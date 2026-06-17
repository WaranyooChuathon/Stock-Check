import { prisma } from '@/lib/prisma';
import { isDemoMode } from '@/lib/demo';
import {
  mockListAllChecklistItems,
  mockCreateChecklistItem,
  mockSetChecklistItemActive,
  mockDeleteChecklistItem,
} from '@/server/mock/store';

/** All checklist items (active + inactive), ordered for the settings UI. */
export function listAllChecklistItems() {
  if (isDemoMode()) return Promise.resolve(mockListAllChecklistItems());
  return prisma.checklistItem.findMany({ orderBy: [{ order: 'asc' }, { label: 'asc' }] });
}

/** Create a new active checklist item at the end of the order. */
export async function createChecklistItem(label: string) {
  if (isDemoMode()) return mockCreateChecklistItem(label);
  const max = await prisma.checklistItem.aggregate({ _max: { order: true } });
  return prisma.checklistItem.create({
    data: { label, order: (max._max.order ?? 0) + 1, active: true },
  });
}

/** Activate/deactivate an item (preferred over delete — preserves history). */
export function setChecklistItemActive(id: string, active: boolean) {
  if (isDemoMode()) return Promise.resolve(mockSetChecklistItemActive(id, active));
  return prisma.checklistItem.update({ where: { id }, data: { active } });
}

/** Hard-delete an item (cascades its recorded results). */
export function deleteChecklistItem(id: string) {
  if (isDemoMode()) return Promise.resolve(mockDeleteChecklistItem(id));
  return prisma.checklistItem.delete({ where: { id } });
}
