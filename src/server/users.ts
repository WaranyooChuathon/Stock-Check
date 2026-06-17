import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { isDemoMode } from '@/lib/demo';
import { mockListUsers, mockCreateUser, mockResetPassword } from '@/server/mock/store';
import type { UserRole } from '@/types/inventory';

export interface UserListItem {
  id: string;
  username: string;
  role: UserRole;
  createdAt: Date;
}

/** All users — never exposes passwordHash. */
export function listUsers(): Promise<UserListItem[]> {
  if (isDemoMode()) return Promise.resolve(mockListUsers());
  return prisma.user.findMany({
    select: { id: true, username: true, role: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  }) as Promise<UserListItem[]>;
}

/** Create a user with a bcrypt-hashed password. Username must be unique. */
export async function createUser(username: string, password: string, role: UserRole) {
  if (isDemoMode()) return mockCreateUser(username, password, role);
  const existing = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (existing) throw new ConflictError(`มีผู้ใช้ชื่อ "${username}" อยู่แล้ว`);

  return prisma.user.create({
    data: { username, passwordHash: bcrypt.hashSync(password, 10), role },
    select: { id: true, username: true, role: true, createdAt: true },
  });
}

/** Reset a user's password (bcrypt-hashed). */
export async function resetPassword(userId: string, newPassword: string) {
  if (isDemoMode()) return mockResetPassword(userId, newPassword);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new NotFoundError('ไม่พบผู้ใช้');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: bcrypt.hashSync(newPassword, 10) },
  });
}
