const { retrieveChunks, formatContext } = require("./retrieval.service");
const {
  streamChatResponse,
  getChatResponse,
  RAG_SYSTEM_PROMPT,
} = require("./openai.service");

// ── RAG Answer — Streaming ────────────────────────────
// Chat page pe use hoga — word by word response
const ragStreamAnswer = async (question, documentId, chatHistory, res) => {
  // Step 1: Relevant chunks nikalo
  const chunks = await retrieveChunks(question, documentId);

  // Step 2: Chunks mile ya nahi?
  if (chunks.length === 0) {
    // No relevant chunks — SSE se batao
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.status(200);
    res.write(
      `data: ${JSON.stringify({
        text: "I couldn't find relevant information about this in your notes. Please try rephrasing your question.",
      })}\n\n`,
    );
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return { answer: null, sources: [] };
  }

  // Step 3: Context banao
  const context = formatContext(chunks);

  // Step 4: Recent chat history include karo (last 6 messages)
  // Kyun? Conversation continuity chahiye
  // "Uske baare mein aur batao" — AI ko pata hona chahiye
  // "uske" ka matlab kya hai
  const messages = [
    ...chatHistory.slice(-6),
    { role: "user", content: question },
  ];

  // Step 5: Stream karo
  const fullAnswer = await streamChatResponse(
    messages,
    res,
    RAG_SYSTEM_PROMPT(context),
  );

  // Step 6: Sources return karo — frontend pe cite kar sako
  const sources = chunks.map((c) => ({
    text: c.text.slice(0, 150) + "...", // Preview only
    score: Math.round(c.score * 100), // Percentage mein
    chunkIndex: c.chunkIndex,
  }));

  return { answer: fullAnswer, sources };
};

// ── RAG Answer — Non-Streaming ────────────────────────
// Quiz + Summary generation mein use hoga
const ragGetAnswer = async (question, documentId, topK = 5) => {
  const chunks = await retrieveChunks(question, documentId, topK);

  if (chunks.length === 0) {
    return {
      answer: null,
      sources: [],
      found: false,
    };
  }

  const context = formatContext(chunks);
  const messages = [{ role: "user", content: question }];

  const answer = await getChatResponse(messages, RAG_SYSTEM_PROMPT(context));

  return {
    answer,
    sources: chunks,
    found: true,
  };
};

module.exports = { ragStreamAnswer, ragGetAnswer };
