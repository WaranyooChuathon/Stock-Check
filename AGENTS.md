<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Project guide — Check Stock Signage (read this before exploring)

เครื่องมือให้ทีมเล็กเคลียร์/ตรวจนับสต็อกเครื่อง Smart Signage รายตัว (mobile-first).
รายละเอียดเต็มดู `SPEC.md`; แผนงาน/สถานะดู `tasks/todo.md` + `tasks/plan.md`.

## Stack (verified June 2026 — อย่าถอยเวอร์ชัน)

Next.js 16 (App Router, Turbopack) · React 19.2 · TypeScript · **Prisma 7 + PostgreSQL** · Auth.js v5 (`next-auth@beta`) · Tailwind 4 · next-themes · Vitest + Playwright · xlsx (SheetJS).

## Commands

`npm run dev` · `build` · `start` · `lint` · `typecheck` · `format` · `test` (Vitest) · `test:e2e` (Playwright, mobile) · `db:seed` · `db:studio`.

## Directory map (อะไรอยู่ไหน)

```
src/
  auth.ts                Auth.js v5 config (Credentials + JWT + role/id callbacks; trustHost:true)
  proxy.ts               route protection (Next 16 replaces middleware; MUST be in src/)
  app/(auth)/login/      login page + LoginForm (useActionState) + actions
  app/(app)/             pages หลังล็อกอิน (layout = auth guard + header: BackButton/ThemeToggle/logout)
    page.tsx             home (เมนูการ์ด; การ์ด admin ใช้ isAdmin)
    units/               รายการ + ค้นหา/กรอง + ปุ่ม Export
    units/                รายการ + ค้นหา/กรอง + Export · UnitsView(card/table) · actions.ts=bulkDeleteAction(admin)
    units/[id]/          detail + VerifyForm + EditForm + ประวัติ + DeleteUnitButton (actions.ts = verify/edit/deleteUnitAction)
    problems/            หน้าเครื่อง discrepancy
    trash/               admin: ถังขยะ (soft-deleted) — กู้คืน/ลบถาวร + DeletionArchive (actions.ts = restore/purge/purgeExpired)
    audit/               admin: บันทึก ChangeLog ทั้งหมด + กรอง action/ผู้ใช้ + pagination
    import/ settings/ users/   admin-only (guard ด้วย hasRole ในหน้า)
  app/api/units/         GET list · export/ (xlsx) · auth/[...nextauth] · import/ (POST, admin)
  server/                business logic (ตรรกะอยู่ที่นี่ ไม่ใช่ในหน้า):
    discrepancy.ts       evaluateDiscrepancy — pure; discrepancy = อุปกรณ์ active ขาด เท่านั้น
    verify.ts            verifyUnit (transaction + ChangeLog + serial-conflict guard)
    update-unit.ts       updateUnit (optimistic lock ด้วย version → 409)
    delete-unit.ts       soft delete: softDeleteUnit(s)/restoreUnit/purgeUnit/purgeExpired + RETENTION_DAYS(30)
    units.ts             listUnits/getUnitDetail/buildUnitWhere/listDeletedUnits (buildUnitWhere กรอง deletedAt:null)
    audit.ts             listAuditLog ({action?,userId?,page}) — paginated ChangeLog
    import.ts export.ts problems.ts checklist.ts users.ts auth-verify.ts
  lib/                   prisma.ts (singleton+PrismaPg) · rbac.ts (hasRole) · session-guard.ts (requireRole) · errors.ts · api-auth.ts
  types/signage.ts       enums + labels (UNIT_STATUS/VERIFY_STATE/USER_ROLE/DISPLAY_SIZES)
  generated/prisma/      Prisma client (gitignored — `prisma generate` สร้าง)
prisma/                  schema.prisma · migrations/ · seed.ts
tests/                   unit/ (pure) · integration/ (ชน DB) · e2e/ (Playwright)
```

## Conventions

