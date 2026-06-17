import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDemoMode } from '@/lib/demo';
import { ConflictError } from '@/lib/errors';
import {
  resetMockStore,
  mockListUnits,
  mockListCategories,
  mockListDeletedUnits,
  mockVerifyCredentials,
  mockUpdateUnit,
  mockVerifyUnit,
  mockSoftDeleteUnit,
} from '@/server/mock/store';

describe('isDemoMode', () => {
  const original = process.env.DATABASE_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
    delete process.env.DEMO_MOCK;
  });

  it('is true when DATABASE_URL is absent', () => {
    delete process.env.DATABASE_URL;
    expect(isDemoMode()).toBe(true);
  });

  it('is false when DATABASE_URL is set (and DEMO_MOCK off)', () => {
    process.env.DATABASE_URL = 'postgresql://x';
    expect(isDemoMode()).toBe(false);
  });

  it('is true when DEMO_MOCK=1 even with a URL', () => {
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.DEMO_MOCK = '1';
    expect(isDemoMode()).toBe(true);
  });
});

describe('mock store (deterministic, no DB)', () => {
  beforeEach(() => resetMockStore());

  it('seeds 14 active items, newest-first', () => {
    const rows = mockListUnits({});
    expect(rows.length).toBe(14);
    expect(rows[0].serialNumber).toBe('SGN-1001');
  });

  it('lists distinct categories sorted', () => {
    expect(mockListCategories()).toEqual(['furniture', 'laptop', 'signage', 'tool']);
  });

  it('filters by category', () => {
    expect(mockListUnits({ category: 'laptop' }).length).toBe(4);
  });

  it('verifies demo credentials with bcrypt', () => {
    expect(mockVerifyCredentials('admin', 'admin123')?.role).toBe('admin');
    expect(mockVerifyCredentials('admin', 'wrong')).toBeNull();
  });

  it('rejects a stale optimistic-lock version with ConflictError', () => {
    const target = mockListUnits({})[0];
    expect(() =>
      mockUpdateUnit(
        target.id,
        { boxSerialNumber: 'x', category: null, model: null, location: null, boxLocation: null },
        999,
        'u-admin',
      ),
    ).toThrow(ConflictError);
  });

  it('flags discrepancy when a checklist item is missing', () => {
    // i-4 = SGN-3001 (signage, unverified). signage checklist: manual/ac/wifi.
    const res = mockVerifyUnit(
      'i-4',
      {
        serialNumber: 'SGN-3001',
        category: 'signage',
        status: 'in_stock',
        checklist: [
          { checklistItemId: 'c-manual', present: true },
          { checklistItemId: 'c-ac', present: true },
          { checklistItemId: 'c-wifi', present: false },
        ],
      },
      'u-admin',
    );
    expect(res.verifyState).toBe('discrepancy');
  });

  it('soft-delete hides from list and shows in trash', () => {
    const target = mockListUnits({})[0];
    mockSoftDeleteUnit(target.id, 'u-admin');
    expect(mockListUnits({}).some((u) => u.id === target.id)).toBe(false);
    expect(mockListDeletedUnits().some((u) => u.id === target.id)).toBe(true);
  });
});
