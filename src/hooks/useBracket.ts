"use client";

import { useState, useCallback, useEffect } from "react";
import { Picks, RegionName, FirstFourGame } from "@/lib/types";
import { makePick, makeFirstFourPick } from "@/lib/bracket";
import { bracketData } from "@/data/bracket-2026";

const STORAGE_KEY = "bracket-ai-picks";

/** Build picks for completed First Four games (locked results) */
function getLockedFirstFourPicks(): Picks {
  const locked: Picks = {};
  for (const ff of bracketData.firstFour) {
    if (ff.winner === "teamA") locked[ff.id] = ff.teamA.id;
    else if (ff.winner === "teamB") locked[ff.id] = ff.teamB.id;
  }
  return locked;
}

/** IDs of First Four games that are locked */
function getLockedGameIds(): Set<string> {
  return new Set(
    bracketData.firstFour.filter((ff) => ff.winner).map((ff) => ff.id)
  );
}

function loadInitialPicks(): Picks {
  if (typeof window === "undefined") return getLockedFirstFourPicks();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const loaded = saved ? JSON.parse(saved) : {};
    return { ...loaded, ...getLockedFirstFourPicks() };
  } catch {
    return getLockedFirstFourPicks();
  }
}

export function useBracket() {
  const [picks, setPicks] = useState<Picks>(loadInitialPicks);

  // Save picks to localStorage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(picks));
  }, [picks]);

  const handlePick = useCallback(
    (gameId: string, teamId: string) => {
      setPicks((prev) => {
        // First Four play-in games
        if (gameId.startsWith("first4-")) {
          // Don't allow changing locked results
          if (getLockedGameIds().has(gameId)) return prev;

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

        // Toggle: if already picked this team, unpick and clear downstream
        if (prev[gameId] === teamId) {
          const next = { ...prev };
          delete next[gameId];
          // Clear all downstream picks that referenced this team
          for (const key of Object.keys(next)) {
            if (next[key] === teamId) {
              // Clear Final Four / Championship picks
              if (key.startsWith("ff-") || key === "final") {
                delete next[key];
              } else {
                // Clear same-region later-round picks
                const kparts = key.split("-");
                if (kparts[0] === region) {
                  const kround = parseInt(kparts[1]?.slice(1) || "0");
                  if (kround > round) {
                    delete next[key];
                  }
                }
              }
            }
          }
          return next;
        }

        return makePick(prev, gameId, teamId, region, round, gameIndex);
      });
    },
    []
  );

  const resetBracket = useCallback(() => {
    // Reset everything except locked First Four results
    const locked = getLockedFirstFourPicks();
    setPicks(locked);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locked));
  }, []);

  const fillBracket = useCallback((newPicks: Picks) => {
    setPicks(newPicks);
  }, []);

  return { picks, handlePick, resetBracket, fillBracket };
}
