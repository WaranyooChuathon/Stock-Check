# SPEC — Device-Frame Showcase Mode

> Status: draft for review · Feature branch suggestion: `feat/showcase-device-frame`
> Companion docs: `AGENTS.md` (project guide), `ARCHITECTURE.md`, `PORTFOLIO-SPEC.md`.

## 1. Objective

Add a **presentation/showcase mode** that renders the live StockCheck app inside a realistic
**tablet bezel**, so a portfolio viewer immediately sees how the tool is actually used in the
field — on a tablet/iPad held by a stock-checker — rather than as a plain desktop website.

**Target users**
- Recruiters / hiring managers opening the portfolio link who should grasp the real-world
  context in one glance.
- The author (demo driver) presenting the app live and switching device contexts on the fly.

**Why a route + iframe (chosen approach):** the inner app stays fully interactive at the *true
device viewport* (the app's own responsive breakpoints fire as on real hardware), with zero
changes to existing pages. The wrapper only frames and resizes — it never reimplements app UI.

**Out of scope:** real touch-gesture emulation, network throttling, multi-device side-by-side,
recording/video, changing any existing app page or business logic.

## 2. Core features & acceptance criteria

### F1 — Showcase route (`/showcase`)
- New **public** page at `src/app/showcase/page.tsx` (outside the `(app)` authed group).
- Renders a centered device frame containing an `<iframe>` pointing at the app root (`/`).
- The iframe is **same-origin**, so the inner app shares the session; an unauthenticated viewer
  sees the login page *inside the frame* and can click "🚀 เข้าสู่ Live Demo" there.
- **AC:** visiting `/showcase` with no session shows the framed login; after entering the demo
  inside the frame, the framed app navigates normally and stays within the bezel.

### F2 — Device presets (switcher)
Three presets, selectable via a top toolbar. Sizes are **logical CSS viewport** points
(starting values — finalize in build):

| Preset      | Portrait (w×h) | Notes |
|-------------|----------------|-------|
| Tablet 8.8" | 820 × 1180     | compact tablet / iPad-mini class |
| Tablet 11"  | 840 × 1230     | iPad-Pro-11" class |
| Web         | 100% × 100%    | no bezel, full-width (iframe fills viewport) |

- **AC:** clicking a preset swaps the iframe's rendered viewport size; the inner app reflows to
  match (verified by the app's mobile vs. wider layout responding).
- **AC:** "Web" hides the bezel entirely and shows the app edge-to-edge.

### F3 — Orientation toggle (portrait ↔ landscape)
- A rotate button swaps width/height for the active tablet preset. Disabled/hidden for "Web".
- **AC:** rotating 8.8"/11" swaps dimensions and the frame visibly re-orients; inner app reflows.

### F4 — Fit-to-screen scaling
- When a device's logical size is taller/wider than the available viewport, the whole frame is
  uniformly down-scaled (CSS `transform: scale()`) so it always fits without page scrollbars,
  preserving aspect ratio. The iframe's internal logical size is unchanged (app still believes
  it has the full device viewport).
- **AC:** on a laptop screen the 11" portrait frame fits fully on screen with no clipping.

### F5 — Entry points
- **Login page:** a secondary link/button "📱 ดูแบบ Tablet" → `/showcase`.
- **DemoBanner:** a "📱 Tablet view" link (alongside GitHub / Resume) → `/showcase`.
- **AC:** both links navigate to `/showcase`; the banner link is visible on every app page.

### F6 — Mobile-first & dark mode (project convention)
- The showcase chrome (toolbar, bezel, background) supports light/dark via `dark:` variants and
  is usable on a phone (controls wrap, touch targets ≥44px).
- **AC:** toggling theme restyles the showcase chrome; toolbar usable at 375px width.

### Non-functional
- **Zero-config / demo-mode safe:** the wrapper adds no data layer; it works in `isDemoMode()`
  exactly as in DB mode (it only frames existing routes). No new `src/server/*` service.
- **No new dependencies** — pure React 19 + Tailwind 4 + CSS transforms.
- State (active device + orientation) may persist in URL query (`?device=11&o=landscape`) so a
  specific framed view is shareable; default = 11" portrait. (URL-state is a nice-to-have; local
  component state is acceptable for v1 if URL sync adds risk.)

## 3. Project structure (additions only)

```
src/
  app/
    showcase/
      page.tsx              # public wrapper page (server component shell)
      ShowcaseFrame.tsx     # 'use client' — toolbar + bezel + iframe + scaling
      devices.ts            # DEVICE_PRESETS (id, label, width, height, type)
  proxy.ts                  # MODIFY matcher: exclude `showcase` (make route public)
  app/(auth)/login/page.tsx # MODIFY: add "ดูแบบ Tablet" link
  components/DemoBanner.tsx  # MODIFY: add "Tablet view" link
tests/
  unit/showcase-devices.test.ts   # preset + orientation pure helpers
```

- `devices.ts` exposes pure helpers (`getPreset(id)`, `rotate(dims)`, `fitScale(dims, viewport)`)
  so the geometry logic is unit-testable without a DOM.
- `ShowcaseFrame.tsx` is the only client component; `page.tsx` stays a thin server shell.

## 4. Code style

- Follow `AGENTS.md`: **UI text Thai, code/comments English**; mobile-first; `dark:` on every
  surface; touch targets ≥44px.
- Thin page → logic in helpers (mirror the server-service pattern, but client-side geometry here).
- TypeScript strict; no `any`. Device presets typed via a `DevicePreset` union/const.
- Tailwind utility classes (no new CSS files); scaling via inline `style` for the dynamic
  `transform`/dimensions only.
- Reuse existing tokens/colors from the app's palette for visual consistency.

## 5. Testing strategy

- **Unit (Vitest, no DB):** `devices.ts` helpers — `rotate()` swaps w/h; `fitScale()` returns
  ≤1 and preserves aspect ratio; `getPreset()` returns the correct preset / falls back to default.
- **Type/lint gate:** `npm run typecheck` + `npm run lint` clean.
- **Manual / browser:** load `/showcase`, verify each preset + rotation reflows the framed app,
  fit-to-screen has no clipping, both entry-point links work, light/dark + 375px width OK.
  (Optional: Chrome DevTools MCP screenshot per preset for the README.)
- No integration/DB test needed — feature touches no data layer.

## 6. Boundaries

**Always**
- Keep it **company-safe**: synthetic data only; the frame just wraps the existing demo.
- Preserve demo-mode (`isDemoMode()`) behavior; the wrapper must work with no DB / no env.
- Keep existing app pages untouched except the two small link additions (login + banner).
- Add the matching mock branch only if a `src/server/*` service is introduced (none planned).

**Ask first**
- Before adding any new dependency (e.g. a device-mockup library) — default is hand-rolled CSS.
- Before persisting showcase state anywhere beyond URL query / local component state.
- Before changing `proxy.ts` matcher semantics beyond excluding `/showcase`.

**Never**
- Never add real names/serials/locations/emails.
- Never commit `.env`/secrets/tokens.
- Never auto-commit / push / deploy — the user commits themselves.
- Never alter business logic, RBAC, or the data layer to serve the showcase.
```
