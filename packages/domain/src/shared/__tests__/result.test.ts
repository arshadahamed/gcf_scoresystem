import { describe, it, expect } from 'vitest';
import { ok, err, type Result } from '../result';

describe('Result', () => {
  it('ok() isOk is true, isErr is false', () => {
    const r = ok(42);
    expect(r.isOk()).toBe(true);
    expect(r.isErr()).toBe(false);
    expect(r.value).toBe(42);
  });

  it('err() isErr is true, isOk is false', () => {
    const r = err(new Error('oops'));
    expect(r.isErr()).toBe(true);
    expect(r.isOk()).toBe(false);
    expect(r.error.message).toBe('oops');
  });

  it('ok map transforms value', () => {
    const r = ok(2).map((n) => n * 3);
    expect(r.value).toBe(6);
  });

  it('err map is a no-op', () => {
    const r: Result<number, Error> = err(new Error('x'));
    const mapped = r.map((n) => n + 1);
    expect(mapped.isErr()).toBe(true);
  });
});
