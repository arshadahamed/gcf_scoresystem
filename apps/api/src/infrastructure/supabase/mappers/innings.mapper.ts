import { Innings } from '@scf/domain';

interface InningsRow {
  id: string;
  match_id: string;
  number: 1 | 2;
  batting_team_id: string;
  bowling_team_id: string;
  total_runs: number;
  total_wickets: number;
  legal_balls: number;
  is_complete: boolean;
  completion_reason: string | null;
}

export class InningsMapper {
  static toDomain(row: InningsRow): Innings {
    const innings = Innings.start({
      id:             row.id,
      matchId:        row.match_id,
      number:         row.number,
      battingTeamId:  row.batting_team_id,
      bowlingTeamId:  row.bowling_team_id,
      maxOvers:       0,
    });
    Object.assign(innings, {
      _wickets:    row.total_wickets,
      _isComplete: row.is_complete,
    });
    innings.pullDomainEvents();
    return innings;
  }
}
