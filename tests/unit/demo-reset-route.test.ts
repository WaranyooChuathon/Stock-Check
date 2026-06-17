import { describe, it, expect, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';
import { GET } from '@/app/api/demo/reset/route';

const req = (headers: Record<string, string> = {}) =>
  new Request('http://localhost/api/demo/reset', { headers }) as unknown as NextRequest;

const env = { ...process.env };
afterEach(() => {
  process.env = { ...env };
});

describe('POST/GET /api/demo/reset (token guard)', () => {
  it('returns 503 when no token is configured', async () => {
    delete process.env.DEMO_RESET_TOKEN;
    delete process.env.CRON_SECRET;
    const res = await GET(req({ authorization: 'Bearer anything' }));
    expect(res.status).toBe(503);
  });

  it('returns 401 without a valid token', async () => {
    process.env.DEMO_RESET_TOKEN = 'secret-tok';
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req({ authorization: 'Bearer wrong' }))).status).toBe(401);
  });

  it('returns 200 with the correct bearer token (mock mode)', async () => {
    process.env.DEMO_RESET_TOKEN = 'secret-tok';
    process.env.DEMO_MOCK = '1'; // force mock so reset touches no real DB
    const res = await GET(req({ authorization: 'Bearer secret-tok' }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('accepts the x-demo-reset-token header too', async () => {
    process.env.DEMO_RESET_TOKEN = 'secret-tok';
    process.env.DEMO_MOCK = '1';
    const res = await GET(req({ 'x-demo-reset-token': 'secret-tok' }));
    expect(res.status).toBe(200);
  });
});
