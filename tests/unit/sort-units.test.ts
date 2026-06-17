import { describe, it, expect } from 'vitest';
import { sortUnits } from '@/lib/sort-units';

const u = (serialNumber: string | null, category: string | null = null) => ({
  serialNumber,
  category,
});

describe('sortUnits', () => {
  it('sorts by serialNumber ascending and descending', () => {
    const rows = [u('SN-3'), u('SN-1'), u('SN-2')];
    expect(sortUnits(rows, 'serialNumber', 'asc').map((r) => r.serialNumber)).toEqual([
      'SN-1',
      'SN-2',
      'SN-3',
    ]);
    expect(sortUnits(rows, 'serialNumber', 'desc').map((r) => r.serialNumber)).toEqual([
      'SN-3',
      'SN-2',
      'SN-1',
    ]);
  });

  it('sorts by category using Thai locale, empty last', () => {
    const rows = [u('a', 'tool'), u('b', 'furniture'), u('c', null), u('d', 'laptop')];
    expect(sortUnits(rows, 'category', 'asc').map((r) => r.category)).toEqual([
      'furniture',
      'laptop',
      'tool',
      null,
    ]);
  });

  it('puts null/empty values last regardless of direction', () => {
    const rows = [u('SN-2'), u(null), u('SN-1')];
    expect(sortUnits(rows, 'serialNumber', 'asc').map((r) => r.serialNumber)).toEqual([
      'SN-1',
      'SN-2',
      null,
    ]);
    expect(sortUnits(rows, 'serialNumber', 'desc').map((r) => r.serialNumber)).toEqual([
      'SN-2',
      'SN-1',
      null,
    ]);
  });

  it('sorts by note using Thai locale, empty notes last', () => {
    const rows = [
      { serialNumber: 'a', note: 'รอซ่อม' },
      { serialNumber: 'b', note: null },
      { serialNumber: 'c', note: 'กล่องชำรุด' },
    ];
    expect(sortUnits(rows, 'note', 'asc').map((r) => r.note)).toEqual([
      'กล่องชำรุด',
      'รอซ่อม',
      null,
    ]);
    expect(sortUnits(rows, 'note', 'desc').map((r) => r.note)).toEqual([
      'รอซ่อม',
      'กล่องชำรุด',
      null,
    ]);
  });

  it('does not mutate the input array', () => {
    const rows = [u('SN-2'), u('SN-1')];
    const copy = [...rows];
    sortUnits(rows, 'serialNumber', 'asc');
    expect(rows).toEqual(copy);
  });
});
