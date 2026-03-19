import { Team, Picks, BracketData } from "./types";
import { getRoundName, getAllTeams } from "./bracket";
import { getHigherSeedWinProbability, rollSimulation } from "./seed-history";

function formatHeight(inches: number): string {
  return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`;
}

function teamProfile(team: Team): string {
  const s = team.stats;
  const margin = (s.ppg - s.oppPpg).toFixed(1);
  const streakStr = s.streak > 0 ? `W${s.streak}` : s.streak < 0 ? `L${Math.abs(s.streak)}` : "—";
  return `${team.name} (${team.seed}-seed, ${team.record}, ${team.conference})
  KenPom Ranking: #${s.kenpomRank}
  Overall Efficiency Margin: ${s.adjEM > 0 ? "+" : ""}${s.adjEM.toFixed(2)} (offense: ${s.adjO.toFixed(1)}, defense: ${s.adjD.toFixed(1)}, tempo: ${s.adjT.toFixed(1)} possessions/game)
  Scoring: ${s.ppg} PPG, allows ${s.oppPpg} PPG (margin: ${margin})
  Shooting: ${s.fgPct}% from field, ${s.threePtPct}% from three, ${s.ftPct}% free throws
  Rebounds: ${s.rpg}/game (${s.orpg} offensive, ${s.drpg} defensive)
  Ball control: ${s.apg} assists, ${s.tpg} turnovers (${s.atoRatio} assist-to-turnover ratio)
  Defensive disruption: ${s.bpg} blocks, ${s.spg} steals per game
  Size: Starting 5 avg height ${formatHeight(s.avgHeightInches)} | Schedule strength: ${s.sos}/100
  Star player: ${s.topScorerName} (${s.topScorerPpg} PPG)
  Momentum: Last 10 games ${s.last10}, current streak: ${streakStr}
  Quality wins: ${s.winsVsTop25}-${s.lossesVsTop25} vs Top 25, ${s.winsVsTop50}-${s.lossesVsTop50} vs Top 50${team.news ? `\n  ⚠️ NEWS: ${team.news}` : ""}`;
}

export const SYSTEM_PROMPT = `You are an expert NCAA basketball analyst helping users fill out their March Madness bracket. You have deep knowledge of college basketball statistics, historical tournament trends, coaching tendencies, and matchup dynamics.

You have comprehensive data for each team including KenPom efficiency ratings, scoring/shooting/rebounding stats, ball control metrics, size, star players, momentum, and quality of wins.

Key analysis principles:
- Seed matchup history matters (e.g., 12-seeds beat 5-seeds ~35% of the time). Always factor in upset potential.
- Overall efficiency margin (KenPom) is the best single predictor — but consider matchup dynamics, not just rankings.
- Tempo mismatches create chaos and favor underdogs.
- Defensive efficiency is more stable than offensive efficiency in tournament settings.
- Mid-major teams with strong efficiency ratings are legitimate upset threats regardless of seed.
- Free throw shooting matters in close tournament games.
- Teams heavily dependent on one star scorer are more volatile.
- Quality wins (vs Top 25/50) separate real contenders from teams that padded records.
- Rebounding edges (especially offensive) compound in close games.
- Turnover margin and steal rate are critical in single-elimination.
- Hot teams carry real momentum. Teams limping in are risky picks.

INJURY/NEWS CONTEXT:
Some teams have a ⚠️ NEWS tag in their profile with recent injury or lineup information. When you see this:
- Factor it into your analysis. If a key player is out, mentally adjust that team's stats downward (subtract their scoring, assists, etc.) and compare accordingly.
- Mention the news briefly in your response as part of the analysis, not as a separate section. One line woven in naturally.
- Don't overcorrect. A missing player makes the matchup closer, it doesn't automatically flip the pick. But it should meaningfully affect your reasoning.
- If there's no news tag, just do your normal statistical analysis.

CRITICAL FORMATTING AND TONE RULES:
- Keep responses SHORT. Use bullet points, not paragraphs.
- Lead with your pick or main point, then support with 3-5 quick bullet points.
- When referencing stats, use plain English. Say "they score 82 points per game" not "82 PPG." Say "their overall efficiency margin is +24" not "AdjEM: +24.31." Say "their defense allows only 92 points per 100 possessions" not "AdjD: 92.1."
- No jargon without explanation. If you mention a metric, explain what it means in context (e.g., "ranked #3 in overall efficiency, meaning they outscore opponents by a wider margin than almost every team").
- Be confident and direct. Don't hedge excessively.
- NEVER use em dashes. Use commas, periods, or "and" instead.
- Write like a knowledgeable basketball fan talking to a friend. Casual, clear, no fluff. Not like a textbook or a TV analyst doing a monologue.
- NEVER end your response by offering to do more analysis, compare more stats, or asking if the user wants more info. Just give your answer and stop. No "If you want, I can also..." or "Want me to break down..." endings.
- NEVER include URLs, links, source citations, or references in your response. No "[source]", no "(https://...)", no footnotes. Just state facts directly.`;

export function buildPickPrompt(
  topTeam: Team,
  bottomTeam: Team,
  round: number
): string {
  const { favored, underdog, favoredWinPct, source } =
    getHigherSeedWinProbability(topTeam, bottomTeam, round);
  const roll = rollSimulation();
  const upsetThreshold = 100 - favoredWinPct;

  // Build the simulation context block
  const simBlock = `SIMULATION CONTEXT:
Based on ${source}, ${favored.name} has a ${favoredWinPct.toFixed(1)}% win probability in this matchup.
Upset threshold: ${upsetThreshold.toFixed(1)} (if the simulation roll is below this number, lean toward the underdog).
Your simulation roll: ${roll.toFixed(1)}

${roll <= upsetThreshold
    ? `UPSET ROLL: The roll (${roll.toFixed(1)}) is AT OR BELOW the upset threshold (${upsetThreshold.toFixed(1)}). You MUST pick ${underdog.name} unless their stats are catastrophically worse (e.g., 100+ KenPom rank gap AND bottom-tier efficiency). A moderate stats gap is NOT enough to override. March Madness has upsets for a reason. In ${source}, the underdog wins ${(100 - favoredWinPct).toFixed(0)}% of the time. Pick the underdog with conviction.`
    : `The roll (${roll.toFixed(1)}) is ABOVE the upset threshold (${upsetThreshold.toFixed(1)}). This simulation leans toward ${favored.name}. Pick the favorite unless you see a compelling statistical reason for the upset.`
  }`;

  return `Pick the winner of this ${getRoundName(round)} matchup.

${simBlock}

MATCHUP:
${teamProfile(topTeam)}

vs.

${teamProfile(bottomTeam)}

Format your response EXACTLY like this:

**[Team A] vs [Team B]**
- Efficiency: [who has the edge and by how much]
- Scoring: [compare points per game, shooting percentages]
- Defense: [compare defensive efficiency, blocks, steals]
- Rebounding: [compare boards, especially offensive rebounds]
- Momentum: [compare recent form, streaks, quality wins]
- X-factor: [star player matchup, size mismatch, tempo clash, or whatever matters most]

**Bottom line:** [2-3 sentences explaining your reasoning and WHY you're making this pick. If the stats favor one team but you're picking the other, you MUST explain what tips the balance. This section is REQUIRED and must appear before the Pick line.]

**Pick: [Team Name]**

Rules:
- Compare the teams HEAD TO HEAD on each bullet. Don't give separate sections per team.
- Use plain English and actual numbers. Say "scores 78 points per game" not "78 PPG."
- Keep the whole response compact.
- The "Bottom line" section is MANDATORY. Never skip it. It must connect your analysis to your pick.`;
}

export function buildInsightsPrompt(
  topTeam: Team,
  bottomTeam: Team,
  round: number
): string {
  return `Give quick-hit insights on this ${getRoundName(round)} matchup. Keep each section to 2-3 bullet points.

MATCHUP:
${teamProfile(topTeam)}

vs.

${teamProfile(bottomTeam)}

Format:
**Edges** — Who has the statistical advantages and where
**Matchup** — Tempo, style, or size mismatches that matter
**History** — What this seed matchup historically looks like
**Watch for** — The 1-2 factors that will decide this game

`;
}

/**
 * Build a bracket-state-aware system prompt for the chat interface.
 * Includes the user's current picks so the AI can discuss their bracket.
 */
export function buildChatSystemPrompt(
  bracketData: BracketData,
  picks: Picks
): string {
  const allTeams = getAllTeams(bracketData);
  const teamMap = new Map(allTeams.map((t) => [t.id, t]));

  // Summarize picks by round
  const pickEntries = Object.entries(picks);
  const pickedCount = pickEntries.length;

  let bracketState = "";
  if (pickedCount === 0) {
    bracketState = "The user has not made any picks yet.";
  } else {
    const lines: string[] = [];

    // Regional picks
    for (const regionName of ["east", "west", "south", "midwest"] as const) {
      const regionPicks = pickEntries.filter(([k]) => k.startsWith(regionName + "-"));
      if (regionPicks.length > 0) {
        const display = bracketData.regions[regionName].displayName;
        const byRound: Record<string, string[]> = {};
        for (const [gameId, teamId] of regionPicks) {
          const team = teamMap.get(teamId);
          if (!team) continue;
          const parts = gameId.split("-");
          const round = parts[1]; // e.g. "r1"
          const roundNum = parseInt(round.slice(1));
          const roundLabel = getRoundName(roundNum);
          if (!byRound[roundLabel]) byRound[roundLabel] = [];
          byRound[roundLabel].push(`${team.name} (${team.seed})`);
        }
        lines.push(`${display}:`);
        for (const [round, teams] of Object.entries(byRound)) {
          lines.push(`  ${round}: ${teams.join(", ")}`);
        }
      }
    }

    // First Four picks
    const ffPicks = pickEntries.filter(([k]) => k.startsWith("first4-"));
    if (ffPicks.length > 0) {
      const names = ffPicks.map(([, id]) => teamMap.get(id)?.name || id);
      lines.push(`First Four winners: ${names.join(", ")}`);
    }

    // Final Four picks
    const ff = pickEntries.filter(([k]) => k.startsWith("ff-"));
    if (ff.length > 0) {
      const names = ff.map(([, id]) => teamMap.get(id)?.name || id);
      lines.push(`Final Four winners: ${names.join(", ")}`);
    }

    // Championship
    const champ = picks["final"];
    if (champ) {
      const team = teamMap.get(champ);
      lines.push(`Champion: ${team ? team.name : champ}`);
    }

    bracketState = `The user has made ${pickedCount} of 67 picks:\n${lines.join("\n")}`;
  }

  return `${SYSTEM_PROMPT}

CURRENT BRACKET STATE:
${bracketState}

You are now in a conversational mode. The user can ask you anything about their bracket, matchups, strategy, or college basketball in general. You have access to full stats for all 68 teams.

Guidelines for conversation:
- Reference the user's actual picks when relevant.
- Use bullet points, not paragraphs. Keep responses scannable.
- Use plain English for all stats — no unexplained abbreviations.
- Be direct and confident. Lead with the answer, then support it.
- You can push back on picks you disagree with.
- Max 5-8 bullet points per response unless the user asks for more detail.`;
}
