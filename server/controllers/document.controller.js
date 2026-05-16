const Document = require("../models/Document");
const QuizAttempt = require("../models/QuizAttempt");
const Flashcard = require("../models/Flashcard");
const Chat = require("../models/Chat");
const { deleteFile, getFileType } = require("../services/multer.service");
const {
  extractText,
  chunkText,
  cleanText,
} = require("../services/document.service");
const {
  storeEmbeddings,
  deleteEmbeddings,
} = require("../services/embedding.service");
const { ragGetAnswer } = require("../services/rag.service");

// ── Background Processor ─────────────────────────────
const processDocument = async (doc) => {
  try {
    doc.status = "processing";
    await doc.save();

    const rawText = await extractText(doc.fileType, doc.storedName);
    const cleanedText = cleanText(rawText);
    const chunks = await chunkText(cleanedText);

    await storeEmbeddings(chunks, doc._id.toString());

    const summaryResult = await ragGetAnswer(
      `Provide a structured summary of this document with:
       1. Main Topic
       2. 5-7 Key Points in simple language
       3. Important Terms
       Keep it concise and student-friendly.`,
      doc._id.toString(),
      10,
    );

    doc.status = "ready";
    doc.chunkCount = chunks.length;
    doc.textLength = cleanedText.length;
    doc.summary = summaryResult.answer || null;
    await doc.save();

    console.log(`✅ Document ${doc._id} ready — ${chunks.length} chunks`);
  } catch (error) {
    console.error(`❌ Document ${doc._id} failed:`, error.message);
    doc.status = "failed";
    doc.errorMessage = error.message;
    await doc.save();
  }
};

// ── UPLOAD ───────────────────────────────────────────
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileType = getFileType(req.file.originalname);
    if (!fileType) {
      deleteFile(req.file.filename);
      return res
        .status(400)
        .json({ error: "Only PDF, PPTX, DOCX files allowed" });
    }

    const doc = await Document.create({
      userId: req.userId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      fileType,
      fileSize: req.file.size,
      status: "uploaded",
    });

    processDocument(doc);

    res.status(201).json({
      message: "File uploaded successfully. Processing started.",
      document: {
        id: doc._id,
        originalName: doc.originalName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        status: doc.status,
      },
    });
  } catch (error) {
    if (req.file) deleteFile(req.file.filename);
    console.error("Upload error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET ALL DOCUMENTS ────────────────────────────────
exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.userId })
      .select(
        "originalName fileType fileSize status chunkCount createdAt summary",
      )
      .sort({ createdAt: -1 })
      .lean();

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET SINGLE DOCUMENT ──────────────────────────────
exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.documentId,
      userId: req.userId,
    }).lean();

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ document: doc });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET STATUS ───────────────────────────────────────
exports.getDocumentStatus = async (req, res) => {
  try {
    const doc = await Document.findOne({
      _id: req.params.documentId,
      userId: req.userId,
    })
      .select("status errorMessage chunkCount summary")
      .lean();

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      status: doc.status,
      chunkCount: doc.chunkCount,
      errorMessage: doc.errorMessage,
      summary: doc.summary,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// ── DELETE DOCUMENT ──────────────────────────────────
// ── DELETE DOCUMENT ──────────────────────────────────
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({
      _id: req.params.documentId,
      userId: req.userId,
    });

    if (!doc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // 1. Disk se file delete karo
    deleteFile(doc.storedName);

    // 2. Pinecone se vectors delete karo
    await deleteEmbeddings(doc._id.toString());

    // 3. Related quiz attempts delete karo
    await QuizAttempt.deleteMany({ documentId: doc._id });

    // 4. Related flashcards delete karo
    await Flashcard.deleteMany({ documentId: doc._id });

    // 5. Related chats delete karo
    await Chat.deleteMany({ documentId: doc._id, userId: req.userId });

    res.json({ message: "Document and all related data deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
