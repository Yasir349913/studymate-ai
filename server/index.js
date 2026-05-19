require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// ── DB Connect ────────────────────────────────────────
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// NoSQL injection protection (replaces express-mongo-sanitize)
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return;
    Object.keys(obj).forEach((key) => {
      if (key.startsWith("$") || key.includes(".")) delete obj[key];
      else sanitize(obj[key]);
    });
  };
  sanitize(req.body);
  sanitize(req.params);
  next();
});

// ── Routes ────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/documents", require("./routes/document.routes")); // ← Phase 2
app.use("/api/quiz", require("./routes/quiz.routes")); // ← Naya
app.use("/api/flashcards", require("./routes/flashcard.routes")); // ← Naya
// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error("ERROR:", err);
  res.status(500).json({ error: err.message || "Something went wrong" });
});

// ── Start Server ──────────────────────────────────────
module.exports = app;
