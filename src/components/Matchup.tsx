"use client";

import { Team } from "@/lib/types";
import TeamSlot from "./TeamSlot";

interface MatchupProps {
  gameId: string;
  topTeam: Team | null;
  bottomTeam: Team | null;
  winnerId: string | null;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
  onCompare?: (teamA: Team, teamB: Team) => void;
  showAI?: boolean;
}

export default function Matchup({
  gameId,
  topTeam,
  bottomTeam,
  winnerId,
  onPick,
  onAIAction,
  onCompare,
  showAI = true,
}: MatchupProps) {
  const canInteract = topTeam !== null && bottomTeam !== null;

  return (
    <div className="group relative">
      <div className="w-44 flex flex-col gap-px">
        <TeamSlot
          team={topTeam}
          isWinner={winnerId === topTeam?.id}
          isLoser={winnerId !== null && winnerId !== topTeam?.id}
          onClick={
            canInteract && topTeam
              ? () => onPick(gameId, topTeam.id)
              : undefined
          }
        />
        <TeamSlot
          team={bottomTeam}
          isWinner={winnerId === bottomTeam?.id}
          isLoser={winnerId !== null && winnerId !== bottomTeam?.id}
          onClick={
            canInteract && bottomTeam
              ? () => onPick(gameId, bottomTeam.id)
              : undefined
          }
        />
      </div>
      {/* Action buttons — compact vertical stack */}
      {canInteract && (onCompare || (showAI && onAIAction)) && (
        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-px z-10">
          {onCompare && topTeam && bottomTeam && (
            <button
              onClick={() => onCompare(topTeam, bottomTeam)}
              className="w-[18px] h-[15px] rounded-sm bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors"
              title="Compare Stats"
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="5" width="3" height="6" rx="0.5" opacity="0.7" />
                <rect x="5" y="2" width="3" height="9" rx="0.5" />
                <rect x="9" y="4" width="3" height="7" rx="0.5" opacity="0.7" />
              </svg>
            </button>
          )}
          {showAI && onAIAction && (
            <>
              <button
                onClick={() => onAIAction(gameId, "pick")}
                className="w-[18px] h-[15px] rounded-sm bg-violet-600 hover:bg-violet-500 text-white text-[7px] font-bold flex items-center justify-center"
                title="AI Pick"
              >
                AI
              </button>
              <button
                onClick={() => onAIAction(gameId, "insights")}
                className="w-[18px] h-[15px] rounded-sm bg-violet-600/60 hover:bg-violet-500 text-white text-[7px] flex items-center justify-center"
                title="AI Insights"
              >
                ?
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
