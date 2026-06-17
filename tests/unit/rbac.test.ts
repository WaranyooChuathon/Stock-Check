import { describe, it, expect } from 'vitest';
import { hasRole } from '@/lib/rbac';

describe('hasRole', () => {
  it('grants when role is in the allowed list', () => {
    expect(hasRole('admin', ['admin'])).toBe(true);
    expect(hasRole('staff', ['admin', 'staff'])).toBe(true);
  });

  it('denies when role is not allowed', () => {
    expect(hasRole('staff', ['admin'])).toBe(false);
  });

  it('denies when role is undefined (no session)', () => {
    expect(hasRole(undefined, ['admin', 'staff'])).toBe(false);
  });
});
