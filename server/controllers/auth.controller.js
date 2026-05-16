const bcrypt       = require('bcryptjs');
const crypto       = require('crypto');
const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const tokenService = require('../services/token.service');
const { sendPasswordResetEmail } = require('../config/email');

// ── SIGNUP ───────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash    = await bcrypt.hash(password, 12);
    const user            = await User.create({ name, email, passwordHash });
    const accessToken     = tokenService.generateAccessToken(user._id);
    const refreshToken    = tokenService.generateRefreshToken(user._id);

    await tokenService.saveRefreshToken(refreshToken, user._id);
    tokenService.setRefreshCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── LOGIN ────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken  = tokenService.generateAccessToken(user._id);
    const refreshToken = tokenService.generateRefreshToken(user._id);

    await tokenService.saveRefreshToken(refreshToken, user._id);
    tokenService.setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── REFRESH ──────────────────────────────────────────
// Sirf access token naya banta hai — refresh token wahi rehta hai
// Koi circular loop nahi — refresh token se sirf access token milta hai
exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    // Step 1 — JWT valid hai?
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      // Refresh token bhi expire — login karna padega
      return res.status(401).json({
        error: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED',
      });
    }

    // Step 2 — DB mein hai? (logout ke baad nahi hoga)
    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) {
      tokenService.clearRefreshCookie(res);
      return res.status(401).json({
        error: 'Session expired. Please login again.',
        code: 'SESSION_EXPIRED',
      });
    }

    // Step 3 — Sirf naya ACCESS token do
    // Refresh token wahi rehta hai — koi circular issue nahi
    const newAccessToken = tokenService.generateAccessToken(decoded.id);

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── LOGOUT ───────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      // DB se delete karo — token revoke ho gaya
      await RefreshToken.deleteOne({ token: refreshToken });
    }

    tokenService.clearRefreshCookie(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── GET CURRENT USER ─────────────────────────────────
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// ── FORGOT PASSWORD ──────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Security: user exist kare ya na kare — same response
    // Attacker ko pata na chale kaunsi emails registered hain
    if (!user) {
      return res.json({ message: 'If this email exists, a reset link has been sent.' });
    }

    // Cryptographically secure random token
    const resetToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken  = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    await sendPasswordResetEmail(user.email, resetURL);

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// ── RESET PASSWORD ───────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token }    = req.params;
    const { password } = req.body;

    // URL wale token ko hash karo — DB mein hashed version hai
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() }, // Expire nahi hua?
    });

    if (!user) {
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }

    // Password update karo
    user.passwordHash          = await bcrypt.hash(password, 12);
    user.passwordResetToken    = undefined; // Clear karo
    user.passwordResetExpires  = undefined;
    await user.save();

    // Purane sab refresh tokens delete karo — security ke liye
    // Agar kisi ne account hack kiya tha — unka access bhi khatam
    await RefreshToken.deleteMany({ userId: user._id });

    res.json({ message: 'Password reset successful. Please login again.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};