const express = require("express");
const controller = require("../controllers/quiz.controller");
const auth = require("../middleware/auth");
const {
  validateGenerateQuiz,
  validateSubmitQuiz,
  validateQuizId,
} = require("../validators/quiz.validator");

const router = express.Router();
router.use(auth);

router.post("/", validateGenerateQuiz, controller.generateQuiz);
router.post(
  "/:quizId/submit",
  validateQuizId,
  validateSubmitQuiz,
  controller.submitQuiz,
);
router.get("/history", controller.getQuizHistory);
router.get("/:quizId", validateQuizId, controller.getQuiz);

module.exports = router;
