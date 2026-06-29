# TODO — Tech-stack logo marquee (login) ✅ DONE

Plan: `tasks/plan.md` · Spec: `SPEC.md` · Branch: `feat/login-tech-marquee`

- [x] **T1** `react-icons` installed (^5.6.0); verified `Si*` exports. Auth.js has no icon → dropped;
      final set = 9 (Next.js, React, TypeScript, Tailwind, Prisma, PostgreSQL, Zod, Vitest, Vercel).
- [x] **T2** `globals.css` — `@keyframes marquee` (translateX 0→-50%) + `.animate-marquee` (32s
      linear infinite) + `prefers-reduced-motion` → animation:none.
- [x] **T3** `src/components/TechMarquee.tsx` (RSC) — duplicated 2-copy track, per-item padding
      (uniform wrap), mask-image edge fade, brand colors; Next.js/Vercel/Prisma theme-adaptive ink;
      wrapper aria-hidden.
- [x] **T4** `login/page.tsx` — main → column; card centered (flex-1); `<TechMarquee/>` bottom band.
- [x] **T5** Verified via `npm run dev:demo` (isolated /login): animation marquee 32s, 2 copies,
      9 logos, React brand cyan, Next.js adapts to near-white on dark, mask fade applied.
      Screenshot `.screenshots/login-marquee-AFTER.png`. Server killed.
- [x] ◆ Final: typecheck + lint + build green; ready to commit.

Note: brand hex colors in TechMarquee are flagged by the impeccable design hook (outside DESIGN.md
palette) — intentional/by-design (real logo colors, user-confirmed). Optional: persist with
`/impeccable hooks ignore-file "src/components/TechMarquee.tsx"`.

## Follow-up (2026-06-28): bigger + gap fix
- [x] **2× size** — icons h-5→h-10, text-sm→text-lg, px-7→px-14, py-4→py-8, gap-2→gap-3.
- [x] **Gap-after-Vercel fix** — root cause: with 2 copies, one copy was narrower than wide
      viewports, so translateX(-50%) revealed empty space (~5s) before the loop repeated.
      Fix: render 4 copies; -50% now reveals 2 copies (always ≥ viewport) → seamless on any width.
- [x] **Duration** 32s → 60s (track distance doubled; keeps the same calm per-pixel speed).
- [x] typecheck + lint green.
