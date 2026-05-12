import { describe, it, expect } from 'vitest';
import { Score } from '../score.value-object';

describe('Score', () => {
  it('starts at zero', () => {
    const s = Score.zero();
    expect(s.runs).toBe(0);
    expect(s.extras).toBe(0);
    expect(s.total).toBe(0);
  });

  it('add runs', () => {
    const s = Score.zero().addRuns(4);
    expect(s.runs).toBe(4);
    expect(s.total).toBe(4);
  });

  it('add extras (wide)', () => {
    const s = Score.zero().addExtras({ wide: 1 });
    expect(s.runs).toBe(0);
    expect(s.extras).toBe(1);
    expect(s.total).toBe(1);
  });

  it('add runs + extras (no-ball + 4)', () => {
    const s = Score.zero().addRuns(4).addExtras({ noBall: 1 });
    expect(s.total).toBe(5);
  });
});
