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
  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract text from PDF. " +
        "Ensure it is a text-based PDF, not a scanned image.",
    );
  }

  return text;
};

// ── PPTX Extract ─────────────────────────────────────
const extractFromPPTX = async (storedName) => {
  const filePath = path.join(UPLOADS_DIR, storedName);
  const pptxParser = require("pptx-parser");
  const result = await pptxParser(filePath);

  const text = result
    .map((slide) =>
      slide.texts
        ?.map((t) => t.value || "")
        .filter(Boolean)
        .join(" "),
    )
    .filter(Boolean)
    .join("\n\n");

  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract text from PPTX. " +
        "Ensure slides contain text, not just images.",
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
      "Could not extract text from DOCX. " +
        "Ensure the document contains readable text.",
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
