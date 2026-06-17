'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import {
  createChecklistItem,
  deleteChecklistItem,
  setChecklistItemActive,
} from '@/server/checklist';

async function isAdmin() {
  const session = await auth();
  return hasRole(session?.user?.role, ['admin']);
}

export interface AddItemState {
  ok?: boolean;
  error?: string;
}

const labelSchema = z.string().trim().min(1, 'กรุณาระบุชื่ออุปกรณ์').max(100);

export async function addChecklistItemAction(
  _prevState: AddItemState,
  formData: FormData,
): Promise<AddItemState> {
  if (!(await isAdmin())) return { error: 'เฉพาะผู้ดูแลเท่านั้น' };

  const parsed = labelSchema.safeParse(formData.get('label'));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' };

  await createChecklistItem(parsed.data);
  revalidatePath('/settings');
  return { ok: true };
}

export async function toggleChecklistItemAction(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  if (!id) return;
  await setChecklistItemActive(id, active);
  revalidatePath('/settings');
}

export async function deleteChecklistItemAction(formData: FormData) {
  if (!(await isAdmin())) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await deleteChecklistItem(id);
  revalidatePath('/settings');
}
