"use client";

import { useState } from "react";
import { BracketData, Picks, RegionName, Team } from "@/lib/types";
import Region from "./Region";
import FinalFour from "./FinalFour";

type Tab = RegionName | "final-four";

interface BracketProps {
  data: BracketData;
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
  onCompare?: (teamA: Team, teamB: Team) => void;
  aiPicksRemaining?: number;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "east", label: "East" },
  { id: "west", label: "West" },
  { id: "south", label: "South" },
  { id: "midwest", label: "Midwest" },
  { id: "final-four", label: "Final Four" },
];

export default function Bracket({
  data,
  picks,
  onPick,
  onAIAction,
  onCompare,
  aiPicksRemaining = 67,
}: BracketProps) {
  const [activeTab, setActiveTab] = useState<Tab>("east");

  const picksCount = Object.keys(picks).length;

  return (
    <div>
      {/* Region selector */}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-1">
          Select Region
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0
                ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 whitespace-nowrap shrink-0">
            {picksCount}<span className="text-slate-600">/67</span> picks
          </div>
        </div>
      </div>

      {/* Legend + AI usage */}
      <div className="flex items-center gap-4 mb-3 px-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-slate-600 text-white flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="5" width="3" height="6" rx="0.5" opacity="0.7" />
              <rect x="5" y="2" width="3" height="9" rx="0.5" />
              <rect x="9" y="4" width="3" height="7" rx="0.5" opacity="0.7" />
            </svg>
          </span>
          Compare stats
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-violet-600 text-white text-[9px] font-bold flex items-center justify-center">AI</span>
          AI pick
        </span>
        <span className="hidden sm:flex items-center gap-1.5">
          <span className="w-4 h-4 rounded bg-violet-600/60 text-white text-[9px] flex items-center justify-center">?</span>
          Matchup insights
        </span>
        <span className="ml-auto text-slate-600 hidden sm:inline">
          {aiPicksRemaining} AI picks left
        </span>
      </div>

      {/* Active region */}
      <div className="overflow-x-auto pb-4">
        {activeTab === "final-four" ? (
          <FinalFour
            data={data}
            picks={picks}
            onPick={onPick}
            onAIAction={onAIAction}
            onCompare={onCompare}
          />
        ) : (
          <Region
            region={data.regions[activeTab]}
            picks={picks}
            onPick={onPick}
            onAIAction={onAIAction}
            onCompare={onCompare}
            firstFour={data.firstFour}
          />
        )}
      </div>
    </div>
  );
}
