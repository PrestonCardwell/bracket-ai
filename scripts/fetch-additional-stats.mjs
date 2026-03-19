/**
 * Fetches additional team data from ESPN:
 * - Top scorer (name + PPG) from web roster API
 * - Starting 5 average height (top 5 by PPG as proxy for starters)
 * - Schedule data to calculate last 10 record and wins vs ranked
 *
 * Usage: node scripts/fetch-additional-stats.mjs
 * Output: scripts/espn-additional.json
 */

import { writeFileSync } from "fs";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";
const WEB_BASE = "https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball";

const TEAM_IDS = {
  "duke": 150, "siena": 2547, "ohio-st": 194, "tcu": 2628,
  "st-johns": 2599, "n-iowa": 2460, "kansas": 2305, "cal-baptist": 2856,
  "louisville": 97, "s-florida": 58, "mich-st": 127, "ndsu": 2449,
  "ucla": 26, "ucf": 2116, "uconn": 41, "furman": 231,
  "arizona": 12, "liu": 2344, "villanova": 222, "utah-st": 328,
  "wisconsin": 275, "high-point": 2272, "arkansas": 8, "hawaii": 62,
  "byu": 252, "nc-state": 152, "gonzaga": 2250, "kennesaw-st": 2320,
  "miami-fl": 2390, "missouri": 142, "purdue": 2509, "queens": 3101,
  "florida": 57, "lehigh": 2329, "clemson": 228, "iowa": 2294,
  "vanderbilt": 238, "mcneese": 2377, "nebraska": 158, "troy": 2653,
  "unc": 153, "vcu": 2670, "illinois": 356, "penn": 219,
  "st-marys": 2608, "texas-am": 245, "houston": 248, "idaho": 70,
  "michigan": 130, "howard": 47, "georgia": 61, "saint-louis": 139,
  "texas-tech": 2641, "akron": 2006, "alabama": 333, "hofstra": 2275,
  "tennessee": 2633, "miami-oh": 193, "virginia": 258, "wright-st": 2750,
  "kentucky": 96, "santa-clara": 2541, "iowa-st": 66, "tenn-st": 2634,
  "texas": 251, "prairie-view": 2504, "umbc": 2692, "smu": 2567,
};

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRosterData(espnId) {
  const data = await fetchJSON(`${WEB_BASE}/teams/${espnId}/roster`);
  if (!data?.positionGroups) return { topPlayers: [], starting5Height: null };

  // Collect all players with their PPG, RPG, APG, and height
  const players = [];
  for (const pg of data.positionGroups) {
    for (const athlete of (pg.athletes || [])) {
      let ppg = 0, rpg = 0, apg = 0;
      const cats = athlete.statistics?.splits?.categories;
      if (cats) {
        for (const cat of cats) {
          for (const stat of (cat.stats || [])) {
            if (stat.name === "avgPoints") ppg = stat.value;
            if (stat.name === "avgRebounds") rpg = stat.value;
            if (stat.name === "avgAssists") apg = stat.value;
          }
        }
      }
      const heightInches = parseInt(athlete.height) || 0;
      players.push({
        name: athlete.displayName,
        ppg: Math.round(ppg * 10) / 10,
        rpg: Math.round(rpg * 10) / 10,
        apg: Math.round(apg * 10) / 10,
        heightInches,
      });
    }
  }

  // Sort by PPG to identify impact players
  players.sort((a, b) => b.ppg - a.ppg);

  // Top 3 players by PPG (star + 2 notable)
  const topPlayers = players
    .filter(p => p.ppg > 0)
    .slice(0, 3)
    .map(p => ({ name: p.name, ppg: p.ppg, rpg: p.rpg, apg: p.apg }));

  // Starting 5 avg height: top 5 scorers as proxy for starters
  const top5 = players.slice(0, 5).filter(p => p.heightInches > 0);
  const starting5Height = top5.length === 5
    ? Math.round((top5.reduce((s, p) => s + p.heightInches, 0) / 5) * 10) / 10
    : null;

  return { topPlayers, starting5Height };
}

