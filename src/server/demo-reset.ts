import { prisma } from '@/lib/prisma';
import { isDemoMode } from '@/lib/demo';
import { resetMockStore } from '@/server/mock/store';
import { seedDemo } from '@/server/seed-demo';

/**
 * Reset the demo data back to the deterministic seed. In demo (mock) mode this
 * rebuilds the in-memory store; with a real database it re-runs `seedDemo`.
 * Used by both the /api/demo/reset endpoint (cron) and the in-app reset button.
 */
export async function resetDemoData(): Promise<void> {
  if (isDemoMode()) {
    resetMockStore();
    return;
  }
  await seedDemo(prisma);
}
