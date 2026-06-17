'use server';

import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

/**
 * Server action for the login form (used with React 19 useActionState).
 * Returns an error message string on failure; on success `signIn` throws a
 * redirect which must propagate.
 */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string | undefined> {
  try {
    await signIn('credentials', {
      username: String(formData.get('username') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      }
      return 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';
    }
    // Re-throw redirect (and anything non-auth) so Next.js can handle it.
    throw error;
  }
}

/**
 * One-click "Enter Live Demo" — signs in as the demo admin without typing
 * credentials. Works in both modes: against the mock store in demo mode, and
 * against the seeded admin user when a real database is connected.
 */
export async function enterDemo(): Promise<void> {
  await signIn('credentials', {
    username: 'admin',
    password: 'admin123',
    redirectTo: '/',
  });
}
