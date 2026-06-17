import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import { isDemoMode } from '@/lib/demo';
import {
  mockSoftDeleteUnit,
  mockSoftDeleteUnits,
  mockRestoreUnit,
  mockPurgeUnit,
  mockPurgeExpired,
  mockListDeletionArchive,
} from '@/server/mock/store';
import type { Prisma } from '@/generated/prisma/client';

/** Default retention window (days) before a soft-deleted unit may be purged. */
export const RETENTION_DAYS = 30;

/**
 * Soft-delete a unit: flag `deletedAt`/`deletedById` and bump the optimistic-lock
 * version, all in one transaction with a ChangeLog audit row. The unit stays in
 * the DB (recoverable from /trash) but is hidden from every normal read.
 * Throws NotFoundError if the unit doesn't exist or is already deleted.
 */
export async function softDeleteUnit(unitId: string, actorUserId: string): Promise<void> {
  if (isDemoMode()) return mockSoftDeleteUnit(unitId, actorUserId);
  await prisma.$transaction(async (tx) => {
    const deletedAt = new Date();
    const res = await tx.item.updateMany({
      where: { id: unitId, deletedAt: null },
      data: { deletedAt, deletedById: actorUserId, version: { increment: 1 } },
    });
    if (res.count === 0) throw new NotFoundError('ไม่พบรายการ หรือถูกลบไปแล้ว');

    await tx.changeLog.create({
      data: {
        unitId,
        userId: actorUserId,
        action: 'delete',
        field: 'deletedAt',
        oldValue: null,
        newValue: deletedAt.toISOString(),
      },
    });
  });
}

/**
 * Bulk soft-delete. Skips units that are missing/already-deleted; returns the
 * number actually deleted. Runs in a single transaction.
 */
export async function softDeleteUnits(unitIds: string[], actorUserId: string): Promise<number> {
  if (unitIds.length === 0) return 0;
  if (isDemoMode()) return mockSoftDeleteUnits(unitIds, actorUserId);
  return prisma.$transaction(async (tx) => {
    const deletedAt = new Date();
    const targets = await tx.item.findMany({
      where: { id: { in: unitIds }, deletedAt: null },
      select: { id: true },
    });
    if (targets.length === 0) return 0;

    await tx.item.updateMany({
      where: { id: { in: targets.map((t) => t.id) } },
      data: { deletedAt, deletedById: actorUserId, version: { increment: 1 } },
    });
    await tx.changeLog.createMany({
      data: targets.map((t) => ({
        unitId: t.id,
        userId: actorUserId,
        action: 'delete' as const,
        field: 'deletedAt',
        newValue: deletedAt.toISOString(),
      })),
    });
    return targets.length;
  });
}

/**
 * Restore a soft-deleted unit back to active. Clears `deletedAt`/`deletedById`,
 * bumps version, logs a `restore` action. Throws NotFoundError if it isn't in trash.
 */
export async function restoreUnit(unitId: string, actorUserId: string): Promise<void> {
  if (isDemoMode()) return mockRestoreUnit(unitId, actorUserId);
  await prisma.$transaction(async (tx) => {
    const res = await tx.item.updateMany({
      where: { id: unitId, deletedAt: { not: null } },
      data: { deletedAt: null, deletedById: null, version: { increment: 1 } },
    });
    if (res.count === 0) throw new NotFoundError('ไม่พบรายการในถังขยะ');

    await tx.changeLog.create({
      data: { unitId, userId: actorUserId, action: 'restore', field: 'deletedAt', newValue: null },
    });
  });
}

/**
 * Permanently delete a unit. Snapshots the full row into DeletionArchive first
 * (the unit's ChangeLog/UnitChecklist are cascade-deleted with it), so a paper
 * trail survives the hard delete. Throws NotFoundError if it doesn't exist.
 */
export async function purgeUnit(unitId: string, actorUserId: string): Promise<void> {
  if (isDemoMode()) return mockPurgeUnit(unitId, actorUserId);
  await prisma.$transaction(async (tx) => {
    const unit = await tx.item.findUnique({ where: { id: unitId } });
    if (!unit) throw new NotFoundError('ไม่พบรายการนี้');

    await tx.deletionArchive.create({
      data: {
        originalId: unit.id,
        serialNumber: unit.serialNumber,
        snapshot: unit as unknown as Prisma.InputJsonValue,
        deletedAt: unit.deletedAt,
        purgedById: actorUserId,
      },
    });
    await tx.item.delete({ where: { id: unitId } });
  });
}

/**
 * Purge every soft-deleted unit whose retention window has elapsed.
 * Returns the number purged.
 */
export async function purgeExpired(
  actorUserId: string,
  days: number = RETENTION_DAYS,
): Promise<number> {
  if (isDemoMode()) return mockPurgeExpired(actorUserId, days);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const expired = await prisma.item.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    select: { id: true },
  });
  for (const u of expired) {
    await purgeUnit(u.id, actorUserId);
  }
  return expired.length;
}

/** Recent permanent-deletion records (the "ลบถาวรแล้ว" log on /trash). */
export async function listDeletionArchive(take = 50) {
  if (isDemoMode()) return mockListDeletionArchive(take) as Awaited<ReturnType<typeof dbListDeletionArchive>>;
  return dbListDeletionArchive(take);
}

function dbListDeletionArchive(take = 50) {
  return prisma.deletionArchive.findMany({
    orderBy: { purgedAt: 'desc' },
    take,
    include: { purgedBy: { select: { username: true } } },
  });
}
