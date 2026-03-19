import { BracketData, Picks, RegionName, Team } from "./types";
import { getGameId, getTopTeam, getBottomTeam, getAllTeams } from "./bracket";
import { getHigherSeedWinProbability, rollSimulation } from "./seed-history";

export type BracketStyle = "chalk" | "balanced" | "madness";

/**
 * Shift win probability toward 50/50 based on style.
 * chalk: no change. balanced: 20% toward 50. chaos: 50% toward 50.
 */
function adjustProbability(pct: number, style: BracketStyle): number {
  switch (style) {
    case "chalk":
      return pct;
    case "balanced":
      return pct * 0.8 + 10;
    case "madness":
      return pct * 0.5 + 25;
  }
}

function simulateGame(
  topTeam: Team,
  bottomTeam: Team,
  round: number,
  style: BracketStyle
): Team {
  const { favored, underdog, favoredWinPct } = getHigherSeedWinProbability(
    topTeam,
    bottomTeam,
    round
  );
  const adjustedPct = adjustProbability(favoredWinPct, style);
  const roll = rollSimulation();
  return roll <= adjustedPct ? favored : underdog;
}

/**
 * Simulate an entire bracket and return a complete set of picks.
 */
export function simulateBracket(
  data: BracketData,
  style: BracketStyle = "balanced"
): Picks {
  const picks: Picks = {};

  // 1. First Four
  for (const ff of data.firstFour) {
    const winner = simulateGame(ff.teamA, ff.teamB, 0, style);
    picks[ff.id] = winner.id;
  }

  // 2. Regional rounds (1–4)
  const regionNames: RegionName[] = ["east", "west", "south", "midwest"];
  for (const regionName of regionNames) {
    const region = data.regions[regionName];
    for (let round = 1; round <= 4; round++) {
      const games = 8 / Math.pow(2, round - 1); // 8, 4, 2, 1
      for (let g = 0; g < games; g++) {
        const gameId = getGameId(regionName, round, g);
        const topTeam = getTopTeam(region, round, g, picks, data.firstFour);
        const bottomTeam = getBottomTeam(
          region,
          round,
          g,
          picks,
          data.firstFour
        );
        if (!topTeam || !bottomTeam) continue;
        const winner = simulateGame(topTeam, bottomTeam, round, style);
        picks[gameId] = winner.id;
      }
    }
  }

  // 3. Final Four (2 semifinal games)
  const allTeams = getAllTeams(data);
  for (let g = 0; g < 2; g++) {
    const [r1, r2] = data.finalFourMatchups[g];
    const topTeamId = picks[`${r1}-r4-g0`];
    const bottomTeamId = picks[`${r2}-r4-g0`];
    const topTeam = topTeamId
      ? allTeams.find((t) => t.id === topTeamId) || null
      : null;
    const bottomTeam = bottomTeamId
      ? allTeams.find((t) => t.id === bottomTeamId) || null
      : null;
    if (!topTeam || !bottomTeam) continue;
    const winner = simulateGame(topTeam, bottomTeam, 5, style);
    picks[`ff-g${g}`] = winner.id;
  }

  // 4. Championship
  const champTopId = picks["ff-g0"];
  const champBottomId = picks["ff-g1"];
  const champTop = champTopId
    ? allTeams.find((t) => t.id === champTopId) || null
    : null;
  const champBottom = champBottomId
    ? allTeams.find((t) => t.id === champBottomId) || null
    : null;
  if (champTop && champBottom) {
    const winner = simulateGame(champTop, champBottom, 6, style);
    picks["final"] = winner.id;
  }

  return picks;
}