- **TDD**: เขียน test ก่อน (RED→GREEN). logic ใหม่ → server service + test.
- **Server services pattern**: ตรรกะ DB/ธุรกิจอยู่ใน `src/server/*`; pages/route handlers แค่เรียกใช้.
- **RBAC**: pages admin guard ด้วย `hasRole(session?.user?.role,['admin'])`; API guard ด้วย `requireRole([...])` → 401/403 (`authErrorResponse`).
- **ทุกการแก้ SignageUnit เขียน ChangeLog** ใน transaction เดียวกัน.
- **Mobile-first + dark mode**: ทุก surface ต้องมี `dark:` variants; touch ≥44px.
- **ห้าม auto-commit git** — บอกผู้ใช้แล้วผู้ใช้ commit เอง.

## Domain model essentials (`SignageUnit`)

- `serialNumber` = S/N เครื่องจริง · `boxSerialNumber` = **"S/N Software"** (Software Setup Number — label เดิม "S/N กล่อง"; **ไม่นำมาเทียบกับ serialNumber**)
- `verifyState`: `unverified | verified | discrepancy`. **discrepancy = อุปกรณ์ active ขาด เท่านั้น** (ไม่ใช่ S/N)
- `status`: `in_stock | lease_or_sold | trial | repair_lost` · `location` (เครื่อง) · `boxLocation` (กล่อง) · `note` (หมายเหตุ) · `version` (optimistic lock) · `attributes` (Json จาก import)
- `deletedAt`/`deletedById` = **soft delete** (null = active). ทุก read ปกติกรอง `deletedAt:null` (ผ่าน buildUnitWhere/getUnitDetail/problems). purge = hard delete + snapshot ลง `DeletionArchive`
- ChecklistItem (admin แก้ได้) + UnitChecklist (ผลตรวจต่อเครื่อง) · ChangeLog (audit; action: import/verify/edit/delete/restore)

## Gotchas สำคัญ (อย่าลืม)

- **DB: dev ใช้ Postgres local, prod ใช้ Neon** — ตอน dev/test สลับ `.env` `DATABASE_URL` เป็น local ไม่งั้นช้า/test พังเพราะชน Neon. รัน test: `$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/signage_dev?schema=public"; npm run test`.
- **Prisma 7**: ไม่มี `url` ใน schema — อยู่ใน `prisma.config.ts` (`DIRECT_DATABASE_URL ?? DATABASE_URL`). ต้องใช้ driver adapter (PrismaPg). `serialNumber` unique เฉพาะกลุ่ม `verified` (partial index ใน migration).
- **Migration บน prod**: rename/เปลี่ยนความหมายให้คงคอลัมน์เดิม (อย่า migrate ที่กระทบข้อมูล prod). migration จริงรันชี้ local เท่านั้น; Vercel รัน `migrate deploy` ตอน deploy.
- **Next 16**: `params`/`searchParams`/`cookies()` เป็น Promise (await); `proxy.ts` (ไม่ใช่ middleware) อยู่ใน `src/`.
- **Vercel**: region `sin1` (`vercel.json`) อยู่ region เดียวกับ Neon สิงคโปร์ (ไม่งั้นช้า); ต้องตั้ง `DATABASE_URL`(pooled), `DIRECT_DATABASE_URL`(direct), `AUTH_SECRET`.
- **Auth.js**: `trustHost:true` (จำเป็นตอน self-host/local prod); seed: admin/admin123, staff/staff123.
- **Soft delete**: อย่าลืมกรอง `deletedAt:null` ในทุก read ใหม่ที่ query `SignageUnit` (ไม่งั้นเครื่องที่ลบจะโผล่). purge = hard delete → ChangeLog/UnitChecklist ของตัวนั้นถูก cascade ลบ (ตั้งใจ; หลักฐานอยู่ `DeletionArchive`). retention 30 วัน เป็น **manual** (ไม่มี cron) — purge ทำผ่านหน้า /trash. รัน migration ใหม่ต้อง override env เป็น local ก่อน (`$env:DIRECT_DATABASE_URL` + `DATABASE_URL`) ห้ามชน Neon.
