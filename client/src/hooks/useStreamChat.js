import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/store/auth.store";

export function useStreamChat() {
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const abortRef = useRef(null);

  const { logout } = useAuthStore();

  const refreshToken = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) throw new Error("Refresh failed");

      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);

      return data.accessToken;
    } catch {
      logout();
      return null;
    }
  };

  const sendMessage = useCallback(
    async ({ message, chatId, documentId, onChunk, onComplete, onError }) => {
      setStreaming(true);
      setStreamText("");

      abortRef.current = new AbortController();

      let token = localStorage.getItem("accessToken");

      const makeRequest = async (authToken) => {
        return fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            message,
            ...(chatId && { chatId }),
            ...(documentId && { documentId }),
          }),
          signal: abortRef.current.signal,
          credentials: "include",
        });
      };

      try {
        let response = await makeRequest(token);

        // 🔥 TOKEN EXPIRE HANDLING
        if (response.status === 401) {
          const newToken = await refreshToken();

          if (!newToken) {
            onError?.("Session expired. Please login again.");
            return;
          }

          token = newToken;
          response = await makeRequest(newToken);
        }

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to send message");
        }

        const newChatId = response.headers.get("X-Chat-Id");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) throw new Error(data.error);

              if (data.done) {
                onComplete?.(fullText, newChatId);
                return;
              }

              if (data.text) {
                fullText += data.text;
                setStreamText(fullText);
                onChunk?.(data.text, fullText);
              }
            } catch (e) {
              if (e.message !== "Unexpected end of JSON input") {
                console.error("Parse error:", e);
              }
            }
          }
        }

        onComplete?.(fullText, newChatId);
      } catch (err) {
        if (err.name !== "AbortError") {
          onError?.(err.message || "Something went wrong. Please try again.");
        }
      } finally {
        setStreaming(false);
        setStreamText("");
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
    setStreamText("");
  }, []);

  return { sendMessage, streaming, streamText, cancel };
}
