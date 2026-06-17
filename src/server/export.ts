import { prisma } from '@/lib/prisma';
import { buildUnitWhere } from '@/server/units';
import { isDemoMode } from '@/lib/demo';
import { mockGetUnitsForExport } from '@/server/mock/store';
import type { UnitFilters } from '@/lib/unit-filters';
import {
  UNIT_STATUS_LABELS,
  VERIFY_STATE_LABELS,
  type UnitStatus,
  type VerifyState,
} from '@/types/inventory';

export type ExportRow = Record<string, string | number>;

/**
 * Flatten units (matching the given filters) into human-readable rows for
 * Excel/CSV export. Core fields use Thai column headers; any extra `attributes`
 * are spread into their own columns.
 */
export async function getUnitsForExport(filters: UnitFilters): Promise<ExportRow[]> {
  if (isDemoMode()) return mockGetUnitsForExport(filters);
  const units = await prisma.item.findMany({
    where: buildUnitWhere(filters),
    orderBy: { updatedAt: 'desc' },
  });

  return units.map((u) => {
    const row: ExportRow = {
      'S/N': u.serialNumber ?? '',
      รหัสรอง: u.boxSerialNumber ?? '',
      หมวด: u.category ?? '',
      รุ่น: u.model ?? '',
      สถานะ: UNIT_STATUS_LABELS[u.status as UnitStatus],
      การตรวจ: VERIFY_STATE_LABELS[u.verifyState as VerifyState],
      ตำแหน่ง: u.location ?? '',
      ตำแหน่งกล่อง: u.boxLocation ?? '',
      หมายเหตุ: u.note ?? '',
    };

    // Spread extra columns carried in attributes (skip keys that would clash).
    if (u.attributes && typeof u.attributes === 'object' && !Array.isArray(u.attributes)) {
      for (const [key, value] of Object.entries(u.attributes as Record<string, unknown>)) {
        if (!(key in row)) row[key] = value == null ? '' : String(value);
      }
    }

    return row;
  });
}
