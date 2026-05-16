const express    = require('express');
const controller = require('../controllers/chat.controller');
const auth       = require('../middleware/auth');
const { validateSendMessage } = require('../validators/chat.validator');

const router = express.Router();

// router.use(auth) — ye sab routes pe auth apply karta hai
// Har route pe alag alag auth likhne ki zaroorat nahi
// Ek baar likho — sab pe lage
router.use(auth);

// POST /api/chat         — naya message bhejo (naya ya existing chat)
// GET  /api/chat         — sab chats list karo (sidebar)
// GET  /api/chat/:chatId — ek chat ke sare messages
// DELETE /api/chat/:chatId     — chat delete karo
// PATCH  /api/chat/:chatId/title — title update karo

router.post  ('/',                   validateSendMessage,  controller.sendMessage);
router.get   ('/',                                         controller.getChats);
router.get   ('/:chatId',                                  controller.getChat);
router.delete('/:chatId',                                  controller.deleteChat);
router.patch ('/:chatId/title',                            controller.updateChatTitle);

module.exports = router;