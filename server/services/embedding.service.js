const OpenAI = require("openai");
const { Pinecone } = require("@pinecone-database/pinecone");

// ── Clients ──────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:3000",
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

  // Batch mein embed karo — sab chunks ek saath
  const embeddings = await generateEmbeddings(chunks);

  // Pinecone record format
  const records = embeddings.map((vector, i) => ({
    id: `${documentId}_chunk_${i}`, // Unique ID
    values: vector, // 1536 numbers
    metadata: {
      text: chunks[i], // Original text — retrieval mein wapas milega
      documentId: documentId, // Filter ke liye — sirf is doc ke chunks
      chunkIndex: i, // Order track karne ke liye
    },
  }));

  // Pinecone mein 100 records ek baar mein upsert karo
  // Zyada chunks hone pe batch mein karo
  const BATCH_SIZE = 100;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await index.upsert(batch);
  }

  console.log(`Stored ${records.length} embeddings for doc ${documentId}`);
  return records.length;
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
    console.log('Total vectors in index:', stats.totalRecordCount);

    // Step 2: Query se IDs nikalo
    // Dummy vector se query karo — filter ke saath
    const dummyVector = new Array(1536).fill(0);
    const results = await index.query({
      vector:          dummyVector,
      topK:            1000, // Max fetch
      filter:          { documentId: { $eq: documentId } },
      includeMetadata: false,
      includeValues:   false,
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
    console.error('Delete embeddings error:', error.message);
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
