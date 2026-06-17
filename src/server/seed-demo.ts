import bcrypt from 'bcryptjs';
import { PrismaClient } from '../generated/prisma/client';
import type { Prisma } from '../generated/prisma/client';
import { CHECKLIST, ITEMS } from './mock/data';

/**
 * Deterministic demo seed for StockCheck (real database path). Side-effect-free
 * module — safe to import from the reset API route. The CLI wrapper lives in
 * `prisma/seed.ts`; the in-memory mock store seeds from the same `data.ts`.
 */
export async function seedDemo(prisma: PrismaClient): Promise<void> {
  // Clean slate (children first due to FKs).
  await prisma.changeLog.deleteMany();
  await prisma.unitChecklist.deleteMany();
  await prisma.item.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { username: 'admin', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin' },
  });
  await prisma.user.create({
    data: { username: 'staff', passwordHash: bcrypt.hashSync('staff123', 10), role: 'staff' },
  });

  const checklistId = new Map<string, string>();
  for (const c of CHECKLIST) {
    const created = await prisma.checklistItem.create({
      data: { label: c.label, order: c.order, active: true, category: c.category },
    });
    checklistId.set(c.key, created.id);
  }

  for (const it of ITEMS) {
    const checked = it.verifyState !== 'unverified';
    const relevant = CHECKLIST.filter((c) => c.category == null || c.category === it.category);
    const missing = new Set(it.missing ?? []);

    const unit = await prisma.item.create({
      data: {
        serialNumber: it.serialNumber,
        boxSerialNumber: it.boxSerialNumber,
        category: it.category,
        status: it.status,
        verifyState: it.verifyState,
        model: it.model,
        location: it.location,
        note: it.note ?? null,
        attributes: (it.attributes ?? undefined) as Prisma.InputJsonValue | undefined,
        verifiedById: checked ? admin.id : null,
        verifiedAt: checked ? new Date() : null,
        ...(checked
          ? {
              checklist: {
                create: relevant.map((c) => ({
                  checklistItemId: checklistId.get(c.key)!,
                  present: !missing.has(c.key),
                })),
              },
            }
          : {}),
      },
    });

    await prisma.changeLog.create({
      data: { unitId: unit.id, userId: admin.id, action: 'import' },
    });
    if (checked) {
      await prisma.changeLog.create({
        data: {
          unitId: unit.id,
          userId: admin.id,
          action: 'verify',
          field: 'verifyState',
          oldValue: 'unverified',
          newValue: it.verifyState,
        },
      });
    }
  }
}
