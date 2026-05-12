import type { SupabaseClient } from '@supabase/supabase-js';
import type { IEventBus } from '@scf/application';
import type { IDomainEvent } from '@scf/domain';
import { Channels } from '@scf/contracts';
import pino from 'pino';

const logger = pino({ name: 'EventBus' });

export class SupabaseEventBus implements IEventBus {
  constructor(private readonly client: SupabaseClient) {}

  async publish(event: IDomainEvent): Promise<void> {
    await this.publishAll([event]);
  }

  async publishAll(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      const channel = this.resolveChannel(event);
      if (!channel) { logger.warn({ event: event.name }, 'No channel for event'); continue; }
      const ch = this.client.channel(channel);
      const { error } = await ch.send({
        type: 'broadcast',
        event: event.name,
        payload: this.serialize(event),
      });
      if (error) logger.error({ error, event: event.name }, 'Failed to broadcast event');
    }
  }

  private resolveChannel(event: IDomainEvent): string | null {
    const e = event as any;
    if (e.matchId) return Channels.match(e.matchId);
    if (e.inningsId && e.matchId) return Channels.match(e.matchId);
    return null;
  }

  private serialize(event: IDomainEvent): Record<string, unknown> {
    const e = event as any;
    return {
      type:         event.name,
      v:            1,
      occurredAt:   event.occurredAt.toISOString(),
      matchId:      e.matchId,
      inningsId:    e.inningsId,
      ball:         e.ball ? {
        id:         e.ball.id,
        seq:        e.ball.seq,
        overNumber: e.ball.overNumber,
        ballInOver: e.ball.ballInOver,
        runsOffBat: e.ball.runsOffBat,
        extras:     e.ball.extras,
        wicket:     e.ball.wicket ? { kind: e.ball.wicket.kind } : null,
      } : undefined,
      totalRuns:    e.totalRuns,
      totalWickets: e.totalWickets,
      overDisplay:  e.overDisplay,
      overNumber:   e.overNumber,
      reason:       e.reason,
    };
  }
}
