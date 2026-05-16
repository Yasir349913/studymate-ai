const Flashcard = require('../models/Flashcard');
const Document  = require('../models/Document');
const { getChatResponse }               = require('../services/openai.service');
const { retrieveChunks, formatContext } = require('../services/retrieval.service');

// ── Flashcard Prompt ──────────────────────────────────
const buildFlashcardPrompt = (context) => `Generate 15 flashcard pairs based on the study notes below.

Study Notes:
${context}

Return ONLY a valid JSON array. No markdown. No explanation. No extra text.

[
  {
    "term": "Key term or concept",
    "definition": "Clear concise definition (1-2 sentences)"
  }
]

Rules:
- Terms = important vocabulary or concepts
- Definitions = clear and student-friendly
- Based ONLY on provided notes
- Return exactly 15 pairs
- ONLY the JSON array — nothing else`;

// ── Parse Flashcard Response ──────────────────────────
const parseFlashcardResponse = (response) => {
  if (!response || typeof response !== 'string') {
    console.error('Flashcard parse error: Empty response');
    return null;
  }

  try {
    let cleaned = response
      .replace(/```json/gi, '')
      .replace(/```/gi, '')
      .trim();

    const startIndex = cleaned.indexOf('[');
    const endIndex   = cleaned.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1) {
      console.error('Flashcard parse error: No JSON array found');
      console.error('Response:', cleaned.slice(0, 300));
      return null;
    }

    cleaned = cleaned.slice(startIndex, endIndex + 1);

    // Smart quotes fix
    cleaned = cleaned
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return null;

    const valid = parsed.filter((card) =>
      card.term &&
      typeof card.term === 'string' &&
      card.definition &&
      typeof card.definition === 'string'
    );

    console.log(`Valid flashcards: ${valid.length}/${parsed.length}`);
    return valid.length > 0 ? valid : null;

  } catch (error) {
    console.error('Flashcard parse error:', error.message);
    console.error('Response preview:', response?.slice(0, 300));
    return null;
  }
};

