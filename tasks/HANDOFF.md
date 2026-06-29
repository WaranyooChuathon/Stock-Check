# HANDOFF — login page (read THIS file first; it's the token-cheap entry point)

> Purpose: a fresh session can implement the pending login edits **without** re-reading
> the whole login tree or the chat history. Everything needed is below.
> Last updated: 2026-06-28.

## Run / verify

- Local demo (DB-free, the reliable way): `npm run dev:demo` → http://localhost:3000/login
  (plain `npm run dev` 500s because `.env` has a `DATABASE_URL` pointing at an unreachable DB.)
- Gates before finishing: `npm run typecheck` then `npm run lint`. Browser check is optional
  (it's expensive — only open Chrome if the user asks to see it).
- ⚠️ Do NOT commit/push (AGENTS.md). Company-safe synthetic data only.

## Files that matter

| File | Role |
|---|---|
| `src/app/(auth)/login/page.tsx` | The login page. Card (Live Demo button + LoginForm + test accounts) is centered; `<TechMarquee/>` is the bottom band. |
| `src/components/TechMarquee.tsx` | Tech-stack logo marquee (decorative, `aria-hidden`). |
| `src/components/icons.tsx` | Shared Lucide-style line-icon family. Add new icons here (`LogInIcon`, `TabletIcon`, … pattern). |
| `src/app/globals.css` | `@keyframes marquee` + `.animate-marquee` live here (bottom of file). |

## DONE (do not redo)

- **TechMarquee built** — modern CSS marquee (NOT `<marquee>`): a flex track of **4 identical
  copies** translated `translateX(0 → -50%)`; `mask-image` edge fade; `prefers-reduced-motion`
  stops it. 9 logos via `react-icons/si`: Next.js, React, TypeScript, Tailwind, Prisma,
  PostgreSQL, Zod, Vitest, Vercel. (Auth.js has no Simple-Icons mark → omitted.)
- **Enlarged 2×** — icons `h-10 w-10`, text `text-lg`, item padding `px-14`, band `py-8`, `gap-3`.
- **Fixed the post-Vercel gap** — root cause: with only 2 copies, one copy was narrower than a
  wide viewport, so `-50%` revealed empty space (~5s) before it looped. Fix = 4 copies (`-50%`
  now reveals 2 copies, always ≥ viewport). Duration `60s` (was 32s) to keep the same calm
  per-pixel speed after the distance doubled.
- **Brand hex colors in TechMarquee are intentional** (real logo colors — React `#61DAFB`, etc.).
  The impeccable design hook flags them every edit; this is a known false positive (SPEC sanctions
  brand colors as the one palette exception). If asked to silence permanently:
  `/impeccable hooks ignore-file "src/components/TechMarquee.tsx"`.

## ✅ RESOLVED (2026-06-29) — the real target was the DemoBanner, not the login page

The earlier confusion was about *where*. The user always meant the **top demo banner**
(`src/components/DemoBanner.tsx`, rendered on every page via the root layout / `BannerGate`,
hidden only on `/showcase`), which already had `Live Demo · ข้อมูลตัวอย่างเพื่อการสาธิต` + GitHub +
Resume + Tablet view. Final changes:
- **Green dot** — the "Live Demo" status dot went red → `bg-green-500` ("live / connected").
- **Neon badge added** — `NeonIcon` (the user's real Neon logomark, inlined in `icons.tsx` as a
  filled `#37C38F` SVG so it always renders) + `เชื่อมต่อกับฐานข้อมูล neon`.
- **Resume removed** (lives in the user's portfolio blog). GitHub + Tablet view kept.
- **Always visible** — banner is now `sticky top-0 z-50`. The `(app)` layout header stays sticky
  but pinned **below** the banner (`sticky top-8.5` ≈ 34px banner height, `z-10`) so the two bars
  stack flush (verified: 0px gap/overlap on scroll) instead of colliding at top-0.
  - ⚠️ A first pass made the `(app)` root a `flex` column to kill scroll, which made `main mx-auto`
    shrink-to-fit → **squeezed the dashboard width**. Reverted root to `min-h-dvh` (width back to
    max-w-5xl / 1024px, verified). Lesson logged: ask before touching the shared app layout.
  - Minor known cosmetic: the banner dark bg is `amber-950/40` (40% opacity), so page content
    faintly shows through it while scrolling now that it's sticky. Make it opaque if it bothers.
- **No vertical scroll** — the sticky banner + `min-h-dvh` page = a guaranteed banner-height scroll
  (classic bug). Fixed by making both the login `<main>` and the `(app)` layout root `flex-1`
  (fill the space under the banner) instead of `min-h-dvh`; body is already `flex min-h-full
  flex-col`. Login also: dropped the redundant "ดูแบบ Tablet" link (the banner already has Tablet
  view), trimmed the card area to `py-4`, and the marquee was set to ~1.5× (`py-5`, `h-8`,
  `text-base`, `px-10`) so it all fits.
- **Verified in a real browser** (isolated /login): no vertical scroll at 1366×768, 720, 700, and
  640px heights (overflow 0); banner shows green dot + Neon green logomark + GitHub + Tablet view,
  no Resume. Screenshot taken. typecheck + lint green. (Below ~654px height a few px overflow —
  acceptable for normal laptops.)

### Neon logo now loads from `public/` (not inlined) + the real root cause (2026-06-29)
The user wants the DB logo swappable via the `public/` folder. Switched the badge from an inlined
SVG to `next/image` reading `public/neon_icon/neon-logomark-light-color.svg` (`unoptimized`, since
Next's optimizer rejects SVGs). Path + label are a `DB` const at the top of `DemoBanner.tsx` —
swap the file and edit two lines to change databases later.
- **Real reason the logo was blank before** (not a next/image quirk): `src/proxy.ts` route
  protection was matching the static asset path and **307-redirecting the image request to /login**
  when logged out. Fixed the matcher to also exclude image extensions
  (`…|.*\.(svg|png|jpg|jpeg|gif|webp|avif|ico)`), so any public image now loads on any page,
  logged in or not. Verified: `GET /neon_icon/…svg` → `200 image/svg+xml`, and the `<img>` reports
  `complete:true, naturalWidth:64`. (proxy config change requires a dev-server restart.)

The notes below are the earlier (misplaced) attempt — kept only for history.

## ⚠️ Corrected direction (2026-06-28) — READ THIS, earlier attempt was misplaced

A first attempt put the neon-DB badge **inside the login card** — wrong. It has been **reverted**;
the login card/form is back to its original state (Live Demo button + caption
`เข้าใช้งานทันทีในฐานะผู้ดูแล (ข้อมูลตัวอย่างเพื่อการสาธิต)` + LoginForm + test accounts). Do NOT
touch the login form/card.

What the user actually wants:
- The neon-DB badge goes in the **bottom area** (the band with the marquee / footer), NOT in the form.
- **The user is supplying the real Neon logo asset themselves** (react-icons has no Neon mark).
  Wait for that asset before building the badge; drop it in `public/` (e.g. `public/neon.svg`) and
  render via `next/image` or inline `<img>`. (A generic `DatabaseIcon` exists in
  `src/components/icons.tsx` as a fallback only — prefer the user's real logo.)
- The badge still wants the **green "connected/live" dot** + text
  `เชื่อมต่อกับฐานข้อมูล neon · ข้อมูลตัวอย่างเพื่อการสาธิต`.

### Bottom-area items — ✅ DONE (2026-06-29)
1. **Neon-DB badge** — built in the `<footer>` (below the marquee): pulsing green dot
   (`bg-green-500` + `animate-ping`) + the user's real Neon logomark
   (`public/neon_icon/neon-logomark-light-color.svg`, rendered via `next/image` `unoptimized` since
   it's an SVG) + `เชื่อมต่อกับฐานข้อมูล neon · ข้อมูลตัวอย่างเพื่อการสาธิต`. (The two supplied
   SVGs `…-dark-color`/`…-light-color` are byte-identical green `#37C38F`, so only one is used; if
   they ever differ, swap by theme with `dark:` classes.)
2. **GitHub link** — `https://github.com/WaranyooChuathon` (`SiGithub` icon, opens new tab,
   `rel="noopener noreferrer"`), in the same footer row. **Resume: dropped** per user (it'll live in
   their portfolio blog instead).
3. **"ดูแบบ Tablet" link** — left under the card, unchanged.

### NO-scroll — ✅ DONE
`<main>` is `h-dvh overflow-hidden`; the form area is `flex-1 min-h-0 overflow-y-auto` so the page
never body-scrolls and the footer is always visible. The marquee was dialed from 2× back to ~1.5×
(`py-5`, `h-8` icons, `text-base`, `px-10`) to fit. Caveat: on a very short viewport the *form
area* (not the page) scrolls internally so the login is never clipped — acceptable trade.
Not yet eyeballed in a browser at multiple heights; user can `npm run dev:demo` to confirm.

### 2. GitHub link — ⏸ deferred (user said "just note it for now")
User wants a GitHub link somewhere near the footer/Tablet-view link. **Not yet decided:** exact
placement, label (icon vs "GitHub" text), and the **repo URL** (must be supplied by the user —
do not guess). Ask for the URL when picking this up.

### 3. Tablet view link — already exists
`<a href="/showcase" target="_top">ดูแบบ Tablet</a>` is in place (`target="_top"` is load-bearing:
it prevents nesting a second navbar when viewing the framed login inside `/showcase`). No change
requested — leave it unless the GitHub work reorganizes that row.
