const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { UPLOADS_DIR } = require("./multer.service");

// ── PDF Extract ──────────────────────────────────────
const extractFromPDF = async (storedName) => {
  const filePath = path.join(UPLOADS_DIR, storedName);
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text?.trim();

  if (!text || text.length < 200) {
    throw new Error(
      "This PDF appears to be scanned or image-based. " +
        "StudyMate AI only supports text-based PDFs. " +
        "Please ensure your PDF contains selectable text.",
    );
  }

  const words = text.split(/\s+/).filter((w) => w.length > 1);
  const wordDensity = words.length / (data.numpages || 1);

  // ← DONO checks
  if (words.length < 100 || wordDensity < 50) {
    throw new Error(
      "This PDF appears to be scanned or image-based. " +
        "StudyMate AI only supports text-based PDFs. " +
        "Please ensure your PDF contains selectable text.",
    );
  }

  return text;
};

// ── PPTX Extract ─────────────────────────────────────
// ── PPTX Extract ─────────────────────────────────────
const extractFromPPTX = async (storedName) => {
  const filePath = path.join(UPLOADS_DIR, storedName);
  const officeParser = require("officeparser");

  const result = await new Promise((resolve, reject) => {
    officeParser.parseOffice(filePath, (data, err) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  // officeparser object return kar sakta hai — string enforce karo
  const text = typeof result === "string" ? result : JSON.stringify(result);

  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract text from this PPTX. " +
        "Ensure slides contain actual text, not just images or screenshots.",
    );
  }
  return text;
};

// ── DOCX Extract ─────────────────────────────────────
const extractFromDOCX = async (storedName) => {
  const filePath = path.join(UPLOADS_DIR, storedName);
  const result = await mammoth.extractRawText({ path: filePath });

  const text = result.value?.trim();

  if (result.messages?.length > 0) {
    console.warn(`DOCX warnings for ${storedName}:`, result.messages);
  }

  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract text from this Word document. " +
        "Ensure the document contains readable text content.",
    );
  }
  return text;
};

// ── Router ───────────────────────────────────────────
const extractText = async (fileType, storedName) => {
  const extractors = {
    pdf: extractFromPDF,
    pptx: extractFromPPTX,
    docx: extractFromDOCX,
  };

  const extractor = extractors[fileType];
  if (!extractor) {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  return extractor(storedName);
};

// ── Clean Text ───────────────────────────────────────
const cleanText = (text) => {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[^\S\n]+$/gm, "")
    .trim();
};

// ── Chunking ─────────────────────────────────────────
const chunkText = async (text) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 600,
    chunkOverlap: 100,
    separators: ["\n\n", "\n", ". ", "! ", "? ", " ", ""],
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent);
};

module.exports = { extractText, chunkText, cleanText };
