"use client";

import { Team } from "@/lib/types";

interface TeamSlotProps {
  team: Team | null;
  isWinner: boolean;
  isLoser: boolean;
  onClick?: () => void;
}

export default function TeamSlot({
  team,
  isWinner,
  isLoser,
  onClick,
}: TeamSlotProps) {
  if (!team) {
    return (
      <div className="h-7 flex items-center px-2 border border-dashed border-slate-700 bg-slate-800/30 rounded-sm">
        <span className="text-slate-600 text-xs">---</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`h-7 w-full flex items-center gap-1.5 px-2 rounded-sm text-left text-sm transition-colors
        ${isWinner ? "bg-emerald-900/60 border border-emerald-600 text-emerald-100 font-semibold" : ""}
        ${isLoser ? "bg-slate-800/40 border border-slate-700/50 text-slate-500" : ""}
        ${!isWinner && !isLoser ? "bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 text-slate-200" : ""}
      `}
    >
      <span className="text-[10px] text-slate-400 w-4 text-right shrink-0 font-mono">
        {team.seed}
      </span>
      <span className="truncate flex-1">{team.shortName}</span>
      <span className="text-[10px] text-slate-500 shrink-0">{team.record}</span>
    </button>
  );
}
