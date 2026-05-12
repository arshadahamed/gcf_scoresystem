export interface IDomainEvent {
  readonly name: string;
  readonly occurredAt: Date;
}
