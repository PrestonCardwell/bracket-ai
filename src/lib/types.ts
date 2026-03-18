export interface Team {
  id: string;
  name: string;
  shortName: string;
  seed: number;
  conference: string;
  record: string;
  stats: TeamStats;
}

export interface TeamStats {
  ppg: number;
  oppPpg: number;
  fgPct: number;
  threePtPct: number;
  rpg: number;
  apg: number;
  tpg: number;
  sos: number;
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
