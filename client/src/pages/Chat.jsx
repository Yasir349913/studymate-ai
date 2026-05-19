import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, FileText, ChevronDown, Sparkles } from "lucide-react";
import PageWrapper from "@/components/layout/PageWrapper";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import ChatSkeleton from "@/components/chat/ChatSkeleton";
import { chatAPI } from "@/api/chat.api";
import { documentAPI } from "@/api/document.api";
import { useStreamChat } from "@/hooks/useStreamChat";
import { cn, truncate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Chat() {
  const { chatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const documentId = searchParams.get("doc");

  const [messages, setMessages] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(chatId || null);
  const [streamingMsg, setStreamingMsg] = useState("");
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const bottomRef = useRef(null);
  const { sendMessage, streaming, streamText, cancel } = useStreamChat();

  // ── chatId change pe reset ───────────────────────
  // Ye sabse important fix hai
  useEffect(() => {
    setCurrentChatId(chatId || null);
    setMessages([]); // Pehle clear karo
    setStreamingMsg(""); // Stream bhi clear
  }, [chatId]);

  // ── Existing chat load ───────────────────────────
  const { isLoading: chatLoading, data: chatData } = useQuery({
    queryKey: ["chat", currentChatId],
    queryFn: () => chatAPI.getOne(currentChatId).then((r) => r.data),
    enabled: !!currentChatId,
    staleTime: 0, // Har baar fresh fetch karo
  });

  useEffect(() => {
    if (chatData?.chat?.messages) {
      setMessages(chatData.chat.messages);
    }
  }, [chatData]);

  // ── Documents load ───────────────────────────────
  const { data: docsData } = useQuery({
    queryKey: ["documents"],
    queryFn: () => documentAPI.getAll().then((r) => r.data),
  });

  const readyDocs =
    docsData?.documents?.filter((d) => d.status === "ready") || [];

  // ── URL param se doc set karo ────────────────────
  useEffect(() => {
    if (documentId && readyDocs.length > 0) {
      const doc = readyDocs.find((d) => d._id === documentId);
      if (doc) setSelectedDoc(doc);
    }
  }, [documentId, readyDocs.length]);

  // ── Auto scroll ──────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMsg]);

  // ── Streaming text ───────────────────────────────
  useEffect(() => {
    setStreamingMsg(streamText);
  }, [streamText]);

  // ── Send message ─────────────────────────────────
  const handleSend = useCallback(
    async (message) => {
      const userMsg = { role: "user", content: message };
      setMessages((prev) => [...prev, userMsg]);

      await sendMessage({
        message,
        chatId: currentChatId,
        documentId: selectedDoc?._id || null,

        onComplete: (fullText, newChatId) => {
          // Blank response handle karo
          const responseText = fullText?.trim()
            ? fullText
            : "I couldn't generate a response. Please try again.";

          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: responseText },
          ]);
          setStreamingMsg("");

          if (newChatId && !currentChatId) {
            setCurrentChatId(newChatId);
            navigate(`/chat/${newChatId}`, { replace: true });
          }

          queryClient.invalidateQueries(["chats"]);
        },

        onError: (err) => {
          toast.error("Failed to send message. Please try again.");
          setMessages((prev) => prev.slice(0, -1));
          setStreamingMsg("");
        },
      });
    },
    [currentChatId, selectedDoc, sendMessage, navigate, queryClient],
  );

  const isNewChat = !currentChatId && messages.length === 0;

  // ── Loading state ────────────────────────────────
  // chatId hai lekin data abhi load nahi hua
  const showLoader = !!currentChatId && chatLoading && messages.length === 0;

  return (
    <PageWrapper>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-violet-400" />
            <h1 className="text-white/80 text-sm font-medium">
              {currentChatId ? "Chat" : "New Chat"}
            </h1>
          </div>

          {/* Document Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDocPicker(!showDocPicker)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border",
                selectedDoc
                  ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                  : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10",
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              {selectedDoc
                ? truncate(selectedDoc.originalName, 25)
                : "Select document"}
              <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatePresence>
              {showDocPicker && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-[#111118] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setSelectedDoc(null);
                        setShowDocPicker(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left",
                        !selectedDoc
                          ? "bg-violet-600/20 text-violet-300"
                          : "text-white/50 hover:bg-white/5",
                      )}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      General AI Chat
                    </button>

                    {readyDocs.length > 0 && (
                      <div className="my-1 border-t border-white/8" />
                    )}

                    {readyDocs.map((doc) => (
                      <button
                        key={doc._id}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowDocPicker(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all text-left",
                          selectedDoc?._id === doc._id
                            ? "bg-violet-600/20 text-violet-300"
                            : "text-white/50 hover:bg-white/5",
                        )}
                      >
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{doc.originalName}</span>
                      </button>
                    ))}

                    {readyDocs.length === 0 && (
                      <p className="text-white/25 text-xs px-3 py-2">
                        No documents ready yet
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 overflow-y-auto"
          onClick={() => showDocPicker && setShowDocPicker(false)}
        >
          {showLoader ? (
            <ChatSkeleton />
          ) : isNewChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-violet-400" />
              </div>
              <h2 className="text-white/70 text-lg font-medium mb-2">
                {selectedDoc
                  ? `Chatting with ${truncate(selectedDoc.originalName, 30)}`
                  : "Start a conversation"}
              </h2>
              <p className="text-white/30 text-sm max-w-sm">
                {selectedDoc
                  ? "Ask anything about your document. AI will answer from your notes only."
                  : "Select a document above to chat with your notes, or ask any question."}
              </p>

              {selectedDoc && (
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                  <p className="w-full text-white/20 text-xs text-center mb-1">
                    Try asking:
                  </p>

                  {[
                    "Summarize this document",
                    "What are the key concepts?",
                    "Explain the most important topic",
                    "What should I focus on for exam?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSend(q)}
                      disabled={streaming}
                      className="px-3 py-1.5 rounded-xl bg-white/5 text-white/50 text-xs border border-white/8 hover:bg-white/10 hover:text-white/70 transition-all disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} isStreaming={false} />
              ))}

              {streaming && streamingMsg && (
                <ChatMessage
                  message={{ role: "assistant", content: streamingMsg }}
                  isStreaming={true}
                />
              )}

              {streaming && !streamingMsg && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white/40" />
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-2xl px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white/40"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput
          onSend={handleSend}
          streaming={streaming}
          onCancel={cancel}
          placeholder={
            selectedDoc
              ? `Ask about ${truncate(selectedDoc.originalName, 20)}...`
              : "Ask anything..."
          }
        />
      </div>
    </PageWrapper>
  );
}
