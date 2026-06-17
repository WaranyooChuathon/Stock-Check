import type { UserRole } from '@/types/inventory';

/** Pure authorization check: is `role` one of the `allowed` roles? */
export function hasRole(role: UserRole | undefined | null, allowed: UserRole[]): boolean {
  return role != null && allowed.includes(role);
}

/** Thrown when no valid session exists (→ 401). */
export class UnauthorizedError extends Error {
  constructor(message = 'ต้องเข้าสู่ระบบก่อน') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/** Thrown when the session lacks the required role (→ 403). */
export class ForbiddenError extends Error {
  constructor(message = 'ไม่มีสิทธิ์เข้าถึง') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export interface SessionUser {
  id: string;
  role: UserRole;
}
