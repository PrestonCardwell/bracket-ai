import { Picks, BracketData } from "./types";
import { getAllTeams } from "./bracket";
import { getRoundName } from "./bracket";

/**
 * Encode picks into a compact URL-safe string.
 * Format: base64-encoded JSON of pick entries.
 */
export function encodePicks(picks: Picks): string {
  if (Object.keys(picks).length === 0) return "";
  const json = JSON.stringify(picks);
  // Use base64url encoding (URL-safe)
  return btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode picks from a URL-safe string.
 */
export function decodePicks(encoded: string): Picks | null {
  if (!encoded) return null;
  try {
    // Restore base64 padding
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const parsed = JSON.parse(json);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Picks;
  } catch {
    return null;
  }
}

/**
 * Generate a shareable URL with picks encoded in the hash.
 */
export function getShareUrl(picks: Picks): string {
  const encoded = encodePicks(picks);
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return encoded ? `${base}/?b=${encoded}` : base;
}

/**
 * Generate a text summary of the bracket picks.
 */
export function generateBracketText(
  bracketData: BracketData,
  picks: Picks
): string {
  const allTeams = getAllTeams(bracketData);
  const teamMap = new Map(allTeams.map((t) => [t.id, t]));
  const lines: string[] = ["🏀 My 2026 NCAA Tournament Bracket", ""];

  // Regional picks by round
  for (const regionName of ["east", "west", "south", "midwest"] as const) {
    const display = bracketData.regions[regionName].displayName;
    const regionPicks = Object.entries(picks).filter(([k]) =>
      k.startsWith(regionName + "-")
    );
    if (regionPicks.length === 0) continue;

    lines.push(`📍 ${display} Region`);

    // Group by round
    const byRound: Record<number, string[]> = {};
    for (const [gameId, teamId] of regionPicks) {
      const team = teamMap.get(teamId);
      if (!team) continue;
      const roundNum = parseInt(gameId.split("-")[1].slice(1));
      if (!byRound[roundNum]) byRound[roundNum] = [];
      byRound[roundNum].push(`${team.name} (${team.seed})`);
    }

    for (const round of [1, 2, 3, 4]) {
      if (byRound[round]) {
        lines.push(`  ${getRoundName(round)}: ${byRound[round].join(", ")}`);
      }
    }
    lines.push("");
  }

  // Final Four
  const ffPicks = Object.entries(picks).filter(([k]) => k.startsWith("ff-"));
  if (ffPicks.length > 0) {
    const names = ffPicks.map(
      ([, id]) => teamMap.get(id)?.name || "?"
    );
    lines.push(`🏆 Final Four: ${names.join(" vs ")}`);
  }

  // Champion
  const champ = picks["final"];
  if (champ) {
    const team = teamMap.get(champ);
    lines.push(`👑 Champion: ${team?.name || "?"}`);
  }

  lines.push("");
  lines.push("Built with Bracket AI — bracketai.app");

  return lines.join("\n");
}
