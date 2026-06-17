'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/auth';
import { hasRole } from '@/lib/rbac';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { createUser, resetPassword } from '@/server/users';
import { USER_ROLES } from '@/types/inventory';

async function isAdmin() {
  const session = await auth();
  return hasRole(session?.user?.role, ['admin']);
}

export interface FormState {
  ok?: boolean;
  error?: string;
}

const addSchema = z.object({
  username: z.string().trim().min(1, 'กรุณาระบุชื่อผู้ใช้').max(50),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
  role: z.enum(USER_ROLES),
});

export async function addUserAction(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: 'เฉพาะผู้ดูแลเท่านั้น' };

  const parsed = addSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' };

  try {
    await createUser(parsed.data.username, parsed.data.password, parsed.data.role);
    revalidatePath('/users');
    return { ok: true };
  } catch (error) {
    if (error instanceof ConflictError) return { error: error.message };
    throw error;
  }
}

const resetSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'),
});

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!(await isAdmin())) return { error: 'เฉพาะผู้ดูแลเท่านั้น' };

  const parsed = resetSchema.safeParse({
    userId: formData.get('userId'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' };

  try {
    await resetPassword(parsed.data.userId, parsed.data.password);
    return { ok: true };
  } catch (error) {
    if (error instanceof NotFoundError) return { error: error.message };
    throw error;
  }
}
