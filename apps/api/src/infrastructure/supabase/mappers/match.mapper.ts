import { Match } from '@scf/domain';

interface MatchRow {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  overs_per_innings: number;
  scheduled_at: string;
  status: 'scheduled' | 'live' | 'completed' | 'abandoned';
  toss_winner_id: string | null;
  toss_decision: 'bat' | 'bowl' | null;
  winner_id: string | null;
  result_summary: string | null;
  scorer_id: string | null;
}

export class MatchMapper {
  static toDomain(row: MatchRow): Match {
    const match = Match.create({
      id:              row.id,
      tournamentId:    row.tournament_id,
      teamAId:         row.team_a_id,
      teamBId:         row.team_b_id,
      oversPerInnings: row.overs_per_innings,
      scheduledAt:     new Date(row.scheduled_at),
    });
    if (row.toss_winner_id && row.toss_decision) {
      match.decideToss({ winnerId: row.toss_winner_id, decision: row.toss_decision });
      match.pullDomainEvents();
    }
    if (row.status === 'live' || row.status === 'completed') {
      Object.assign(match, { _status: row.status });
      match.pullDomainEvents();
    }
    return match;
  }

  static toInsertRow(match: Match): Omit<MatchRow, 'status'|'toss_winner_id'|'toss_decision'|'winner_id'|'result_summary'|'scorer_id'> {
    return {
      id:               match.id,
      tournament_id:    match.tournamentId,
      team_a_id:        (match as any)._teamAId,
      team_b_id:        (match as any)._teamBId,
      overs_per_innings: match.oversPerInnings,
      scheduled_at:     (match as any)._scheduledAt.toISOString(),
    };
  }
}
