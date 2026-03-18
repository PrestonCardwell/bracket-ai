import {
  RegionName,
  Picks,
  Team,
  RegionData,
  BracketData,
  FirstFourGame,
} from "./types";

export function getGameId(
  region: RegionName,
  round: number,
  gameIndex: number
): string {
  return `${region}-r${round}-g${gameIndex}`;
}

/** Get all teams including First Four alternates */
export function getAllTeams(data: BracketData): Team[] {
  const regionTeams = Object.values(data.regions).flatMap((r) => r.teams);
  const ids = new Set(regionTeams.map((t) => t.id));
  const ffTeams = data.firstFour
    .flatMap((ff) => [ff.teamA, ff.teamB])
    .filter((t) => !ids.has(t.id));
  return [...regionTeams, ...ffTeams];
}

/** Resolve a First Four slot — returns the winning team or null if not yet picked */
function resolveFirstFourSlot(
  firstFour: FirstFourGame[],
  region: RegionName,
  slotIndex: number,
  picks: Picks
): { hasFF: boolean; team: Team | null } {
  const ff = firstFour.find(
    (g) => g.region === region && g.slotIndex === slotIndex
  );
  if (!ff) return { hasFF: false, team: null };
  const winnerId = picks[ff.id];
  if (!winnerId) return { hasFF: true, team: null };
  if (winnerId === ff.teamA.id) return { hasFF: true, team: ff.teamA };
  if (winnerId === ff.teamB.id) return { hasFF: true, team: ff.teamB };
  return { hasFF: true, team: null };
}

export function getTopTeam(
  region: RegionData,
  round: number,
  gameIndex: number,
  picks: Picks,
  firstFour?: FirstFourGame[]
): Team | null {
  if (round === 1) {
    const slotIndex = gameIndex * 2;
    if (firstFour) {
      const { hasFF, team } = resolveFirstFourSlot(
        firstFour, region.name, slotIndex, picks
      );
      if (hasFF) return team;
    }
    return region.teams[slotIndex] || null;
  }
  const feederId = getGameId(region.name, round - 1, gameIndex * 2);
  const winnerId = picks[feederId];
  if (!winnerId) return null;
  // Check region teams AND first four alternates
  const team = region.teams.find((t) => t.id === winnerId);
  if (team) return team;
  if (firstFour) {
    for (const ff of firstFour) {
      if (ff.teamA.id === winnerId) return ff.teamA;
      if (ff.teamB.id === winnerId) return ff.teamB;
    }
  }
  return null;
}

export function getBottomTeam(
  region: RegionData,
  round: number,
  gameIndex: number,
  picks: Picks,
  firstFour?: FirstFourGame[]
): Team | null {
  if (round === 1) {
    const slotIndex = gameIndex * 2 + 1;
    if (firstFour) {
      const { hasFF, team } = resolveFirstFourSlot(
        firstFour, region.name, slotIndex, picks
      );
      if (hasFF) return team;
    }
    return region.teams[slotIndex] || null;
  }
  const feederId = getGameId(region.name, round - 1, gameIndex * 2 + 1);
  const winnerId = picks[feederId];
  if (!winnerId) return null;
  const team = region.teams.find((t) => t.id === winnerId);
  if (team) return team;
  if (firstFour) {
    for (const ff of firstFour) {
      if (ff.teamA.id === winnerId) return ff.teamA;
      if (ff.teamB.id === winnerId) return ff.teamB;
    }
  }
  return null;
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

/** Make a First Four pick, clearing any downstream picks for the old winner */
export function makeFirstFourPick(
  picks: Picks,
  gameId: string,
  teamId: string
): Picks {
  const next = { ...picks };
  const oldWinner = next[gameId];
  next[gameId] = teamId;

  // If the old winner was picked anywhere downstream, clear those picks
  if (oldWinner && oldWinner !== teamId) {
    for (const key of Object.keys(next)) {
      if (key !== gameId && next[key] === oldWinner) {
        delete next[key];
      }
    }
  }

  return next;
}

export function getRoundName(round: number): string {
  switch (round) {
    case 0:
      return "First Four";
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
