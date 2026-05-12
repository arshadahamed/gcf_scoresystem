import type { Match } from '@scf/domain';
import type { Innings } from '@scf/domain';

export interface IMatchRepository {
  findById(matchId: string): Promise<Match | null>;
  save(match: Match): Promise<void>;
  findLive(): Promise<Match[]>;
  findByTournament(tournamentId: string): Promise<Match[]>;

  loadInnings(inningsId: string): Promise<Innings | null>;
  saveInnings(innings: Innings): Promise<void>;
  findInningsByMatch(matchId: string): Promise<Innings[]>;
}
