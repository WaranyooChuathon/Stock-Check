'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/session-guard';
import { resetDemoData } from '@/server/demo-reset';

/**
 * In-app "Reset demo" button handler. Admin-only. Restores the seed dataset and
 * revalidates every route so the fresh data shows immediately.
 */
export async function resetDemoAction(): Promise<void> {
  await requireRole(['admin']);
  await resetDemoData();
  revalidatePath('/', 'layout');
}
