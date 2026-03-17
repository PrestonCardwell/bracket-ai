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

// Teams listed in bracket matchup order per region:
// seeds 1,16, 8,9, 5,12, 4,13, 6,11, 3,14, 7,10, 2,15

const east: Team[] = [
  t("duke",        "Duke Blue Devils",          "Duke",        1, "ACC",     "29-4",  82.1, 66.3, 49.2, 38.1, 38.5, 17.2, 11.0, 88),
  t("norfolk-st",  "Norfolk State Spartans",    "Norfolk St",  16,"MEAC",    "21-13", 71.4, 72.1, 43.1, 32.5, 33.8, 12.4, 14.1, 18),
  t("sdsu",        "San Diego State Aztecs",    "San Diego St", 8,"MWC",     "23-9",  72.8, 65.4, 45.3, 34.7, 35.1, 14.6, 12.3, 62),
  t("drake",       "Drake Bulldogs",            "Drake",        9,"MVC",     "24-8",  74.2, 67.8, 46.1, 35.2, 34.3, 15.1, 11.8, 52),
  t("michigan",    "Michigan Wolverines",       "Michigan",     5,"Big Ten", "24-8",  76.5, 68.2, 46.8, 36.4, 36.2, 15.8, 12.1, 78),
  t("uc-irvine",   "UC Irvine Anteaters",       "UC Irvine",   12,"Big West","26-7",  73.1, 66.5, 45.8, 34.9, 34.8, 14.2, 11.5, 38),
  t("purdue",      "Purdue Boilermakers",       "Purdue",       4,"Big Ten", "26-7",  79.4, 67.1, 48.2, 37.8, 39.1, 16.4, 12.0, 82),
  t("vermont",     "Vermont Catamounts",        "Vermont",     13,"AE",      "27-5",  74.8, 68.2, 46.3, 35.1, 35.2, 14.8, 12.2, 25),
  t("byu",         "BYU Cougars",               "BYU",          6,"Big 12",  "23-9",  77.2, 69.4, 46.5, 36.8, 35.8, 15.5, 12.5, 72),
  t("indiana",     "Indiana Hoosiers",          "Indiana",     11,"Big Ten", "21-12", 75.1, 70.2, 45.6, 35.3, 35.4, 14.9, 12.8, 75),
  t("iowa-st",     "Iowa State Cyclones",       "Iowa St",      3,"Big 12",  "27-5",  78.6, 64.8, 47.9, 37.2, 37.4, 16.8, 11.2, 85),
  t("colgate",     "Colgate Raiders",           "Colgate",     14,"Patriot", "25-8",  76.2, 70.5, 45.1, 36.4, 33.5, 14.1, 12.6, 22),
  t("clemson",     "Clemson Tigers",            "Clemson",      7,"ACC",     "22-10", 74.5, 68.8, 45.8, 35.6, 35.6, 14.7, 12.4, 68),
  t("new-mexico",  "New Mexico Lobos",          "New Mexico",  10,"MWC",     "23-9",  78.3, 71.2, 46.2, 36.1, 36.1, 15.3, 13.0, 55),
  t("marquette",   "Marquette Golden Eagles",   "Marquette",    2,"Big East","28-5",  80.4, 66.8, 48.5, 37.5, 37.2, 17.1, 11.4, 83),
  t("unc-ash",     "UNC Asheville Bulldogs",    "UNC Asheville",15,"Big South","23-10",72.5, 71.8, 44.2, 33.8, 33.2, 13.5, 13.2, 20),
];

