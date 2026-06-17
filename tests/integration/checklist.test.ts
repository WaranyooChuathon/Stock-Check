import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  createChecklistItem,
  deleteChecklistItem,
  listAllChecklistItems,
  setChecklistItemActive,
} from '@/server/checklist';

const MARK = 'T9TEST';

beforeEach(async () => {
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
});

afterAll(async () => {
  await prisma.checklistItem.deleteMany({ where: { label: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('checklist service (integration)', () => {
  it('creates an item active with an incremented order', async () => {
    const a = await createChecklistItem(`${MARK} A`);
    const b = await createChecklistItem(`${MARK} B`);
    expect(a.active).toBe(true);
    expect(b.order).toBeGreaterThan(a.order);

    const all = await listAllChecklistItems();
    const labels = all.map((i) => i.label);
    expect(labels).toContain(`${MARK} A`);
    expect(labels).toContain(`${MARK} B`);
  });

  it('toggles active', async () => {
    const item = await createChecklistItem(`${MARK} C`);
    const updated = await setChecklistItemActive(item.id, false);
    expect(updated.active).toBe(false);
  });

  it('deletes an item', async () => {
    const item = await createChecklistItem(`${MARK} D`);
    await deleteChecklistItem(item.id);
    const found = await prisma.checklistItem.findUnique({ where: { id: item.id } });
    expect(found).toBeNull();
  });
});
