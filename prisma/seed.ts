import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import type { Prisma } from '../src/generated/prisma/client';
import { CHECKLIST, ITEMS } from '../src/server/mock/data';

/**
 * Deterministic demo seed for StockCheck — a *generic* serialized-asset tracker.
 * The dataset lives in `src/server/mock/data.ts` (shared with the in-memory mock
 * store). Exported as `seedDemo` so both the CLI and the /api/demo/reset endpoint
 * share one source of truth.
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

  // Create checklist items, keep a key→id map.
  const checklistId = new Map<string, string>();
  for (const c of CHECKLIST) {
    const created = await prisma.checklistItem.create({
      data: { label: c.label, order: c.order, active: true, category: c.category },
    });
    checklistId.set(c.key, created.id);
  }

  for (const it of ITEMS) {
    const checked = it.verifyState !== 'unverified';
    // Relevant checklist = this item's category + global (category null).
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

  const counts = {
    users: await prisma.user.count(),
    checklistItems: await prisma.checklistItem.count(),
    items: await prisma.item.count(),
    changeLogs: await prisma.changeLog.count(),
  };
  console.log('Seed complete:', counts);
}

// CLI entrypoint (npm run db:seed). The reset endpoint imports seedDemo directly.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
seedDemo(prisma)
  .then(() => console.log('Login: admin/admin123 (admin), staff/staff123 (staff)'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
