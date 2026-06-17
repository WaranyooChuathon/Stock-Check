'use server';

import { revalidatePath } from 'next/cache';
import { restoreUnit, purgeUnit, purgeExpired } from '@/server/delete-unit';
import { requireRole } from '@/lib/session-guard';
import { NotFoundError } from '@/lib/errors';

export interface TrashState {
  ok?: boolean;
  error?: string;
  message?: string;
}

async function adminId(): Promise<string | null> {
  try {
    return (await requireRole(['admin'])).id;
  } catch {
    return null;
  }
}

export async function restoreAction(_prev: TrashState, formData: FormData): Promise<TrashState> {
  const id = await adminId();
  if (!id) return { error: 'เฉพาะผู้ดูแลเท่านั้น' };
  const unitId = String(formData.get('unitId') ?? '');
  if (!unitId) return { error: 'ไม่พบรหัสรายการ' };
  try {
    await restoreUnit(unitId, id);
  } catch (e) {
    if (e instanceof NotFoundError) return { error: e.message };
    throw e;
  }
  revalidatePath('/trash');
  revalidatePath('/units');
  return { ok: true, message: 'กู้คืนรายการแล้ว' };
}

export async function purgeAction(_prev: TrashState, formData: FormData): Promise<TrashState> {
  const id = await adminId();
  if (!id) return { error: 'เฉพาะผู้ดูแลเท่านั้น' };
  const unitId = String(formData.get('unitId') ?? '');
  if (!unitId) return { error: 'ไม่พบรหัสรายการ' };
  try {
    await purgeUnit(unitId, id);
  } catch (e) {
    if (e instanceof NotFoundError) return { error: e.message };
    throw e;
  }
  revalidatePath('/trash');
  return { ok: true, message: 'ลบถาวรแล้ว' };
}

export async function purgeExpiredAction(): Promise<TrashState> {
  const id = await adminId();
  if (!id) return { error: 'เฉพาะผู้ดูแลเท่านั้น' };
  const count = await purgeExpired(id);
  revalidatePath('/trash');
  return { ok: true, message: `ลบถาวรที่ครบกำหนดแล้ว ${count} รายการ` };
}
