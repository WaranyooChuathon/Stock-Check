# SPEC — Tech-stack logo marquee on the login page

> Status: draft for review · Branch suggestion: `feat/login-tech-marquee`
> Supersedes the dark-slate SPEC (shipped). Design context: [DESIGN.md](DESIGN.md), [AGENTS.md].

## 1. Objective

Add a polished **tech-stack logo marquee** at the **bottom of the login page** — a seamless,
infinitely-scrolling band of the real technologies this project uses, as a portfolio signal to
recruiters who open the link.

Modern CSS approach (researched): native `<marquee>` is obsolete; do a **CSS `@keyframes`
`translateX` loop on a duplicated track** (seamless), with `mask-image` edge fade and a
`prefers-reduced-motion` fallback. Not scroll-driven animation (that binds to scroll, not auto-play).

**Target users:** recruiters/visitors on the login screen. Presentational only — no behavior/data
change to auth or the app.

**Out of scope:** marquees anywhere else; pause-on-hover and a caption label (not requested);
clickable logos / links.

## 2. Core features & acceptance criteria

### F1 — Tech marquee component (seamless CSS loop)
- New `src/components/TechMarquee.tsx` (server component — no client JS needed).
- Render the stack as brand logos via **`react-icons`** (Simple Icons set), in **real brand colors**.
- Seamless loop: the logo list is rendered **twice** in one track; the track animates
  `transform: translateX(0) → translateX(-50%)` via a CSS `@keyframes` (`animation: … linear
  infinite`). Duplicate is `aria-hidden`.
- **Edge fade:** `mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)`
  so logos fade in/out at both ends.
- **AC:** logos scroll horizontally in one continuous, seamless loop (no visible jump at wrap);
  both ends fade out; runs without JS.

### F2 — Brand colors, theme-safe
- Each logo uses its Simple-Icons brand color. **Monochrome black/near-black marks** (Next.js,
  Vercel, Prisma) would vanish on the dark slate bg — these adapt to a theme-neutral
  (gray-900 in light / gray-100 in dark) instead of pure brand black.
- **AC:** every logo is clearly visible in **both** light and the new slate dark mode (no invisible
  black-on-dark logo); colored logos (React cyan, TypeScript blue, Postgres blue, etc.) show their
  brand hue.

### F3 — Accessibility / reduced motion
- `@media (prefers-reduced-motion: reduce)` → **no auto-scroll** (static row; the duplicate hidden or
  the track centered). The marquee is decorative → wrap in `aria-hidden` (the stack isn't conveyed by
  the icons alone). Logos still ≥ adequate size; nothing flashes.
- **AC:** with reduced-motion on, the band is static (no animation) and still looks intentional.

### F4 — Placement at the login bottom
- Restructure login `main` to a column: existing card group stays vertically centered (`flex-1`),
  the marquee sits as a **full-width band pinned at the bottom** (subtle `border-t`, padding).
- **AC:** the login card remains centered; the marquee spans the width at the bottom on desktop and
  mobile (375px) without overflowing; light + dark both correct.

### Tech set (confirm exact availability in `react-icons/si` at build; drop/substitute any missing)
Next.js · React · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Zod · Vitest · Vercel
(+ Auth.js if an icon exists). ~8–10 marks.

### Non-functional
- **New dependency: `react-icons`** (approved) — import only the specific `Si*` icons (tree-shaken).
- No change to auth/data/logic. GPU-friendly (`transform` only; consider `will-change: transform`).

## 3. Project structure

```
src/
  components/TechMarquee.tsx   # NEW — RSC; react-icons brand logos, duplicated track, mask fade
  app/globals.css             # MODIFY — @keyframes marquee (+ small utility/classes)
  app/(auth)/login/page.tsx   # MODIFY — column layout; <TechMarquee/> as bottom band
package.json                  # MODIFY — add react-icons
```

## 4. Code style

- Follow AGENTS.md/DESIGN.md: Thai UI / English code; mobile-first; `dark:` everywhere; calm,
  restrained (the marquee is a quiet accent, not loud). Tailwind utilities; keyframes live in
  `globals.css`. Brand colors are the one allowed exception to the app palette (they're logos).
- TypeScript strict; `TechMarquee` data = a typed array of `{ name, Icon, color }`.

## 5. Testing strategy

- Presentational — no unit tests; existing tests stay green.
- Gates: `npm run typecheck` / `lint` / `build` clean (build also proves the `react-icons` imports
  resolve).
- **Manual (via `npm run dev:demo`):** login page — seamless scroll, no wrap jump, edge fade;
  toggle dark/light (all logos visible, black marks adapt); 375px width; emulate reduced-motion
  (static). Before/after screenshots → `.screenshots/`. Kill the dev server when done.

## 6. Boundaries

**Always**
- Keep auth/login behavior, copy, and the rest of the page intact; this is an additive band.
- Ensure reduced-motion + both-theme visibility; keep it calm (decorative `aria-hidden`).
- Company-safe: these are public tech-brand logos of the actual stack (no company/client marks).

**Ask first**
- Before adding any dependency **beyond** the approved `react-icons`.
- Before making logos clickable/links, adding a caption, or pause-on-hover (not in scope).

**Never**
- Never add real company/client branding or data; never commit `.env`/secrets.
- Never ship an animation without a `prefers-reduced-motion` fallback.
- Never auto-commit / push / deploy — the user commits themselves.
```
