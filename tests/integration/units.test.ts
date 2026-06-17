import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listUnits } from '@/server/units';

// Isolated fixtures (marker prefix) so we don't depend on / collide with seed data.
const MARK = 'T4TEST';

beforeAll(async () => {
  await prisma.item.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
  await prisma.item.createMany({
    data: [
      {
        serialNumber: `${MARK}-A`,
        boxSerialNumber: `${MARK}-A`,
        status: 'trial',
        verifyState: 'unverified',
        category: 'signage',
        location: `${MARK}-WH-A`,
        boxLocation: `${MARK}-BOX-A`,
      },
      {
        serialNumber: `${MARK}-B`,
        boxSerialNumber: `${MARK}-B`,
        status: 'in_stock',
        verifyState: 'discrepancy',
        category: 'laptop',
        location: `${MARK}-WH-B`,
      },
      {
        serialNumber: `${MARK}-C`,
        boxSerialNumber: `${MARK}-CBOX`,
        status: 'in_stock',
        verifyState: 'unverified',
        category: 'signage',
      },
    ],
  });
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('listUnits (integration)', () => {
  it('searches across serialNumber (q)', async () => {
    const rows = await listUnits({ q: MARK });
    expect(rows.length).toBe(3);
  });

  it('searches across boxSerialNumber too', async () => {
    const rows = await listUnits({ q: `${MARK}-CBOX` });
    expect(rows.map((r) => r.serialNumber)).toContain(`${MARK}-C`);
  });

  it('combines q with status filter (AND)', async () => {
    const rows = await listUnits({ q: MARK, status: 'trial' });
    expect(rows.length).toBe(1);
    expect(rows[0].serialNumber).toBe(`${MARK}-A`);
  });

  it('combines q with verifyState filter', async () => {
    const rows = await listUnits({ q: MARK, verifyState: 'discrepancy' });
    expect(rows.length).toBe(1);
    expect(rows[0].serialNumber).toBe(`${MARK}-B`);
  });

  it('filters by category', async () => {
    const rows = await listUnits({ q: MARK, category: 'signage' });
    expect(rows.length).toBe(2);
  });

  it('is case-insensitive on search', async () => {
    const rows = await listUnits({ q: MARK.toLowerCase() });
    expect(rows.length).toBe(3);
  });

  it('filters by location (contains)', async () => {
    const rows = await listUnits({ q: MARK, location: 'WH-A' });
    expect(rows.length).toBe(1);
    expect(rows[0].serialNumber).toBe(`${MARK}-A`);
  });

  it('filters by hasBox = yes (boxLocation recorded)', async () => {
    const rows = await listUnits({ q: MARK, hasBox: 'yes' });
    expect(rows.map((r) => r.serialNumber)).toEqual([`${MARK}-A`]);
  });

  it('filters by hasBox = no (no boxLocation)', async () => {
    const rows = await listUnits({ q: MARK, hasBox: 'no' });
    const serials = rows.map((r) => r.serialNumber).sort();
    expect(serials).toEqual([`${MARK}-B`, `${MARK}-C`]);
  });
});
