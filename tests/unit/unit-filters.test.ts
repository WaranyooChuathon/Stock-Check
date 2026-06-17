import { describe, it, expect } from 'vitest';
import { parseUnitFilters } from '@/lib/unit-filters';

describe('parseUnitFilters', () => {
  it('keeps valid search + filters', () => {
    expect(
      parseUnitFilters({
        q: 'SN-1001',
        status: 'in_stock',
        verifyState: 'verified',
        category: 'signage',
      }),
    ).toEqual({ q: 'SN-1001', status: 'in_stock', verifyState: 'verified', category: 'signage' });
  });

  it('drops invalid enum values', () => {
    expect(parseUnitFilters({ status: 'bogus', verifyState: 'nope' })).toEqual({});
  });

  it('treats empty/whitespace query as absent and trims', () => {
    expect(parseUnitFilters({ q: '   ' })).toEqual({});
    expect(parseUnitFilters({ q: '  SN-9  ' })).toEqual({ q: 'SN-9' });
  });

  it('takes the first value when given arrays', () => {
    expect(parseUnitFilters({ status: ['trial', 'in_stock'] })).toEqual({ status: 'trial' });
  });

  it('returns empty object for no params', () => {
    expect(parseUnitFilters({})).toEqual({});
  });

  it('keeps a trimmed location and a valid hasBox value', () => {
    expect(parseUnitFilters({ location: '  A1  ', hasBox: 'yes' })).toEqual({
      location: 'A1',
      hasBox: 'yes',
    });
    expect(parseUnitFilters({ hasBox: 'no' })).toEqual({ hasBox: 'no' });
  });

  it('drops an invalid hasBox value and blank location', () => {
    expect(parseUnitFilters({ hasBox: 'maybe', location: '   ' })).toEqual({});
  });
});
