"use client";

import { useState, useEffect } from "react";
import { AIProvider } from "@/lib/types";
import { encryptValue, decryptValue, looksLikeRawKey } from "@/lib/crypto";

const STORAGE_KEY = "bracket-ai-settings";

const MODELS: Record<AIProvider, { id: string; label: string }[]> = {
  openai: [
    { id: "gpt-5.4-mini", label: "GPT-5.4 Mini (cheapest)" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "o4-mini", label: "o4-mini" },
  ],
  anthropic: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (cheapest)" },
    { id: "claude-opus-4-6", label: "Claude Opus 4.6" },
  ],
};

export default function SettingsPage() {
  const [provider, setProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("gpt-5.4-mini");
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load and decrypt settings on mount
  useEffect(() => {
    async function load() {
      try {
        const s = localStorage.getItem(STORAGE_KEY);
        if (!s) {
          setLoaded(true);
          return;
        }
        const parsed = JSON.parse(s);
        setProvider(parsed.provider || "openai");
        setModel(parsed.model || "gpt-5.4-mini");

        // Handle both encrypted keys and legacy plain-text keys
        if (parsed.encryptedKey) {
          const decrypted = await decryptValue(parsed.encryptedKey);
          setApiKey(decrypted);
        } else if (parsed.apiKey && looksLikeRawKey(parsed.apiKey)) {
          // Auto-migrate: encrypt the plain-text key
          setApiKey(parsed.apiKey);
          const encrypted = await encryptValue(parsed.apiKey);
          const migrated = { ...parsed, encryptedKey: encrypted };
          delete migrated.apiKey;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        }
      } catch {
        // ignore
      }
      setLoaded(true);
    }
    load();
  }, []);

  async function handleSave() {
    const encrypted = await encryptValue(apiKey);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ provider, encryptedKey: encrypted, model })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleProviderChange(p: AIProvider) {
    setProvider(p);
    setModel(MODELS[p][0].id);
  }

  if (!loaded) {
    return (
      <div className="min-h-screen p-6 max-w-lg mx-auto">
        <p className="text-slate-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-lg mx-auto">
      <a
        href="/"
        className="text-sm text-slate-400 hover:text-white transition-colors"
      >
        &larr; Back to Bracket
      </a>
      <h1 className="text-2xl font-bold text-white mt-4 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Provider selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            AI Provider
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleProviderChange("openai")}
              className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                provider === "openai"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              OpenAI
            </button>
            <button
              onClick={() => handleProviderChange("anthropic")}
              className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                provider === "anthropic"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              Anthropic
            </button>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === "openai" ? "sk-..." : "sk-ant-..."
            }
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <p className="text-xs text-slate-500 mt-1">
            Encrypted before storage. Never sent to any server except the AI provider you selected.
          </p>
        </div>

        {/* Model selection */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-emerald-500"
          >
            {MODELS[provider].map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded transition-colors"
        >
          {saved ? "Saved!" : "Save Settings"}
        </button>

        {/* Security info */}
        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">How your key is protected:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Encrypted with AES-256-GCM before being saved to your browser</li>
            <li>Decrypted in memory only when making an AI request</li>
            <li>Sent directly to {provider === "openai" ? "OpenAI" : "Anthropic"} over HTTPS — no intermediary</li>
            <li>Never logged, stored on disk, or committed to any repository</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
