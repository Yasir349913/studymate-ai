<div align="center">

<h1>🚀 StudyMate AI</h1>
<h3>Intelligent RAG-Based Learning Assistant</h3>

<p>
  <a href="https://studymate-ai-v9zx.vercel.app/" target="_blank">
    🔗 Live Demo
  </a>
</p>

</div>

<hr/>

<h2>📌 Project Overview</h2>

<p>
<b>StudyMate AI</b> is a full-stack AI-powered study assistant that allows students to interact with their own documents using a 
<b>Retrieval-Augmented Generation (RAG)</b> system.
</p>

<p>
Unlike traditional chatbots, it does not rely on general knowledge. Instead, it answers strictly from <b>uploaded documents</b>, 
ensuring accurate and hallucination-free responses.
</p>

<p>It also generates:</p>

<ul>
  <li>🧠 AI-powered MCQs (Quizzes)</li>
  <li>🧾 Flashcards for revision</li>
  <li>📄 Smart document summaries</li>
</ul>

<hr/>

<h2>⚙️ Tech Stack</h2>

<ul>
  <li><b>Frontend:</b> React.js + Tailwind CSS</li>
  <li><b>Backend:</b> Node.js + Express.js</li>
  <li><b>Database:</b> MongoDB</li>
  <li><b>AI Models:</b> OpenAI GPT-3.5 Turbo</li>
  <li><b>Embeddings:</b> text-embedding-3-small</li>
  <li><b>Vector Database:</b> Pinecone</li>
  <li><b>Authentication:</b> JWT + bcrypt</li>
  <li><b>Deployment:</b> Vercel + Render</li>
</ul>

<hr/>

<h2>🧠 AI Architecture (RAG Pipeline)</h2>

<h3>1. Document Processing</h3>
<ul>
  <li>User uploads PDF / PPT files</li>
  <li>Text is extracted and cleaned</li>
  <li>Document is prepared for chunking</li>
</ul>

<h3>2. Text Chunking</h3>
<ul>
  <li>Document is split into ~600 character chunks</li>
  <li>Overlap is added to preserve context</li>
  <li>Ensures semantic completeness</li>
</ul>

<h3>3. Embedding Generation</h3>
<ul>
  <li>Each chunk is converted into a vector using OpenAI embeddings</li>
  <li>Model used: <b>text-embedding-3-small</b></li>
  <li>Each vector represents semantic meaning (1536 dimensions)</li>
</ul>

<h3>4. Vector Storage (Pinecone)</h3>
<ul>
  <li>Embeddings stored in Pinecone Vector DB</li>
  <li>Metadata includes chunk text + document ID</li>
  <li>Enables fast similarity search (ANN)</li>
</ul>

<h3>5. Semantic Retrieval</h3>
<ul>
  <li>User question is also converted into embedding</li>
  <li>Pinecone performs cosine similarity search</li>
  <li>Top relevant chunks are retrieved (Top-K = 5)</li>
</ul>

<h3>6. Answer Generation (LLM)</h3>
<ul>
  <li>Retrieved chunks + question sent to GPT-3.5 Turbo</li>
  <li>Model generates grounded answer only from context</li>
  <li>If no relevant data found → system refuses response</li>
</ul>

<blockquote>
“I could not find this in your uploaded notes.”
</blockquote>

<hr/>

<h2>🧩 System Architecture Flow</h2>

<pre>
User Question
     ↓
Embedding Model (OpenAI)
     ↓
Pinecone Vector Search
     ↓
Relevant Document Chunks Retrieved
     ↓
GPT-3.5 Turbo (RAG Prompt)
     ↓
Final Grounded Answer
</pre>

<hr/>

<h2>✨ Key Features</h2>

<ul>
  <li>📚 Chat with PDFs & Documents</li>
  <li>🧠 RAG-based AI system (no hallucination)</li>
  <li>🧾 Automatic MCQ generation</li>
  <li>🧠 Flashcard generation</li>
  <li>📄 AI-powered summarization</li>
  <li>🔐 Secure authentication system</li>
  <li>⚡ Fast semantic search using Pinecone</li>
</ul>

<hr/>

<h2>🚀 Live Demo</h2>

<p>
<a href="https://studymate-ai-v9zx.vercel.app/" target="_blank">
👉 Click here to open StudyMate AI
</a>
</p>

<hr/>

<h2>🏆 Project Highlights</h2>

<ul>
  <li>✔ Production-ready full-stack AI system</li>
  <li>✔ Real-world RAG implementation</li>
  <li>✔ Zero hallucination design approach</li>
  <li>✔ Optimized vector search pipeline</li>
  <li>✔ Scalable AI architecture</li>
</ul>

<hr/>

<h2>📫 Contact</h2>

<ul>
  <li><b>Email:</b> your-email@example.com</li>
  <li><b>LinkedIn:</b>https://www.linkedin.com/in/yasir-maqsood/</li>
  <li><b>GitHub:</b>https://github.com/Yasir349913/studymate-ai</li>
</ul>

<hr/>

<div align="center">

<h3>⭐ If you like this project, consider starring the repo ⭐</h3>

</div>
