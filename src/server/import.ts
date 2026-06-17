import { prisma } from '@/lib/prisma';
import { isDemoMode } from '@/lib/demo';
import { mockImportUnits } from '@/server/mock/store';
import { UNIT_STATUSES, type UnitStatus } from '@/types/inventory';
import type { Prisma } from '@/generated/prisma/client';

export interface ImportRow {
  serialNumber: string | null;
  boxSerialNumber: string | null;
  category: string | null;
  status: string | null;
  boxLocation?: string | null;
  /** category-specific specs (e.g. displaySize, macAddress) ride along here */
  attributes?: Record<string, unknown>;
}

export interface ImportReport {
  total: number;
  imported: number;
  /** empty/malformed rows that were not imported */
  skipped: number;
}

const blank = (v: string | null | undefined): string | null => {
  const t = v?.trim();
  return t ? t : null;
};

function coerceStatus(value: string | null): UnitStatus {
  const v = value?.trim();
  return v && (UNIT_STATUSES as readonly string[]).includes(v) ? (v as UnitStatus) : 'in_stock';
}

/**
 * Import normalized rows (column mapping already applied client-side).
 *
 * Everything you can see is imported as `unverified`; only truly empty rows are
 * skipped. Units are flagged `discrepancy` later, during verification, ONLY when
 * an accessory is missing — never from the serial numbers. Unmapped columns are
 * carried along in `attributes`.
 */
export async function importUnits(rows: ImportRow[], actorUserId: string): Promise<ImportReport> {
  if (isDemoMode()) return mockImportUnits(rows, actorUserId);
  let imported = 0;
  let skipped = 0;

  await prisma.$transaction(async (tx) => {
    for (const raw of rows) {
      const serialNumber = blank(raw.serialNumber);
      const boxSerialNumber = blank(raw.boxSerialNumber);
      const category = blank(raw.category);

      // Truly empty row → skip.
      if (!serialNumber && !boxSerialNumber) {
        skipped += 1;
        continue;
      }

      const unit = await tx.item.create({
        data: {
          serialNumber,
          boxSerialNumber,
          category,
          boxLocation: blank(raw.boxLocation),
          status: coerceStatus(raw.status),
          verifyState: 'unverified',
          attributes:
            raw.attributes && Object.keys(raw.attributes).length > 0
              ? (raw.attributes as Prisma.InputJsonValue)
              : undefined,
        },
      });
      await tx.changeLog.create({
        data: { unitId: unit.id, userId: actorUserId, action: 'import' },
      });

      imported += 1;
    }
  });

  return { total: rows.length, imported, skipped };
}
