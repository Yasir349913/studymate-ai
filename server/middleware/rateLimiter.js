const rateLimit = require("express-rate-limit");
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
exports.passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message:
    "Too many password reset attempts from this IP, please try again after an hour",
  standardHeaders: true,
  legacyHeaders: false,
});
