# TODO — Device-Frame Showcase Mode

Plan: `tasks/plan.md` · Spec: `SPEC.md` · Branch: `feat/showcase-device-frame`

## Phase A — Geometry core
- [x] **T1** `src/app/showcase/devices.ts` — `DevicePreset` type, `DEVICE_PRESETS`
      (8.8"=820×1180, 11"=840×1230, web=full), `getPreset`, `rotate`, `fitScale`, defaults.
- [x] **T1** `tests/unit/showcase-devices.test.ts` — getPreset/fallback, rotate swap,
      fitScale ≤1 + aspect-ratio preserved. (12 tests passing)
- [x] ◆ Checkpoint A: `npm run test -- showcase-devices` + `typecheck` green.

## Phase B — Client frame
- [x] **T2** `src/app/showcase/ShowcaseFrame.tsx` (`'use client'`) — toolbar (presets + rotate),
      tablet bezel + `<iframe src="/">`, resize-aware `fitScale` transform, web = no bezel.
- [x] ◆ Checkpoint B: `typecheck` + `lint` clean.

## Phase C — Public route
- [x] **T3** `src/app/showcase/page.tsx` — thin server shell rendering `<ShowcaseFrame />`.
- [x] **T3** `src/proxy.ts` — add `showcase` to matcher exclusion (make route public).
- [x] **T3** `src/components/BannerGate.tsx` + layout — hide outer DemoBanner on /showcase
      (avoid double banner / overflow). ShowcaseFrame uses `h-dvh` + stage `min-h-0` for fit-scale.
- [x] ◆ Checkpoint C: verified in browser — public framed login, 3 presets + rotate + fit-to-screen,
      demo-enter inside frame → authed dashboard stays in bezel; typecheck/lint/build green.

## Phase D — Entry points
- [x] **T4** `src/app/(auth)/login/page.tsx` — add "📱 ดูแบบ Tablet" → `/showcase`.
- [x] **T5** `src/components/DemoBanner.tsx` — add "📱 Tablet view" → `/showcase`.
- [x] ◆ Checkpoint D: both links verified in browser → `/showcase`.

## Phase E — Polish & verify
- [x] **T6** Manual sweep done in browser: 3 presets + rotate reflow ✓, 11" fit-no-clip ✓,
      both entry links ✓, banner on every page ✓, toolbar usable at 375px ✓. README "Tablet
      showcase" note added. (Light-mode classes present; not OS-forced.)
- [x] ◆ Checkpoint E: unit tests pass + `build` compiled; 7 failing tests are pre-existing
      integration (need local Postgres), unrelated to this feature. Ready for user to commit.

## Deferred / optional
- [ ] URL state `?device=&o=` for shareable framed views (SPEC nice-to-have, post-v1).
