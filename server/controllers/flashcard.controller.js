const Flashcard = require("../models/Flashcard");
const Document = require("../models/Document");
const { getChatResponse } = require("../services/openai.service");
const {
  retrieveChunks,
  formatContext,
} = require("../services/retrieval.service");

// ── Flashcard Generation Prompt ───────────────────────
const buildFlashcardPrompt = (
  context,
) => `You are a flashcard generator for students.
Based on the following study notes, generate 15-20 flashcard pairs.

Study Notes:
${context}

IMPORTANT: Respond with ONLY a valid JSON array. No explanation, no markdown.

Format:
[
  {
    "term": "Key term or concept",
    "definition": "Clear, concise definition or explanation (1-2 sentences)"
  }
]

Rules:
- Terms should be important vocabulary, concepts, or topics
- Definitions must be clear and student-friendly
- Based ONLY on provided notes
- Generate 15-20 pairs`;

// ── Parse Flashcard Response ──────────────────────────
const parseFlashcardResponse = (response) => {
  try {
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) throw new Error("Not an array");

    return parsed.filter((card) => card.term && card.definition);
  } catch (error) {
    console.error("Flashcard parse error:", error.message);
    return null;
  }
};

// ── GENERATE FLASHCARDS ───────────────────────────────
exports.generateFlashcards = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;

    // Document check
    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (doc.status !== "ready") {
      return res.status(400).json({ error: "Document is still processing" });
    }

    // Existing flashcards check — already generate kiye?
    const existing = await Flashcard.findOne({ userId, documentId });
    if (existing) {
      return res.json({
        flashcardId: existing._id,
        cards: existing.cards,
        totalCards: existing.totalCards,
        learnedCards: existing.learnedCards,
      });
    }

    // Chunks nikalo
    const chunks = await retrieveChunks(
      "key terms definitions concepts vocabulary",
      documentId,
      15,
    );

    if (chunks.length === 0) {
      return res.status(400).json({ error: "Could not retrieve content" });
    }

    const context = formatContext(chunks);
    const prompt = buildFlashcardPrompt(context);

    const aiResponse = await getChatResponse(
      [{ role: "user", content: prompt }],
      "You are an expert flashcard generator. Always respond with valid JSON only.",
    );

    const cards = parseFlashcardResponse(aiResponse);

    if (!cards || cards.length === 0) {
      return res
        .status(500)
        .json({ error: "Failed to generate flashcards. Please try again." });
    }

    const flashcardSet = await Flashcard.create({
      userId,
      documentId,
      cards: cards.map((c) => ({ ...c, status: "new" })),
      totalCards: cards.length,
    });

    res.status(201).json({
      flashcardId: flashcardSet._id,
      cards: flashcardSet.cards,
      totalCards: flashcardSet.totalCards,
      learnedCards: 0,
    });
  } catch (error) {
    console.error("Generate flashcards error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── UPDATE CARD STATUS ────────────────────────────────
// User "Got it" ya "Review" click kare
exports.updateCardStatus = async (req, res) => {
  try {
    const { flashcardId } = req.params;
    const { cardIndex, status } = req.body;
    const userId = req.userId;

    if (!["new", "learning", "learned"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const flashcard = await Flashcard.findOne({ _id: flashcardId, userId });
    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard set not found" });
    }

    if (cardIndex >= flashcard.cards.length) {
      return res.status(400).json({ error: "Invalid card index" });
    }

    // Card status update karo
    flashcard.cards[cardIndex].status = status;

    // Learned cards count update karo
    flashcard.learnedCards = flashcard.cards.filter(
      (c) => c.status === "learned",
    ).length;

    await flashcard.save();

    res.json({
      cardIndex,
      status,
      learnedCards: flashcard.learnedCards,
      totalCards: flashcard.totalCards,
      progress: Math.round(
        (flashcard.learnedCards / flashcard.totalCards) * 100,
      ),
    });
  } catch (error) {
    console.error("Update card error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET FLASHCARDS ────────────────────────────────────
exports.getFlashcards = async (req, res) => {
  try {
    const { documentId } = req.params;

    const flashcard = await Flashcard.findOne({
      userId: req.userId,
      documentId,
    }).lean();

    if (!flashcard) {
      return res
        .status(404)
        .json({ error: "No flashcards found for this document" });
    }

    res.json({
      flashcardId: flashcard._id,
      cards: flashcard.cards,
      totalCards: flashcard.totalCards,
      learnedCards: flashcard.learnedCards,
      progress: Math.round(
        (flashcard.learnedCards / flashcard.totalCards) * 100,
      ),
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ── RESET FLASHCARDS ──────────────────────────────────
exports.resetFlashcards = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id: req.params.flashcardId,
      userId: req.userId,
    });

    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard set not found" });
    }

    // Sab cards reset karo
    flashcard.cards = flashcard.cards.map((c) => ({ ...c, status: "new" }));
    flashcard.learnedCards = 0;
    await flashcard.save();

    res.json({ message: "Flashcards reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
