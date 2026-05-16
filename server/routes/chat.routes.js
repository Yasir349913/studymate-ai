const express = require("express");
const controller = require("../controllers/chat.controller");
const auth = require("../middleware/auth");
const { validateSendMessage } = require("../validators/chat.validator");
const { chatLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
router.use(auth);

router.post("/", chatLimiter, validateSendMessage, controller.sendMessage);
router.get("/", controller.getChats);
router.get("/:chatId", controller.getChat);
router.delete("/:chatId", controller.deleteChat);
router.patch("/:chatId/title", controller.updateChatTitle);

module.exports = router;
