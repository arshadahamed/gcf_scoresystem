import { describe, it, expect } from 'vitest';
import { Over } from '../over.value-object';

describe('Over', () => {
  it('starts at over 1, ball 0', () => {
    const o = Over.first();
    expect(o.number).toBe(1);
    expect(o.legalBallsBowled).toBe(0);
    expect(o.isComplete).toBe(false);
  });

  it('advance 6 legal balls = complete', () => {
    let o = Over.first();
    for (let i = 0; i < 6; i++) o = o.recordLegalBall();
    expect(o.isComplete).toBe(true);
    expect(o.legalBallsBowled).toBe(6);
  });

  it('wide does not advance legal ball count', () => {
    const o = Over.first().recordIllegalBall();
    expect(o.legalBallsBowled).toBe(0);
    expect(o.isComplete).toBe(false);
  });

  it('display format "x.y"', () => {
    const o = Over.first().recordLegalBall().recordLegalBall();
    expect(o.display).toBe('0.2');
  });
});
