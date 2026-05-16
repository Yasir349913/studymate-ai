const express = require("express");
const controller = require("../controllers/flashcard.controller");
const auth = require("../middleware/auth");

const router = express.Router();
router.use(auth);

router.post("/", controller.generateFlashcards);
router.get("/document/:documentId", controller.getFlashcards);
router.patch("/:flashcardId/card", controller.updateCardStatus);
router.post("/:flashcardId/reset", controller.resetFlashcards);

module.exports = router;
