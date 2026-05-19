import { useState, useRef, useEffect } from "react";
import { Send, Square, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatInput({
  onSend,
  streaming,
  onCancel,
  disabled,
  placeholder = "Ask anything about your document...",
}) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // Auto resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [message]);

  const handleSend = () => {
    const text = message.trim();
    if (!text || streaming) return;
    onSend(text);
    setMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/8">
      <div
        className={cn(
          "flex items-end gap-3 bg-white/5 border rounded-2xl px-4 py-3 transition-all",
          streaming
            ? "border-violet-500/30"
            : "border-white/10 focus-within:border-violet-500/50",
        )}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || streaming}
          rows={1}
          className="flex-1 bg-transparent text-white/80 placeholder:text-white/25 text-sm resize-none outline-none leading-relaxed max-h-40"
        />

        <div className="flex items-center gap-2 flex-shrink-0">
          {streaming ? (
            <button
              onClick={onCancel}
              className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/30 transition-all"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                message.trim()
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-white/5 text-white/20 cursor-not-allowed",
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-white/15 mt-2">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
