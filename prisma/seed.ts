import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { seedDemo } from '../src/server/seed-demo';

/**
 * CLI entrypoint for `npm run db:seed`. The actual seeding logic lives in
 * `src/server/seed-demo.ts` (shared with the /api/demo/reset endpoint).
 */
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
seedDemo(prisma)
  .then(async () => {
    const items = await prisma.item.count();
    console.log(`Seed complete: ${items} items.`);
    console.log('Login: admin/admin123 (admin), staff/staff123 (staff)');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
