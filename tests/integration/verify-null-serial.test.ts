import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { verifyUnit } from '@/server/verify';

const MARK = 'NULLSN';
let actorId: string;
let acId: string;

beforeAll(async () => {
  const u = await prisma.user.create({
    data: { username: `${MARK}_actor`, passwordHash: 'x', role: 'admin' },
  });
  actorId = u.id;
  const ac = await prisma.checklistItem.create({ data: { label: `${MARK} AC`, order: 1 } });
  acId = ac.id;
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('verifyUnit with empty/null serialNumber', () => {
  it('verifies a blank-serial item without throwing (discrepancy path)', async () => {
    const item = await prisma.item.create({
      data: { serialNumber: null, boxSerialNumber: `${MARK}-1`, status: 'in_stock', verifyState: 'unverified' },
    });
    const res = await verifyUnit(
      item.id,
      { serialNumber: null, category: 'laptop', status: 'in_stock', checklist: [{ checklistItemId: acId, present: false }] },
      actorId,
    );
    expect(res.verifyState).toBe('discrepancy');
  });

  it('verifies a blank-serial item to verified without throwing', async () => {
    const item = await prisma.item.create({
      data: { serialNumber: null, boxSerialNumber: `${MARK}-2`, status: 'in_stock', verifyState: 'unverified' },
    });
    const res = await verifyUnit(
      item.id,
      { serialNumber: null, category: 'laptop', status: 'in_stock', checklist: [{ checklistItemId: acId, present: true }] },
      actorId,
    );
    expect(res.verifyState).toBe('verified');
  });
});
