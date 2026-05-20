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
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "https://studymate-ai-v9zx.vercel.app",
        process.env.CLIENT_URL,
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
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
app.get("/health", (req, res) => res.json({ status: "ok" }));
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
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
