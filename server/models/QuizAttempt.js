const mongoose = require("mongoose");

// Ek MCQ question ka schema
const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true }, // 4 options
    correctAnswer: { type: Number, required: true }, // 0-3 index
    explanation: { type: String, required: true }, // Kyun sahi hai
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard","mixed"],
      required: true,
    },
    // User ne kya answer diya — null matlab attempt nahi kiya
    userAnswer: { type: Number, default: null },
  },
  { _id: false },
);

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    questions: { type: [questionSchema], required: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      default: "mixed",
    },
    // Score tracking
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, default: 0 },
    score: { type: Number, default: 0 }, // Percentage
    // Status
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// User ke quiz attempts latest pehle
quizAttemptSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("QuizAttempt", quizAttemptSchema);
