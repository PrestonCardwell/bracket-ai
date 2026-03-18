"use client";

import { useState, useCallback } from "react";
import { Team, AISettings } from "@/lib/types";
import { SYSTEM_PROMPT, buildPickPrompt, buildInsightsPrompt } from "@/lib/prompts";
import { decryptValue, looksLikeRawKey } from "@/lib/crypto";

interface AIState {
  loading: boolean;
  content: string | null;
  error: string | null;
  type: "pick" | "insights" | null;
  gameId: string | null;
}

async function getSettings(): Promise<AISettings | null> {
  try {
    const s = localStorage.getItem("bracket-ai-settings");
    if (!s) return null;
    const parsed = JSON.parse(s);

    let apiKey = "";
    if (parsed.encryptedKey) {
      apiKey = await decryptValue(parsed.encryptedKey);
    } else if (parsed.apiKey && looksLikeRawKey(parsed.apiKey)) {
      // Legacy plain-text key — use it but it'll be migrated on next Settings visit
      apiKey = parsed.apiKey;
    }

    if (!apiKey) return null;
    return {
      provider: parsed.provider,
      apiKey,
      model: parsed.model,
    };
  } catch {
    return null;
  }
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    loading: false,
    content: null,
    error: null,
    type: null,
    gameId: null,
  });

  const requestAI = useCallback(
    async (
      gameId: string,
      type: "pick" | "insights",
      topTeam: Team,
      bottomTeam: Team,
      round: number
    ) => {
      const settings = await getSettings();
      if (!settings?.apiKey) {
        setState({
          loading: false,
          content: null,
          error: "No API key configured. Go to Settings to add one.",
          type,
          gameId,
        });
        return;
      }

      setState({ loading: true, content: null, error: null, type, gameId });

      const userPrompt =
        type === "pick"
          ? buildPickPrompt(topTeam, bottomTeam, round)
          : buildInsightsPrompt(topTeam, bottomTeam, round);

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: settings.provider,
            apiKey: settings.apiKey,
            model: settings.model,
            systemPrompt: SYSTEM_PROMPT,
            userPrompt,
          }),
        });

        const data = await res.json();
        if (data.error) {
          setState({
            loading: false,
            content: null,
            error: data.error,
            type,
            gameId,
          });
        } else {
          setState({
            loading: false,
            content: data.content,
            error: null,
            type,
            gameId,
          });
        }
      } catch (e) {
        setState({
          loading: false,
          content: null,
          error: `Request failed: ${e instanceof Error ? e.message : String(e)}`,
          type,
          gameId,
        });
      }
    },
    []
  );

  const clearAI = useCallback(() => {
    setState({
      loading: false,
      content: null,
      error: null,
      type: null,
      gameId: null,
    });
  }, []);

  return { ...state, requestAI, clearAI };
}
