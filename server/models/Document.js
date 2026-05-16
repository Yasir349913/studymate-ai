const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // User ko dikhane ke liye original naam
    // "Ali_Notes_Chapter5.pdf"
    originalName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [255, "Filename too long"],
    },

    // Disk pe save naam — UUID based
    // Kyun UUID? 2 users same naam ki file upload karein
    // toh ek doosre ki file overwrite na ho
    storedName: {
      type: String,
      required: true,
    },

    // PDF ya PPTX — enum se sirf ye 2 allowed
    fileType: {
      type: String,
      enum: ["pdf", "pptx", "docx"],
      required: true,
    },

    // Bytes mein — frontend pe "2.3 MB" dikhane ke liye
    fileSize: {
      type: Number,
      required: true,
    },

    // Processing pipeline status
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },

    // Failed hone pe reason — debugging ke liye
    errorMessage: {
      type: String,
      default: null,
    },

    // Phase 4 (RAG) mein use hoga
    // Kitne chunks Pinecone mein gaye
    chunkCount: {
      type: Number,
      default: 0,
    },

    // Extracted text kitna lamba tha
    textLength: {
      type: Number,
      default: 0,
    },
    // Existing fields ke saath ye add karo
    summary: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// User ke docs latest pehle — compound index
documentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Document", documentSchema);
