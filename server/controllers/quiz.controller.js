const QuizAttempt = require("../models/QuizAttempt");
const Document = require("../models/Document");
const { getChatResponse } = require("../services/openai.service");
const {
  retrieveChunks,
  formatContext,
} = require("../services/retrieval.service");

// ── Quiz Generation Prompt ────────────────────────────
const buildQuizPrompt = (context, count, difficulty) => {
  const difficultyGuide = {
    easy: "Simple factual recall questions",
    medium: "Understanding and explanation questions",
    hard: "Application and analysis questions",
    mixed: "Mix of easy, medium, and hard questions",
  };

  // Count per difficulty for mixed
  const easyCount = difficulty === "mixed" ? Math.ceil(count * 0.3) : 0;
  const medCount = difficulty === "mixed" ? Math.ceil(count * 0.4) : 0;
  const hardCount = difficulty === "mixed" ? count - easyCount - medCount : 0;

  return `Generate ${count} MCQ questions from these study notes.
Type: ${difficultyGuide[difficulty]}
${difficulty === "mixed" ? `(${easyCount} easy, ${medCount} medium, ${hardCount} hard)` : ""}

NOTES:
${context}

OUTPUT FORMAT - Return ONLY this JSON array, nothing else:
[{"question":"...","options":["A","B","C","D"],"correctAnswer":0,"explanation":"...","difficulty":"easy"}]

RULES:
1. correctAnswer = 0,1,2,3 (index of correct option)
2. Each question needs exactly 4 options
3. Keep questions short and clear
4. Base ONLY on provided notes
5. Return exactly ${count} questions
6. NO markdown, NO extra text, ONLY the JSON array`;
};

// ── Parse AI Response ─────────────────────────────────

const parseQuizResponse = (response) => {
  if (!response || typeof response !== "string") {
    console.error("Parse error: Empty or invalid response");
    return null;
  }

  try {
    let cleaned = response
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const startIndex = cleaned.indexOf("[");
    const endIndex = cleaned.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1) {
      console.error("Parse error: No JSON array found");
      console.error("Response:", cleaned.slice(0, 300));
      return null;
    }

    cleaned = cleaned.slice(startIndex, endIndex + 1);

    // Smart quotes fix
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    // Markdown formatting remove karo
    cleaned = cleaned
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      console.error("Parse error: Not an array");
      return null;
    }

    const valid = parsed.filter(
      (q) =>
        q.question &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every((o) => typeof o === "string") &&
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3 &&
        q.explanation &&
        typeof q.explanation === "string",
    );

    console.log(`Valid questions: ${valid.length}/${parsed.length}`);
    return valid.length > 0 ? valid : null;
  } catch (error) {
    console.error("Parse error:", error.message);
    console.error("Response preview:", response?.slice(0, 300));
    return null;
  }
};
// ── GENERATE QUIZ ─────────────────────────────────────
exports.generateQuiz = async (req, res) => {
  try {
    const { documentId, difficulty, count } = req.body;
    const userId = req.userId;

    // Document check
    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (doc.status !== "ready") {
      return res.status(400).json({ error: "Document is still processing" });
    }

    // Chunks nikalo
    const chunks = await retrieveChunks(
      "main concepts key terms important topics definitions",
      documentId,
      15,
    );

    if (chunks.length === 0) {
      return res
        .status(400)
        .json({ error: "Could not retrieve content from document" });
    }

    const context = formatContext(chunks);
    const prompt = buildQuizPrompt(context, count, difficulty);

    // Retry logic — 3 attempts
    let questions = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Quiz generation attempt ${attempt}/3`);

      const aiResponse = await getChatResponse(
        [{ role: "user", content: prompt }],
        "You are a quiz generator. Respond with valid JSON array only. No markdown. No extra text.",
      );

      console.log("Response length:", aiResponse?.length);
      console.log("Response preview:", aiResponse?.slice(0, 200));

      questions = parseQuizResponse(aiResponse);

      if (questions && questions.length > 0) {
        console.log(`✅ Quiz generated on attempt ${attempt}`);
        break;
      }

      console.log(`Attempt ${attempt} failed — retrying...`);
    }

    if (!questions || questions.length === 0) {
      return res.status(500).json({
        error: "Failed to generate quiz. Please try again.",
      });
    }

    // Clean — userAnswer null
    const cleanQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty || difficulty,
      userAnswer: null,
    }));

    // DB save
    const quiz = await QuizAttempt.create({
      userId,
      documentId,
      questions: cleanQuestions,
      difficulty,
      totalQuestions: cleanQuestions.length,
      status: "in_progress",
    });

    // Frontend ko correctAnswer hide karke bhejo
    const questionsForUser = cleanQuestions.map((q) => ({
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
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

    // Sab null karo pehle
    quiz.questions.forEach((q) => {
      q.userAnswer = null;
    });

    // Answers apply karo
    answers.forEach(({ questionIndex, answer }) => {
      if (
        questionIndex >= 0 &&
        questionIndex < quiz.questions.length &&
        answer >= 0 &&
        answer <= 3
      ) {
        quiz.questions[questionIndex].userAnswer = answer;
      }
    });

    // Score calculate
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (q.userAnswer !== null && q.userAnswer === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.totalQuestions) * 100);

    quiz.correctAnswers = correctCount;
    quiz.score = score;
    quiz.status = "completed";
    quiz.completedAt = new Date();
    await quiz.save();

    // Review
    const reviewQuestions = quiz.questions.map((q) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      userAnswer: q.userAnswer,
      isCorrect: q.userAnswer === q.correctAnswer,
      isSkipped: q.userAnswer === null,
      difficulty: q.difficulty,
    }));

    res.json({
      score,
      correctAnswers: correctCount,
      skippedQuestions: quiz.questions.filter((q) => q.userAnswer === null)
        .length,
      totalQuestions: quiz.totalQuestions,
      passed: score >= 60,
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
      .populate("documentId", "originalName")
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
