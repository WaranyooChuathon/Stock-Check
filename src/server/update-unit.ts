import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { isDemoMode } from '@/lib/demo';
import { mockUpdateUnit } from '@/server/mock/store';

export interface UpdateUnitInput {
  boxSerialNumber: string | null;
  category: string | null;
  model: string | null;
  location: string | null;
  boxLocation: string | null;
}

/**
 * Edit a unit's metadata with optimistic concurrency control.
 *
 * The version check is enforced atomically via `updateMany({ where: { id,
 * version: expectedVersion } })`: if another edit/verify bumped the version
 * first, zero rows match → ConflictError (409), and the transaction rolls back
 * so no partial write or audit row is left behind.
 */
export async function updateUnit(
  unitId: string,
  input: UpdateUnitInput,
  expectedVersion: number,
  actorUserId: string,
): Promise<{ version: number }> {
  if (isDemoMode()) return mockUpdateUnit(unitId, input, expectedVersion, actorUserId);
  const current = await prisma.item.findUnique({
    where: { id: unitId },
    select: {
      boxSerialNumber: true,
      category: true,
      model: true,
      location: true,
      boxLocation: true,
      version: true,
    },
  });
  if (!current) throw new NotFoundError('ไม่พบรายการนี้');

  const diffs: { field: string; oldValue: string | null; newValue: string | null }[] = [];
  if (current.boxSerialNumber !== input.boxSerialNumber)
    diffs.push({
      field: 'boxSerialNumber',
      oldValue: current.boxSerialNumber,
      newValue: input.boxSerialNumber,
    });
  if (current.category !== input.category)
    diffs.push({ field: 'category', oldValue: current.category, newValue: input.category });
  if (current.model !== input.model)
    diffs.push({ field: 'model', oldValue: current.model, newValue: input.model });
  if (current.location !== input.location)
    diffs.push({ field: 'location', oldValue: current.location, newValue: input.location });
  if (current.boxLocation !== input.boxLocation)
    diffs.push({
      field: 'boxLocation',
      oldValue: current.boxLocation,
      newValue: input.boxLocation,
    });

  await prisma.$transaction(async (tx) => {
    const res = await tx.item.updateMany({
      where: { id: unitId, version: expectedVersion },
      data: {
        boxSerialNumber: input.boxSerialNumber,
        category: input.category,
        model: input.model,
        location: input.location,
        boxLocation: input.boxLocation,
        version: { increment: 1 },
      },
    });
    if (res.count === 0) {
      throw new ConflictError('ข้อมูลถูกแก้ไขโดยผู้อื่นไปแล้ว กรุณาโหลดใหม่');
    }
    for (const diff of diffs) {
      await tx.changeLog.create({
        data: { unitId, userId: actorUserId, action: 'edit', ...diff },
      });
    }
  });

  return { version: expectedVersion + 1 };
}
