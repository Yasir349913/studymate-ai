const express      = require('express');
const controller   = require('../controllers/auth.controller');
const auth         = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  validateSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} = require('../validators/auth.validator');

const router = express.Router();

// Validate → Rate limit → Controller
// Ye order important hai — pehle invalid data reject karo
router.post('/signup',          validateSignup,         authLimiter,          controller.signup);
router.post('/login',           validateLogin,          authLimiter,          controller.login);
router.post('/refresh',                                                        controller.refresh);
router.post('/logout',                                                         controller.logout);
router.get ('/me',              auth,                                          controller.me);
router.post('/forgot-password', validateForgotPassword, passwordResetLimiter, controller.forgotPassword);
router.post('/reset-password/:token', validateResetPassword,                  controller.resetPassword);

module.exports = router;