/**
 * Reads the ESPN data JSON and outputs updated team stat values
 * that can be used to update bracket-2026.ts.
 *
 * Usage: node scripts/generate-updated-stats.mjs
 */

import { readFileSync } from "fs";

const data = JSON.parse(readFileSync("scripts/espn-data.json", "utf-8"));

// High Point manual data (ESPN ID was wrong in original fetch)
const HIGH_POINT = {
  ppg: 90.0, oppPpg: 70.3, fgPct: 49.1, threePct: 35.6,
  rpg: 36.4, apg: 16.3, tpg: 9.4, avgHeightInches: 77,
};

// Team order matching bracket-2026.ts
const REGIONS = {
  east: ["duke","siena","ohio-st","tcu","st-johns","n-iowa","kansas","cal-baptist","louisville","s-florida","mich-st","ndsu","ucla","ucf","uconn","furman"],
  west: ["arizona","liu","villanova","utah-st","wisconsin","high-point","arkansas","hawaii","byu","nc-state","gonzaga","kennesaw-st","miami-fl","missouri","purdue","queens"],
  south: ["florida","lehigh","clemson","iowa","vanderbilt","mcneese","nebraska","troy","unc","vcu","illinois","penn","st-marys","texas-am","houston","idaho"],
  midwest: ["michigan","howard","georgia","saint-louis","texas-tech","akron","alabama","hofstra","tennessee","miami-oh","virginia","wright-st","kentucky","santa-clara","iowa-st","tenn-st"],
};
const FIRST_FOUR = ["texas","prairie-view","umbc","smu"];

function getStats(teamId) {
  if (teamId === "high-point") {
    return HIGH_POINT;
  }

  const d = data[teamId];
  if (!d) {
    console.error(`Missing data for ${teamId}`);
    return null;
  }

  const s = d.stats;
  const r = d.record;
  const ro = d.roster;

  return {
    ppg: round1(s.avgPoints),
    oppPpg: round1(r.avgPointsAgainst),
    fgPct: round1(s.fieldGoalPct),
    threePct: round1(s.threePointFieldGoalPct),
    rpg: round1(s.avgRebounds),
    apg: round1(s.avgAssists),
    tpg: round1(s.avgTurnovers),
    avgHeightInches: ro.avgHeightInches ? round1(ro.avgHeightInches) : null,
    record: r.record,
  };
}

function round1(v) {
  if (v == null) return null;
  return Math.round(v * 10) / 10;
}

function formatHeight(inches) {
  if (!inches) return "N/A";
  return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`;
}

// Output all stats
console.log("=== UPDATED TEAM STATS FROM ESPN ===\n");

for (const [region, teams] of Object.entries(REGIONS)) {
  console.log(`--- ${region.toUpperCase()} ---`);
  for (const t of teams) {
    const s = getStats(t);
    if (!s) continue;
    console.log(`${t.padEnd(15)} | PPG: ${String(s.ppg).padStart(5)} | OppPPG: ${String(s.oppPpg).padStart(5)} | FG%: ${String(s.fgPct).padStart(5)} | 3P%: ${String(s.threePct).padStart(5)} | RPG: ${String(s.rpg).padStart(5)} | APG: ${String(s.apg).padStart(5)} | TPG: ${String(s.tpg).padStart(5)} | Ht: ${formatHeight(s.avgHeightInches)}`);
  }
  console.log("");
}

console.log("--- FIRST FOUR ---");
for (const t of FIRST_FOUR) {
  const s = getStats(t);
  if (!s) continue;
  console.log(`${t.padEnd(15)} | PPG: ${String(s.ppg).padStart(5)} | OppPPG: ${String(s.oppPpg).padStart(5)} | FG%: ${String(s.fgPct).padStart(5)} | 3P%: ${String(s.threePct).padStart(5)} | RPG: ${String(s.rpg).padStart(5)} | APG: ${String(s.apg).padStart(5)} | TPG: ${String(s.tpg).padStart(5)} | Ht: ${formatHeight(s.avgHeightInches)}`);
}

// Output as JSON for programmatic use
console.log("\n\n=== JSON OUTPUT ===\n");
const allTeams = {};
for (const teams of Object.values(REGIONS)) {
  for (const t of teams) {
    allTeams[t] = getStats(t);
  }
}
for (const t of FIRST_FOUR) {
  allTeams[t] = getStats(t);
}
console.log(JSON.stringify(allTeams, null, 2));
