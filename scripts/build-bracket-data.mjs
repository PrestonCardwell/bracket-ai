/**
 * Generates src/data/bracket-2026.ts from all data sources:
 * - scripts/espn-data.json (team stats, records, rosters)
 * - scripts/espn-additional.json (top scorers, schedule/record data)
 * - KenPom data (hardcoded in KENPOM below)
 * - Bracket structure (seeds, regions, first four)
 *
 * Usage: node scripts/build-bracket-data.mjs
 */

import { readFileSync, writeFileSync } from "fs";

const espn = JSON.parse(readFileSync("scripts/espn-data.json", "utf-8"));
const extra = JSON.parse(readFileSync("scripts/espn-additional.json", "utf-8"));
const teamNews = JSON.parse(readFileSync("scripts/team-news.json", "utf-8"));

function r1(v) { return v == null ? 0 : Math.round(v * 10) / 10; }

// KenPom data: [kenpomRank, adjEM, adjO, adjD, adjT, sos]
const KENPOM = {
  "duke":         [1, 38.90, 127.9, 89.1, 65.4, 94],
  "siena":        [193, -2.14, 107.1, 109.3, 64.7, 18],
  "ohio-st":      [26, 22.23, 124.3, 102.1, 66.1, 72],
  "tcu":          [43, 17.53, 115.4, 97.8, 67.7, 70],
  "st-johns":     [17, 25.89, 120.1, 94.2, 69.6, 80],
  "n-iowa":       [71, 11.82, 110.0, 98.2, 62.3, 42],
  "kansas":       [21, 24.41, 118.3, 93.9, 67.7, 85],
  "cal-baptist":  [107, 6.00, 107.9, 101.9, 65.8, 25],
  "louisville":   [19, 25.42, 124.1, 98.6, 69.7, 74],
  "s-florida":    [48, 16.38, 117.3, 101.0, 71.5, 52],
  "mich-st":      [9, 28.30, 123.0, 94.7, 66.1, 86],
  "ndsu":         [114, 5.16, 111.8, 106.6, 66.3, 22],
  "ucla":         [27, 21.66, 123.7, 102.1, 64.7, 73],
  "ucf":          [54, 15.00, 120.4, 105.4, 69.2, 68],
  "uconn":        [11, 27.85, 122.0, 94.1, 64.5, 88],
  "furman":       [190, -1.98, 107.5, 109.4, 65.9, 20],
  "arizona":      [2, 37.62, 127.7, 90.0, 69.8, 93],
  "liu":          [216, -3.96, 105.6, 109.6, 67.8, 15],
  "villanova":    [33, 19.94, 120.4, 100.4, 65.2, 70],
  "utah-st":      [30, 20.78, 122.2, 101.4, 67.7, 55],
  "wisconsin":    [22, 23.38, 125.3, 102.0, 68.8, 78],
  "high-point":   [92, 8.40, 117.0, 108.6, 69.9, 30],
  "arkansas":     [15, 26.04, 127.7, 101.6, 71.0, 82],
  "hawaii":       [108, 5.98, 107.1, 101.2, 69.7, 28],
  "byu":          [23, 23.21, 125.4, 102.2, 70.0, 75],
  "nc-state":     [34, 19.62, 124.1, 104.4, 69.1, 72],
  "gonzaga":      [10, 28.10, 122.0, 93.9, 68.6, 75],
  "kennesaw-st":  [161, 0.76, 110.7, 110.0, 71.2, 26],
  "miami-fl":     [31, 20.68, 121.4, 100.7, 67.6, 74],
  "missouri":     [52, 15.39, 119.5, 104.1, 66.2, 72],
  "purdue":       [8, 31.19, 131.6, 100.4, 64.4, 87],
  "queens":       [183, -1.43, 115.8, 117.2, 69.6, 19],
  "florida":      [4, 33.78, 125.5, 91.8, 70.6, 88],
  "lehigh":       [284, -10.41, 102.7, 113.1, 66.9, 16],
  "clemson":      [36, 19.23, 116.5, 97.3, 64.3, 71],
  "iowa":         [25, 22.43, 121.7, 99.3, 63.0, 68],
  "vanderbilt":   [12, 27.50, 126.8, 99.3, 68.9, 78],
  "mcneese":      [67, 12.48, 114.3, 101.8, 66.2, 30],
  "nebraska":     [14, 26.15, 118.5, 92.4, 66.8, 80],
  "troy":         [143, 1.73, 110.7, 109.0, 64.9, 32],
  "unc":          [29, 20.83, 121.4, 100.6, 68.0, 76],
  "vcu":          [46, 17.13, 119.8, 102.7, 68.5, 50],
  "illinois":     [7, 32.09, 131.2, 99.1, 65.6, 84],
  "penn":         [151, 1.33, 107.3, 106.0, 69.1, 24],
  "st-marys":     [24, 23.08, 120.3, 97.2, 65.2, 58],
  "texas-am":     [39, 18.65, 119.7, 101.0, 70.5, 72],
  "houston":      [5, 33.39, 124.8, 91.5, 63.3, 89],
  "idaho":        [146, 1.55, 108.9, 107.3, 67.8, 21],
  "michigan":     [3, 37.58, 126.6, 89.0, 71.0, 91],
  "howard":       [204, -2.92, 104.1, 107.0, 69.1, 17],
  "georgia":      [32, 20.47, 124.7, 104.2, 71.4, 71],
  "saint-louis":  [41, 18.26, 119.4, 101.2, 71.0, 52],
  "texas-tech":   [20, 25.20, 125.1, 99.9, 66.2, 78],
  "akron":        [64, 12.77, 118.8, 106.1, 70.3, 35],
  "alabama":      [18, 25.70, 129.0, 103.3, 73.1, 85],
  "hofstra":      [86, 9.53, 114.6, 105.1, 64.7, 28],
  "tennessee":    [16, 26.02, 121.1, 95.0, 65.0, 78],
  "miami-oh":     [93, 8.25, 116.8, 108.5, 70.0, 38],
  "virginia":     [13, 26.71, 122.5, 95.8, 65.8, 85],
  "wright-st":    [140, 2.04, 112.1, 110.0, 67.2, 22],
  "kentucky":     [28, 21.48, 120.5, 99.0, 68.4, 82],
  "santa-clara":  [35, 19.40, 123.6, 104.2, 69.2, 52],
  "iowa-st":      [6, 32.38, 123.8, 91.4, 66.6, 87],
  "tenn-st":      [186, -1.81, 109.1, 110.9, 70.2, 20],
  "texas":        [37, 19.02, 125.0, 105.9, 66.9, 75],
  "prairie-view": [288, -10.69, 101.2, 111.9, 71.0, 12],
  "umbc":         [188, -1.95, 108.8, 110.8, 66.3, 20],
  "smu":          [42, 18.08, 122.9, 104.8, 68.6, 72],
};

