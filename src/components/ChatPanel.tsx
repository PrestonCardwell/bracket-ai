"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ChatMessage } from "@/lib/types";

interface ChatPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  onSend: (content: string) => void;
  onClear: () => void;
  onClose: () => void;
}

/** Strip URLs, domains, citation brackets, and source references from AI text */
function stripUrls(text: string): string {
  return text
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove bare URLs (with optional surrounding parens/brackets)
    .replace(/\s*\(?\s*https?:\/\/[^\s)}\]]+\s*\)?\s*/g, " ")
    // Remove domain names in parens like (sports.yahoo.com) or (ctinsider.com)
    .replace(/\s*\([a-z0-9.-]+\.[a-z]{2,}\)\s*/gi, " ")
    // Remove [source] style citations
    .replace(/\s*\[[^\]]*(?:source|ref|cite|http)[^\]]*\]\s*/gi, " ")
    // Clean up double spaces and trailing spaces before punctuation
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/  +/g, " ")
    .trim();
}

/** Render inline markdown: **bold** */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, j) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={j} className="text-white font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={j}>{part}</span>
    )
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-violet-600 text-white"
            : "bg-slate-800 text-slate-200 border border-slate-700"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-1">
            {stripUrls(message.content).split("\n").map((line, i) => {
              // Section headers
              if (line.startsWith("## ")) {
                return (
                  <h4
                    key={i}
                    className="text-emerald-400 font-semibold mt-2.5 mb-0.5 text-sm"
                  >
                    {renderInline(line.slice(3))}
                  </h4>
                );
              }
              // Pick callout — matches "Pick: X" anywhere in line, with optional bullets/bold
              const pickMatch = line.match(/(?:PICK|Pick):\s*\*{0,2}([^*\n]+)/i);
              if (pickMatch) {
                const teamName = pickMatch[1].replace(/\*+/g, "").replace(/[.,!]+$/, "").trim();
                return (
                  <div
                    key={i}
                    className="bg-emerald-900/40 border border-emerald-600 rounded px-2.5 py-1.5 my-1.5 text-emerald-200 font-bold text-sm"
                  >
                    Pick: {teamName}
                  </div>
                );
              }
              // Bullet points (- or *)
              if (line.match(/^[-*]\s/)) {
                return (
                  <p key={i} className="text-slate-300 text-sm pl-3 leading-snug">
                    <span className="text-slate-500 mr-1.5">&bull;</span>
                    {renderInline(line.slice(2))}
                  </p>
                );
              }
              // Full-line bold
              if (line.startsWith("**") && line.endsWith("**") && !line.includes("**", 2)) {
                return (
                  <p key={i} className="text-white font-semibold text-sm mt-1">
                    {line.slice(2, -2)}
                  </p>
                );
              }
              // Empty line
              if (line.trim() === "") {
                return <div key={i} className="h-1" />;
              }
              // Regular text with inline bold
              return (
                <p key={i} className="text-slate-300 text-sm leading-snug">
                  {renderInline(line)}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "Rate my bracket. Where am I most vulnerable?",
  "What are the best upset picks this year?",
  "Who's the most likely Cinderella?",
  "Which 1-seed is most likely to lose early?",
];

export default function ChatPanel({
  isOpen,
  messages,
  loading,
  error,
  onSend,
  onClear,
  onClose,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    onSend(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500" />
          <h3 className="font-semibold text-white text-sm">Bracket Chat</h3>
          <span className="text-xs text-slate-500">
            {messages.length > 0 &&
              `${Math.ceil(messages.length / 2)} exchange${
                Math.ceil(messages.length / 2) !== 1 ? "s" : ""
              }`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-slate-500 text-sm mb-4">
              Ask me anything about your bracket, matchups, or March Madness
              strategy.
            </div>
            <div className="space-y-2 w-full max-w-xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="w-full text-left text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 rounded-lg px-3 py-2 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-400 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded p-3 text-red-300 text-sm mb-3">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-700 shrink-0">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your bracket..."
            rows={1}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500 transition-colors"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </button>
        </div>
        <div className="text-[10px] text-slate-600 mt-1.5">
          Enter to send &middot; Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
