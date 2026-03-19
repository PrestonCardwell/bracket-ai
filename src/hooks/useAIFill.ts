"use client";

import { useState, useCallback, useRef } from "react";
import { BracketData, Picks, Team, RegionName } from "@/lib/types";
import { getGameId, getTopTeam, getBottomTeam, getAllTeams } from "@/lib/bracket";
import { buildPickPrompt, SYSTEM_PROMPT } from "@/lib/prompts";
import { BracketStyle } from "@/lib/simulate";
import { decryptValue, looksLikeRawKey } from "@/lib/crypto";

interface AIFillProgress {
  phase: string; // e.g. "Round of 64", "Sweet 16", etc.
  completed: number;
  total: number;
  currentMatchup?: string; // e.g. "Duke vs Siena"
}

interface AISettings {
  provider: string;
  apiKey: string;
  model: string;
}

async function getSettings(): Promise<AISettings | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("bracket-ai-settings");
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    let apiKey = "";
    if (parsed.encryptedKey) {
      apiKey = await decryptValue(parsed.encryptedKey);
    } else if (parsed.apiKey && looksLikeRawKey(parsed.apiKey)) {
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

// Same system prompt as individual picks — model must show its reasoning
// so it actually thinks through the analysis instead of shortcutting to chalk
const FILL_SYSTEM_PROMPT = SYSTEM_PROMPT + `\n\nRESPONSE FORMAT: You are filling a full bracket. You MUST show your brief reasoning so you actually think through the matchup. Use this exact format:

Reasoning: [2-3 sentences comparing the teams, noting the simulation roll result, and explaining your pick]
Pick: [Team Name]

The reasoning is critical — it forces you to actually analyze instead of defaulting to the favorite. Respect the simulation roll.`;

async function quickPick(
  topTeam: Team,
  bottomTeam: Team,
  round: number,
  settings: AISettings
): Promise<string | null> {
  // Use the EXACT same prompt as the individual AI pick button
  const prompt = buildPickPrompt(topTeam, bottomTeam, round);

  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        systemPrompt: FILL_SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[AI Fill] API error (${res.status}):`, errText);
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.error("[AI Fill] Response error:", data.error);
      return null;
    }

    // Extract the pick from the reasoning response
    const content = (data.content || "").trim();

    // Look for "Pick: [Team Name]" pattern
    const pickMatch = content.match(/(?:Pick|PICK):\s*\*{0,2}([^*\n]+)/i);
    if (pickMatch) {
      const teamName = pickMatch[1]
        .replace(/\*+/g, "")
        .replace(/\s*[-–—].*/, "")
        .replace(/[.!,]+$/, "")
        .trim();
      console.log(`[AI Fill] ${topTeam.shortName} vs ${bottomTeam.shortName} → "${teamName}" (from reasoning)`);
      return teamName || null;
    }

    // Fallback: try to find a team name in the response
    const raw = content.replace(/[.*"]/g, "").trim();
    console.log(`[AI Fill] ${topTeam.shortName} vs ${bottomTeam.shortName} → "${raw}" (raw fallback)`);
    return raw || null;
  } catch (e) {
    console.error("[AI Fill] Fetch failed:", e);
    return null;
  }
}

function findTeamByName(
  name: string,
  allTeams: Team[]
): Team | null {
  const normalized = name.toLowerCase().trim();
  return (
    allTeams.find((t) => t.name.toLowerCase() === normalized) ||
    allTeams.find((t) => t.shortName.toLowerCase() === normalized) ||
    allTeams.find((t) => t.name.toLowerCase().includes(normalized)) ||
    allTeams.find((t) => normalized.includes(t.name.toLowerCase())) ||
    allTeams.find((t) => normalized.includes(t.shortName.toLowerCase())) ||
    null
  );
}

const ROUND_NAMES: Record<number, string> = {
  0: "First Four",
  1: "Round of 64",
  2: "Round of 32",
  3: "Sweet 16",
  4: "Elite Eight",
  5: "Final Four",
  6: "Championship",
};

export function useAIFill(bracketData: BracketData) {
  const [filling, setFilling] = useState(false);
  const [progress, setProgress] = useState<AIFillProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const fill = useCallback(
    async (
      _style: BracketStyle,
      onPick: (gameId: string, teamId: string) => void
    ) => {
      setFilling(true);
      setError(null);
      abortRef.current = false;

      // Try user settings; if none, use empty values (server-side key will be used)
      const settings: AISettings = (await getSettings()) || {
        provider: "openai",
        apiKey: "",
        model: "",
      };

      const allTeams = getAllTeams(bracketData);
      const picks: Picks = {};

      // Helper: analyze one game, update progress, apply pick
      async function analyzeGame(
        gameId: string,
        topTeam: Team,
        bottomTeam: Team,
        round: number,
        phase: string,
        completed: number,
        total: number
      ): Promise<void> {
        if (abortRef.current) return;
        setProgress({ phase, completed, total, currentMatchup: `${topTeam.shortName} vs ${bottomTeam.shortName}` });

        const winnerName = await quickPick(topTeam, bottomTeam, round, settings);
        const winner = winnerName ? findTeamByName(winnerName, [topTeam, bottomTeam]) : null;
        const picked = winner || topTeam; // fallback to top team

        picks[gameId] = picked.id;
        onPick(gameId, picked.id);
        setProgress({ phase, completed: completed + 1, total });
      }

      try {
        // 1. First Four — use locked results where available, AI for the rest
        if (bracketData.firstFour.length > 0) {
          const total = bracketData.firstFour.length;
          let completed = 0;
          for (const ff of bracketData.firstFour) {
            if (abortRef.current) break;

            if (ff.winner) {
              // Locked result — apply directly
              const winner = ff.winner === "teamA" ? ff.teamA : ff.teamB;
              picks[ff.id] = winner.id;
              onPick(ff.id, winner.id);
              completed++;
              setProgress({ phase: ROUND_NAMES[0], completed, total, currentMatchup: `${ff.teamA.shortName} vs ${ff.teamB.shortName} ✓` });
            } else {
              await analyzeGame(ff.id, ff.teamA, ff.teamB, 0, ROUND_NAMES[0], completed, total);
              completed++;
            }
          }
        }

        // 2. Regional rounds 1-4 — one game at a time
        const regionNames: RegionName[] = ["east", "west", "south", "midwest"];
        for (let round = 1; round <= 4; round++) {
          const gamesPerRegion = 8 / Math.pow(2, round - 1);
          const totalGames = gamesPerRegion * 4;
          let completed = 0;

          for (const regionName of regionNames) {
            const region = bracketData.regions[regionName];
            for (let g = 0; g < gamesPerRegion; g++) {
              if (abortRef.current) break;
              const gameId = getGameId(regionName, round, g);
              const topTeam = getTopTeam(region, round, g, picks, bracketData.firstFour);
              const bottomTeam = getBottomTeam(region, round, g, picks, bracketData.firstFour);
              if (topTeam && bottomTeam) {
                await analyzeGame(gameId, topTeam, bottomTeam, round, ROUND_NAMES[round], completed, totalGames);
              }
              completed++;
            }
          }
        }

        // 3. Final Four — one at a time
        if (!abortRef.current) {
          for (let g = 0; g < 2; g++) {
            if (abortRef.current) break;
            const [r1, r2] = bracketData.finalFourMatchups[g];
            const topTeamId = picks[`${r1}-r4-g0`];
            const bottomTeamId = picks[`${r2}-r4-g0`];
            const topTeam = topTeamId ? allTeams.find((t) => t.id === topTeamId) || null : null;
            const bottomTeam = bottomTeamId ? allTeams.find((t) => t.id === bottomTeamId) || null : null;
            if (topTeam && bottomTeam) {
              await analyzeGame(`ff-g${g}`, topTeam, bottomTeam, 5, ROUND_NAMES[5], g, 2);
            }
          }
        }

        // 4. Championship
        if (!abortRef.current) {
          const champTopId = picks["ff-g0"];
          const champBottomId = picks["ff-g1"];
          const champTop = champTopId ? allTeams.find((t) => t.id === champTopId) || null : null;
          const champBottom = champBottomId ? allTeams.find((t) => t.id === champBottomId) || null : null;
          if (champTop && champBottom) {
            await analyzeGame("final", champTop, champBottom, 6, ROUND_NAMES[6], 0, 1);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "AI fill failed");
      } finally {
        setFilling(false);
        setProgress(null);
      }
    },
    [bracketData]
  );

  const cancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  return { fill, filling, progress, error, cancel };
}