// High Point manual data (ESPN ID issue — data fetched manually)
const HIGH_POINT_OVERRIDE = {
  stats: {
    avgPoints: 90.0, fieldGoalPct: 49.1, threePointFieldGoalPct: 35.6,
    freeThrowPct: 73.0, avgRebounds: 36.4, avgOffensiveRebounds: 10.5,
    avgDefensiveRebounds: 25.9, avgAssists: 16.3, avgTurnovers: 9.4,
    avgBlocks: 3.8, avgSteals: 7.2, assistTurnoverRatio: 1.7,
  },
  record: { avgPointsAgainst: 70.3, record: "30-4", streak: 8, winPercent: 0.882 },
  roster: { avgHeightInches: 77 },
};

// Bracket structure: [teamId, fullName, shortName, seed, conference]
const BRACKET = {
  east: [
    ["duke",       "Duke Blue Devils",            "Duke",          1, "ACC"],
    ["siena",      "Siena Saints",                "Siena",        16, "MAAC"],
    ["ohio-st",    "Ohio State Buckeyes",         "Ohio St",       8, "Big Ten"],
    ["tcu",        "TCU Horned Frogs",            "TCU",           9, "Big 12"],
    ["st-johns",   "St. John's Red Storm",        "St. John's",    5, "Big East"],
    ["n-iowa",     "Northern Iowa Panthers",      "N. Iowa",      12, "MVC"],
    ["kansas",     "Kansas Jayhawks",             "Kansas",        4, "Big 12"],
    ["cal-baptist","Cal Baptist Lancers",         "Cal Baptist",  13, "WAC"],
    ["louisville", "Louisville Cardinals",        "Louisville",    6, "ACC"],
    ["s-florida",  "South Florida Bulls",         "S. Florida",   11, "AAC"],
    ["mich-st",    "Michigan State Spartans",     "Michigan St",   3, "Big Ten"],
    ["ndsu",       "North Dakota State Bison",    "N. Dakota St", 14, "Summit"],
    ["ucla",       "UCLA Bruins",                 "UCLA",          7, "Big Ten"],
    ["ucf",        "UCF Knights",                 "UCF",          10, "Big 12"],
    ["uconn",      "UConn Huskies",               "UConn",         2, "Big East"],
    ["furman",     "Furman Paladins",             "Furman",       15, "SoCon"],
  ],
  west: [
    ["arizona",    "Arizona Wildcats",            "Arizona",       1, "Big 12"],
    ["liu",        "LIU Sharks",                  "LIU",          16, "NEC"],
    ["villanova",  "Villanova Wildcats",          "Villanova",     8, "Big East"],
    ["utah-st",    "Utah State Aggies",           "Utah St",       9, "MWC"],
    ["wisconsin",  "Wisconsin Badgers",           "Wisconsin",     5, "Big Ten"],
    ["high-point", "High Point Panthers",         "High Point",   12, "Big South"],
    ["arkansas",   "Arkansas Razorbacks",         "Arkansas",      4, "SEC"],
    ["hawaii",     "Hawai'i Rainbow Warriors",    "Hawai'i",      13, "Big West"],
    ["byu",        "BYU Cougars",                 "BYU",           6, "Big 12"],
    ["nc-state",   "NC State Wolfpack",           "NC State",     11, "ACC"],
    ["gonzaga",    "Gonzaga Bulldogs",            "Gonzaga",       3, "WCC"],
    ["kennesaw-st","Kennesaw State Owls",         "Kennesaw St",  14, "CUSA"],
    ["miami-fl",   "Miami Hurricanes",            "Miami",         7, "ACC"],
    ["missouri",   "Missouri Tigers",             "Missouri",     10, "SEC"],
    ["purdue",     "Purdue Boilermakers",         "Purdue",        2, "Big Ten"],
    ["queens",     "Queens Royals",               "Queens",       15, "ASUN"],
  ],
  south: [
    ["florida",    "Florida Gators",              "Florida",       1, "SEC"],
    ["lehigh",     "Lehigh Mountain Hawks",       "Lehigh",       16, "Patriot"],
    ["clemson",    "Clemson Tigers",              "Clemson",       8, "ACC"],
    ["iowa",       "Iowa Hawkeyes",               "Iowa",          9, "Big Ten"],
    ["vanderbilt", "Vanderbilt Commodores",       "Vanderbilt",    5, "SEC"],
    ["mcneese",    "McNeese Cowboys",             "McNeese",      12, "Southland"],
    ["nebraska",   "Nebraska Cornhuskers",        "Nebraska",      4, "Big Ten"],
    ["troy",       "Troy Trojans",                "Troy",         13, "Sun Belt"],
    ["unc",        "North Carolina Tar Heels",    "UNC",           6, "ACC"],
    ["vcu",        "VCU Rams",                    "VCU",          11, "A-10"],
    ["illinois",   "Illinois Fighting Illini",    "Illinois",      3, "Big Ten"],
    ["penn",       "Penn Quakers",                "Penn",         14, "Ivy"],
    ["st-marys",   "Saint Mary's Gaels",          "Saint Mary's",  7, "WCC"],
    ["texas-am",   "Texas A&M Aggies",            "Texas A&M",    10, "SEC"],
    ["houston",    "Houston Cougars",             "Houston",       2, "Big 12"],
    ["idaho",      "Idaho Vandals",               "Idaho",        15, "Big Sky"],
  ],
  midwest: [
    ["michigan",   "Michigan Wolverines",         "Michigan",      1, "Big Ten"],
    ["howard",     "Howard Bison",                "Howard",       16, "MEAC"],
    ["georgia",    "Georgia Bulldogs",            "Georgia",       8, "SEC"],
    ["saint-louis","Saint Louis Billikens",       "Saint Louis",   9, "A-10"],
    ["texas-tech", "Texas Tech Red Raiders",      "Texas Tech",    5, "Big 12"],
    ["akron",      "Akron Zips",                  "Akron",        12, "MAC"],
    ["alabama",    "Alabama Crimson Tide",        "Alabama",       4, "SEC"],
    ["hofstra",    "Hofstra Pride",               "Hofstra",      13, "CAA"],
    ["tennessee",  "Tennessee Volunteers",        "Tennessee",     6, "SEC"],
    ["miami-oh",   "Miami (OH) RedHawks",         "Miami OH",     11, "MAC"],
    ["virginia",   "Virginia Cavaliers",          "Virginia",      3, "ACC"],
    ["wright-st",  "Wright State Raiders",        "Wright St",    14, "Horizon"],
    ["kentucky",   "Kentucky Wildcats",           "Kentucky",      7, "SEC"],
    ["santa-clara","Santa Clara Broncos",         "Santa Clara",  10, "WCC"],
    ["iowa-st",    "Iowa State Cyclones",         "Iowa St",       2, "Big 12"],
    ["tenn-st",    "Tennessee State Tigers",      "Tennessee St", 15, "OVC"],
  ],
};

