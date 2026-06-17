import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listProblemUnits } from '@/server/problems';

const MARK = 'T7TEST';

beforeAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });

  const wifi = await prisma.checklistItem.create({ data: { label: `${MARK} Wi-Fi`, order: 1 } });

  // u1: Wi-Fi accessory missing → discrepancy (with a reason)
  await prisma.item.create({
    data: {
      serialNumber: `${MARK}-A`,
      boxSerialNumber: `${MARK}-A-SOFTWARE`,
      verifyState: 'discrepancy',
      checklist: { create: [{ checklistItemId: wifi.id, present: false }] },
    },
  });
  // u2: Wi-Fi accessory missing → discrepancy
  await prisma.item.create({
    data: {
      serialNumber: `${MARK}-B`,
      boxSerialNumber: `${MARK}-B`,
      verifyState: 'discrepancy',
      checklist: { create: [{ checklistItemId: wifi.id, present: false }] },
    },
  });
  // u3: verified → must NOT appear
  await prisma.item.create({
    data: { serialNumber: `${MARK}-C`, boxSerialNumber: `${MARK}-C`, verifyState: 'verified' },
  });
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('listProblemUnits (integration)', () => {
  it('returns only discrepancy units, with reasons', async () => {
    const all = await listProblemUnits();
    const mine = all.filter((u) => u.boxSerialNumber?.startsWith(MARK));

    expect(mine.length).toBe(2);

    const a = mine.find((u) => u.serialNumber === `${MARK}-A`);
    expect(a?.reasons.some((r) => r.includes('อุปกรณ์'))).toBe(true);

    const b = mine.find((u) => u.serialNumber === `${MARK}-B`);
    expect(b?.reasons.some((r) => r.includes('อุปกรณ์'))).toBe(true);

    expect(mine.some((u) => u.serialNumber === `${MARK}-C`)).toBe(false);
  });
});
