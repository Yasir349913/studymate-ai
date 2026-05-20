const OpenAI = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");

// ── Clients ──────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
    "X-Title": "StudyMate AI",
  },
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// ── Constants ─────────────────────────────────────────
// Embedding model — 1536 dimensions generate karta hai
// Index ki dimensions se match karna zaroori hai
const EMBEDDING_MODEL = "text-embedding-3-small";
const PINECONE_INDEX = process.env.PINECONE_INDEX;

// ── Get Pinecone Index ────────────────────────────────
const getIndex = () => pinecone.index(PINECONE_INDEX);

// ── Generate Single Embedding ─────────────────────────
// Ek text string → 1536 numbers ka array
const generateEmbedding = async (text) => {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  // response.data[0].embedding = [0.23, -0.87, ...]
  return response.data[0].embedding;
};

// ── Generate Batch Embeddings ─────────────────────────
// Multiple chunks ek saath embed karo
// Kyun batch? Ek ek karne se API calls zyada hongi
// Batch mein = kam calls = fast + cheap
const generateEmbeddings = async (texts) => {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts, // Array of strings
  });

  // Har text ka embedding same order mein aata hai
  return response.data.map((item) => item.embedding);
};

// ── Store Chunks in Pinecone ──────────────────────────
// Chunks + their embeddings → Pinecone mein save
const storeEmbeddings = async (chunks, documentId) => {
  const index = getIndex();

  const EMBED_BATCH = 50; // safe for OpenRouter / OpenAI limits
  const UPSERT_BATCH = 100;

  const allRecords = [];

  // ── Step 1: Embed in batches ─────────────────────
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch = chunks.slice(i, i + EMBED_BATCH);

    const vectors = await generateEmbeddings(batch);

    const records = vectors.map((vector, j) => ({
      id: `${documentId}_chunk_${i + j}`,
      values: vector,
      metadata: {
        text: batch[j],
        documentId,
        chunkIndex: i + j,
      },
    }));

    allRecords.push(...records);
  }

  // ── Step 2: Upsert in Pinecone batches ───────────
  for (let i = 0; i < allRecords.length; i += UPSERT_BATCH) {
    const batch = allRecords.slice(i, i + UPSERT_BATCH);

    await index.upsert(batch);

    console.log(
      `Upserted ${Math.min(i + UPSERT_BATCH, allRecords.length)}/${allRecords.length} vectors`,
    );
  }

  console.log(`Stored ${allRecords.length} embeddings for doc ${documentId}`);

  return allRecords.length;
};

// ── Delete Document Embeddings ────────────────────────
// Document delete hone pe Pinecone se bhi hataao
// Kyun? Orphan vectors space waste karte hain
// Aur galat results dete hain doosre docs ke liye
const deleteEmbeddings = async (documentId) => {
  const index = getIndex();

  try {
    // Step 1: Pehle is document ke sab chunk IDs fetch karo
    // Hum jaante hain IDs ka format: documentId_chunk_0, 1, 2...
    // Pinecone se stats lo — kitne vectors hain
    const stats = await index.describeIndexStats();
    console.log("Total vectors in index:", stats.totalRecordCount);

    // Step 2: Query se IDs nikalo
    // Dummy vector se query karo — filter ke saath
    const dummyVector = new Array(1536).fill(0);
    const results = await index.query({
      vector: dummyVector,
      topK: 1000, // Max fetch
      filter: { documentId: { $eq: documentId } },
      includeMetadata: false,
      includeValues: false,
    });

    if (results.matches.length === 0) {
      console.log(`No vectors found for doc ${documentId}`);
      return;
    }

    // Step 3: IDs se delete karo
    const ids = results.matches.map((m) => m.id);
    console.log(`Deleting ${ids.length} vectors for doc ${documentId}`);

    await index.deleteMany(ids);

    console.log(`✅ Deleted ${ids.length} vectors for doc ${documentId}`);
  } catch (error) {
    console.error("Delete embeddings error:", error.message);
    throw error;
  }
};

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  storeEmbeddings,
  deleteEmbeddings,
  getIndex,
};
