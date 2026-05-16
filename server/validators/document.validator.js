// File upload ke liye body mein kuch nahi hota
// Sirf params validate karne hain — documentId etc.
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

const documentIdSchema = Joi.object({
  documentId: Joi.string().hex().length(24).required().messages({
    "string.hex": "Invalid document ID",
    "string.length": "Invalid document ID",
    "any.required": "Document ID is required",
  }),
});

module.exports = {
  validateDocumentId: validate(documentIdSchema, "params"),
};