const FIRST_FOUR = [
  { id: "first4-west-9",    region: "west",    slotIndex: 9,  teamBId: "texas",        teamBName: "Texas Longhorns",            teamBShort: "Texas",         teamBSeed: 11, teamBConf: "SEC" },
  { id: "first4-south-1",   region: "south",   slotIndex: 1,  teamBId: "prairie-view", teamBName: "Prairie View A&M Panthers",  teamBShort: "Prairie View",  teamBSeed: 16, teamBConf: "SWAC" },
  { id: "first4-midwest-1", region: "midwest", slotIndex: 1,  teamBId: "umbc",         teamBName: "UMBC Retrievers",            teamBShort: "UMBC",          teamBSeed: 16, teamBConf: "America East" },
  { id: "first4-midwest-9", region: "midwest", slotIndex: 9,  teamBId: "smu",          teamBName: "SMU Mustangs",               teamBShort: "SMU",           teamBSeed: 11, teamBConf: "ACC" },
];

function buildTeamStats(teamId) {
  const kp = KENPOM[teamId];
  if (!kp) throw new Error(`No KenPom data for ${teamId}`);

  const isHighPoint = teamId === "high-point";
  const e = isHighPoint ? null : espn[teamId];
  const hp = isHighPoint ? HIGH_POINT_OVERRIDE : null;
  const x = extra[teamId];

  const s = e?.stats || hp?.stats || {};
  const rec = e?.record || hp?.record || {};
  const ros = e?.roster || hp?.roster || {};

  // Top players: star + 2 notable (from espn-additional.json)
  const topPlayers = x?.topPlayers || [];
  const starPlayer = topPlayers[0] || { name: "Unknown", ppg: 0, rpg: 0, apg: 0 };
  const notablePlayers = topPlayers.slice(1, 3);

  // Best wins
  const bestWins = x?.schedule?.bestWins || [];

  return {
    record: rec.record || "N/A",
    ppg: r1(s.avgPoints),
    oppPpg: r1(rec.avgPointsAgainst),
    fgPct: r1(s.fieldGoalPct),
    threePtPct: r1(s.threePointFieldGoalPct),
    ftPct: r1(s.freeThrowPct),
    rpg: r1(s.avgRebounds),
    orpg: r1(s.avgOffensiveRebounds),
    drpg: r1(s.avgDefensiveRebounds),
    apg: r1(s.avgAssists),
    tpg: r1(s.avgTurnovers),
    bpg: r1(s.avgBlocks),
    spg: r1(s.avgSteals),
    atoRatio: r1(s.assistTurnoverRatio),
    avgHeightInches: x?.starting5Height || r1(ros.avgHeightInches) || 77,
    streak: rec.streak || 0,
    last10: x?.schedule?.last10 || "N/A",
    topScorerName: starPlayer.name,
    topScorerPpg: starPlayer.ppg,
    winsVsTop25: x?.schedule?.winsVsTop25 || 0,
    lossesVsTop25: x?.schedule?.lossesVsTop25 || 0,
    winsVsTop50: x?.schedule?.winsVsTop50 || 0,
    lossesVsTop50: x?.schedule?.lossesVsTop50 || 0,
    sos: kp[5],
    kenpomRank: kp[0],
    adjEM: kp[1],
    adjO: kp[2],
    adjD: kp[3],
    adjT: kp[4],
    starPlayer,
    notablePlayers,
    bestWins,
    news: teamNews[teamId] || "",
  };
}

