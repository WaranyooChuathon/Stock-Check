import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { createUser, listUsers, resetPassword } from '@/server/users';
import { verifyCredentials } from '@/server/auth-verify';
import { ConflictError } from '@/lib/errors';

const MARK = 'T12TEST';

beforeEach(async () => {
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { startsWith: MARK } } });
  await prisma.$disconnect();
});

describe('user service (integration)', () => {
  it('creates a user with a hashed password and the given role', async () => {
    const user = await createUser(`${MARK}_a`, 'secret123', 'staff');
    expect(user.role).toBe('staff');
    // password is usable + stored hashed (not plaintext)
    expect(await verifyCredentials(`${MARK}_a`, 'secret123')).not.toBeNull();
    const raw = await prisma.user.findUnique({ where: { id: user.id } });
    expect(raw?.passwordHash).not.toBe('secret123');
  });

  it('rejects a duplicate username with ConflictError', async () => {
    await createUser(`${MARK}_dup`, 'pw12345', 'staff');
    await expect(createUser(`${MARK}_dup`, 'pw12345', 'admin')).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it('resets a password (old fails, new works)', async () => {
    const user = await createUser(`${MARK}_r`, 'oldpass1', 'staff');
    await resetPassword(user.id, 'newpass1');
    expect(await verifyCredentials(`${MARK}_r`, 'oldpass1')).toBeNull();
    expect(await verifyCredentials(`${MARK}_r`, 'newpass1')).not.toBeNull();
  });

  it('listUsers does not expose passwordHash', async () => {
    await createUser(`${MARK}_l`, 'pw12345', 'admin');
    const users = await listUsers();
    const found = users.find((u) => u.username === `${MARK}_l`);
    expect(found).toBeDefined();
    expect(Object.keys(found!)).not.toContain('passwordHash');
  });
});
