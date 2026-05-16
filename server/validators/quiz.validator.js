const Joi = require("joi");

const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const data = source === "params" ? req.params : req.body;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (source === "params") req.params = value;
    else req.body = value;
    next();
  };

// Quiz generate karne ke liye
const generateQuizSchema = Joi.object({
  documentId: Joi.string().hex().length(24).required(),
  difficulty: Joi.string()
    .valid("easy", "medium", "hard", "mixed")
    .default("mixed"),
  count: Joi.number().min(5).max(20).default(10),
});

// Quiz submit karne ke liye
const submitQuizSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionIndex: Joi.number().min(0).required(),
        answer: Joi.number().min(0).max(3).required(),
      }),
    )
    .min(1)
    .required(),
});

const quizIdSchema = Joi.object({
  quizId: Joi.string().hex().length(24).required(),
});

module.exports = {
  validateGenerateQuiz: validate(generateQuizSchema),
  validateSubmitQuiz: validate(submitQuizSchema),
  validateQuizId: validate(quizIdSchema, "params"),
};