async function getScheduleData(espnId) {
  // Fetch regular season (type 2) schedule
  const data = await fetchJSON(`${BASE}/teams/${espnId}/schedule?season=2026&seasontype=2`);
  if (!data?.events) return null;

  const games = [];
  for (const event of data.events) {
    const comp = event.competitions?.[0];
    if (!comp?.status?.type?.completed) continue;

    let teamScore = null;
    let oppScore = null;
    let oppRank = null;
    let oppName = null;

    for (const team of (comp.competitors || [])) {
      const id = parseInt(team.id);
      const score = typeof team.score === "object" ? team.score?.value : parseInt(team.score);
      if (id === espnId) {
        teamScore = score;
      } else {
        oppScore = score;
        oppRank = team.curatedRank?.current ?? null;
        oppName = team.team?.displayName || team.team?.shortDisplayName || "Unknown";
      }
    }

    if (teamScore != null && oppScore != null) {
      games.push({
        won: teamScore > oppScore,
        oppRank: (oppRank && oppRank < 99) ? oppRank : null,
        oppName,
        teamScore,
        oppScore,
        date: event.date,
      });
    }
  }

  games.sort((a, b) => new Date(a.date) - new Date(b.date));

  const last10 = games.slice(-10);
  const last10W = last10.filter(g => g.won).length;
  const last10L = last10.length - last10W;

  const vsT25 = games.filter(g => g.oppRank && g.oppRank <= 25);
  const vsT50 = games.filter(g => g.oppRank && g.oppRank <= 50);

  // Best wins: wins against ranked teams, sorted by opponent rank (best first)
  const allWins = games.filter(g => g.won && g.oppRank);
  allWins.sort((a, b) => a.oppRank - b.oppRank);
  const bestWins = allWins.slice(0, 5).map(g => ({
    opponent: g.oppName,
    rank: g.oppRank,
    score: `${g.teamScore}-${g.oppScore}`,
  }));
  // If fewer than 3 ranked wins, fill with best unranked wins (closest games)
  if (bestWins.length < 3) {
    const unrankedWins = games
      .filter(g => g.won && !g.oppRank)
      .sort((a, b) => (a.teamScore - a.oppScore) - (b.teamScore - b.oppScore));
    for (const g of unrankedWins) {
      if (bestWins.length >= 5) break;
      bestWins.push({ opponent: g.oppName, rank: 0, score: `${g.teamScore}-${g.oppScore}` });
    }
  }

  return {
    last10: `${last10W}-${last10L}`,
    winsVsTop25: vsT25.filter(g => g.won).length,
    lossesVsTop25: vsT25.filter(g => !g.won).length,
    winsVsTop50: vsT50.filter(g => g.won).length,
    lossesVsTop50: vsT50.filter(g => !g.won).length,
    bestWins,
  };
}

async function fetchTeamAdditional(teamId, espnId) {
  console.error(`  ${teamId}...`);
  const [rosterData, schedule] = await Promise.all([
    getRosterData(espnId),
    getScheduleData(espnId),
  ]);
  return {
    teamId,
    topPlayers: rosterData.topPlayers,
    starting5Height: rosterData.starting5Height,
    schedule,
  };
}

async function main() {
  const entries = Object.entries(TEAM_IDS);
  const results = {};

  for (let i = 0; i < entries.length; i += 6) {
    const batch = entries.slice(i, i + 6);
    console.error(`Batch ${Math.floor(i/6)+1}/${Math.ceil(entries.length/6)}:`);
    const batchResults = await Promise.all(
      batch.map(([teamId, espnId]) => fetchTeamAdditional(teamId, espnId))
    );
    for (const r of batchResults) results[r.teamId] = r;
    if (i + 6 < entries.length) await new Promise(r => setTimeout(r, 600));
  }

  writeFileSync("scripts/espn-additional.json", JSON.stringify(results, null, 2));

  // Summary
  let rosters = 0, schedules = 0, heights = 0;
  for (const r of Object.values(results)) {
    if (r.topPlayers?.length > 0) rosters++;
    if (r.schedule) schedules++;
    if (r.starting5Height) heights++;
  }
  console.log(`\nDone! Player data: ${rosters}/68 | Schedules: ${schedules}/68 | Starting 5 heights: ${heights}/68`);

  // Print sample
  for (const id of ["duke", "siena", "louisville", "alabama"]) {
    const r = results[id];
    if (!r) continue;
    const players = (r.topPlayers || []).map(p => `${p.name} (${p.ppg}/${p.rpg}/${p.apg})`).join(", ");
    const wins = (r.schedule?.bestWins || []).map(w => `#${w.rank} ${w.opponent} ${w.score}`).join(", ");
    console.log(`${id}: ${players}`);
    console.log(`  Best wins: ${wins || "none"}`);
  }
}

main().catch(console.error);
