'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { auth } from '@/auth';
import { verifyUnit } from '@/server/verify';
import { updateUnit } from '@/server/update-unit';
import { softDeleteUnit } from '@/server/delete-unit';
import { requireRole } from '@/lib/session-guard';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { UNIT_STATUSES, type VerifyState } from '@/types/inventory';

export interface VerifyFormState {
  ok?: boolean;
  error?: string;
  verifyState?: VerifyState;
  reasons?: string[];
}

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const schema = z.object({
  serialNumber: optionalText,
  category: optionalText,
  status: z.enum(UNIT_STATUSES),
  note: optionalText,
});

export async function verifyAction(
  _prevState: VerifyFormState,
  formData: FormData,
): Promise<VerifyFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'ต้องเข้าสู่ระบบก่อน' };

  const unitId = String(formData.get('unitId') ?? '');
  if (!unitId) return { error: 'ไม่พบรหัสรายการ' };

  const parsed = schema.safeParse({
    serialNumber: formData.get('serialNumber'),
    category: formData.get('category'),
    status: formData.get('status'),
    note: formData.get('note'),
  });
  if (!parsed.success) return { error: 'ข้อมูลไม่ถูกต้อง ตรวจสอบฟอร์มอีกครั้ง' };

  const ids = String(formData.get('checklistItemIds') ?? '')
    .split(',')
    .filter(Boolean);
  const checklist = ids.map((id) => ({
    checklistItemId: id,
    present: formData.get(`present:${id}`) === 'on',
  }));

  try {
    const result = await verifyUnit(unitId, { ...parsed.data, checklist }, session.user.id);
    revalidatePath(`/units/${unitId}`);
    return { ok: true, verifyState: result.verifyState, reasons: result.reasons };
  } catch (error) {
    if (error instanceof ConflictError || error instanceof NotFoundError) {
      return { error: error.message };
    }
    throw error;
  }
}

export interface EditFormState {
  ok?: boolean;
  error?: string;
  /** new version after a successful edit (so the form can edit again w/o reload) */
  version?: number;
}

const editSchema = z.object({
  boxSerialNumber: optionalText,
  category: optionalText,
  model: optionalText,
  location: optionalText,
  boxLocation: optionalText,
});

export async function editAction(
  _prevState: EditFormState,
  formData: FormData,
): Promise<EditFormState> {
  const session = await auth();
  if (!session?.user) return { error: 'ต้องเข้าสู่ระบบก่อน' };

  const unitId = String(formData.get('unitId') ?? '');
  const version = Number(formData.get('version'));
  if (!unitId || Number.isNaN(version)) return { error: 'ข้อมูลไม่ถูกต้อง' };

  const parsed = editSchema.safeParse({
    boxSerialNumber: formData.get('boxSerialNumber'),
    category: formData.get('category'),
    model: formData.get('model'),
    location: formData.get('location'),
    boxLocation: formData.get('boxLocation'),
  });
  if (!parsed.success) return { error: 'ข้อมูลไม่ถูกต้อง ตรวจสอบฟอร์มอีกครั้ง' };

  try {
    const result = await updateUnit(unitId, parsed.data, version, session.user.id);
    revalidatePath(`/units/${unitId}`);
    return { ok: true, version: result.version };
  } catch (error) {
    if (error instanceof ConflictError || error instanceof NotFoundError) {
      return { error: error.message };
    }
    throw error;
  }
}

export interface DeleteFormState {
  error?: string;
}

/**
 * Soft-delete a unit (admin only). On success, revalidate the list and redirect
 * away — the unit moves to /trash and is recoverable for the retention window.
 */
export async function deleteUnitAction(
  _prevState: DeleteFormState,
  formData: FormData,
): Promise<DeleteFormState> {
  const unitId = String(formData.get('unitId') ?? '');
  if (!unitId) return { error: 'ไม่พบรหัสรายการ' };

  let actorId: string;
  try {
    actorId = (await requireRole(['admin'])).id;
  } catch {
    return { error: 'เฉพาะผู้ดูแลเท่านั้นที่ลบได้' };
  }

  try {
    await softDeleteUnit(unitId, actorId);
  } catch (error) {
    if (error instanceof NotFoundError) return { error: error.message };
    throw error;
  }

  revalidatePath('/units');
  redirect('/units'); // throws NEXT_REDIRECT — must stay outside the try/catch
}
