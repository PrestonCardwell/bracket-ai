"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { ChatMessage, Picks, BracketData } from "@/lib/types";
import { buildChatSystemPrompt } from "@/lib/prompts";
import { decryptValue, looksLikeRawKey } from "@/lib/crypto";

const STORAGE_KEY = "bracket-ai-chat";

async function getSettings() {
  try {
    const s = localStorage.getItem("bracket-ai-settings");
    if (!s) return null;
    const parsed = JSON.parse(s);

    let apiKey = "";
    if (parsed.encryptedKey) {
      apiKey = await decryptValue(parsed.encryptedKey);
    } else if (parsed.apiKey && looksLikeRawKey(parsed.apiKey)) {
      apiKey = parsed.apiKey;
    }

    if (!apiKey) return null;
    return {
      provider: parsed.provider as "openai" | "anthropic",
      apiKey,
      model: parsed.model as string,
    };
  } catch {
    return null;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function useChat(bracketData: BracketData, picks: Picks) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  // Track the gameId for pending AI pick requests so we can auto-fill
  const [pendingPickGameId, setPendingPickGameId] = useState<string | null>(null);
  const [lastPickResult, setLastPickResult] = useState<{ gameId: string; teamName: string } | null>(null);
  // Keep a ref to latest picks so the system prompt is always current
  const picksRef = useRef(picks);
  picksRef.current = picks;

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (content: string, gameId?: string, displayMessage?: string) => {
      // Try to get user settings; if none, the server-side key will be used
      const settings = await getSettings();

      if (gameId) {
        setPendingPickGameId(gameId);
      }

      // Show a clean message in the chat UI, but send the full data-rich prompt to the AI
      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content: displayMessage || content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      // Build messages array for the API (last 20 messages for context window)
      // Use the full content (not display message) for the current user message sent to the AI
      const recentMessages = [...messages].slice(-19);
      const apiMessages = [
        ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content },  // full prompt goes to API, not display message
      ];

      const systemPrompt = buildChatSystemPrompt(
        bracketData,
        picksRef.current
      );

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: settings?.provider || "openai",
            apiKey: settings?.apiKey || "",
            model: settings?.model || "",
            systemPrompt,
            messages: apiMessages,
          }),
        });

        const data = await res.json();
        if (data.error) {
          setError(data.error);
          setLoading(false);
          setPendingPickGameId(null);
          return;
        }

        const assistantMsg: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: data.content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setLoading(false);

        // If this was a pick request, extract the team name from the response
        if (gameId) {
          // Match "Pick: Team Name" with optional ** wrapping and trailing text
          const pickMatch = data.content.match(/(?:PICK|Pick):\s*\*{0,2}([^*\n]+)/i);
          if (pickMatch) {
            const teamName = pickMatch[1]
              .replace(/\*+/g, "")
              .replace(/\s*[-–—].*/, "")   // strip after dashes
              .replace(/\.\s.*/, "")         // strip after ". " (sentence boundary)
              .replace(/[.,!]+$/, "")        // strip trailing punctuation
              .trim();
            if (teamName) {
              setLastPickResult({ gameId, teamName });
            }
          }
          setPendingPickGameId(null);
        }
      } catch (e) {
        setError(
          `Request failed: ${e instanceof Error ? e.message : String(e)}`
        );
        setLoading(false);
        setPendingPickGameId(null);
      }
    },
    [messages, bracketData]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const clearPickResult = useCallback(() => setLastPickResult(null), []);

  return {
    messages,
    loading,
    error,
    isOpen,
    sendMessage,
    clearChat,
    open,
    close,
    lastPickResult,
    clearPickResult,
  };
}
