# PLAN — Device-Frame Showcase Mode

Source spec: `SPEC.md`. Branch suggestion: `feat/showcase-device-frame`.
Approach: build the **pure geometry core first** (testable, no DOM), then the **client frame**,
then the **public route**, then **entry-point links**, then **polish/verify**. Each task is a
vertical slice that leaves the app in a working, type-clean state.

## Dependency graph

```
T1 devices.ts (pure helpers + presets)         ── unit-testable, no deps
        │
        ▼
T2 ShowcaseFrame.tsx (client: toolbar+bezel+iframe+scale)  ── depends on T1
        │
        ▼
T3 /showcase route + proxy public exclusion     ── depends on T2, makes it reachable
        │
        ├──► T4 Login entry link                 ── depends on T3 (route must exist)
        └──► T5 DemoBanner entry link            ── depends on T3
                        │
                        ▼
            T6 Polish + manual/browser verify     ── depends on T2–T5
```

Vertical-slice rationale: T1→T2→T3 is one complete "framed app renders and switches devices"
path before any entry links are added, so the feature is demonstrable at the `/showcase` URL
even before F5 links exist.

---

## Phase A — Geometry core (no DOM)

### T1 — `devices.ts`: presets + pure helpers
- **Files:** `src/app/showcase/devices.ts` (new), `tests/unit/showcase-devices.test.ts` (new).
- **Build:**
  - `DevicePreset` type: `{ id: '8.8' | '11' | 'web'; label: string; type: 'tablet' | 'web';
    width: number; height: number }` (width/height = logical CSS px portrait; `web` uses 0/0
    sentinel or `type: 'web'`).
  - `DEVICE_PRESETS` const array: 8.8" = 820×1180, 11" = 840×1230, Web (full).
  - `getPreset(id)` → preset, falls back to default (`11`).
  - `rotate({width,height})` → `{width: height, height: width}`.
  - `fitScale(frame, viewport, margin?)` → number ≤1 (= `min(1, min(vw/fw, vh/fh))`),
    preserves aspect ratio; returns 1 when frame fits.
  - `DEFAULT_DEVICE_ID = '11'`, `DEFAULT_ORIENTATION = 'portrait'`.
- **AC:** `getPreset('11')` returns 11" preset; unknown id → default. `rotate` swaps w/h.
  `fitScale` returns ≤1, never up-scales, preserves ratio (scaled w/h ratio == original).
- **Verify:** `npm run test -- showcase-devices` green; `npm run typecheck` clean.

**◆ CHECKPOINT A:** geometry logic proven by tests before any UI is written.

---

## Phase B — Client frame UI

### T2 — `ShowcaseFrame.tsx`: toolbar + bezel + iframe + scaling
- **Files:** `src/app/showcase/ShowcaseFrame.tsx` (new, `'use client'`).
- **Build:**
  - State: `deviceId` (default `'11'`), `orientation` (default `'portrait'`).
  - Toolbar (top): device preset buttons [Web][8.8"][11"], a rotate button (hidden/disabled when
    `web`), Thai labels, dark-mode styled, touch ≥44px, controls wrap on narrow screens.
  - Bezel: rounded-corner tablet shell around an `<iframe src="/">` sized to the active preset's
    logical w/h (after orientation). `web` → no bezel, iframe fills container.
  - Scaling: measure available viewport (resize-aware via `useEffect` + `ResizeObserver`/window
    `resize`), compute `fitScale(...)`, apply `transform: scale()` + `transform-origin: top center`
    to the bezel wrapper. Keep iframe's internal logical px unchanged.
  - iframe attrs: `title`, same-origin (no `sandbox` that would break the session), lazy is fine.
- **AC:** component renders three presets + rotate; switching presets/orientation changes the
  framed iframe dimensions; oversized frames are down-scaled to fit with no page scrollbars;
  `web` shows edge-to-edge with no bezel; light/dark both styled; usable at 375px.
- **Verify:** `npm run typecheck` + `npm run lint` clean. (Visual check happens in T6.)

**◆ CHECKPOINT B:** frame component compiles and is self-contained (not yet routed).

---

## Phase C — Public route

### T3 — `/showcase` route + make it public in `proxy.ts`
- **Files:** `src/app/showcase/page.tsx` (new server shell), `src/proxy.ts` (modify matcher).
- **Build:**
  - `page.tsx`: thin server component — page background + `<ShowcaseFrame />`. No auth call
    needed (wrapper is public; inner iframe self-auths).
  - `proxy.ts`: add `showcase` to the matcher negative-lookahead so `/showcase` is NOT redirected
    to `/login`: `'/((?!api|login|showcase|_next/static|_next/image|favicon.ico).*)'`.
- **AC:** visiting `/showcase` while logged-out renders the framed **login** page (iframe), not a
  redirect of the wrapper itself; entering the demo inside the frame navigates the framed app and
  it stays within the bezel.
- **Verify:** `npm run dev`, open `/showcase` logged-out → framed login visible; click demo enter
  inside frame → framed units page. `npm run build` succeeds.

**◆ CHECKPOINT C:** feature reachable and interactive at `/showcase` (F1–F4 demonstrable).

---

## Phase D — Entry points (parallel-safe after T3)

### T4 — Login page "ดูแบบ Tablet" link
- **Files:** `src/app/(auth)/login/page.tsx` (modify).
- **Build:** add a small secondary link "📱 ดูแบบ Tablet" → `/showcase` below the login card
  (own styling, dark-mode aware, ≥44px tap area).
- **AC:** link visible on `/login`, navigates to `/showcase`.
- **Verify:** typecheck/lint clean; manual click works.

### T5 — DemoBanner "Tablet view" link
- **Files:** `src/components/DemoBanner.tsx` (modify).
- **Build:** add "📱 Tablet view" anchor alongside GitHub / Resume → `/showcase`, matching the
  banner's existing link styling.
- **AC:** link visible on every app page banner, navigates to `/showcase`.
- **Verify:** typecheck/lint clean; manual click works.

**◆ CHECKPOINT D:** both entry points (F5) live.

---

## Phase E — Polish & verification

### T6 — Manual/browser verify + README note
- **Build:** no new logic. Walk the manual checklist; tidy spacing/labels; optionally add a short
  "Tablet showcase" line to `README.md`. (Optional: Chrome DevTools MCP screenshot per preset.)
- **AC (full manual sweep):**
  - Each preset (8.8"/11"/Web) + rotate reflows the framed app correctly.
  - Fit-to-screen: 11" portrait fits on a laptop with no clipping/scrollbars.
  - Both entry links work; banner link present on every app page.
  - Light/dark chrome OK; toolbar usable at 375px width.
- **Verify:** `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all green.

**◆ CHECKPOINT E (final):** full suite green; manual sweep passed; ready for the user to commit.

---

## Notes & deferred items
- **URL state** (`?device=11&o=landscape`) is a SPEC nice-to-have — **deferred** from v1 to keep
  T2 simple; can be a follow-up that reads/writes `searchParams`. Flagged in todo as optional.
- **No new dependency** and **no `src/server/*`/mock changes** — feature touches no data layer
  (per SPEC boundaries), so no integration test is required.
- User commits; **no auto-commit/push/deploy.**
