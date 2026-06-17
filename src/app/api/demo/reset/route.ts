import { type NextRequest, NextResponse } from 'next/server';
import { resetDemoData } from '@/server/demo-reset';

/**
 * Reset the demo data to the seed. Token-guarded so randoms can't wipe it.
 *
 * Auth (any of):
 *  - `Authorization: Bearer <token>` — Vercel Cron sets this automatically from
 *    the CRON_SECRET env var.
 *  - `x-demo-reset-token: <token>` — for manual curl.
 *
 * The expected token is DEMO_RESET_TOKEN (falls back to CRON_SECRET). If neither
 * env is set the endpoint is disabled (503) so it never runs unguarded.
 */
function authorize(request: NextRequest): boolean {
  const token = process.env.DEMO_RESET_TOKEN ?? process.env.CRON_SECRET;
  if (!token) return false;
  const auth = request.headers.get('authorization');
  const header = request.headers.get('x-demo-reset-token');
  return auth === `Bearer ${token}` || header === token;
}

async function handle(request: NextRequest) {
  if (!process.env.DEMO_RESET_TOKEN && !process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'reset disabled (no token configured)' }, { status: 503 });
  }
  if (!authorize(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  await resetDemoData();
  return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
}

// Vercel Cron invokes the path with GET; POST is available for manual triggers.
export const GET = handle;
export const POST = handle;
