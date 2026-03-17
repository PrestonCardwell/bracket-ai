import { Team } from "./types";
import { getRoundName } from "./bracket";

function teamProfile(team: Team): string {
  const s = team.stats;
  return `${team.name} (${team.seed}-seed, ${team.record}, ${team.conference})
  PPG: ${s.ppg} | Opp PPG: ${s.oppPpg} | Margin: ${(s.ppg - s.oppPpg).toFixed(1)}
  FG%: ${s.fgPct} | 3PT%: ${s.threePtPct}
  RPG: ${s.rpg} | APG: ${s.apg} | TPG: ${s.tpg}
  Strength of Schedule: ${s.sos}/100`;
}

export const SYSTEM_PROMPT = `You are an expert NCAA basketball analyst helping users fill out their March Madness bracket. You have deep knowledge of college basketball statistics, historical tournament trends, coaching tendencies, and matchup dynamics.

Key analysis principles:
- Seed matchup history matters (e.g., 12-seeds beat 5-seeds ~35% of the time)
- Tempo and style matchups can be more predictive than raw talent
- Defensive efficiency is often more stable than offensive efficiency in tournament settings
- Experience in the tournament matters — teams with recent Final Four runs have an edge
- Mid-major teams with elite metrics can compete with power conference teams
- Turnover margin and rebounding are especially important in single-elimination games

Be specific, cite the stats you're referencing, and give confident but well-reasoned analysis. Keep responses concise.`;

export function buildPickPrompt(
  topTeam: Team,
  bottomTeam: Team,
  round: number
): string {
  return `Pick the winner of this ${getRoundName(round)} matchup and explain your reasoning in 2-3 paragraphs.

MATCHUP:
${teamProfile(topTeam)}

vs.

${teamProfile(bottomTeam)}

Format your response as:
PICK: [Team Name]

[Your reasoning]`;
}

export function buildInsightsPrompt(
  topTeam: Team,
  bottomTeam: Team,
  round: number
): string {
  return `Provide statistical insights and analysis for this ${getRoundName(round)} matchup. Focus on key statistical edges, potential mismatches, historical context for this seed matchup, and any factors that could make this game interesting.

MATCHUP:
${teamProfile(topTeam)}

vs.

${teamProfile(bottomTeam)}

Format your response with clear sections:
## Key Statistical Edges
## Matchup Dynamics
## Historical Context
## Watch For`;
}
