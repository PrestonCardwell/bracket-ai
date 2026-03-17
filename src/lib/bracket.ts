import { RegionName, Picks, Team, RegionData } from "./types";

export function getGameId(
  region: RegionName,
  round: number,
  gameIndex: number
): string {
  return `${region}-r${round}-g${gameIndex}`;
}

export function getTopTeam(
  region: RegionData,
  round: number,
  gameIndex: number,
  picks: Picks
): Team | null {
  if (round === 1) {
    return region.teams[gameIndex * 2] || null;
  }
  const feederId = getGameId(region.name, round - 1, gameIndex * 2);
  const winnerId = picks[feederId];
  if (!winnerId) return null;
  return region.teams.find((t) => t.id === winnerId) || null;
}

export function getBottomTeam(
  region: RegionData,
  round: number,
  gameIndex: number,
  picks: Picks
): Team | null {
  if (round === 1) {
    return region.teams[gameIndex * 2 + 1] || null;
  }
  const feederId = getGameId(region.name, round - 1, gameIndex * 2 + 1);
  const winnerId = picks[feederId];
  if (!winnerId) return null;
  return region.teams.find((t) => t.id === winnerId) || null;
}

/** Get all downstream game IDs within a region that depend on a given game */
function getDownstreamIds(
  region: RegionName,
  round: number,
  gameIndex: number
): string[] {
  const ids: string[] = [];
  let r = round + 1;
  let idx = Math.floor(gameIndex / 2);
  while (r <= 4) {
    ids.push(getGameId(region, r, idx));
    idx = Math.floor(idx / 2);
    r++;
  }
  return ids;
}

/** Make a pick, clearing any downstream picks that depended on the old winner */
export function makePick(
  picks: Picks,
  gameId: string,
  teamId: string,
  region: RegionName,
  round: number,
  gameIndex: number
): Picks {
  const next = { ...picks };
  const prev = next[gameId];
  next[gameId] = teamId;

  if (prev && prev !== teamId) {
    // Clear downstream picks that referenced the old winner
    for (const id of getDownstreamIds(region, round, gameIndex)) {
      if (next[id] === prev) {
        delete next[id];
      }
    }
    // Clear Final Four / Championship picks that referenced old winner
    for (const key of Object.keys(next)) {
      if (key.startsWith("ff-") || key === "final") {
        if (next[key] === prev) {
          delete next[key];
        }
      }
    }
  }

  return next;
}

export function getRoundName(round: number): string {
  switch (round) {
    case 1:
      return "Round of 64";
    case 2:
      return "Round of 32";
    case 3:
      return "Sweet 16";
    case 4:
      return "Elite 8";
    case 5:
      return "Final Four";
    case 6:
      return "Championship";
    default:
      return "";
  }
}

export function gamesInRound(round: number): number {
  return round <= 4 ? 8 / Math.pow(2, round - 1) : round === 5 ? 2 : 1;
}

export function countPicks(picks: Picks): number {
  return Object.keys(picks).length;
}