function fmt(v) {
  if (typeof v === "string") return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return String(v);
}

function fmtPlayer(p) {
  return `{ name: ${fmt(p.name)}, ppg: ${p.ppg}, rpg: ${p.rpg}, apg: ${p.apg} }`;
}

function fmtWin(w) {
  return `{ opponent: ${fmt(w.opponent)}, rank: ${w.rank}, score: ${fmt(w.score)} }`;
}

function teamLine(teamId, name, short, seed, conf, indent = "  ") {
  const s = buildTeamStats(teamId);
  const np = s.notablePlayers.map(fmtPlayer).join(", ");
  const bw = s.bestWins.map(fmtWin).join(", ");
  return `${indent}{ id: ${fmt(teamId)}, name: ${fmt(name)}, shortName: ${fmt(short)}, seed: ${seed}, conference: ${fmt(conf)}, record: ${fmt(s.record)},
${indent}  stats: { ppg: ${s.ppg}, oppPpg: ${s.oppPpg}, fgPct: ${s.fgPct}, threePtPct: ${s.threePtPct}, ftPct: ${s.ftPct},
${indent}    rpg: ${s.rpg}, orpg: ${s.orpg}, drpg: ${s.drpg}, apg: ${s.apg}, tpg: ${s.tpg}, bpg: ${s.bpg}, spg: ${s.spg}, atoRatio: ${s.atoRatio},
${indent}    avgHeightInches: ${s.avgHeightInches}, streak: ${s.streak}, last10: ${fmt(s.last10)},
${indent}    topScorerName: ${fmt(s.topScorerName)}, topScorerPpg: ${s.topScorerPpg},
${indent}    winsVsTop25: ${s.winsVsTop25}, lossesVsTop25: ${s.lossesVsTop25}, winsVsTop50: ${s.winsVsTop50}, lossesVsTop50: ${s.lossesVsTop50},
${indent}    sos: ${s.sos}, kenpomRank: ${s.kenpomRank}, adjEM: ${s.adjEM}, adjO: ${s.adjO}, adjD: ${s.adjD}, adjT: ${s.adjT} },
${indent}  starPlayer: ${fmtPlayer(s.starPlayer)},
${indent}  notablePlayers: [${np}],
${indent}  bestWins: [${bw}],
${indent}  news: ${fmt(s.news)} }`;
}

