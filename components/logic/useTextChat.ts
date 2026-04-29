import { useCallback } from "react";

import { useStreamingAvatarContext } from "./context";

export const useTextChat = () => {
  const { avatarRef, addUserMessage } = useStreamingAvatarContext();

  const sendMessage = useCallback(
    async (message: string) => {
      if (!avatarRef.current) return;

      // Add user message to history for text chat
      addUserMessage(message);

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        
        avatarRef.current.repeat(data.reply);
      } catch (error) {
        console.error("Gemini fetch error:", error);
      }
    },
    [avatarRef, addUserMessage],
  );

  const sendMessageSync = useCallback(
    async (message: string) => {
      if (!avatarRef.current) return;

      // Add user message to history for text chat
      addUserMessage(message);

      try {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Request failed");
        
        return avatarRef.current?.repeat(data.reply);
      } catch (error) {
        console.error("Gemini fetch error:", error);
      }
    },
    [avatarRef, addUserMessage],
  );

  const repeatMessage = useCallback(
    (message: string) => {
      if (!avatarRef.current) return;

      // Add user message to history for text chat
      addUserMessage(message);

      return avatarRef.current?.repeat(message);
    },
    [avatarRef, addUserMessage],
  );

  const repeatMessageSync = useCallback(
    async (message: string) => {
      if (!avatarRef.current) return;

      // Add user message to history for text chat
      addUserMessage(message);

      return avatarRef.current?.repeat(message);
    },
    [avatarRef, addUserMessage],
  );

  return {
    sendMessage,
    sendMessageSync,
    repeatMessage,
    repeatMessageSync,
  };
};
