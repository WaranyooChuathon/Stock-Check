// Next.js 16 route protection. `proxy.ts` replaces the deprecated `middleware.ts`.
// With a `src/` directory it must live at `src/proxy.ts` (not the project root).
// Re-exporting Auth.js `auth` runs the `authorized` callback (see src/auth.ts):
// unauthenticated requests to matched routes are redirected to /login.
export { auth as proxy } from '@/auth';

export const config = {
  // Protect pages only. API routes are excluded so they can self-guard with
  // requireRole() and return proper 401/403 JSON instead of an HTML redirect.
  // `showcase` is the public device-frame wrapper — the framed app self-auths.
  matcher: ['/((?!api|login|showcase|_next/static|_next/image|favicon.ico).*)'],
};
