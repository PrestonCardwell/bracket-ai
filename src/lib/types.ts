export interface PlayerInfo {
  name: string;
  ppg: number;
  rpg: number;
  apg: number;
}

export interface NotableWin {
  opponent: string;
  rank: number;
  score: string; // e.g. "78-66"
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  seed: number;
  conference: string;
  record: string;
  stats: TeamStats;
  starPlayer: PlayerInfo;
  notablePlayers: PlayerInfo[];  // 2 impact players beyond the star
  bestWins: NotableWin[];        // 3-5 best wins by opponent rank
  news: string;                  // Recent injury/lineup news, empty if none
}

export interface TeamStats {
  // Scoring
  ppg: number;
  oppPpg: number;
  fgPct: number;
  threePtPct: number;
  ftPct: number;
  // Ball handling
  rpg: number;
  orpg: number;
  drpg: number;
  apg: number;
  tpg: number;
  bpg: number;
  spg: number;
  atoRatio: number;  // Assist-to-turnover ratio
  // Physical
  avgHeightInches: number;
  // Momentum
  streak: number;       // Current win streak (negative = loss streak)
  last10: string;       // e.g. "8-2"
  // Star power
  topScorerName: string;
  topScorerPpg: number;
  // Strength of record
  winsVsTop25: number;
  lossesVsTop25: number;
  winsVsTop50: number;
  lossesVsTop50: number;
  sos: number;
  // KenPom advanced metrics
  kenpomRank: number;
  adjEM: number;  // Adjusted Efficiency Margin
  adjO: number;   // Adjusted Offensive Efficiency
  adjD: number;   // Adjusted Defensive Efficiency
  adjT: number;   // Adjusted Tempo
}

export type RegionName = "east" | "west" | "south" | "midwest";

export interface RegionData {
  name: RegionName;
  displayName: string;
  // 16 teams in matchup order: seeds 1,16,8,9,5,12,4,13,6,11,3,14,7,10,2,15
  teams: Team[];
}

export interface FirstFourGame {
  id: string; // e.g. "first4-midwest-1"
  region: RegionName;
  slotIndex: number; // index in region.teams this feeds into
  teamA: Team; // one play-in team (same as the team in the slot)
  teamB: Team; // the other play-in team
  winner?: "teamA" | "teamB"; // set when game is completed (locks the result)
}

export interface BracketData {
  year: number;
  regions: Record<RegionName, RegionData>;
  // Which regional champions play each other in the Final Four
  finalFourMatchups: [RegionName, RegionName][];
  // Play-in games
  firstFour: FirstFourGame[];
}

// gameId -> teamId
export type Picks = Record<string, string>;

export type AIProvider = "openai" | "anthropic";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

export interface AIRequest {
  type: "pick" | "insights";
  topTeam: Team;
  bottomTeam: Team;
  round: number;
}

export interface AIResponse {
  content: string;
  type: "pick" | "insights";
  pickTeamId?: string;
}

// Structured pick response from AI
export interface StructuredPick {
  matchup_title: string;
  bullets: { label: string; text: string }[];
  pick: string;
  reasoning: string;
}

// Chat
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  structuredPick?: StructuredPick;
}
