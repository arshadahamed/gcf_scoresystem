import type { IDomainEvent } from './domain-event';
import { Entity } from './entity';

export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _events: IDomainEvent[] = [];

  protected addEvent(event: IDomainEvent): void {
    this._events.push(event);
  }

  pullDomainEvents(): IDomainEvent[] {
    const events = [...this._events];
    this._events = [];
    return events;
  }

  get domainEventCount(): number {
    return this._events.length;
  }
}
