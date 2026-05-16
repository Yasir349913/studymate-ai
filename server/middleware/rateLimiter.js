const rateLimit = require("express-rate-limit");

// Auth routes — 15 min mein 10 attempts
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many attempts. Try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset — 1 ghante mein 3 attempts
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many reset attempts. Try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat rate limit — 1 minute mein 20 messages
// Kyun? Free AI API ka cost control
// 20 messages/min = normal user ke liye enough
// Bot ya abuse = block
exports.chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages
  message: { error: "Too many messages. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
  // Streaming responses ke liye skip karo agar already started
  skip: (req, res) => res.headersSent,
});

// Document upload — 1 ghante mein 10 uploads
exports.uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Upload limit reached. Try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Quiz generate — 1 ghante mein 20 quizzes
exports.quizLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: "Quiz limit reached. Try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});