const west: Team[] = [
  t("houston",     "Houston Cougars",           "Houston",      1,"Big 12",  "30-3",  78.8, 60.2, 47.5, 35.8, 38.8, 15.4, 10.8, 90),
  t("stetson",     "Stetson Hatters",            "Stetson",     16,"ASUN",    "20-14", 69.8, 73.4, 42.5, 31.8, 32.5, 12.1, 14.5, 15),
  t("colorado-st", "Colorado State Rams",        "Colorado St",  8,"MWC",     "24-8",  74.1, 66.8, 45.5, 35.4, 35.8, 14.8, 12.0, 58),
  t("boise-st",   "Boise State Broncos",        "Boise St",     9,"MWC",     "23-9",  73.5, 67.2, 45.1, 34.8, 34.5, 14.3, 12.2, 55),
  t("st-johns",   "St. John's Red Storm",       "St. John's",   5,"Big East","25-7",  77.8, 68.5, 47.2, 36.5, 36.8, 16.2, 11.8, 76),
  t("grand-canyon","Grand Canyon Antelopes",     "Grand Canyon",12,"WAC",     "27-5",  75.4, 67.8, 46.4, 35.5, 35.1, 14.5, 11.6, 32),
  t("wisconsin",   "Wisconsin Badgers",          "Wisconsin",    4,"Big Ten", "25-8",  72.5, 63.8, 46.8, 36.2, 36.5, 15.1, 10.5, 80),
  t("liberty",     "Liberty Flames",             "Liberty",     13,"CUSA",    "26-7",  73.8, 68.5, 45.5, 35.2, 34.8, 13.8, 12.0, 28),
  t("ole-miss",   "Ole Miss Rebels",            "Ole Miss",     6,"SEC",     "22-10", 76.4, 69.8, 46.1, 35.8, 36.2, 15.0, 12.8, 74),
  t("vcu",        "VCU Rams",                   "VCU",         11,"A-10",    "24-9",  74.8, 68.2, 45.4, 34.5, 35.5, 14.6, 12.5, 48),
  t("kentucky",   "Kentucky Wildcats",           "Kentucky",     3,"SEC",     "26-6",  80.2, 67.5, 48.1, 37.4, 38.2, 16.5, 12.2, 84),
  t("yale",       "Yale Bulldogs",              "Yale",        14,"Ivy",     "23-7",  75.1, 69.8, 46.2, 36.8, 34.2, 15.2, 11.8, 24),
  t("texas",      "Texas Longhorns",            "Texas",        7,"SEC",     "21-11", 74.8, 69.5, 45.8, 35.2, 36.4, 14.5, 13.1, 72),
  t("xavier",     "Xavier Musketeers",          "Xavier",      10,"Big East","22-10", 76.2, 70.8, 46.0, 36.2, 35.8, 15.4, 12.8, 60),
  t("arizona",    "Arizona Wildcats",            "Arizona",      2,"Big 12",  "27-5",  81.5, 67.2, 48.8, 38.2, 37.5, 17.0, 11.5, 86),
  t("robert-morris","Robert Morris Colonials",   "Robert Morris",15,"Horizon","24-9",  71.8, 72.5, 43.8, 33.2, 33.5, 13.2, 13.5, 19),
];

const south: Team[] = [
  t("auburn",      "Auburn Tigers",             "Auburn",       1,"SEC",     "30-3",  83.5, 65.2, 49.5, 38.4, 39.2, 17.5, 11.2, 92),
  t("alcorn-st",  "Alcorn State Braves",        "Alcorn St",   16,"SWAC",    "19-15", 68.5, 74.8, 41.8, 30.5, 32.2, 11.8, 14.8, 12),
  t("gonzaga",    "Gonzaga Bulldogs",            "Gonzaga",      8,"WCC",     "24-8",  81.2, 69.5, 48.5, 37.8, 36.8, 16.8, 12.5, 56),
  t("georgia",    "Georgia Bulldogs",            "Georgia",      9,"SEC",     "22-11", 74.5, 69.2, 45.8, 35.1, 35.2, 14.8, 12.8, 70),
  t("memphis",    "Memphis Tigers",              "Memphis",      5,"AAC",     "25-7",  78.2, 68.8, 47.1, 36.2, 37.1, 15.5, 12.2, 65),
  t("mcneese-st", "McNeese State Cowboys",      "McNeese St",  12,"Southland","28-4",  79.5, 70.2, 47.5, 37.1, 35.5, 15.8, 11.8, 30),
  t("maryland",   "Maryland Terrapins",          "Maryland",     4,"Big Ten", "25-8",  76.8, 66.5, 47.2, 36.5, 37.5, 15.8, 11.5, 79),
  t("morehead-st","Morehead State Eagles",      "Morehead St", 13,"OVC",     "26-7",  77.2, 70.8, 46.8, 36.2, 34.8, 14.5, 12.2, 26),
  t("missouri",   "Missouri Tigers",            "Missouri",     6,"SEC",     "23-9",  75.8, 69.1, 46.2, 35.8, 36.0, 15.2, 12.5, 73),
  t("dayton",     "Dayton Flyers",              "Dayton",      11,"A-10",    "24-8",  76.5, 68.5, 46.5, 36.1, 35.8, 15.4, 12.0, 50),
  t("texas-tech", "Texas Tech Red Raiders",     "Texas Tech",   3,"Big 12",  "26-6",  74.2, 62.5, 46.8, 35.5, 37.8, 14.8, 10.8, 85),
  t("troy",       "Troy Trojans",               "Troy",        14,"Sun Belt","24-9",  73.5, 71.2, 44.8, 34.5, 33.8, 13.8, 12.8, 28),
  t("ucla",       "UCLA Bruins",                "UCLA",         7,"Big Ten", "22-10", 75.8, 69.2, 46.1, 35.8, 36.2, 15.1, 12.5, 71),
  t("creighton",  "Creighton Bluejays",         "Creighton",   10,"Big East","22-10", 77.5, 70.5, 47.2, 37.5, 35.2, 16.2, 12.8, 62),
  t("alabama",    "Alabama Crimson Tide",        "Alabama",      2,"SEC",     "27-6",  84.2, 69.8, 48.2, 38.5, 37.8, 16.8, 13.5, 87),
  t("montana-st", "Montana State Bobcats",      "Montana St",  15,"Big Sky", "24-8",  72.1, 71.5, 44.5, 34.2, 34.5, 13.5, 12.5, 21),
];

