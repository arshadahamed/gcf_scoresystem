export interface ScoreboardSnapshot {
  matchId: string;
  tournamentName: string;
  teamA: { id: string; name: string; shortName: string };
  teamB: { id: string; name: string; shortName: string };
  currentInnings: {
    battingTeamId: string;
    runs: number;
    wickets: number;
    oversDisplay: string;
    targetRuns: number | null;
  };
  striker: {
    id: string; name: string; runs: number; balls: number;
    fours: number; sixes: number; strikeRate: number;
  };
  nonStriker: {
    id: string; name: string; runs: number; balls: number;
  };
  bowler: {
    id: string; name: string; overs: string;
    runs: number; wickets: number; economy: number;
  };
  recentOvers: string[];
  matchStatus: 'live' | 'innings_break' | 'completed';
}
