import { prisma } from '@/lib/prisma';
import { evaluateDiscrepancy } from '@/server/discrepancy';
import { isDemoMode } from '@/lib/demo';
import {
  mockListUnits,
  mockListCategories,
  mockListDeletedUnits,
  mockGetUnitDetail,
} from '@/server/mock/store';
import type { UnitFilters } from '@/lib/unit-filters';
import type { Prisma } from '@/generated/prisma/client';

/** Columns needed for the list view (keep the payload small). */
const listSelect = {
  id: true,
  serialNumber: true,
  boxSerialNumber: true,
  category: true,
  status: true,
  verifyState: true,
  location: true,
  boxLocation: true,
  note: true,
  updatedAt: true,
} satisfies Prisma.ItemSelect;

export type UnitListItem = Prisma.ItemGetPayload<{ select: typeof listSelect }>;

/**
 * List items matching the given filters.
 * - `q` matches serialNumber / boxSerialNumber (case-insensitive contains)
 * - status / verifyState / category are exact matches
 * Filters combine with AND; newest-updated first.
 */
/** Build the Prisma where-clause for item filters (shared by list + export). */
export function buildUnitWhere(filters: UnitFilters): Prisma.ItemWhereInput {
  // Soft-deleted items are never shown in normal lists/search/export.
  const where: Prisma.ItemWhereInput = { deletedAt: null };
  if (filters.q) {
    where.OR = [
      { serialNumber: { contains: filters.q, mode: 'insensitive' } },
      { boxSerialNumber: { contains: filters.q, mode: 'insensitive' } },
    ];
  }
  if (filters.status) where.status = filters.status;
  if (filters.verifyState) where.verifyState = filters.verifyState;
  if (filters.category) where.category = filters.category;
  if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
  if (filters.hasBox === 'yes') where.boxLocation = { not: null };
  if (filters.hasBox === 'no') where.boxLocation = null;
  return where;
}

/** Distinct non-empty categories present in active items (for the filter dropdown). */
export async function listCategories(): Promise<string[]> {
  if (isDemoMode()) return mockListCategories();
  const rows = await prisma.item.findMany({
    where: { deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });
  return rows.map((r) => r.category).filter((c): c is string => !!c);
}

export async function listUnits(filters: UnitFilters): Promise<UnitListItem[]> {
  if (isDemoMode()) return mockListUnits(filters) as UnitListItem[];
  return prisma.item.findMany({
    where: buildUnitWhere(filters),
    select: listSelect,
    orderBy: { updatedAt: 'desc' },
  });
}

const trashSelect = {
  id: true,
  serialNumber: true,
  category: true,
  status: true,
  deletedAt: true,
  deletedById: true,
  deletedBy: { select: { username: true } },
} satisfies Prisma.ItemSelect;

export type DeletedUnitItem = Prisma.ItemGetPayload<{ select: typeof trashSelect }>;

/** List soft-deleted units (the /trash view), most-recently-deleted first. */
export async function listDeletedUnits(): Promise<DeletedUnitItem[]> {
  if (isDemoMode()) return mockListDeletedUnits() as DeletedUnitItem[];
  return prisma.item.findMany({
    where: { deletedAt: { not: null } },
    select: trashSelect,
    orderBy: { deletedAt: 'desc' },
  });
}

/**
 * Load one unit with everything the detail/verify page needs:
 * the unit, the *active* checklist (pre-filled with any recorded results),
 * and recent audit history. Returns null if not found.
 */
export async function getUnitDetail(id: string) {
  if (isDemoMode()) return mockGetUnitDetail(id);
  // Run the three independent reads in parallel — one network round-trip instead
  // of three sequential ones (matters a lot on a remote DB like Neon).
  const [unit, activeItems, history] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: { checklist: { include: { checklistItem: true } } },
    }),
    prisma.checklistItem.findMany({ where: { active: true }, orderBy: { order: 'asc' } }),
    prisma.changeLog.findMany({
      where: { unitId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { username: true } } },
    }),
  ]);
  // Treat soft-deleted units as gone (guards stale links / direct URLs).
  if (!unit || unit.deletedAt) return null;

  // Reasons reflect what was actually RECORDED for this unit — not every active
  // item. So adding a new checklist item later never retroactively flags a unit
  // that was already verified.
  const { reasons } = evaluateDiscrepancy({
    checklist: unit.checklist.map((c) => ({
      label: c.checklistItem.label,
      present: c.present,
      active: c.checklistItem.active,
    })),
  });

  // The form shows active items relevant to this item's category — its own
  // category plus global items (category = null) — pre-filled with any recorded
  // result. Newly-added items can be ticked on the next verification.
  const presentMap = new Map(unit.checklist.map((c) => [c.checklistItemId, c.present]));
  const checklist = activeItems
    .filter((item) => item.category == null || item.category === unit.category)
    .map((item) => ({
      id: item.id,
      label: item.label,
      present: presentMap.get(item.id) ?? false,
    }));

  return { unit, checklist, reasons, history };
}
