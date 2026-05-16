const Chat = require("../models/Chat");
const openaiService = require("../services/openai.service");
const { ragStreamAnswer } = require("../services/rag.service");

// ── SEND MESSAGE ─────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { message, chatId, documentId } = req.body;
    const userId = req.userId;

    let chat;

    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });

      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      if (chat.messageCount >= 500) {
        return res.status(400).json({
          error: "Chat is full. Please start a new conversation.",
        });
      }
    } else {
      const title =
        message.length > 60
          ? message.slice(0, 60).trim() + "..."
          : message.trim();

      chat = await Chat.create({
        userId,
        title,
        documentId: documentId || null,
      });
    }

    chat.messages.push({ role: "user", content: message });

    const contextMessages = chat.messages
      .slice(-6)
      .map(({ role, content }) => ({ role, content }));

    res.setHeader("X-Chat-Id", chat._id.toString());

    let fullResponse;

    if (documentId) {
      // ── RAG MODE ─────────────────────────────────
      // Document ke saath — sirf us document se answer
      const ragResult = await ragStreamAnswer(
        message,
        documentId,
        contextMessages,
        res,
      );
      fullResponse = ragResult.answer;
    } else {
      // ── NORMAL MODE ──────────────────────────────
      // General chat — koi document nahi
      fullResponse = await openaiService.streamChatResponse(
        contextMessages,
        res,
      );
    }

    // Stream complete — DB mein save karo
    if (fullResponse) {
      chat.messages.push({ role: "assistant", content: fullResponse });
      await chat.save();
    }
  } catch (error) {
    console.error("Send message error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Server error" });
    }
  }
};

// ── GET ALL CHATS ────────────────────────────────────
exports.getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .select("title messageCount createdAt updatedAt documentId")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    res.json({ chats });
  } catch (error) {
    console.error("Get chats error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET SINGLE CHAT ──────────────────────────────────
exports.getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.userId,
    }).lean();

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ chat });
  } catch (error) {
    console.error("Get chat error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── DELETE CHAT ──────────────────────────────────────
exports.deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.chatId,
      userId: req.userId,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ message: "Chat deleted successfully" });
  } catch (error) {
    console.error("Delete chat error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ── UPDATE CHAT TITLE ────────────────────────────────
exports.updateChatTitle = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, userId: req.userId },
      { title: title.trim().slice(0, 100) },
      { new: true },
    ).select("title updatedAt");

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ chat });
  } catch (error) {
    console.error("Update title error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
