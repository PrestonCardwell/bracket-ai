"use client";

import { BracketData, Picks, Team, RegionName } from "@/lib/types";
import { getAllTeams } from "@/lib/bracket";
import Matchup from "./Matchup";

interface FinalFourProps {
  data: BracketData;
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
  onCompare?: (teamA: Team, teamB: Team) => void;
}

function getRegionChampion(
  data: BracketData,
  region: RegionName,
  picks: Picks
): Team | null {
  const eliteEightId = `${region}-r4-g0`;
  const winnerId = picks[eliteEightId];
  if (!winnerId) return null;
  return getAllTeams(data).find((t) => t.id === winnerId) || null;
}

export default function FinalFour({
  data,
  picks,
  onPick,
  onAIAction,
  onCompare,
}: FinalFourProps) {
  const [ff1Regions, ff2Regions] = data.finalFourMatchups;

  const ff1Top = getRegionChampion(data, ff1Regions[0], picks);
  const ff1Bottom = getRegionChampion(data, ff1Regions[1], picks);
  const ff2Top = getRegionChampion(data, ff2Regions[0], picks);
  const ff2Bottom = getRegionChampion(data, ff2Regions[1], picks);

  const ff1Winner = picks["ff-g0"] || null;
  const ff2Winner = picks["ff-g1"] || null;
  const champion = picks["final"] || null;

  // Get the actual team objects for the championship
  const allTeams = getAllTeams(data);
  const champTop = ff1Winner
    ? allTeams.find((t) => t.id === ff1Winner) || null
    : null;
  const champBottom = ff2Winner
    ? allTeams.find((t) => t.id === ff2Winner) || null
    : null;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-lg font-bold text-slate-300 mb-3">Final Four</h2>
      <div className="flex items-center gap-8">
        <div className="flex flex-col gap-4">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">
              {data.regions[ff1Regions[0]].displayName} vs{" "}
              {data.regions[ff1Regions[1]].displayName}
            </div>
            <Matchup
              gameId="ff-g0"
              topTeam={ff1Top}
              bottomTeam={ff1Bottom}
              winnerId={ff1Winner}
              onPick={onPick}
              onAIAction={onAIAction}
              onCompare={onCompare}
            />
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">
              {data.regions[ff2Regions[0]].displayName} vs{" "}
              {data.regions[ff2Regions[1]].displayName}
            </div>
            <Matchup
              gameId="ff-g1"
              topTeam={ff2Top}
              bottomTeam={ff2Bottom}
              winnerId={ff2Winner}
              onPick={onPick}
              onAIAction={onAIAction}
              onCompare={onCompare}
            />
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">Championship</div>
          <Matchup
            gameId="final"
            topTeam={champTop}
            bottomTeam={champBottom}
            winnerId={champion}
            onPick={onPick}
            onAIAction={onAIAction}
            onCompare={onCompare}
          />
          {champion && (
            <div className="mt-3 px-3 py-1.5 bg-emerald-900/40 border border-emerald-600 rounded text-emerald-300 text-sm font-bold text-center">
              {allTeams.find((t) => t.id === champion)?.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
