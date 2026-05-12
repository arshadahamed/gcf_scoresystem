import { describe, it, expect } from 'vitest';
import { Tournament } from '../tournament.aggregate';

describe('Tournament', () => {
  it('creates in draft status', () => {
    const t = Tournament.create({ id: 't1', name: 'Fiesta 2026', season: '2026', format: 'T20', organizerId: 'u1' });
    expect(t.status).toBe('draft');
    expect(t.name).toBe('Fiesta 2026');
  });

  it('publishes tournament', () => {
    const t = Tournament.create({ id: 't1', name: 'F', season: '2026', format: 'T20', organizerId: 'u1' });
    t.publish();
    expect(t.status).toBe('active');
    const events = t.pullDomainEvents();
    expect(events[0]!.name).toBe('tournament.published');
  });

  it('cannot publish already active tournament', () => {
    const t = Tournament.create({ id: 't1', name: 'F', season: '2026', format: 'T20', organizerId: 'u1' });
    t.publish();
    const result = t.publish();
    expect(result.isErr()).toBe(true);
  });
});
