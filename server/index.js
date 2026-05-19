require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// DB connect
connectDB();

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(mongoSanitize());

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/documents", require("./routes/document.routes"));
app.use("/api/quiz", require("./routes/quiz.routes"));
app.use("/api/flashcards", require("./routes/flashcard.routes"));

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

// ── Vercel ke liye ──────────────────────────────────
// Local dev mein listen, Vercel mein export
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
