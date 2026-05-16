const Joi = require("joi");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      error: error.details[0].message,
      errors: error.details.map((d) => d.message),
    });
  }

  req.body = value;
  next();
};

const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(2000).required().messages({
    "string.empty": "Message cannot be empty",
    "string.min": "Message cannot be empty",
    "string.max": "Message is too long (max 2000 characters)",
    "any.required": "Message is required",
  }),

  chatId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Invalid chat ID format",
    "string.length": "Invalid chat ID length",
  }),

  // RAG ke liye — document select karna
  documentId: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Invalid document ID format",
    "string.length": "Invalid document ID length",
  }),
});

module.exports = {
  validateSendMessage: validate(sendMessageSchema),
};
