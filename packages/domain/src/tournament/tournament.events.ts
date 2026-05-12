import type { IDomainEvent } from '../shared/domain-event';

export class TournamentPublishedEvent implements IDomainEvent {
  readonly name = 'tournament.published' as const;
  readonly occurredAt = new Date();
  constructor(readonly tournamentId: string) {}
}
