import type { IDomainEvent } from '../shared/domain-event';
import type { Ball } from './ball.entity';

export class BallRecordedEvent implements IDomainEvent {
  readonly name = 'scoring.ball.recorded' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly ball: Ball,
    readonly totalRuns: number,
    readonly totalWickets: number,
    readonly overDisplay: string,
  ) {}
}

export class BallUndoneEvent implements IDomainEvent {
  readonly name = 'scoring.ball.undone' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly undoneSeq: number,
    readonly actorId: string,
    readonly totalRuns: number,
    readonly totalWickets: number,
  ) {}
}

export class OverCompletedEvent implements IDomainEvent {
  readonly name = 'scoring.over.completed' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly overNumber: number,
    readonly runsInOver: number,
    readonly wicketsInOver: number,
  ) {}
}

export class InningsCompletedEvent implements IDomainEvent {
  readonly name = 'scoring.innings.completed' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly inningsId: string,
    readonly matchId: string,
    readonly totalRuns: number,
    readonly totalWickets: number,
    readonly reason: 'all_out' | 'overs_complete' | 'declared',
  ) {}
}
