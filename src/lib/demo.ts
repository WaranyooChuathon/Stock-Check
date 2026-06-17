/**
 * Dual-mode data layer switch.
 *
 * StockCheck runs against a real PostgreSQL database (Neon in production) when
 * `DATABASE_URL` is set, and falls back to a deterministic in-memory mock store
 * when it isn't — so the app boots with zero configuration for local quick-start,
 * CI, and preview deploys. Set `DEMO_MOCK=1` to force mock mode even with a URL.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MOCK === '1' || !process.env.DATABASE_URL;
}
