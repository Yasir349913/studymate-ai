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
    easy: "Factual questions — direct answers from the text",
    medium: "Conceptual questions — understanding and explanation",
    hard: "Application questions — apply concepts to scenarios",
    mixed: "Mix of factual, conceptual, and application questions",
  };

  return `Generate exactly ${count} multiple choice questions based on the study notes below.

Difficulty: ${difficulty} — ${difficultyGuide[difficulty]}

Study Notes:
${context}

Return ONLY a valid JSON array. No markdown. No explanation. No extra text before or after.

[
  {
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "difficulty": "${difficulty === "mixed" ? "easy" : difficulty}"
  }
]

Strict rules:
- correctAnswer = index 0 to 3
- Exactly 4 options per question
- Based ONLY on provided notes
- Return exactly ${count} questions
- ONLY the JSON array — nothing else`;
};

// ── Parse AI Response ─────────────────────────────────
const parseQuizResponse = (response) => {
  if (!response || typeof response !== "string") {
    console.error("Parse error: Empty or invalid response");
    return null;
  }

  try {
    // Markdown + extra text remove karo
    let cleaned = response
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    // JSON array boundaries find karo
    const startIndex = cleaned.indexOf("[");
    const endIndex = cleaned.lastIndexOf("]");

    if (startIndex === -1 || endIndex === -1) {
      console.error("Parse error: No JSON array found");
      console.error("Response:", cleaned.slice(0, 300));
      return null;
    }

    cleaned = cleaned.slice(startIndex, endIndex + 1);

    // Invalid characters fix karo
    // AI kabhi kabhi smart quotes use karta hai
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

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
