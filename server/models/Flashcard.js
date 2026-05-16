const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    term: { type: String, required: true },
    definition: { type: String, required: true },
    // User ne ye card seekha ya nahi
    status: {
      type: String,
      enum: ["new", "learning", "learned"],
      default: "new",
    },
  },
  { _id: false },
);

const flashcardSchema = new mongoose.Schema(
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
    cards: { type: [cardSchema], default: [] },
    totalCards: { type: Number, default: 0 },
    learnedCards: { type: Number, default: 0 },
  },
  { timestamps: true },
);

flashcardSchema.index({ userId: 1, documentId: 1 });

module.exports = mongoose.model("Flashcard", flashcardSchema);
