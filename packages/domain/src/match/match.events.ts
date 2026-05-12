import type { IDomainEvent } from '../shared/domain-event';

export class MatchStartedEvent implements IDomainEvent {
  readonly name = 'match.started' as const;
  readonly occurredAt = new Date();
  constructor(readonly matchId: string, readonly tournamentId: string) {}
}

export class TossDecidedEvent implements IDomainEvent {
  readonly name = 'match.toss.decided' as const;
  readonly occurredAt = new Date();
  constructor(readonly matchId: string, readonly winnerId: string, readonly decision: 'bat' | 'bowl') {}
}

export class MatchEndedEvent implements IDomainEvent {
  readonly name = 'match.ended' as const;
  readonly occurredAt = new Date();
  constructor(
    readonly matchId: string,
    readonly winnerId: string | null,
    readonly resultSummary: string,
  ) {}
}
