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
    "HTTP-Referer": process.env.CLIENT_URL || "http://localhost:5173",
    "X-Title": "StudyMate AI",
  },
});

// ── Constants ────────────────────────────────────────
// Ek jagah define karo — agar model change karna ho
// sirf yahan change karo, baaki sab automatically update
const MODEL = "openrouter/free";
// const MODEL = process.env.OPENROUTER_MODEL || "google/gemma-3-12b-it:free";

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
  let retryCount = 0;
  const maxRetries = 2;

  while (retryCount <= maxRetries) {
    try {
      const stream = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
        max_tokens: 1000,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      // Success — loop se bahar niklo
      break;
    } catch (error) {
      retryCount++;
      console.error(
        `OpenRouter streaming error (attempt ${retryCount}):`,
        error.message,
      );

      if (retryCount > maxRetries) {
        // Sab retries fail — user ko batao
        if (!res.writableEnded) {
          res.write(
            `data: ${JSON.stringify({
              text: "\n\nI'm having trouble connecting right now. Please try again in a moment.",
            })}\n\n`,
          );
        }
        break;
      }

      // 1 second wait — phir retry
      await new Promise((r) => setTimeout(r, 1000));
      console.log(`Retrying stream... attempt ${retryCount + 1}`);
    }
  }

  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }

  return fullResponse;
};

// ── Non-Streaming Response ───────────────────────────
// RAG pipeline mein use hoga — wahan streaming nahi chahiye
// Sirf final answer chahiye — jo chunks se bana ho
const getChatResponse = async (
  messages,
  systemPrompt = BASE_SYSTEM_PROMPT,
  maxTokens = 2000, // ← Increase kiya — truncation fix
) => {
  // 3 retry attempts with different temperatures
  const attempts = [
    { temperature: 0.3, max_tokens: maxTokens },
    { temperature: 0.1, max_tokens: maxTokens },
    { temperature: 0.5, max_tokens: maxTokens + 500 },
  ];

  for (const config of attempts) {
    try {
      const response = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        ...config,
      });

      const content = response.choices[0]?.message?.content;
      if (content && content.length > 10) {
        return content;
      }
    } catch (error) {
      console.error("OpenRouter attempt failed:", error.message);
    }
  }

  throw new Error("AI service unavailable after retries");
};

module.exports = {
  streamChatResponse,
  getChatResponse,
  RAG_SYSTEM_PROMPT, // Phase 4 mein import karenge
};
