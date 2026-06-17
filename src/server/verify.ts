import { prisma } from '@/lib/prisma';
import { evaluateDiscrepancy, type ChecklistResult } from '@/server/discrepancy';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { isDemoMode } from '@/lib/demo';
import { mockVerifyUnit } from '@/server/mock/store';
import type { UnitStatus, VerifyState } from '@/types/inventory';

export interface VerifyChecklistInput {
  checklistItemId: string;
  present: boolean;
}

export interface VerifyInput {
  serialNumber: string | null;
  category: string | null;
  status: UnitStatus;
  checklist: VerifyChecklistInput[];
  note?: string | null;
}

export interface VerifyResult {
  verifyState: VerifyState;
  reasons: string[];
}

/**
 * Record a physical verification of a unit.
 *
 * Computes verifyState from the discrepancy rules (device S/N vs box S/N +
 * accessory completeness), then in a single transaction: upserts the checklist
 * results, updates the unit (incrementing the optimistic-lock version), and
 * writes ChangeLog audit rows. Refuses to mark a unit verified if another
 * verified unit already claims the same serial number.
 */
export async function verifyUnit(
  unitId: string,
  input: VerifyInput,
  actorUserId: string,
): Promise<VerifyResult> {
  if (isDemoMode()) return mockVerifyUnit(unitId, input, actorUserId);
  const unit = await prisma.item.findUnique({
    where: { id: unitId },
    select: { id: true, serialNumber: true, boxSerialNumber: true, verifyState: true },
  });
  if (!unit) throw new NotFoundError('ไม่พบเครื่องนี้');

  // Resolve label + active flag for each submitted checklist item.
  const ids = input.checklist.map((c) => c.checklistItemId);
  const items = ids.length
    ? await prisma.checklistItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, label: true, active: true },
      })
    : [];
  const itemMap = new Map(items.map((i) => [i.id, i]));
  const checklistForEval: ChecklistResult[] = input.checklist.map((c) => {
    const meta = itemMap.get(c.checklistItemId);
    return { label: meta?.label ?? '', present: c.present, active: meta?.active ?? false };
  });

  const { hasDiscrepancy, reasons } = evaluateDiscrepancy({ checklist: checklistForEval });
  const verifyState: VerifyState = hasDiscrepancy ? 'discrepancy' : 'verified';

  // App-layer guard: two verified units must not share a serial. The partial
  // unique index is the backstop; this gives a friendly error first.
  if (verifyState === 'verified' && input.serialNumber) {
    const clash = await prisma.item.findFirst({
      where: { serialNumber: input.serialNumber, verifyState: 'verified', id: { not: unitId } },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictError(`S/N ${input.serialNumber} มีเครื่องที่ยืนยันแล้วในระบบ`);
    }
  }

  const serialChanged = unit.serialNumber !== input.serialNumber;

  await prisma.$transaction(async (tx) => {
    for (const c of input.checklist) {
      await tx.unitChecklist.upsert({
        where: { unitId_checklistItemId: { unitId, checklistItemId: c.checklistItemId } },
        create: { unitId, checklistItemId: c.checklistItemId, present: c.present },
        update: { present: c.present },
      });
    }

    await tx.item.update({
      where: { id: unitId },
      data: {
        serialNumber: input.serialNumber,
        category: input.category,
        status: input.status,
        note: input.note ?? undefined,
        verifyState,
        verifiedById: actorUserId,
        verifiedAt: new Date(),
        version: { increment: 1 },
      },
    });

    await tx.changeLog.create({
      data: {
        unitId,
        userId: actorUserId,
        action: 'verify',
        field: 'verifyState',
        oldValue: unit.verifyState,
        newValue: verifyState,
      },
    });

    if (serialChanged) {
      await tx.changeLog.create({
        data: {
          unitId,
          userId: actorUserId,
          action: 'edit',
          field: 'serialNumber',
          oldValue: unit.serialNumber,
          newValue: input.serialNumber,
        },
      });
    }
  });

  return { verifyState, reasons };
}
