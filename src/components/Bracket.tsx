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
      {/* Region selector */}
      <div className="mb-5">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2 px-1">
          Select Region
        </div>
        <div className="flex items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
                ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="ml-auto text-sm text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            {picksCount}<span className="text-slate-600">/63</span> picks
          </div>
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
