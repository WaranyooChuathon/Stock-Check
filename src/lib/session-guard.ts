import { auth } from '@/auth';
import { ForbiddenError, hasRole, UnauthorizedError, type SessionUser } from '@/lib/rbac';
import type { UserRole } from '@/types/inventory';

/**
 * Server-side RBAC guard for route handlers / server actions.
 * Throws UnauthorizedError (401) if not logged in, ForbiddenError (403) if the
 * role is not allowed. Returns the session user otherwise.
 */
export async function requireRole(allowed: UserRole[]): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new UnauthorizedError();
  if (!hasRole(user.role, allowed)) throw new ForbiddenError();
  return { id: user.id, role: user.role };
}
