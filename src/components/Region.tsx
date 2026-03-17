"use client";

import { RegionData, Picks } from "@/lib/types";
import { getGameId, getTopTeam, getBottomTeam } from "@/lib/bracket";
import Matchup from "./Matchup";

interface RegionProps {
  region: RegionData;
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
}

function Connector() {
  return (
    <div className="flex flex-col w-5 shrink-0">
      <div className="flex-1 border-t-2 border-r-2 border-slate-600 rounded-tr-sm" />
      <div className="flex-1 border-b-2 border-r-2 border-slate-600 rounded-br-sm" />
    </div>
  );
}

function ConnectorLine() {
  return <div className="w-4 border-t-2 border-slate-600 shrink-0 self-center" />;
}

interface BracketSectionProps {
  region: RegionData;
  round: number;
  gameIndex: number;
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
}

function BracketSection({
  region,
  round,
  gameIndex,
  picks,
  onPick,
  onAIAction,
}: BracketSectionProps) {
  const gameId = getGameId(region.name, round, gameIndex);
  const topTeam = getTopTeam(region, round, gameIndex, picks);
  const bottomTeam = getBottomTeam(region, round, gameIndex, picks);
  const winnerId = picks[gameId] || null;

  if (round === 1) {
    return (
      <Matchup
        gameId={gameId}
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        winnerId={winnerId}
        onPick={onPick}
        onAIAction={onAIAction}
      />
    );
  }

  return (
    <div className="flex items-center">
      <div className="flex flex-col gap-2">
        <BracketSection
          region={region}
          round={round - 1}
          gameIndex={gameIndex * 2}
          picks={picks}
          onPick={onPick}
          onAIAction={onAIAction}
        />
        <BracketSection
          region={region}
          round={round - 1}
          gameIndex={gameIndex * 2 + 1}
          picks={picks}
          onPick={onPick}
          onAIAction={onAIAction}
        />
      </div>
      <Connector />
      <ConnectorLine />
      <Matchup
        gameId={gameId}
        topTeam={topTeam}
        bottomTeam={bottomTeam}
        winnerId={winnerId}
        onPick={onPick}
        onAIAction={onAIAction}
      />
    </div>
  );
}

export default function Region({
  region,
  picks,
  onPick,
  onAIAction,
}: RegionProps) {
  return (
    <div className="flex flex-col items-start">
      <h2 className="text-lg font-bold text-slate-300 mb-3 px-1">
        {region.displayName} Region
      </h2>
      <BracketSection
        region={region}
        round={4}
        gameIndex={0}
        picks={picks}
        onPick={onPick}
        onAIAction={onAIAction}
      />
    </div>
  );
}
