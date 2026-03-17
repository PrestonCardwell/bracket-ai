import { BracketData, Team } from "@/lib/types";

const t = (
  id: string, name: string, short: string, seed: number,
  conf: string, record: string,
  ppg: number, oppPpg: number, fgPct: number, threePct: number,
  rpg: number, apg: number, tpg: number, sos: number
): Team => ({
  id, name, shortName: short, seed, conference: conf, record,
  stats: { ppg, oppPpg, fgPct, threePtPct: threePct, rpg, apg, tpg, sos },
});

// 2026 NCAA Tournament — Actual bracket
// Teams listed in bracket matchup order per region:
// seeds 1,16, 8,9, 5,12, 4,13, 6,11, 3,14, 7,10, 2,15

const east: Team[] = [
  t("duke",       "Duke Blue Devils",            "Duke",         1, "ACC",      "32-2",  83.5, 64.2, 49.8, 38.5, 39.1, 17.8, 10.5, 94),
  t("siena",      "Siena Saints",                "Siena",       16, "MAAC",     "23-11", 72.8, 71.5, 44.2, 33.5, 33.5, 13.2, 13.8, 18),
  t("ohio-st",    "Ohio State Buckeyes",         "Ohio St",      8, "Big Ten",  "21-12", 73.5, 69.8, 45.5, 34.8, 35.2, 14.5, 12.5, 72),
  t("tcu",        "TCU Horned Frogs",            "TCU",          9, "Big 12",   "22-11", 74.2, 70.1, 45.8, 35.2, 34.8, 14.8, 12.2, 70),
  t("st-johns",   "St. John's Red Storm",        "St. John's",   5, "Big East", "28-6",  78.5, 67.8, 47.5, 36.8, 37.2, 16.5, 11.5, 80),
  t("n-iowa",     "Northern Iowa Panthers",      "N. Iowa",     12, "MVC",      "23-12", 73.8, 69.5, 45.5, 35.1, 34.5, 14.2, 12.0, 42),
  t("kansas",     "Kansas Jayhawks",             "Kansas",       4, "Big 12",   "23-10", 77.8, 68.5, 47.2, 36.5, 38.2, 16.2, 12.0, 85),
  t("cal-baptist","Cal Baptist Lancers",         "Cal Baptist", 13, "WAC",      "25-8",  75.2, 70.8, 46.1, 35.5, 34.2, 14.5, 12.5, 25),
  t("louisville", "Louisville Cardinals",        "Louisville",   6, "ACC",      "23-10", 76.2, 69.2, 46.5, 35.8, 36.0, 15.5, 12.5, 74),
  t("s-florida",  "South Florida Bulls",         "S. Florida",  11, "AAC",      "25-8",  75.8, 68.5, 46.2, 35.5, 35.5, 15.2, 12.0, 52),
  t("mich-st",    "Michigan State Spartans",     "Michigan St",  3, "Big Ten",  "25-7",  78.2, 66.8, 47.8, 36.5, 37.8, 16.5, 11.2, 86),
  t("ndsu",       "North Dakota State Bison",    "N. Dakota St",14, "Summit",   "27-7",  76.5, 70.2, 46.5, 36.2, 35.0, 14.8, 11.8, 22),
  t("ucla",       "UCLA Bruins",                 "UCLA",         7, "Big Ten",  "23-11", 75.8, 69.5, 46.2, 35.8, 36.2, 15.2, 12.5, 73),
  t("ucf",        "UCF Knights",                 "UCF",         10, "Big 12",   "21-11", 74.5, 70.2, 45.8, 35.2, 35.8, 14.8, 12.8, 68),
  t("uconn",      "UConn Huskies",               "UConn",        2, "Big East", "29-5",  80.5, 66.2, 48.5, 37.5, 38.5, 17.2, 11.0, 88),
  t("furman",     "Furman Paladins",             "Furman",      15, "SoCon",    "22-12", 72.2, 71.8, 44.5, 34.2, 33.8, 13.5, 13.0, 20),
];