const midwest: Team[] = [
  t("kansas",     "Kansas Jayhawks",             "Kansas",       1,"Big 12",  "29-4",  81.8, 65.8, 48.8, 37.8, 38.8, 17.2, 11.0, 91),
  t("se-missouri","SE Missouri State Redhawks",  "SE Missouri", 16,"OVC",     "20-14", 70.2, 73.5, 42.8, 32.1, 33.0, 12.2, 14.2, 16),
  t("arkansas",   "Arkansas Razorbacks",         "Arkansas",     8,"SEC",     "23-10", 78.5, 71.2, 46.5, 36.2, 36.8, 15.5, 13.2, 68),
  t("oklahoma",   "Oklahoma Sooners",            "Oklahoma",     9,"SEC",     "22-10", 75.8, 69.8, 45.8, 35.5, 35.5, 14.8, 12.5, 66),
  t("illinois",   "Illinois Fighting Illini",    "Illinois",     5,"Big Ten", "24-8",  76.2, 67.5, 47.1, 36.5, 37.2, 15.8, 11.8, 77),
  t("uab",        "UAB Blazers",                "UAB",         12,"AAC",     "26-7",  75.8, 69.2, 46.2, 35.8, 35.2, 14.8, 12.0, 35),
  t("florida",    "Florida Gators",              "Florida",      4,"SEC",     "26-7",  79.5, 67.8, 48.5, 37.2, 37.8, 16.2, 11.5, 83),
  t("samford",    "Samford Bulldogs",            "Samford",     13,"SoCon",   "27-5",  78.2, 70.5, 47.5, 37.8, 34.5, 15.2, 11.8, 24),
  t("oregon",     "Oregon Ducks",                "Oregon",       6,"Big Ten", "23-9",  77.5, 69.8, 46.8, 36.8, 36.5, 16.1, 12.5, 74),
  t("nc-state",   "NC State Wolfpack",           "NC State",    11,"ACC",     "21-12", 74.8, 70.2, 45.5, 35.2, 35.8, 14.5, 12.8, 70),
  t("uconn",      "UConn Huskies",              "UConn",        3,"Big East","26-6",  79.8, 66.2, 48.2, 37.5, 38.5, 16.8, 11.2, 82),
  t("iona",       "Iona Gaels",                 "Iona",        14,"MAAC",    "24-8",  74.5, 71.2, 45.2, 35.5, 33.8, 14.2, 13.0, 22),
  t("pittsburgh", "Pittsburgh Panthers",         "Pittsburgh",   7,"ACC",     "22-10", 75.2, 69.5, 46.0, 35.5, 36.2, 14.8, 12.5, 67),
  t("wake-forest","Wake Forest Demon Deacons",   "Wake Forest", 10,"ACC",     "21-11", 76.8, 71.5, 46.2, 36.5, 35.5, 15.5, 13.2, 63),
  t("tennessee",  "Tennessee Volunteers",        "Tennessee",    2,"SEC",     "28-5",  74.5, 61.2, 46.5, 34.8, 38.2, 14.5, 10.2, 88),
  t("winthrop",   "Winthrop Eagles",             "Winthrop",    15,"Big South","23-9", 72.8, 72.0, 44.5, 34.2, 34.0, 13.8, 13.0, 20),
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
