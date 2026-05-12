import type { BallDTO, WicketDTO } from '../api/scoring';

export type OverlayCueKind = 'wicket' | 'boundary_four' | 'boundary_six' | 'over_complete' | 'sponsor' | 'result';

export interface OverlayCue {
  kind: OverlayCueKind;
  durationMs: number;
  data: Record<string, unknown>;
}

export interface PlayerLiveDTO {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
}

export interface BowlerLiveDTO {
  id: string;
  name: string;
  overs: string;
  runs: number;
  wickets: number;
  economy: number;
}

export interface BallRecordedPayload {
  matchId: string;
  inningsId: string;
  ball: BallDTO;
  scoreAfter: { runs: number; wickets: number; oversDisplay: string };
  striker:    PlayerLiveDTO;
  nonStriker: PlayerLiveDTO;
  bowler:     BowlerLiveDTO;
  seq: number;
}

export type WsEvent =
  | { type: 'ball.recorded';    v: 1; payload: BallRecordedPayload }
  | { type: 'ball.undone';      v: 1; payload: { inningsId: string; undoneSeq: number; scoreAfter: { runs: number; wickets: number; oversDisplay: string } } }
  | { type: 'over.completed';   v: 1; payload: { matchId: string; inningsId: string; overNumber: number; runs: number; wickets: number } }
  | { type: 'innings.complete'; v: 1; payload: { matchId: string; inningsId: string; reason: string } }
  | { type: 'match.started';    v: 1; payload: { matchId: string } }
  | { type: 'match.ended';      v: 1; payload: { matchId: string; winnerId: string | null; resultSummary: string } }
  | { type: 'overlay.cue';      v: 1; payload: OverlayCue };
