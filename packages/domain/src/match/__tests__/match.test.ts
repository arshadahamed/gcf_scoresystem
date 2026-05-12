import { describe, it, expect } from 'vitest';
import { Match } from '../match.aggregate';

describe('Match', () => {
  it('creates in scheduled status', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    expect(m.status).toBe('scheduled');
  });

  it('records toss decision', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    m.decideToss({ winnerId: 'ta', decision: 'bat' });
    expect(m.tossWinnerId).toBe('ta');
    expect(m.tossDecision).toBe('bat');
  });

  it('start emits MatchStarted event', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    m.decideToss({ winnerId: 'ta', decision: 'bat' });
    m.start();
    expect(m.status).toBe('live');
    const events = m.pullDomainEvents();
    expect(events.some(e => e.name === 'match.started')).toBe(true);
  });

  it('cannot start without toss', () => {
    const m = Match.create({ id: 'm1', tournamentId: 't1', teamAId: 'ta', teamBId: 'tb', oversPerInnings: 20, scheduledAt: new Date() });
    const result = m.start();
    expect(result.isErr()).toBe(true);
  });
});
