import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { updateUnit } from '@/server/update-unit';
import { ConflictError } from '@/lib/errors';

const MARK = 'T6TEST';
let actorId: string;

async function makeUnit() {
  return prisma.item.create({
    data: {
      serialNumber: `${MARK}-${Math.random().toString(36).slice(2, 8)}`,
      boxSerialNumber: 'OLD-BOX',
      model: 'Smart Signage',
      location: 'OLD-LOC',
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
});

beforeEach(async () => {
  await prisma.item.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
});

afterAll(async () => {
  await prisma.item.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('updateUnit (integration)', () => {
  it('updates fields, increments version, and logs each changed field', async () => {
    const unit = await makeUnit();
    const result = await updateUnit(
      unit.id,
      {
        boxSerialNumber: 'NEW-BOX',
        category: 'signage',
        model: 'Smart Signage X',
        location: 'NEW-LOC',
        boxLocation: 'NEW-BOXLOC',
      },
      unit.version,
      actorId,
    );

    expect(result.version).toBe(unit.version + 1);

    const saved = await prisma.item.findUnique({ where: { id: unit.id } });
    expect(saved?.boxSerialNumber).toBe('NEW-BOX');
    expect(saved?.category).toBe('signage');
    expect(saved?.location).toBe('NEW-LOC');
    expect(saved?.boxLocation).toBe('NEW-BOXLOC');
    expect(saved?.version).toBe(unit.version + 1);

    const logs = await prisma.changeLog.findMany({
      where: { unitId: unit.id, action: 'edit' },
    });
    const fields = logs.map((l) => l.field).sort();
    expect(fields).toEqual(['boxLocation', 'boxSerialNumber', 'category', 'location', 'model']);
  });

  it('rejects a stale version with ConflictError and does not write', async () => {
    const unit = await makeUnit();
    // First edit bumps version to 1.
    await updateUnit(
      unit.id,
      { boxSerialNumber: 'V1', category: null, model: 'M', location: 'L1', boxLocation: null },
      unit.version,
      actorId,
    );

    // Second edit using the original (stale) version must conflict.
    await expect(
      updateUnit(
        unit.id,
        { boxSerialNumber: 'V2', category: null, model: 'M', location: 'L2', boxLocation: null },
        unit.version,
        actorId,
      ),
    ).rejects.toBeInstanceOf(ConflictError);

    const saved = await prisma.item.findUnique({ where: { id: unit.id } });
    expect(saved?.boxSerialNumber).toBe('V1'); // stale write rolled back
    expect(saved?.version).toBe(unit.version + 1);
  });

  it('only logs fields that actually changed', async () => {
    const unit = await makeUnit();
    await updateUnit(
      unit.id,
      {
        boxSerialNumber: unit.boxSerialNumber,
        category: unit.category,
        model: unit.model,
        location: 'CHANGED-ONLY',
        boxLocation: unit.boxLocation,
      },
      unit.version,
      actorId,
    );
    const logs = await prisma.changeLog.findMany({ where: { unitId: unit.id, action: 'edit' } });
    expect(logs.map((l) => l.field)).toEqual(['location']);
  });
});
