'use server';

import { revalidatePath } from 'next/cache';
import { softDeleteUnits } from '@/server/delete-unit';
import { requireRole } from '@/lib/session-guard';

export interface BulkDeleteState {
  ok?: boolean;
  error?: string;
  deleted?: number;
}

/**
 * Soft-delete many units at once (admin only). Returns how many were actually
 * deleted so the table can show a confirmation and refresh.
 */
export async function bulkDeleteAction(
  _prevState: BulkDeleteState,
  formData: FormData,
): Promise<BulkDeleteState> {
  let actorId: string;
  try {
    actorId = (await requireRole(['admin'])).id;
  } catch {
    return { error: 'เฉพาะผู้ดูแลเท่านั้นที่ลบได้' };
  }

  const ids = String(formData.get('ids') ?? '')
    .split(',')
    .filter(Boolean);
  if (ids.length === 0) return { error: 'ยังไม่ได้เลือกเครื่อง' };

  const deleted = await softDeleteUnits(ids, actorId);
  revalidatePath('/units');
  return { ok: true, deleted };
}
