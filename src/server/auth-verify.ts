import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isDemoMode } from '@/lib/demo';
import { mockVerifyCredentials } from '@/server/mock/store';
import type { UserRole } from '@/types/inventory';

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

/**
 * Verify a username/password against the database.
 * Returns the user (id/username/role) on success, or null on any failure
 * (unknown user or wrong password) — callers must not distinguish the two.
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<AuthUser | null> {
  if (isDemoMode()) return mockVerifyCredentials(username, password);
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return null;

  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, username: user.username, role: user.role };
}