// ── GENERATE FLASHCARDS ───────────────────────────────
exports.generateFlashcards = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;

    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (doc.status !== 'ready') {
      return res.status(400).json({ error: 'Document is still processing' });
    }

    // Existing check — sirf generate ke liye, regenerate skip karega
    const existing = await Flashcard.findOne({ userId, documentId });
    if (existing) {
      return res.json({
        flashcardId:  existing._id,
        cards:        existing.cards,
        totalCards:   existing.totalCards,
        learnedCards: existing.learnedCards,
      });
    }

    const chunks = await retrieveChunks(
      'key terms definitions concepts vocabulary important',
      documentId,
      15
    );

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Could not retrieve content' });
    }

    const context = formatContext(chunks);
    const prompt  = buildFlashcardPrompt(context);

    // Retry logic — 3 attempts
    let cards = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Flashcard generation attempt ${attempt}/3`);

      const aiResponse = await getChatResponse(
        [{ role: 'user', content: prompt }],
        'You are a flashcard generator. Respond with valid JSON array only. No markdown. No extra text.'
      );

      console.log('Response length:', aiResponse?.length);
      console.log('Response preview:', aiResponse?.slice(0, 200));

      cards = parseFlashcardResponse(aiResponse);

      if (cards && cards.length > 0) {
        console.log(`✅ Flashcards generated on attempt ${attempt}`);
        break;
      }

      console.log(`Attempt ${attempt} failed — retrying...`);
    }

    if (!cards || cards.length === 0) {
      return res.status(500).json({
        error: 'Failed to generate flashcards. Please try again.',
      });
    }

    const flashcardSet = await Flashcard.create({
      userId,
      documentId,
      cards:      cards.map((c) => ({ ...c, status: 'new' })),
      totalCards: cards.length,
    });

    res.status(201).json({
      flashcardId:  flashcardSet._id,
      cards:        flashcardSet.cards,
      totalCards:   flashcardSet.totalCards,
      learnedCards: 0,
    });

  } catch (error) {
    console.error('Generate flashcards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── REGENERATE FLASHCARDS ─────────────────────────────
exports.regenerateFlashcards = async (req, res) => {
  try {
    const { documentId } = req.body;
    const userId = req.userId;

    // Purane delete karo
    await Flashcard.findOneAndDelete({ userId, documentId });

    // Fresh generate karo
    const doc = await Document.findOne({ _id: documentId, userId });
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    if (doc.status !== 'ready') {
      return res.status(400).json({ error: 'Document is still processing' });
    }

    const chunks = await retrieveChunks(
      'key terms definitions concepts vocabulary important',
      documentId,
      15
    );

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Could not retrieve content' });
    }

    const context = formatContext(chunks);
    const prompt  = buildFlashcardPrompt(context);

    let cards = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      console.log(`Regenerate attempt ${attempt}/3`);

      const aiResponse = await getChatResponse(
        [{ role: 'user', content: prompt }],
        'You are a flashcard generator. Respond with valid JSON array only. No markdown. No extra text.'
      );

      cards = parseFlashcardResponse(aiResponse);

      if (cards && cards.length > 0) {
        console.log(`✅ Regenerated on attempt ${attempt}`);
        break;
      }
    }

    if (!cards || cards.length === 0) {
      return res.status(500).json({
        error: 'Failed to regenerate flashcards. Please try again.',
      });
    }

    const flashcardSet = await Flashcard.create({
      userId,
      documentId,
      cards:      cards.map((c) => ({ ...c, status: 'new' })),
      totalCards: cards.length,
    });

    res.status(201).json({
      flashcardId:  flashcardSet._id,
      cards:        flashcardSet.cards,
      totalCards:   flashcardSet.totalCards,
      learnedCards: 0,
    });

  } catch (error) {
    console.error('Regenerate flashcards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── UPDATE CARD STATUS ────────────────────────────────
exports.updateCardStatus = async (req, res) => {
  try {
    const { flashcardId } = req.params;
    const { cardIndex, status } = req.body;
    const userId = req.userId;

    if (!['new', 'learning', 'learned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const flashcard = await Flashcard.findOne({ _id: flashcardId, userId });
    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }
    if (cardIndex >= flashcard.cards.length) {
      return res.status(400).json({ error: 'Invalid card index' });
    }

    flashcard.cards[cardIndex].status = status;
    flashcard.learnedCards = flashcard.cards.filter(
      (c) => c.status === 'learned'
    ).length;

    await flashcard.save();

    res.json({
      cardIndex,
      status,
      learnedCards: flashcard.learnedCards,
      totalCards:   flashcard.totalCards,
      progress:     Math.round((flashcard.learnedCards / flashcard.totalCards) * 100),
    });

  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET FLASHCARDS ────────────────────────────────────
exports.getFlashcards = async (req, res) => {
  try {
    const { documentId } = req.params;

    const flashcard = await Flashcard.findOne({
      userId:     req.userId,
      documentId,
    }).lean();

    if (!flashcard) {
      return res.status(404).json({ error: 'No flashcards found for this document' });
    }

    res.json({
      flashcardId:  flashcard._id,
      cards:        flashcard.cards,
      totalCards:   flashcard.totalCards,
      learnedCards: flashcard.learnedCards,
      progress:     Math.round((flashcard.learnedCards / flashcard.totalCards) * 100),
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ── RESET FLASHCARDS ──────────────────────────────────
exports.resetFlashcards = async (req, res) => {
  try {
    const flashcard = await Flashcard.findOne({
      _id:    req.params.flashcardId,
      userId: req.userId,
    });

    if (!flashcard) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    flashcard.cards        = flashcard.cards.map((c) => ({ ...c._doc, status: 'new' }));
    flashcard.learnedCards = 0;
    await flashcard.save();

    res.json({ message: 'Flashcards reset successfully' });
  } catch (error) {
    console.error('Reset flashcards error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};