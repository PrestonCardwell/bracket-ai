/**
 * Fetches real team stats and roster data from ESPN's API
 * for all 72 tournament teams. Outputs JSON that can be used
 * to update bracket-2026.ts.
 *
 * Usage: node scripts/fetch-espn-data.mjs
 */

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

// ESPN team IDs for all 72 tournament teams
// Found via https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?search=NAME
const TEAM_IDS = {
  // East
  "duke":         150,
  "siena":        2547,
  "ohio-st":      194,
  "tcu":          2628,
  "st-johns":     2599,
  "n-iowa":       2460,
  "kansas":       2305,
  "cal-baptist":  2856,
  "louisville":   97,
  "s-florida":    58,
  "mich-st":      127,
  "ndsu":         2449,
  "ucla":         26,
  "ucf":          2116,
  "uconn":        41,
  "furman":       231,

  // West
  "arizona":      12,
  "liu":          2344,
  "villanova":    222,
  "utah-st":      328,
  "wisconsin":    275,
  "high-point":   2314,
  "arkansas":     8,
  "hawaii":       62,
  "byu":          252,
  "nc-state":     152,
  "gonzaga":      2250,
  "kennesaw-st":  2320,
  "miami-fl":     2390,
  "missouri":     142,
  "purdue":       2509,
  "queens":       3101,

  // South
  "florida":      57,
  "lehigh":       2329,
  "clemson":      228,
  "iowa":         2294,
  "vanderbilt":   238,
  "mcneese":      2377,
  "nebraska":     158,
  "troy":         2653,
  "unc":          153,
  "vcu":          2670,
  "illinois":     356,
  "penn":         219,
  "st-marys":     2608,
  "texas-am":     245,
  "houston":      248,
  "idaho":        70,

  // Midwest
  "michigan":     130,
  "howard":       47,
  "georgia":      61,
  "saint-louis":  139,
  "texas-tech":   2641,
  "akron":        2006,
  "alabama":      333,
  "hofstra":      2275,
  "tennessee":    2633,
  "miami-oh":     193,
  "virginia":     258,
  "wright-st":    2750,
  "kentucky":     96,
  "santa-clara":  2541,
  "iowa-st":      66,
  "tenn-st":      2634,

  // First Four extras
  "texas":        251,
  "prairie-view": 2504,
  "umbc":         2692,
  "smu":          2567,
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch ${url}: ${res.status}`);
    return null;
  }
  return res.json();
}

async function getTeamStats(espnId) {
  const data = await fetchJSON(`${BASE}/teams/${espnId}/statistics`);
  if (!data?.results?.stats?.categories) return null;

  const stats = {};
  for (const cat of data.results.stats.categories) {
    for (const stat of cat.stats) {
      stats[stat.name] = parseFloat(stat.displayValue) || stat.value;
    }
  }
  return stats;
}

async function getTeamRecord(espnId) {
  const data = await fetchJSON(`${BASE}/teams/${espnId}`);
  if (!data?.team) return null;

  const team = data.team;
  const result = { name: team.displayName };

  // Get record
  if (team.record?.items) {
    for (const item of team.record.items) {
      if (item.type === "total") {
        result.record = item.summary; // e.g. "32-2"
        // Extract stats from record items
        for (const stat of (item.stats || [])) {
          if (stat.name === "pointsFor") result.ppg = stat.value;
          if (stat.name === "pointsAgainst") result.oppPpg = stat.value;
          if (stat.name === "avgPointsFor") result.ppg = stat.value;
          if (stat.name === "avgPointsAgainst") result.oppPpg = stat.value;
        }
      }
    }
  }

  return result;
}

async function getTeamRoster(espnId) {
  const data = await fetchJSON(`${BASE}/teams/${espnId}/roster`);
  if (!data?.athletes) return null;

  const players = data.athletes.map(a => ({
    name: a.displayName,
    height: a.height, // in inches
    position: a.position?.abbreviation || "N/A",
  })).filter(p => p.height > 0);

  if (players.length === 0) return null;

  const avgHeight = players.reduce((sum, p) => sum + p.height, 0) / players.length;
  const tallest = Math.max(...players.map(p => p.height));
  const shortest = Math.min(...players.map(p => p.height));

  return {
    playerCount: players.length,
    avgHeightInches: Math.round(avgHeight * 10) / 10,
    avgHeightFormatted: `${Math.floor(avgHeight / 12)}'${Math.round(avgHeight % 12)}"`,
    tallest,
    shortest,
    players: players.map(p => ({
      name: p.name,
      height: p.height,
      heightFormatted: `${Math.floor(p.height / 12)}'${Math.round(p.height % 12)}"`,
      position: p.position,
    })),
  };
}

async function getTeamSummary(espnId) {
  // Try the scoreboard/summary endpoint for more detailed stats
  const data = await fetchJSON(`${BASE}/teams/${espnId}`);
  if (!data?.team) return null;

  const team = data.team;
  const result = {
    espnId,
    displayName: team.displayName,
    abbreviation: team.abbreviation,
  };

  // Extract record details
  if (team.record?.items) {
    for (const item of team.record.items) {
      if (item.type === "total") {
        result.record = item.summary;
        for (const stat of (item.stats || [])) {
          result[stat.name] = stat.value;
        }
      }
    }
  }

  return result;
}

async function fetchTeamData(teamId, espnId) {
  console.error(`Fetching ${teamId} (ESPN ID: ${espnId})...`);

  const [stats, record, roster] = await Promise.all([
    getTeamStats(espnId),
    getTeamSummary(espnId),
    getTeamRoster(espnId),
  ]);

  return {
    teamId,
    espnId,
    record: record || {},
    stats: stats || {},
    roster: roster || {},
  };
}

async function main() {
  const entries = Object.entries(TEAM_IDS);
  const results = {};

  // Process in batches of 10 to be polite to the API
  for (let i = 0; i < entries.length; i += 10) {
    const batch = entries.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map(([teamId, espnId]) => fetchTeamData(teamId, espnId))
    );
    for (const result of batchResults) {
      results[result.teamId] = result;
    }
    // Small delay between batches
    if (i + 10 < entries.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Output the collected data
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
