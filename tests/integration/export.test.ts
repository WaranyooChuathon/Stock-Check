import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getUnitsForExport } from '@/server/export';

const MARK = 'T11TEST';

beforeAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.item.create({
    data: {
      serialNumber: `${MARK}-A`,
      boxSerialNumber: `${MARK}-A`,
      category: 'signage',
      status: 'trial',
      verifyState: 'verified',
      location: 'Z1',
      attributes: { po: 'PO-9', displaySize: '24' },
    },
  });
  await prisma.item.create({
    data: {
      serialNumber: `${MARK}-B`,
      boxSerialNumber: `${MARK}-B`,
      status: 'in_stock',
      verifyState: 'unverified',
    },
  });
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('getUnitsForExport (integration)', () => {
  it('returns flat rows with Thai labels, honoring filters', async () => {
    const rows = await getUnitsForExport({ q: MARK, status: 'trial' });
    expect(rows.length).toBe(1);
    const row = rows[0];
    expect(row['S/N']).toBe(`${MARK}-A`);
    expect(row['รหัสรอง']).toBe(`${MARK}-A`);
    expect(row['หมวด']).toBe('signage');
    expect(row['สถานะ']).toBe('โครงการทดสอบ');
    expect(row['การตรวจ']).toBe('ตรวจแล้ว');
    expect(row['displaySize']).toBe('24');
  });

  it('flattens attributes into extra columns', async () => {
    const rows = await getUnitsForExport({ q: `${MARK}-A` });
    expect(rows[0]['po']).toBe('PO-9');
  });

  it('returns all matching rows when no extra filter', async () => {
    const rows = await getUnitsForExport({ q: MARK });
    expect(rows.length).toBe(2);
  });
});
