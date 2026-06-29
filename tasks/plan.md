# PLAN — Tech-stack logo marquee (login)

Source: `SPEC.md`. Branch: `feat/login-tech-marquee`.

## T1 — Dependency + verify icons
- `npm install react-icons`. Confirm the exact `Si*` exports exist (Next.js, React, TypeScript,
  Tailwind, Prisma, PostgreSQL, Zod, Vitest, Vercel, Auth.js); drop/substitute any missing.
- **AC:** install clean; a quick node check lists which icons resolve.

## T2 — Keyframes (globals.css)
- Add `@keyframes marquee { from {translateX(0)} to {translateX(-50%)} }` + a small class
  (`.animate-marquee`) and the `prefers-reduced-motion` override (`animation: none`).
- **AC:** lint/build clean.

## T3 — TechMarquee component
- `src/components/TechMarquee.tsx` (RSC): typed `{ name, Icon, color }[]`; track rendered **twice**
  in one flex row (`gap`), animated; duplicate `aria-hidden`; wrapper `aria-hidden` + `mask-image`
  edge fade; black/near-black marks use theme-neutral (`text-gray-900 dark:text-gray-100`), others
  inline brand `color`.
- **AC:** typecheck/lint clean.

## T4 — Login placement
- `login/page.tsx`: `main` → column; existing card group in a centered `flex-1`; `<TechMarquee/>`
  as a bottom full-width band (`border-t`, padding).
- **AC:** card stays centered; band at bottom; typecheck/lint/build clean.

## T5 — Verify
- `npm run dev:demo`; login: seamless scroll (no wrap jump), edge fade, all logos visible in
  dark + light (black marks adapt), 375px OK, reduced-motion static. Screenshots → `.screenshots/`.
  Kill the dev server when done.

**◆ FINAL:** gates green; manual review passes; ready to commit.

## Notes
- Only new dep = react-icons (approved). No auth/data change. User commits.
