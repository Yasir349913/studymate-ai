const OpenAI = require("openai");

// ── Client Setup ─────────────────────────────────────
// OpenAI SDK use kar rahe hain lekin OpenRouter ka baseURL
// Ye possible hai kyunki OpenRouter ne OpenAI ki API
// ko exactly copy kiya hai — drop-in replacement
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    // Ye headers OpenRouter require karta hai
    // Tumhari app identify hoti hai dashboard mein
    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:3000",
    "X-Title": "StudyMate AI",
  },
});

// ── Constants ────────────────────────────────────────
// Ek jagah define karo — agar model change karna ho
// sirf yahan change karo, baaki sab automatically update
const MODEL = "openrouter/free";

// Base system prompt — general chat ke liye
const BASE_SYSTEM_PROMPT = `You are StudyMate AI, a helpful study assistant.
Help students understand concepts clearly and concisely.
- Structure your answers with clear points
- Use simple language
- Give examples where helpful
- Be honest if you don't know something`;

// RAG system prompt — Phase 4 mein use hoga
// Context (document chunks) inject kiya jayega
const RAG_SYSTEM_PROMPT = (context) => `You are StudyMate AI, a study assistant.
Answer the question using ONLY the context provided below.
If the answer is not in the context, say: "I could not find this in your notes."
Do not use any outside knowledge.

Context from student's notes:
${context}`;

// ── Helper: SSE Headers ──────────────────────────────
// Server-Sent Events ke liye browser ko batana padta hai
// ke ye ek stream hai — normal JSON response nahi
const setSSEHeaders = (res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  // Nginx proxy use kar raha ho toh ye zaroori hai
  // Warna Nginx sab chunks buffer kar lega aur
  // ek saath bhejega — streaming ka fayda nahi
  res.setHeader("X-Accel-Buffering", "no");
  // Status 200 explicitly set — headers flush karne ke liye
  res.status(200);
};

// ── Streaming Response ───────────────────────────────
// messages     = chat history array [{role, content}]
// res          = Express response object
// systemPrompt = kaunsa prompt use karna (general ya RAG)
const streamChatResponse = async (
  messages,
  res,
  systemPrompt = BASE_SYSTEM_PROMPT,
) => {
  setSSEHeaders(res);

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 1000,
      temperature: 0.7, // 0 = deterministic, 1 = creative
      // 0.7 = good balance for study assistant
    });

    // Har chunk ke liye loop
    for await (const chunk of stream) {
      // Optional chaining (?.) — agar delta ya content undefined ho
      // toh crash nahi hoga — empty string milega
      const text = chunk.choices[0]?.delta?.content || "";

      if (text) {
        fullResponse += text;

        // SSE format — ye exact format browser samajhta hai
        // "data: " prefix zaroori hai
        // "\n\n" = end of event signal
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Done signal — frontend ko pata chale stream khatam
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

    return fullResponse;
  } catch (error) {
    console.error("OpenRouter streaming error:", error);

    // Agar headers already send ho gaye — normal error nahi bhej sakte
    // SSE se error bhejo
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
      res.end();
    }

    throw error;
  }
};

// ── Non-Streaming Response ───────────────────────────
// RAG pipeline mein use hoga — wahan streaming nahi chahiye
// Sirf final answer chahiye — jo chunks se bana ho
const getChatResponse = async (messages, systemPrompt = BASE_SYSTEM_PROMPT) => {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenRouter error:", error);
    throw new Error("AI service unavailable");
  }
};

module.exports = {
  streamChatResponse,
  getChatResponse,
  RAG_SYSTEM_PROMPT, // Phase 4 mein import karenge
};