const west: Team[] = [
  t("arizona",    "Arizona Wildcats",            "Arizona",      1, "Big 12",   "32-2",  82.8, 64.5, 49.5, 38.2, 38.8, 17.5, 10.8, 93),
  t("liu",        "LIU Sharks",                  "LIU",         16, "NEC",      "24-10", 71.5, 73.2, 43.5, 32.8, 33.2, 12.5, 14.2, 15),
  t("villanova",  "Villanova Wildcats",          "Villanova",    8, "Big East", "24-8",  74.8, 68.5, 46.2, 35.5, 35.5, 15.0, 12.0, 70),
  t("utah-st",    "Utah State Aggies",           "Utah St",      9, "MWC",      "28-6",  76.2, 68.2, 46.8, 36.2, 36.0, 15.2, 11.5, 55),
  t("wisconsin",  "Wisconsin Badgers",           "Wisconsin",    5, "Big Ten",  "24-10", 72.8, 65.2, 46.5, 35.8, 36.5, 14.8, 10.8, 78),
  t("high-point", "High Point Panthers",         "High Point",  12, "Big South","30-4",  79.2, 69.5, 47.5, 37.2, 36.2, 15.8, 11.2, 30),
  t("arkansas",   "Arkansas Razorbacks",         "Arkansas",     4, "SEC",      "26-8",  79.5, 69.8, 47.2, 36.8, 37.5, 16.0, 12.5, 82),
  t("hawaii",     "Hawai'i Rainbow Warriors",    "Hawai'i",     13, "Big West", "24-8",  74.5, 70.2, 45.8, 35.2, 34.5, 14.2, 12.2, 28),
  t("byu",        "BYU Cougars",                 "BYU",          6, "Big 12",   "23-11", 76.5, 69.5, 46.5, 36.5, 35.8, 15.5, 12.2, 75),
  t("nc-state",   "NC State Wolfpack",           "NC State",    11, "ACC",      "20-13", 74.2, 71.5, 45.2, 34.8, 35.2, 14.5, 13.0, 72),
  t("gonzaga",    "Gonzaga Bulldogs",            "Gonzaga",      3, "WCC",      "30-3",  84.2, 68.2, 49.2, 38.5, 37.5, 17.2, 11.5, 75),
  t("kennesaw-st","Kennesaw State Owls",         "Kennesaw St", 14, "CUSA",     "21-13", 73.2, 72.5, 44.8, 34.5, 34.0, 13.8, 13.2, 26),
  t("miami-fl",   "Miami Hurricanes",            "Miami",        7, "ACC",      "25-8",  77.2, 69.2, 46.8, 36.2, 36.5, 15.8, 12.0, 74),
  t("missouri",   "Missouri Tigers",             "Missouri",    10, "SEC",      "20-12", 74.8, 70.8, 45.5, 35.0, 35.5, 14.5, 13.0, 72),
  t("purdue",     "Purdue Boilermakers",         "Purdue",       2, "Big Ten",  "27-8",  79.5, 66.8, 48.2, 37.0, 39.2, 16.5, 11.5, 87),
  t("queens",     "Queens Royals",               "Queens",      15, "ASUN",     "21-13", 71.8, 72.8, 44.2, 33.8, 33.5, 13.0, 13.5, 19),
];

const south: Team[] = [
  t("florida",    "Florida Gators",              "Florida",      1, "SEC",      "26-7",  79.8, 65.5, 48.5, 37.2, 38.0, 16.8, 11.0, 88),
  t("lehigh",     "Lehigh Mountain Hawks",       "Lehigh",      16, "Patriot",  "18-16", 73.2, 74.5, 46.4, 34.5, 34.0, 13.8, 14.0, 16),
  t("clemson",    "Clemson Tigers",              "Clemson",      8, "ACC",      "24-10", 74.5, 68.8, 45.8, 35.2, 36.0, 14.8, 12.2, 71),
  t("iowa",       "Iowa Hawkeyes",               "Iowa",         9, "Big Ten",  "21-12", 78.5, 72.5, 46.8, 36.5, 35.5, 16.2, 13.0, 68),
  t("vanderbilt", "Vanderbilt Commodores",       "Vanderbilt",   5, "SEC",      "26-8",  76.8, 68.2, 47.0, 36.5, 36.8, 15.5, 11.8, 78),
  t("mcneese",    "McNeese Cowboys",             "McNeese",     12, "Southland","28-5",  79.5, 70.2, 47.5, 37.2, 35.5, 15.8, 11.5, 30),
  t("nebraska",   "Nebraska Cornhuskers",        "Nebraska",     4, "Big Ten",  "26-6",  75.2, 66.5, 46.8, 35.8, 37.2, 15.0, 11.0, 80),
  t("troy",       "Troy Trojans",                "Troy",        13, "Sun Belt", "22-11", 74.8, 71.5, 45.5, 35.0, 34.5, 14.2, 12.5, 32),
  t("unc",        "North Carolina Tar Heels",    "UNC",          6, "ACC",      "24-8",  78.5, 70.2, 47.2, 36.8, 37.5, 16.0, 12.5, 76),
  t("vcu",        "VCU Rams",                    "VCU",         11, "A-10",     "27-7",  75.8, 68.5, 46.2, 35.5, 35.8, 15.0, 11.8, 50),
  t("illinois",   "Illinois Fighting Illini",    "Illinois",     3, "Big Ten",  "24-8",  76.5, 66.8, 47.2, 36.2, 37.5, 15.8, 11.5, 84),
  t("penn",       "Penn Quakers",                "Penn",        14, "Ivy",      "18-11", 72.5, 71.2, 45.2, 35.8, 34.2, 14.2, 12.8, 24),
  t("st-marys",   "Saint Mary's Gaels",          "Saint Mary's", 7, "WCC",      "27-5",  74.2, 64.8, 47.5, 36.5, 36.5, 14.5, 10.5, 58),
  t("texas-am",   "Texas A&M Aggies",            "Texas A&M",   10, "SEC",      "21-11", 74.8, 70.5, 45.8, 35.2, 36.0, 14.5, 12.8, 72),
  t("houston",    "Houston Cougars",             "Houston",      2, "Big 12",   "28-6",  78.2, 62.5, 47.5, 35.5, 38.5, 15.2, 10.5, 89),
  t("idaho",      "Idaho Vandals",               "Idaho",       15, "Big Sky",  "21-14", 72.8, 73.5, 44.5, 34.2, 34.2, 13.5, 13.5, 21),
];

