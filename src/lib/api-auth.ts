import { NextResponse } from 'next/server';
import { ForbiddenError, UnauthorizedError } from '@/lib/rbac';

/**
 * Map an RBAC guard error to an HTTP JSON response.
 * Returns null for anything else (caller should rethrow).
 * Usage:
 *   try { await requireRole([...]); }
 *   catch (e) { const r = authErrorResponse(e); if (r) return r; throw e; }
 */
export function authErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  if (error instanceof ForbiddenError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  return null;
}
