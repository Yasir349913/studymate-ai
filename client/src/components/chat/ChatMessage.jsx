import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { BookOpen, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 group", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
          isUser
            ? "bg-violet-600/30 text-violet-300"
            : "bg-white/10 text-white/60",
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <BookOpen className="w-4 h-4" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-violet-600/20 text-white/90 border border-violet-500/20"
            : "bg-white/5 text-white/80 border border-white/8",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const code = String(children).replace(/\n$/, "");

                  if (!inline && match) {
                    return (
                      <div className="relative group/code my-2">
                        <div className="flex items-center justify-between bg-white/5 px-3 py-1.5 rounded-t-lg border border-white/10 border-b-0">
                          <span className="text-xs text-white/30 font-mono">
                            {match[1]}
                          </span>
                          <CopyButton text={code} />
                        </div>
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: "0 0 8px 8px",
                            fontSize: "12px",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderTop: "none",
                          }}
                          {...props}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  return (
                    <code
                      className="bg-white/10 text-violet-300 px-1.5 py-0.5 rounded text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-white/70">{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 className="text-base font-medium text-white mb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-sm font-medium text-white mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-medium text-white/80 mb-1">
                    {children}
                  </h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-violet-500 pl-3 text-white/50 my-2">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="text-white font-medium">{children}</strong>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>

            {/* Streaming cursor */}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-violet-400 rounded-sm ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
