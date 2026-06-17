import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  softDeleteUnit,
  softDeleteUnits,
  restoreUnit,
  purgeUnit,
  purgeExpired,
} from '@/server/delete-unit';
import { listUnits, getUnitDetail, listDeletedUnits } from '@/server/units';
import { listProblemUnits } from '@/server/problems';
import { NotFoundError } from '@/lib/errors';

const MARK = 'T16TEST';
let actorId: string;

async function makeUnit(extra: { verifyState?: 'unverified' | 'verified' | 'discrepancy' } = {}) {
  return prisma.item.create({
    data: {
      serialNumber: `${MARK}-${Math.random().toString(36).slice(2, 8)}`,
      model: 'Smart Signage',
      status: 'in_stock',
      verifyState: extra.verifyState ?? 'unverified',
    },
  });
}

async function cleanup() {
  const units = await prisma.item.findMany({
    where: { serialNumber: { startsWith: MARK } },
    select: { id: true },
  });
  const ids = units.map((u) => u.id);
  if (ids.length) {
    await prisma.changeLog.deleteMany({ where: { unitId: { in: ids } } });
    await prisma.item.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.deletionArchive.deleteMany({ where: { serialNumber: { startsWith: MARK } } });
}

beforeAll(async () => {
  // self-heal any leftovers from a previously aborted run
  await cleanup();
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  const user = await prisma.user.create({
    data: { username: `${MARK}_actor`, passwordHash: 'x', role: 'admin' },
  });
  actorId = user.id;
});

beforeEach(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('softDeleteUnit', () => {
  it('hides the unit from all normal reads but keeps it in trash, logs delete, bumps version', async () => {
    const unit = await makeUnit();

    await softDeleteUnit(unit.id, actorId);

    // gone from list + detail
    const listed = await listUnits({});
    expect(listed.find((u) => u.id === unit.id)).toBeUndefined();
    expect(await getUnitDetail(unit.id)).toBeNull();

    // still recoverable from trash
    const trash = await listDeletedUnits();
    const found = trash.find((u) => u.id === unit.id);
    expect(found).toBeDefined();
    expect(found?.deletedById).toBe(actorId);

    // audit + version
    const saved = await prisma.item.findUnique({ where: { id: unit.id } });
    expect(saved?.deletedAt).not.toBeNull();
    expect(saved?.version).toBe(unit.version + 1);
    const log = await prisma.changeLog.findFirst({
      where: { unitId: unit.id, action: 'delete' },
    });
    expect(log).toBeTruthy();
  });

  it('hides a discrepancy unit from the problems list', async () => {
    const unit = await makeUnit({ verifyState: 'discrepancy' });
    expect((await listProblemUnits()).find((u) => u.id === unit.id)).toBeDefined();

    await softDeleteUnit(unit.id, actorId);
    expect((await listProblemUnits()).find((u) => u.id === unit.id)).toBeUndefined();
  });

  it('throws NotFoundError when the unit is already deleted', async () => {
    const unit = await makeUnit();
    await softDeleteUnit(unit.id, actorId);
    await expect(softDeleteUnit(unit.id, actorId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('softDeleteUnits (bulk)', () => {
  it('soft-deletes many units and returns the count actually deleted', async () => {
    const a = await makeUnit();
    const b = await makeUnit();
    const count = await softDeleteUnits([a.id, b.id], actorId);
    expect(count).toBe(2);
    const listed = await listUnits({});
    expect(listed.find((u) => u.id === a.id || u.id === b.id)).toBeUndefined();
  });
});

describe('restoreUnit', () => {
  it('brings a deleted unit back to normal lists, logs restore, bumps version', async () => {
    const unit = await makeUnit();
    await softDeleteUnit(unit.id, actorId);

    await restoreUnit(unit.id, actorId);

    expect((await listUnits({})).find((u) => u.id === unit.id)).toBeDefined();
    expect((await listDeletedUnits()).find((u) => u.id === unit.id)).toBeUndefined();
    const saved = await prisma.item.findUnique({ where: { id: unit.id } });
    expect(saved?.deletedAt).toBeNull();
    expect(saved?.deletedById).toBeNull();
    expect(saved?.version).toBe(unit.version + 2); // delete + restore
    const log = await prisma.changeLog.findFirst({
      where: { unitId: unit.id, action: 'restore' },
    });
    expect(log).toBeTruthy();
  });

  it('throws NotFoundError when the unit is not in trash', async () => {
    const unit = await makeUnit();
    await expect(restoreUnit(unit.id, actorId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('purgeUnit', () => {
  it('hard-deletes the row but writes a DeletionArchive snapshot', async () => {
    const unit = await makeUnit();
    await softDeleteUnit(unit.id, actorId);

    await purgeUnit(unit.id, actorId);

    expect(await prisma.item.findUnique({ where: { id: unit.id } })).toBeNull();
    const archive = await prisma.deletionArchive.findFirst({ where: { originalId: unit.id } });
    expect(archive).toBeTruthy();
    expect(archive?.serialNumber).toBe(unit.serialNumber);
    expect(archive?.purgedById).toBe(actorId);
  });
});

describe('purgeExpired', () => {
  it('purges only units whose deletedAt is older than the retention window', async () => {
    const old = await makeUnit();
    const recent = await makeUnit();
    await softDeleteUnit(old.id, actorId);
    await softDeleteUnit(recent.id, actorId);

    // backdate `old` past the 30-day window
    await prisma.item.update({
      where: { id: old.id },
      data: { deletedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    });

    const count = await purgeExpired(actorId, 30);
    expect(count).toBe(1);
    expect(await prisma.item.findUnique({ where: { id: old.id } })).toBeNull();
    expect(await prisma.item.findUnique({ where: { id: recent.id } })).not.toBeNull();
  });
});
