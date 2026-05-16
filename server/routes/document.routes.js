const express = require("express");
const controller = require("../controllers/document.controller");
const auth = require("../middleware/auth");
const { upload } = require("../services/multer.service");
const { validateDocumentId } = require("../validators/document.validator");
const { uploadLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
router.use(auth);

const handleMulterError = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
};

router.post("/", uploadLimiter, handleMulterError, controller.uploadDocument);
router.get("/", controller.getDocuments);
router.get("/:documentId", validateDocumentId, controller.getDocument);
router.get(
  "/:documentId/status",
  validateDocumentId,
  controller.getDocumentStatus,
);
router.delete("/:documentId", validateDocumentId, controller.deleteDocument);

module.exports = router;
