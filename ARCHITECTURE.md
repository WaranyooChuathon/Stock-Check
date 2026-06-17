# Architecture

How StockCheck is put together, and the decisions worth calling out.

## Layers

```
src/app/**           Next.js App Router — pages, route handlers, server actions (thin)
src/components/**     UI (mobile-first, dark mode); client components only where interactive
src/server/**         business logic — the ONLY place DB/business rules live
src/lib/**            prisma client, auth/rbac helpers, demo switch, pure utils
prisma/               schema + migrations + seed CLI
```

**Server-service pattern.** Pages and route handlers stay thin: they parse input, call a function in
`src/server/*`, and render. All database access and business rules (verify, discrepancy, import,
soft-delete, audit) live in those services. This keeps the logic testable and gives the dual-mode
switch a single, well-defined seam.

## Dual-mode data layer (the headline)

Every service begins with one branch:

```ts
export async function listUnits(filters) {
  if (isDemoMode()) return mockListUnits(filters);   // in-memory, no DB
  return prisma.item.findMany({ ... });               // real PostgreSQL
}
```

`isDemoMode()` is true when `DATABASE_URL` is absent (or `DEMO_MOCK=1`). So:

- **Production (Neon):** `DATABASE_URL` is set → real Prisma. Mutations persist.
- **CI / local / preview:** no env → a deterministic in-memory store seeded from `src/server/mock/data.ts`.

The mock store (`src/server/mock/store.ts`) reproduces the behaviours that matter — optimistic-lock
conflicts (409), the discrepancy rule, serial-uniqueness-among-verified, soft-delete/restore/purge,
and audit logging — so the UI and tests can't tell the difference. The seed dataset is **shared** between
the mock store and the real DB seed (`src/server/seed-demo.ts`), so both modes show the same data.

Why this design: it proves a real full-stack/PostgreSQL implementation while letting the project build
and run with **zero secrets** — ideal for a public portfolio demo and for CI.

## Generic domain (`Item`)

One model represents any tracked asset:

- **Stable core (logic-bearing):** `serialNumber`, `status`, `verifyState`, `version`, `category`.
- **Generic optional:** `model` (name/model), `location`, `boxSerialNumber` (secondary code/asset tag), `boxLocation`, `note`.
- **Flexible edge:** `attributes` (JSON) holds category-specific specs — e.g. signage `{ displaySize, macAddress }`, laptop `{ cpu, ram }`. No schema change to add a category.
- **Checklist** items carry an optional `category` (null = applies to all), so the verify form shows only the relevant checks.

`serialNumber` is intentionally **not** globally unique (import data is messy); a **partial unique index**
enforces uniqueness only among `verified` items.

## Key invariants

- **Every mutation to an `Item` writes a `ChangeLog` row in the same transaction.** That's the audit trail; it is never bypassed.
- **Optimistic locking** via a `version` column: edits use `updateMany({ where: { id, version } })` and a zero-row result becomes a `409` — no silent overwrite.
- **Discrepancy = a recorded active checklist item is missing.** Computed from what was actually recorded for that item, so adding a checklist item later never retroactively flags already-verified items.
- **Soft delete:** `deletedAt` hides an item from all normal reads (filtered centrally in `buildUnitWhere` / `getUnitDetail`). Recoverable from `/trash` for `RETENTION_DAYS` (30), then purged — a snapshot is archived to `DeletionArchive` before the hard delete.
- **RBAC:** pages guard with `hasRole(...)`, services/routes with `requireRole(...)` → 401/403.

## Demo data hygiene

Because the public demo writes to a real database, visitor edits would accumulate. Two guards keep it tidy:

- **`/api/demo/reset`** — token-guarded (Vercel Cron `Authorization: Bearer`, or `x-demo-reset-token`). Re-runs the seed (real mode) or rebuilds the mock store (demo mode).
- **Vercel Cron** — hits that endpoint on a schedule (`vercel.json`). An in-app **"Reset demo"** button (admin) calls the same reset logic via a server action.

## Notable framework specifics (Next.js 16 / Prisma 7)

- Route protection lives in `src/proxy.ts` (Next 16 replaces `middleware.ts`).
- `params` / `searchParams` / `cookies()` are async — always awaited.
- Prisma 7 has no engine: the client is built with a **driver adapter** (`PrismaPg`); the Migrate URL lives in `prisma.config.ts`, and the generated client is emitted to `src/generated/prisma` (gitignored).
