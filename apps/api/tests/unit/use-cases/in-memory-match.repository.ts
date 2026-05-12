import type { IMatchRepository, BallPersistDTO } from '@scf/application';
import { Match, Innings } from '@scf/domain';

export class InMemoryMatchRepository implements IMatchRepository {
  private matches = new Map<string, Match>();
  private inningsMap = new Map<string, Innings>();

  async findById(matchId: string): Promise<Match | null> {
    return this.matches.get(matchId) ?? null;
  }

  async save(match: Match): Promise<void> {
    this.matches.set(match.id, match);
  }

  async findLive(): Promise<Match[]> {
    return [...this.matches.values()].filter(m => (m as any)._status === 'live');
  }

  async findByTournament(tournamentId: string): Promise<Match[]> {
    return [...this.matches.values()].filter(m => m.tournamentId === tournamentId);
  }

  async loadInnings(inningsId: string): Promise<Innings | null> {
    return this.inningsMap.get(inningsId) ?? null;
  }

  async saveInnings(innings: Innings): Promise<void> {
    this.inningsMap.set(innings.id, innings);
  }

  async findInningsByMatch(matchId: string): Promise<Innings[]> {
    return [...this.inningsMap.values()].filter(i => i.matchId === matchId);
  }

  async persistBallEvent(_ball: BallPersistDTO): Promise<void> { /* no-op */ }
  async voidBallEvent(_inningsId: string, _seq: number, _actorId: string): Promise<void> { /* no-op */ }

  // test helpers
  seedMatch(match: Match): void { this.matches.set(match.id, match); }
  seedInnings(innings: Innings): void { this.inningsMap.set(innings.id, innings); }
}
