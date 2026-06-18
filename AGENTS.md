# StockCheck — project guide (read before exploring)

**StockCheck** is a mobile-first, generic **serialized-asset tracker** (1 row = 1 physical item) with a
verify/audit workflow. It's a **company-safe portfolio demo** adapted from an internal tool — all data is
synthetic. Product overview: `README.md`; architecture & decisions: `ARCHITECTURE.md`; deploy: `DEPLOY.md`;
portfolio plan/spec: `PORTFOLIO-SPEC.md` + `tasks/portfolio-*.md`.

> ⚠️ This is a recent Next.js (16) / Prisma (7) setup — APIs differ from older training data. Check
> `node_modules/next/dist/docs/` before writing framework code.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · **Prisma 7 + PostgreSQL** (Neon in prod) ·
Auth.js v5 (`next-auth`) · Tailwind 4 · next-themes · Vitest · SheetJS (`xlsx`) · Zod.

## Commands

`npm run dev` · `build` · `start` · `lint` · `typecheck` · `test` (Vitest) · `db:seed` · `db:studio`.

## ⭐ The one rule that shapes everything: dual-mode data layer

Every data function in `src/server/*` branches on `isDemoMode()` (`src/lib/demo.ts`):

```ts
if (isDemoMode()) return mockX(...);   // in-memory store, no DB  (no DATABASE_URL, or DEMO_MOCK=1)
return prisma.item.findMany(...);      // real PostgreSQL          (DATABASE_URL set)
```

So the app builds and runs with **zero config / no DB**. When you add or change a service, you MUST add the
matching branch in `src/server/mock/store.ts` and keep the return shape identical, or demo mode breaks.
The seed dataset is shared: `src/server/mock/data.ts` (used by both the mock store and `seedDemo`).

## Directory map

```
src/
  lib/demo.ts            isDemoMode() — the dual-mode switch
  lib/prisma.ts rbac.ts session-guard.ts errors.ts datetime.ts ...
  auth.ts                Auth.js v5 (Credentials + JWT + role/id)
  proxy.ts               route protection (Next 16 replaces middleware; MUST be in src/)
  server/                business logic — DB/rules live ONLY here
    units.ts problems.ts audit.ts export.ts verify.ts update-unit.ts import.ts
    delete-unit.ts checklist.ts users.ts auth-verify.ts discrepancy.ts(pure)
    seed-demo.ts         seedDemo(prisma) — real-DB seed (side-effect-free; reused by reset)
    demo-reset.ts        resetDemoData() — mock reset OR seedDemo, by mode
    mock/data.ts         shared deterministic dataset (4 categories)
    mock/store.ts        in-memory store + mockX() for every service
  app/(auth)/login/      login + "🚀 เข้าสู่ Live Demo" (enterDemo action)
  app/(app)/             authed pages: units · units/[id] · problems · import · settings · users · trash · audit
  app/api/units/ import/ auth/   route handlers
  app/api/demo/reset/    token-guarded re-seed (Vercel Cron)
  app/demo-actions.ts    resetDemoAction (admin) for the banner button
  components/DemoBanner.tsx  Live-Demo bar + Reset (in root layout)
  types/inventory.ts     enums + Thai labels
  generated/prisma/      Prisma client (gitignored — `prisma generate`)
prisma/                  schema.prisma · migrations/ · seed.ts (CLI wrapper)
tests/                   unit/ (pure + mock) · integration/ (hits DB)
```

## Domain model (`Item`)

- 🔒 **stable core:** `serialNumber` (unique only among `verified` — partial index), `status`, `verifyState`, `version` (optimistic lock), `category` (free-form: signage/laptop/tool/…).
- 🧩 **generic optional:** `model`, `location`, `boxSerialNumber` (secondary code/asset tag), `boxLocation`, `note`.
- 🔧 **flexible:** `attributes` (JSON) = category-specific specs (e.g. signage `{displaySize, macAddress}`). **Logic-bearing fields are never stored in JSON.**
- `ChecklistItem.category` scopes a check to a category (null = all). **discrepancy = a recorded active checklist item is missing** (not S/N). `deletedAt` = soft delete.

## Conventions

- **Server-service pattern:** pages/route handlers stay thin → call `src/server/*`. **Every `Item` mutation writes a `ChangeLog` in the same transaction.**
- **RBAC:** pages `hasRole(...)`; API/services `requireRole(...)` → 401/403.
- **Mobile-first + dark mode** on every surface (`dark:` variants, touch ≥44px). UI text **Thai**; code/comments English.
- **TDD:** new logic → server service + test (mock tests need no DB; integration tests need `DATABASE_URL`).

## Gotchas

- **Run tests against local Postgres**, not Neon: `$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stockcheck_dev?schema=public"; npm run test`.
- **Prisma 7:** no engine — client via driver adapter (`PrismaPg`); Migrate URL in `prisma.config.ts`; client output `src/generated/prisma`. `serialNumber` partial-unique index is raw SQL in the migration.
- **Next 16:** `params`/`searchParams`/`cookies()` are Promises (await); route protection is `src/proxy.ts`.
- **Demo reset:** `/api/demo/reset` needs a token (`DEMO_RESET_TOKEN` or `CRON_SECRET`). Vercel **Hobby** cron = once/day (`vercel.json` `0 0 * * *`).

## Boundaries (this is a portfolio demo)

- **Company-safe:** synthetic data only — never add real names/serials/locations/emails.
- **Never commit** `.env`/secrets/tokens (only `.env.example` is tracked).
- **No auto-commit/push/deploy** — tell the user; they commit themselves.
