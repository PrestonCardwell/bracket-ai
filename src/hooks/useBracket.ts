"use client";

import { useState, useCallback, useEffect } from "react";
import { Picks, RegionName } from "@/lib/types";
import { makePick, makeFirstFourPick } from "@/lib/bracket";

const STORAGE_KEY = "bracket-ai-picks";

export function useBracket() {
  const [picks, setPicks] = useState<Picks>({});

  // Load picks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setPicks(JSON.parse(saved));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Save picks to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
  }, [picks]);

  const handlePick = useCallback(
    (gameId: string, teamId: string) => {
      setPicks((prev) => {
        // First Four play-in games
        if (gameId.startsWith("first4-")) {
          if (prev[gameId] === teamId) {
            // Unpick: clear this pick and any downstream that used this team
            const next = { ...prev };
            delete next[gameId];
            for (const key of Object.keys(next)) {
              if (next[key] === teamId) {
                delete next[key];
              }
            }
            return next;
          }
          return makeFirstFourPick(prev, gameId, teamId);
        }

        // Final Four / Championship
        if (gameId === "final" || gameId.startsWith("ff-")) {
          const next = { ...prev };
          if (next[gameId] === teamId) {
            delete next[gameId];
            // Clear downstream
            if (gameId.startsWith("ff-") && next["final"] === teamId) {
              delete next["final"];
            }
          } else {
            const oldWinner = next[gameId];
            next[gameId] = teamId;
            // Clear championship if old winner was there
            if (oldWinner && next["final"] === oldWinner) {
              delete next["final"];
            }
          }
          return next;
        }

        // Regional game
        const parts = gameId.split("-");
        const region = parts[0] as RegionName;
        const round = parseInt(parts[1].slice(1));
        const gameIndex = parseInt(parts[2].slice(1));

        // Toggle: if already picked this team, unpick
        if (prev[gameId] === teamId) {
          const next = { ...prev };
          delete next[gameId];
          return next;
        }

        return makePick(prev, gameId, teamId, region, round, gameIndex);
      });
    },
    []
  );

  const resetBracket = useCallback(() => {
    setPicks({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { picks, handlePick, resetBracket };
}
