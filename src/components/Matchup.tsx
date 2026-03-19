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
      {/* Action buttons — stats always visible, AI+? on hover (desktop) */}
      {canInteract && (onCompare || (showAI && onAIAction)) && (
        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 translate-x-full flex gap-1 z-10">
          {onCompare && topTeam && bottomTeam && (
            <button
              onClick={() => onCompare(topTeam, bottomTeam)}
              className="w-6 h-6 rounded bg-slate-600 hover:bg-slate-500 text-white flex items-center justify-center transition-colors"
              title="Compare Stats"
            >
              {/* Desktop: bar chart icon. Mobile: "more" dots since modal has everything */}
              <svg className="hidden sm:block" width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="5" width="3" height="6" rx="0.5" opacity="0.7" />
                <rect x="5" y="2" width="3" height="9" rx="0.5" />
                <rect x="9" y="4" width="3" height="7" rx="0.5" opacity="0.7" />
              </svg>
              <svg className="sm:hidden" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="2" cy="6" r="1.2" />
                <circle cx="6" cy="6" r="1.2" />
                <circle cx="10" cy="6" r="1.2" />
              </svg>
            </button>
          )}
          {showAI && onAIAction && (
            <div className="hidden sm:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      )}
    </div>
  );
}
