"use client";

import { RegionData, Picks, FirstFourGame } from "@/lib/types";
import { getGameId, getTopTeam, getBottomTeam } from "@/lib/bracket";
import Matchup from "./Matchup";

interface RegionProps {
  region: RegionData;
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
  firstFour: FirstFourGame[];
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
  firstFour: FirstFourGame[];
}

function BracketSection({
  region,
  round,
  gameIndex,
  picks,
  onPick,
  onAIAction,
  firstFour,
}: BracketSectionProps) {
  const gameId = getGameId(region.name, round, gameIndex);
  const topTeam = getTopTeam(region, round, gameIndex, picks, firstFour);
  const bottomTeam = getBottomTeam(region, round, gameIndex, picks, firstFour);
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
          firstFour={firstFour}
        />
        <BracketSection
          region={region}
          round={round - 1}
          gameIndex={gameIndex * 2 + 1}
          picks={picks}
          onPick={onPick}
          onAIAction={onAIAction}
          firstFour={firstFour}
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

interface PlayInSectionProps {
  games: FirstFourGame[];
  picks: Picks;
  onPick: (gameId: string, teamId: string) => void;
  onAIAction?: (gameId: string, action: "pick" | "insights") => void;
}

function PlayInSection({ games, picks, onPick, onAIAction }: PlayInSectionProps) {
  return (
    <div className="mb-4 p-3 bg-slate-800/40 rounded-lg border border-amber-900/30">
      <h3 className="text-[10px] uppercase tracking-widest text-amber-400 font-semibold mb-2">
        First Four — Play-in Games
      </h3>
      <div className="flex gap-6">
        {games.map((ff) => {
          const seedLabel = ff.teamA.seed === 16 ? "16 Seed" : "11 Seed";
          return (
            <div key={ff.id}>
              <div className="text-[10px] text-slate-500 mb-1">{seedLabel}</div>
              <Matchup
                gameId={ff.id}
                topTeam={ff.teamA}
                bottomTeam={ff.teamB}
                winnerId={picks[ff.id] || null}
                onPick={onPick}
                onAIAction={onAIAction}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Region({
  region,
  picks,
  onPick,
  onAIAction,
  firstFour,
}: RegionProps) {
  const regionFF = firstFour.filter((ff) => ff.region === region.name);

  return (
    <div className="flex flex-col items-start">
      <h2 className="text-lg font-bold text-slate-300 mb-3 px-1">
        {region.displayName} Region
      </h2>
      {regionFF.length > 0 && (
        <PlayInSection
          games={regionFF}
          picks={picks}
          onPick={onPick}
          onAIAction={onAIAction}
        />
      )}
      <BracketSection
        region={region}
        round={4}
        gameIndex={0}
        picks={picks}
        onPick={onPick}
        onAIAction={onAIAction}
        firstFour={firstFour}
      />
    </div>
  );
}
