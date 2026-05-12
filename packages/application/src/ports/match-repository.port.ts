import type { Match } from '@scf/domain';
import type { Innings } from '@scf/domain';

export interface BallPersistDTO {
  id: string;
  inningsId: string;
  seq: number;
  overNumber: number;
  ballInOver: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runsOffBat: number;
  extras: { wide: number; noBall: number; bye: number; legBye: number };
  wicket: { kind: string; dismissedPlayerId: string; fielderId: string | null; bowlerId: string | null } | null;
  recordedBy: string;
}

export interface IMatchRepository {
  findById(matchId: string): Promise<Match | null>;
  save(match: Match): Promise<void>;
  findLive(): Promise<Match[]>;
  findByTournament(tournamentId: string): Promise<Match[]>;

  loadInnings(inningsId: string): Promise<Innings | null>;
  saveInnings(innings: Innings): Promise<void>;
  findInningsByMatch(matchId: string): Promise<Innings[]>;

  persistBallEvent(ball: BallPersistDTO): Promise<void>;
  voidBallEvent(inningsId: string, seq: number, actorId: string): Promise<void>;
}
