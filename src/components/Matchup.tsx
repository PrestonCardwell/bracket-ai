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
  showAI?: boolean;
}

export default function Matchup({
  gameId,
  topTeam,
  bottomTeam,
  winnerId,
  onPick,
  onAIAction,
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
      {/* AI action buttons - show on hover when both teams are present */}
      {showAI && canInteract && onAIAction && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
          <button
            onClick={() => onAIAction(gameId, "pick")}
            className="w-6 h-6 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center"
            title="AI Pick"
          >
            AI
          </button>
          <button
            onClick={() => onAIAction(gameId, "insights")}
            className="w-6 h-6 rounded bg-violet-600/60 hover:bg-violet-500 text-white text-[10px] flex items-center justify-center"
            title="AI Insights"
          >
            ?
          </button>
        </div>
      )}
    </div>
  );
}
