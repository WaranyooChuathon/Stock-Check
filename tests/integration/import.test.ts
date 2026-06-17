import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { importUnits, type ImportRow } from '@/server/import';

const MARK = 'T8TEST';
let actorId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { username: `${MARK}_actor`, passwordHash: 'x', role: 'admin' },
  });
  actorId = user.id;
});

beforeEach(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.item.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.item.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  await prisma.$disconnect();
});

function row(partial: Partial<ImportRow>): ImportRow {
  return {
    serialNumber: null,
    boxSerialNumber: `${MARK}-BOX`,
    category: null,
    status: 'in_stock',
    attributes: undefined,
    ...partial,
  };
}

describe('importUnits (integration)', () => {
  it('imports clean rows as unverified and logs an import ChangeLog each', async () => {
    const report = await importUnits(
      [
        row({ serialNumber: `${MARK}-1`, boxSerialNumber: `${MARK}-1` }),
        row({ serialNumber: `${MARK}-2`, boxSerialNumber: `${MARK}-2` }),
      ],
      actorId,
    );
    expect(report.total).toBe(2);
    expect(report.imported).toBe(2);
    expect(report.skipped).toBe(0);

    const units = await prisma.item.findMany({
      where: { serialNumber: { startsWith: MARK } },
    });
    expect(units.every((u) => u.verifyState === 'unverified')).toBe(true);

    const logs = await prisma.changeLog.count({
      where: { unitId: { in: units.map((u) => u.id) } },
    });
    expect(logs).toBe(2);
  });

  it('imports blank serial numbers as unverified (not flagged)', async () => {
    const report = await importUnits([row({ serialNumber: null })], actorId);
    expect(report.imported).toBe(1);
    const unit = await prisma.item.findFirst({ where: { boxSerialNumber: `${MARK}-BOX` } });
    expect(unit?.verifyState).toBe('unverified');
  });

  it('imports duplicate serials as unverified (both)', async () => {
    const report = await importUnits(
      [
        row({ serialNumber: `${MARK}-DUP`, boxSerialNumber: `${MARK}-D1` }),
        row({ serialNumber: `${MARK}-DUP`, boxSerialNumber: `${MARK}-D2` }),
      ],
      actorId,
    );
    expect(report.imported).toBe(2);
    const units = await prisma.item.findMany({ where: { serialNumber: `${MARK}-DUP` } });
    expect(units.every((u) => u.verifyState === 'unverified')).toBe(true);
  });

  it('skips completely empty rows', async () => {
    const report = await importUnits(
      [row({ serialNumber: null, boxSerialNumber: null })],
      actorId,
    );
    expect(report.skipped).toBe(1);
    expect(report.imported).toBe(0);
  });

  it('preserves extra columns into attributes', async () => {
    await importUnits(
      [
        row({
          serialNumber: `${MARK}-ATTR`,
          boxSerialNumber: `${MARK}-ATTR`,
          attributes: { po: 'PO-123' },
        }),
      ],
      actorId,
    );
    const unit = await prisma.item.findFirst({ where: { serialNumber: `${MARK}-ATTR` } });
    expect((unit?.attributes as { po?: string } | null)?.po).toBe('PO-123');
  });

  it('coerces invalid status to in_stock', async () => {
    await importUnits(
      [row({ serialNumber: `${MARK}-ST`, boxSerialNumber: `${MARK}-ST`, status: 'weird-value' })],
      actorId,
    );
    const unit = await prisma.item.findFirst({ where: { serialNumber: `${MARK}-ST` } });
    expect(unit?.status).toBe('in_stock');
  });
});
