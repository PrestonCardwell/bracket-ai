"use client";

import { useState } from "react";
import { BracketData, Picks, RegionName } from "@/lib/types";
import Region from "./Region";
import FinalFour from "./FinalFour";

type Tab = RegionName | "final-four";

interface BracketProps {
  data: BracketData;
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
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
}: BracketProps) {
  const [activeTab, setActiveTab] = useState<Tab>("east");

  const picksCount = Object.keys(picks).length;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-800 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors
              ${
                activeTab === tab.id
                  ? "bg-slate-800 text-white border-b-2 border-emerald-500"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-slate-500">
          {picksCount}/63 picks
        </div>
      </div>

      {/* Active region */}
      <div className="overflow-x-auto pb-4">
        {activeTab === "final-four" ? (
          <FinalFour
            data={data}
            picks={picks}
            onPick={onPick}
            onAIAction={onAIAction}
          />
        ) : (
          <Region
            region={data.regions[activeTab]}
            picks={picks}
            onPick={onPick}
            onAIAction={onAIAction}
          />
        )}
      </div>
    </div>
  );
}
