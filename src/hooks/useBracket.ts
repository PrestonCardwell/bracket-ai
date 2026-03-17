"use client";

import { useState, useCallback, useEffect } from "react";
import { Picks, RegionName } from "@/lib/types";
import { makePick } from "@/lib/bracket";

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
        // Parse the gameId to get region, round, gameIndex
        // Format: "region-rN-gN" or "ff-gN" or "final"
        if (gameId === "final" || gameId.startsWith("ff-")) {
          // Final Four / Championship - simple toggle
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
