const { generateEmbedding, getIndex } = require("./embedding.service");

const retrieveChunks = async (question, documentId, topK = 5) => {
  const index = getIndex();

  const questionVector = await generateEmbedding(question);

  const results = await index.query({
    vector: questionVector,
    topK,
    filter: { documentId: { $eq: documentId } },
    includeMetadata: true,
  });

  const relevantChunks = results.matches
    .filter((match) => match.score > 0.1)
    .map((match) => ({
      text: match.metadata.text,
      score: match.score,
      chunkIndex: match.metadata.chunkIndex,
    }));

  return relevantChunks;
};

const formatContext = (chunks) => {
  if (chunks.length === 0) return null;

  return chunks
    .map((chunk, i) => `[Section ${i + 1}]:\n${chunk.text}`)
    .join("\n\n---\n\n");
};

module.exports = { retrieveChunks, formatContext };
