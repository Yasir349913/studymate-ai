const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [10000, "Message too long"],
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  },
);

// ── Chat Schema ──────────────────────────────────────
const chatSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Title too long"],
      default: "New Chat",
    },
    messages: {
      type: [messageSchema],
      default: [],

      validate: {
        validator: (msgs) => msgs.length <= 500,
        message: "Chat has too many messages",
      },
    },

    messageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.pre("save", function () {
  this.messageCount = this.messages.length;
});

module.exports = mongoose.model("Chat", chatSchema);
