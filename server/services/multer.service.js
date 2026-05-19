const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// ── Allowed Types ────────────────────────────────────
// Ek jagah define karo — agar future mein change karna ho
// sirf yahan update karo
const ALLOWED_TYPES = {
  // Extension → MIME type mapping
  ".pdf": ["application/pdf"],
  ".pptx": [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  ".docx": [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    // Windows aksar ye MIME type bhejta hai DOCX ke liye
    "application/octet-stream",
  ],
};

// Reverse map — MIME → extension (getFileType ke liye)
const MIME_TO_EXT = {};
Object.entries(ALLOWED_TYPES).forEach(([ext, mimes]) => {
  mimes.forEach((mime) => {
    MIME_TO_EXT[mime] = ext;
  });
});

const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);

// ── Storage ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// ── File Filter ──────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  // Extension check
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(`File type not supported. Allowed: PDF, PPTX, DOCX`),
      false,
    );
  }

  // MIME check — extension rename karke bypass na kar sake
  // Exception: octet-stream allow karo DOCX ke liye
  // Kyun? Windows browsers aksar DOCX ko octet-stream bhejte hain
  const allowedMimes = ALLOWED_TYPES[ext];
  if (!allowedMimes.includes(mime) && mime !== "application/octet-stream") {
    return cb(new Error(`Invalid file format`), false);
  }

  cb(null, true);
};

// ── Multer Instance ──────────────────────────────────
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
    files: 1,
  },
});

// ── Helpers ──────────────────────────────────────────
const deleteFile = (filename) => {
  if (!filename) return;
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Extension se file type — model enum ke liye
const getFileType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const map = {
    ".pdf": "pdf",
    ".pptx": "pptx",
    ".docx": "docx",
  };
  return map[ext] || null;
};

module.exports = {
  upload,
  deleteFile,
  getFileType,
  UPLOADS_DIR,
  ALLOWED_EXTENSIONS,
};
