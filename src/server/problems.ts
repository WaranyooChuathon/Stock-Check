import { prisma } from '@/lib/prisma';
import { evaluateDiscrepancy } from '@/server/discrepancy';
import { isDemoMode } from '@/lib/demo';
import { mockListProblemUnits } from '@/server/mock/store';
import type { UnitStatus } from '@/types/inventory';

export interface ProblemUnit {
  id: string;
  serialNumber: string | null;
  boxSerialNumber: string | null;
  category: string | null;
  status: UnitStatus;
  location: string | null;
  reasons: string[];
}

/**
 * List units flagged as `discrepancy`, each with the human-readable reasons
 * (recomputed from current data) so the team can chase them down.
 */
export async function listProblemUnits(): Promise<ProblemUnit[]> {
  if (isDemoMode()) return mockListProblemUnits() as ProblemUnit[];
  const units = await prisma.item.findMany({
    where: { verifyState: 'discrepancy', deletedAt: null },
    include: { checklist: { include: { checklistItem: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return units.map((u) => {
    const { reasons } = evaluateDiscrepancy({
      checklist: u.checklist.map((c) => ({
        label: c.checklistItem.label,
        present: c.present,
        active: c.checklistItem.active,
      })),
    });
    return {
      id: u.id,
      serialNumber: u.serialNumber,
      boxSerialNumber: u.boxSerialNumber,
      category: u.category,
      status: u.status as UnitStatus,
      location: u.location,
      reasons,
    };
  });
}
