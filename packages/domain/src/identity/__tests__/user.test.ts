import { describe, it, expect } from 'vitest';
import { User } from '../user.entity';
import { Role } from '../role.value-object';

describe('User', () => {
  it('creates a user with role', () => {
    const user = User.create({ id: 'u1', email: 'a@b.com', role: Role.Scorer });
    expect(user.id).toBe('u1');
    expect(user.email).toBe('a@b.com');
    expect(user.isScorer()).toBe(true);
    expect(user.isAdmin()).toBe(false);
  });

  it('admin has all permissions', () => {
    const user = User.create({ id: 'u2', email: 'admin@b.com', role: Role.Admin });
    expect(user.isAdmin()).toBe(true);
    expect(user.isScorer()).toBe(false);
  });
});
