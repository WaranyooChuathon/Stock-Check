import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { verifyCredentials } from '@/server/auth-verify';

const USERNAME = 'testauth_user';
const PASSWORD = 'testpass123';

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { username: USERNAME } });
  await prisma.user.create({
    data: { username: USERNAME, passwordHash: bcrypt.hashSync(PASSWORD, 10), role: 'staff' },
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: USERNAME } });
  await prisma.$disconnect();
});

describe('verifyCredentials (integration)', () => {
  it('returns the user on correct password', async () => {
    const user = await verifyCredentials(USERNAME, PASSWORD);
    expect(user).not.toBeNull();
    expect(user?.username).toBe(USERNAME);
    expect(user?.role).toBe('staff');
  });

  it('returns null on wrong password', async () => {
    expect(await verifyCredentials(USERNAME, 'wrong-password')).toBeNull();
  });

  it('returns null on unknown user', async () => {
    expect(await verifyCredentials('no_such_user_xyz', 'whatever')).toBeNull();
  });
});
