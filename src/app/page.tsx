"use client";

import { useCallback } from "react";
import { bracketData } from "@/data/bracket-2026";
import { useBracket } from "@/hooks/useBracket";
import { useAI } from "@/hooks/useAI";
import { getTopTeam, getBottomTeam, getAllTeams } from "@/lib/bracket";
import { Team, RegionName } from "@/lib/types";
import Bracket from "@/components/Bracket";
import AIPanel from "@/components/AIPanel";

export default function Home() {
  const { picks, handlePick, resetBracket } = useBracket();
  const ai = useAI();

  const handleAIAction = useCallback(
    (gameId: string, action: "pick" | "insights") => {
      // Parse gameId to find the teams
      let topTeam: Team | null = null;
      let bottomTeam: Team | null = null;
      let round = 1;

      if (gameId.startsWith("first4-")) {
        // First Four play-in game
        round = 0;
        const ff = bracketData.firstFour.find((g) => g.id === gameId);
        if (ff) {
          topTeam = ff.teamA;
          bottomTeam = ff.teamB;
        }
      } else if (gameId === "final" || gameId.startsWith("ff-")) {
        // Final Four / Championship
        const allTeams = getAllTeams(bracketData);
        if (gameId === "final") {
          round = 6;
          const ff1Winner = picks["ff-g0"];
          const ff2Winner = picks["ff-g1"];
          topTeam = ff1Winner
            ? allTeams.find((t) => t.id === ff1Winner) || null
            : null;
          bottomTeam = ff2Winner
            ? allTeams.find((t) => t.id === ff2Winner) || null
            : null;
        } else {
          round = 5;
          const idx = parseInt(gameId.split("-g")[1]);
          const [r1, r2] = bracketData.finalFourMatchups[idx];
          const r1Winner = picks[`${r1}-r4-g0`];
          const r2Winner = picks[`${r2}-r4-g0`];
          topTeam = r1Winner
            ? allTeams.find((t) => t.id === r1Winner) || null
            : null;
          bottomTeam = r2Winner
            ? allTeams.find((t) => t.id === r2Winner) || null
            : null;
        }
      } else {
        // Regional game
        const parts = gameId.split("-");
        const regionName = parts[0] as RegionName;
        round = parseInt(parts[1].slice(1));
        const gameIndex = parseInt(parts[2].slice(1));
        const region = bracketData.regions[regionName];
        topTeam = getTopTeam(region, round, gameIndex, picks, bracketData.firstFour);
        bottomTeam = getBottomTeam(region, round, gameIndex, picks, bracketData.firstFour);
      }

      if (!topTeam || !bottomTeam) return;

      ai.requestAI(gameId, action, topTeam, bottomTeam, round);
    },
    [picks, ai]
  );

  return (
    <div className="min-h-screen p-4 md:p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bracket AI
            <span className="text-emerald-500 ml-1 text-lg font-normal">
              2026
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            NCAA Tournament Bracket Builder with AI
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetBracket}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded transition-colors"
          >
            Reset
          </button>
          <a
            href="/settings"
            className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors"
          >
            Settings
          </a>
        </div>
      </header>

      {/* Bracket */}
      <Bracket
        data={bracketData}
        picks={picks}
        onPick={handlePick}
        onAIAction={handleAIAction}
      />

      {/* AI Panel */}
      <AIPanel
        loading={ai.loading}
        content={ai.content}
        error={ai.error}
        type={ai.type}
        gameId={ai.gameId}
        onClose={ai.clearAI}
      />
    </div>
  );
}