const midwest: Team[] = [
  t("michigan",   "Michigan Wolverines",         "Michigan",     1, "Big Ten",  "31-3",  81.2, 65.0, 49.0, 37.8, 38.5, 17.2, 10.8, 91),
  t("howard",     "Howard Bison",                "Howard",      16, "MEAC",     "23-10", 71.2, 73.8, 43.5, 32.5, 33.0, 12.8, 14.5, 17),
  t("georgia",    "Georgia Bulldogs",            "Georgia",      8, "SEC",      "22-10", 74.2, 69.5, 45.8, 35.0, 35.5, 14.8, 12.5, 71),
  t("saint-louis","Saint Louis Billikens",       "Saint Louis",  9, "A-10",     "28-5",  76.5, 67.8, 47.0, 36.2, 36.0, 15.5, 11.2, 52),
  t("texas-tech", "Texas Tech Red Raiders",      "Texas Tech",   5, "Big 12",   "22-10", 72.5, 64.8, 46.0, 34.8, 37.0, 14.2, 11.0, 78),
  t("akron",      "Akron Zips",                  "Akron",       12, "MAC",      "29-5",  77.8, 69.2, 47.2, 36.8, 35.8, 15.5, 11.5, 35),
  t("alabama",    "Alabama Crimson Tide",        "Alabama",      4, "SEC",      "23-9",  82.5, 70.5, 48.0, 37.5, 37.2, 16.5, 13.2, 85),
  t("hofstra",    "Hofstra Pride",               "Hofstra",     13, "CAA",      "24-10", 75.5, 71.2, 46.0, 35.8, 34.5, 14.8, 12.2, 28),
  t("tennessee",  "Tennessee Volunteers",        "Tennessee",    6, "SEC",      "22-11", 73.8, 64.5, 46.2, 34.5, 37.5, 14.2, 10.8, 78),
  t("miami-oh",   "Miami (OH) RedHawks",         "Miami OH",    11, "MAC",      "31-1",  90.7, 72.5, 52.4, 39.8, 37.2, 18.5, 11.5, 38),
  t("virginia",   "Virginia Cavaliers",          "Virginia",     3, "ACC",      "29-5",  68.5, 56.8, 47.2, 36.0, 36.8, 14.5, 9.8, 85),
  t("wright-st",  "Wright State Raiders",        "Wright St",   14, "Horizon",  "23-11", 73.8, 71.5, 45.5, 34.8, 34.2, 14.0, 12.8, 22),
  t("kentucky",   "Kentucky Wildcats",           "Kentucky",     7, "SEC",      "21-13", 78.5, 72.8, 46.8, 36.2, 37.5, 15.8, 13.5, 82),
  t("santa-clara","Santa Clara Broncos",         "Santa Clara", 10, "WCC",      "26-8",  76.2, 69.5, 46.5, 36.5, 35.5, 15.2, 12.0, 52),
  t("iowa-st",    "Iowa State Cyclones",         "Iowa St",      2, "Big 12",   "27-7",  77.8, 64.2, 47.8, 36.8, 37.5, 16.2, 11.0, 87),
  t("tenn-st",    "Tennessee State Tigers",      "Tennessee St",15, "OVC",      "23-9",  74.2, 72.0, 45.2, 34.5, 34.5, 13.8, 13.0, 20),
];

export const bracketData: BracketData = {
  year: 2026,
  regions: {
    east:    { name: "east",    displayName: "East",    teams: east },
    west:    { name: "west",    displayName: "West",    teams: west },
    south:   { name: "south",   displayName: "South",   teams: south },
    midwest: { name: "midwest", displayName: "Midwest", teams: midwest },
  },
  finalFourMatchups: [
    ["east", "west"],
    ["south", "midwest"],
  ],
};
