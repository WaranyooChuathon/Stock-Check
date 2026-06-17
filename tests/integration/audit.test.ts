import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import { listAuditLog } from '@/server/audit';

const MARK = 'T20TEST';
let actorId: string;
let unitId: string;

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
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
}

beforeAll(async () => {
  await cleanup();
  const user = await prisma.user.create({
    data: { username: `${MARK}_actor`, passwordHash: 'x', role: 'admin' },
  });
  actorId = user.id;
  const unit = await prisma.item.create({
    data: { serialNumber: `${MARK}-A`, model: 'Smart Signage', status: 'in_stock' },
  });
  unitId = unit.id;
});

beforeEach(async () => {
  await prisma.changeLog.deleteMany({ where: { unitId } });
});

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

async function log(action: 'edit' | 'delete' | 'restore') {
  await prisma.changeLog.create({ data: { unitId, userId: actorId, action } });
}

describe('listAuditLog', () => {
  it('filters by action', async () => {
    await log('edit');
    await log('delete');
    await log('delete');

    const onlyDeletes = await listAuditLog({ action: 'delete', userId: actorId });
    expect(onlyDeletes.rows.every((r) => r.action === 'delete')).toBe(true);
    expect(onlyDeletes.rows.length).toBe(2);
  });

  it('filters by user and paginates newest-first', async () => {
    for (let i = 0; i < 3; i++) await log('edit');

    const p1 = await listAuditLog({ userId: actorId, page: 1, perPage: 2 });
    expect(p1.rows.length).toBe(2);
    expect(p1.total).toBe(3);
    expect(p1.pageCount).toBe(2);

    const p2 = await listAuditLog({ userId: actorId, page: 2, perPage: 2 });
    expect(p2.rows.length).toBe(1);

    // newest first: created order is sequential, so first row's createdAt >= last
    const times = p1.rows.map((r) => r.createdAt.getTime());
    expect(times[0]).toBeGreaterThanOrEqual(times[1]);
  });
});