// Build output
let out = `import { BracketData, FirstFourGame, Team } from "@/lib/types";

// 2026 NCAA Tournament — Generated from ESPN + KenPom data
// Run: node scripts/build-bracket-data.mjs

`;

for (const [region, teams] of Object.entries(BRACKET)) {
  out += `const ${region}: Team[] = [\n`;
  for (let i = 0; i < teams.length; i++) {
    const [id, name, short, seed, conf] = teams[i];
    out += teamLine(id, name, short, seed, conf);
    out += i < teams.length - 1 ? ",\n" : "\n";
  }
  out += "];\n\n";
}

// First Four
out += `// First Four play-in games\nconst firstFour: FirstFourGame[] = [\n`;
for (let i = 0; i < FIRST_FOUR.length; i++) {
  const ff = FIRST_FOUR[i];
  out += `  {\n    id: "${ff.id}",\n    region: "${ff.region}",\n    slotIndex: ${ff.slotIndex},\n`;
  out += `    teamA: ${ff.region}[${ff.slotIndex}],\n`;
  out += `    teamB:\n${teamLine(ff.teamBId, ff.teamBName, ff.teamBShort, ff.teamBSeed, ff.teamBConf, "    ")},\n  }`;
  out += i < FIRST_FOUR.length - 1 ? ",\n" : "\n";
}
out += `];\n\n`;

// Export
out += `export const bracketData: BracketData = {
  year: 2026,
  regions: {
    east:    { name: "east",    displayName: "East",    teams: east },
    west:    { name: "west",    displayName: "West",    teams: west },
    south:   { name: "south",   displayName: "South",   teams: south },
    midwest: { name: "midwest", displayName: "Midwest", teams: midwest },
  },
  finalFourMatchups: [
    ["west", "midwest"],
    ["east", "south"],
  ],
  firstFour,
};
`;

writeFileSync("src/data/bracket-2026.ts", out);
console.log("Generated src/data/bracket-2026.ts");

// Verify all teams
let count = 0;
for (const teams of Object.values(BRACKET)) count += teams.length;
count += FIRST_FOUR.length; // teamB entries
console.log(`Teams: ${count} (${Object.values(BRACKET).reduce((s, t) => s + t.length, 0)} regional + ${FIRST_FOUR.length} first-four extras)`);
