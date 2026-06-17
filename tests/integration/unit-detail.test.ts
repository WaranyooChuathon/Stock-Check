import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { getUnitDetail } from '@/server/units';

const MARK = 'T9DET';
let unitId: string;

beforeAll(async () => {
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });

  // An active checklist item that the verified unit never recorded.
  await prisma.checklistItem.create({ data: { label: `${MARK} Wi-Fi`, order: 99, active: true } });

  // Verified unit, S/N matches box, with NO UnitChecklist rows.
  const unit = await prisma.item.create({
    data: { serialNumber: `${MARK}-1`, boxSerialNumber: `${MARK}-1`, verifyState: 'verified' },
  });
  unitId = unit.id;
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { boxSerialNumber: { startsWith: MARK } } });
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('getUnitDetail (integration)', () => {
  it('does not flag a verified unit for an active item it never recorded', async () => {
    const detail = await getUnitDetail(unitId);
    expect(detail).not.toBeNull();
    expect(detail!.reasons).toEqual([]);
  });

  it('still surfaces the active item in the form checklist (present=false)', async () => {
    const detail = await getUnitDetail(unitId);
    const item = detail!.checklist.find((c) => c.label === `${MARK} Wi-Fi`);
    expect(item).toBeDefined();
    expect(item!.present).toBe(false);
  });
});
