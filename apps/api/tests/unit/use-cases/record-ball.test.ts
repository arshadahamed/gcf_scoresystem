import { describe, it, expect, beforeEach } from 'vitest';
import { RecordBallUseCase } from '../../../src/application/use-cases/scoring/record-ball.use-case';
import { InMemoryMatchRepository } from './in-memory-match.repository';
import { Match, Innings } from '@scf/domain';
import type { IEventBus, IUnitOfWork } from '@scf/application';
import type { IDomainEvent } from '@scf/domain';

class InMemoryEventBus implements IEventBus {
  published: IDomainEvent[] = [];
  async publish(e: IDomainEvent) { this.published.push(e); }
  async publishAll(es: IDomainEvent[]) { this.published.push(...es); }
}

class NoopUoW implements IUnitOfWork {
  async run<T>(fn: () => Promise<T>) { return fn(); }
}

function makeLiveMatch() {
  const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
  m.decideToss({ winnerId: 'ta', decision: 'bat' });
  m.start();
  m.pullDomainEvents();
  return m;
}

function makeInnings() {
  return Innings.start({ id: 'inn1', matchId: 'm1', number: 1, battingTeamId: 'ta', bowlingTeamId: 'tb', maxOvers: 20 });
}

describe('RecordBallUseCase', () => {
  let repo: InMemoryMatchRepository;
  let bus: InMemoryEventBus;
  let uow: NoopUoW;
  let useCase: RecordBallUseCase;
  let inningsId: string;

  beforeEach(() => {
    repo = new InMemoryMatchRepository();
    bus = new InMemoryEventBus();
    uow = new NoopUoW();
    useCase = new RecordBallUseCase(repo, bus, uow);
    repo.seedMatch(makeLiveMatch());
    const innings = makeInnings();
    inningsId = innings.id; // 'm1:innings:1'
    repo.seedInnings(innings);
  });

  it('records a valid ball and returns ball DTO', async () => {
    const result = await useCase.execute({
      inningsId, strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1',
      runs: 4, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1',
    });
    expect(result.isOk()).toBe(true);
    expect(result.value?.runsOffBat).toBe(4);
    expect(bus.published).toHaveLength(1);
    expect(bus.published[0]!.name).toBe('scoring.ball.recorded');
  });

  it('returns err when innings not found', async () => {
    const result = await useCase.execute({
      inningsId: 'bad-id', strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1',
      runs: 0, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1',
    });
    expect(result.isErr()).toBe(true);
  });

  it('returns err on concurrency mismatch', async () => {
    // record first ball
    await useCase.execute({ inningsId, strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1', runs: 0, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1' });
    // attempt second with wrong seq
    const result = await useCase.execute({ inningsId, strikerId: 'p1', nonStrikerId: 'p2', bowlerId: 'b1', runs: 1, extras: {}, wicket: null, expectedSeq: 0, actorId: 'scorer1' });
    expect(result.isErr()).toBe(true);
  });
});
