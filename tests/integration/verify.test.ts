import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { verifyUnit } from '@/server/verify';
import { ConflictError } from '@/lib/errors';

const MARK = 'T5TEST';
let actorId: string;
let itemAcId: string;
let itemWifiId: string;

async function makeUnit(serial: string, box: string) {
  return prisma.item.create({
    data: {
      serialNumber: serial,
      boxSerialNumber: box,
      status: 'in_stock',
      verifyState: 'unverified',
    },
  });
}

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { username: `${MARK}_actor`, passwordHash: 'x', role: 'admin' },
  });
  actorId = user.id;
  const ac = await prisma.checklistItem.create({ data: { label: `${MARK} AC`, order: 1 } });
  const wifi = await prisma.checklistItem.create({ data: { label: `${MARK} Wi-Fi`, order: 2 } });
  itemAcId = ac.id;
  itemWifiId = wifi.id;
});

beforeEach(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('verifyUnit (integration)', () => {
  it('marks verified when S/N matches box and all active accessories present', async () => {
    const unit = await makeUnit(`${MARK}-1`, `${MARK}-1`);
    const result = await verifyUnit(
      unit.id,
      {
        serialNumber: `${MARK}-1`,
        category: 'signage',
        status: 'in_stock',
        checklist: [
          { checklistItemId: itemAcId, present: true },
          { checklistItemId: itemWifiId, present: true },
        ],
      },
      actorId,
    );

    expect(result.verifyState).toBe('verified');

    const saved = await prisma.item.findUnique({ where: { id: unit.id } });
    expect(saved?.verifyState).toBe('verified');
    expect(saved?.verifiedById).toBe(actorId);
    expect(saved?.verifiedAt).not.toBeNull();
    expect(saved?.version).toBe(unit.version + 1);

    const checks = await prisma.unitChecklist.findMany({ where: { unitId: unit.id } });
    expect(checks.length).toBe(2);

    const log = await prisma.changeLog.findFirst({
      where: { unitId: unit.id, action: 'verify' },
    });
    expect(log).not.toBeNull();
  });

  it('does NOT flag discrepancy when device S/N differs from the software S/N', async () => {
    const unit = await makeUnit(`${MARK}-2`, `${MARK}-SOFTWARE-2`);
    const result = await verifyUnit(
      unit.id,
      {
        serialNumber: `${MARK}-DIFFERENT`,
        category: 'signage',
        status: 'in_stock',
        checklist: [
          { checklistItemId: itemAcId, present: true },
          { checklistItemId: itemWifiId, present: true },
        ],
      },
      actorId,
    );
    expect(result.verifyState).toBe('verified');
    expect(result.reasons).toEqual([]);
  });

  it('flags discrepancy when an active accessory is missing', async () => {
    const unit = await makeUnit(`${MARK}-3`, `${MARK}-3`);
    const result = await verifyUnit(
      unit.id,
      {
        serialNumber: `${MARK}-3`,
        category: 'signage',
        status: 'in_stock',
        checklist: [
          { checklistItemId: itemAcId, present: true },
          { checklistItemId: itemWifiId, present: false },
        ],
      },
      actorId,
    );
    expect(result.verifyState).toBe('discrepancy');
    expect(result.reasons.some((r) => r.includes('อุปกรณ์'))).toBe(true);
  });

  it('rejects verifying a duplicate S/N that is already verified (ConflictError)', async () => {
    // First unit gets verified with serial SHARED (box matches so it verifies).
    const first = await makeUnit(`${MARK}-X1`, `${MARK}-SHARED`);
    await verifyUnit(
      first.id,
      {
        serialNumber: `${MARK}-SHARED`,
        category: 'signage',
        status: 'in_stock',
        checklist: [],
      },
      actorId,
    );

    // Second unit tries to verify with the same serial → conflict.
    const second = await makeUnit(`${MARK}-X2`, `${MARK}-SHARED`);
    await expect(
      verifyUnit(
        second.id,
        {
          serialNumber: `${MARK}-SHARED`,
          category: 'signage',
          status: 'in_stock',
          checklist: [],
        },
        actorId,
      ),
    ).rejects.toBeInstanceOf(ConflictError);
  });
});
