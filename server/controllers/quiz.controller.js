const QuizAttempt = require("../models/QuizAttempt");
const Document = require("../models/Document");
const { ragGetAnswer } = require("../services/rag.service");
const { getChatResponse } = require("../services/openai.service");
const {
  retrieveChunks,
  formatContext,
} = require("../services/retrieval.service");

// ── Quiz Generation Prompt ────────────────────────────
const buildQuizPrompt = (context, count, difficulty) => {
  const difficultyGuide = {
    easy: "Factual questions — direct answers from the text",
    medium: "Conceptual questions — understanding and explanation",
    hard: "Application questions — apply concepts to scenarios",
    mixed: "Mix of factual, conceptual, and application questions",
  };

  return `You are a quiz generator. Based on the following study notes, generate exactly ${count} multiple choice questions.

Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}

Study Notes:
${context}

IMPORTANT: Respond with ONLY a valid JSON array. No explanation, no markdown, no extra text.

Format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct",
    "difficulty": "${difficulty === "mixed" ? "easy|medium|hard" : difficulty}"
  }
]

Rules:
- correctAnswer is the INDEX (0-3) of the correct option
- Each question must have exactly 4 options
- Explanation must be clear and educational
- Questions must be based ONLY on the provided notes
- Generate exactly ${count} questions`;
};

// ── Parse AI Response ─────────────────────────────────
const parseQuizResponse = (response) => {
  try {
    // Markdown code blocks remove karo agar hain
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    // Validate karo
    if (!Array.isArray(parsed)) throw new Error("Not an array");

    return parsed.filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3 &&
        q.explanation,
    );
  } catch (error) {
    console.error("Quiz parse error:", error.message);
    return null;
  }
};

// ── GENERATE QUIZ ─────────────────────────────────────
exports.generateQuiz = async (req, res) => {
  try {
    const { documentId, difficulty, count } = req.body;
    const userId = req.userId;

    // Document exist karta hai aur user ka hai?
    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (doc.status !== "ready") {
      return res.status(400).json({ error: "Document is still processing" });
    }

    // Top chunks nikalo — zyada chunks = better quiz
    const chunks = await retrieveChunks(
      "main concepts key terms important topics definitions",
      documentId,
      15, // 15 chunks for comprehensive quiz
    );

    if (chunks.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not retrieve content from document" });
    }

    const context = formatContext(chunks);
    const prompt = buildQuizPrompt(context, count, difficulty);

    // AI se MCQs generate karo
    const aiResponse = await getChatResponse(
      [{ role: "user", content: prompt }],
      "You are an expert quiz generator. Always respond with valid JSON only.",
    );

    // Parse karo
    const questions = parseQuizResponse(aiResponse);

    if (!questions || questions.length === 0) {
      return res
        .status(500)
        .json({ error: "Failed to generate quiz. Please try again." });
    }

    // DB mein save karo — userAnswer remove karke
    // User ne abhi answer nahi diya
    const cleanQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || difficulty,
      userAnswer: null,
    }));

    const quiz = await QuizAttempt.create({
      userId,
      documentId,
      questions: cleanQuestions,
      difficulty,
      totalQuestions: cleanQuestions.length,
      status: "in_progress",
    });

    // Frontend ko questions bhejo — correctAnswer hide karo
    // User ko answers pehle se nahi pata hona chahiye
    const questionsForUser = cleanQuestions.map((q) => ({
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
      // correctAnswer aur explanation nahi bhej rahe
    }));

    res.status(201).json({
      quizId: quiz._id,
      questions: questionsForUser,
      totalQuestions: cleanQuestions.length,
      difficulty,
    });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── SUBMIT QUIZ ───────────────────────────────────────
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const userId = req.userId;

    const quiz = await QuizAttempt.findOne({ _id: quizId, userId });
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    if (quiz.status === "completed") {
      return res.status(400).json({ error: "Quiz already submitted" });
    }

    // Answers save karo aur score calculate karo
    let correctCount = 0;

    answers.forEach(({ questionIndex, answer }) => {
      if (questionIndex < quiz.questions.length) {
        quiz.questions[questionIndex].userAnswer = answer;
        if (answer === quiz.questions[questionIndex].correctAnswer) {
          correctCount++;
        }
      }
    });

    const score = Math.round((correctCount / quiz.totalQuestions) * 100);

    quiz.correctAnswers = correctCount;
    quiz.score = score;
    quiz.status = "completed";
    quiz.completedAt = new Date();
    await quiz.save();

    // Ab correctAnswer aur explanation bhejo — quiz complete ho gaya
    const reviewQuestions = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      userAnswer: q.userAnswer,
      isCorrect: q.userAnswer === q.correctAnswer,
      difficulty: q.difficulty,
    }));

    res.json({
      score,
      correctAnswers: correctCount,
      totalQuestions: quiz.totalQuestions,
      passed: score >= 60, // 60% passing marks
      questions: reviewQuestions,
    });
  } catch (error) {
    console.error("Submit quiz error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET QUIZ HISTORY ──────────────────────────────────
exports.getQuizHistory = async (req, res) => {
  try {
    const quizzes = await QuizAttempt.find({
      userId: req.userId,
      status: "completed",
    })
      .select(
        "documentId difficulty score totalQuestions correctAnswers completedAt",
      )
      .populate("documentId", "originalName") // Document name bhi chahiye
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    res.json({ quizzes });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET SINGLE QUIZ ───────────────────────────────────
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await QuizAttempt.findOne({
      _id: req.params.quizId,
      userId: req.userId,
    }).lean();

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    res.json({ quiz });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
