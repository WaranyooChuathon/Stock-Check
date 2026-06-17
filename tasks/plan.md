# Implementation Plan — ระบบเช็ค/ตรวจนับสต็อก Smart Signage

อ้างอิง [SPEC.md](../SPEC.md) · ที่มา [docs/ideas/stock-check.md](../docs/ideas/stock-check.md)
สถานะ: โปรเจกต์ว่าง (greenfield) — ยังไม่มีโค้ด

---

## ✅ Stack verified กับ docs ทางการ (June 2026 — source-driven-development)

ก่อนเริ่ม T1 ได้ตรวจเวอร์ชันจริงแล้ว (เดิม SPEC ใช้เวอร์ชันล้าสมัย):

- **Next.js 16** (ไม่ใช่ 15): Turbopack default, **async request APIs บังคับ** (`params`/`searchParams`/`cookies`/`headers` ต้อง await), **`middleware.ts`→`proxy.ts`**, `next lint` ถูกลบ→ESLint CLI + Flat Config, Node ≥20.9, TS ≥5.1, React 19.2
- **Prisma 7** (ไม่ใช่ 6): บังคับ driver adapter — dev `@prisma/adapter-better-sqlite3`, prod `@prisma/adapter-pg`
- **Auth.js v5** `next-auth@beta`: `auth.ts` (root), route handler `app/api/auth/[...nextauth]/route.ts`, `proxy.ts` สำหรับ protection, `AUTH_SECRET` บังคับ
- **Tailwind 4.3**: `@tailwindcss/postcss`, config ใน CSS (ไม่มี tailwind.config.js)
- ✅ **ผู้ใช้เลือก Prisma 7** (current) — ใช้ driver adapter
- รายละเอียด gotchas + citations อยู่ใน [SPEC.md](../SPEC.md) §2

## หลักการวางแผน

- **Vertical slice:** แต่ละ task ส่งมอบ "เส้นทางครบ 1 เส้น" (UI → API → DB → test) ที่ใช้งานได้จริง ไม่ใช่ทำทีละ layer แนวนอน
- **เฟสรากฐานก่อน:** scaffold + schema + auth เป็นตัว enable ทุกอย่าง ต้องเสร็จก่อน
- **หัวใจมาเร็ว:** ฟีเจอร์ "ตรวจยืนยัน + จับ discrepancy" คือคุณค่าหลัก ดันมาก่อน import (ใช้ seed เป็นข้อมูล dev เพื่อไม่ต้องรอ import)
- **เกณฑ์ผ่านทุก task:** `npm run lint` + `npm run test` + `npm run build` ผ่าน และ acceptance criteria ครบ

---

## การตัดสินใจที่ finalize ในแผนนี้

### 1. Identity / uniqueness ของ `serialNumber` (จุดที่สเปคทิ้งไว้)

- **PK = surrogate `id`** (cuid) — ไม่ใช่ serialNumber
- **`serialNumber` ไม่ทำ global unique ที่ DB** (ข้อมูลเดิมมี S/N ซ้ำ/ว่างจริง)
- บังคับ uniqueness **เฉพาะกลุ่ม `verifyState = 'verified'`** ผ่าน 2 ชั้น:
  - **App layer:** service ตรวจก่อน set เป็น verified — ถ้าชนกับ verified ตัวอื่น ตอบ error ให้แก้
  - **DB layer (hardening):** partial unique index `WHERE verifyState='verified' AND serialNumber IS NOT NULL` (SQLite + Postgres รองรับ) เพิ่มผ่าน raw SQL ใน migration (Prisma schema ไม่รองรับ partial index ตรงๆ)
- import: S/N ซ้ำ/ว่าง → นำเข้าได้ ติดธง `discrepancy` + รายงาน

### 2. ข้อมูล dev

- `seed.ts` สร้าง: admin 1 + staff 1, ChecklistItem 2 ("สายไฟ AC", "เสา Wi-Fi"), SignageUnit ตัวอย่าง ~15 ตัว (มีทั้ง verified / unverified / discrepancy เพื่อทดสอบทุกหน้า)

### 3. RBAC

- helper `requireRole()` ฝั่ง server; staff = อ่าน+verify+edit, admin = +import +delete +settings +manage users

---

## Dependency Graph

```
T1 scaffold ──┬─> T2 schema+seed ──┬─> T3 auth ──┬─> T4 list/search ──> T5 verify(หัวใจ) ──> T6 edit+lock
              │                    │             │                          │
              │                    │             │                          ├─> T7 problems view
              │                    │             │                          │
              │                    │             └─────────────────────────-┴─> T8 import (admin)
              │                    │                                         └─> T9 settings checklist (admin)
              └────────────────────┴──────────────────────────────────────────> T10 E2E + ship prep
```

- T1→T2→T3 เป็นโซ่รากฐาน (ต้องเรียงตามนี้)
- T4 ต้องมาก่อน T5 (verify อยู่ในหน้า detail ที่ลิงก์มาจาก list)
- T5 เป็น prerequisite ของ T6/T7 (อาศัย discrepancy logic + ChangeLog)
- T8/T9 ขนานกันได้หลัง T5 (แตะ schema คนละส่วน)
- T10 ปิดท้าย

---

## เฟสและ Task

### 🔹 Phase 0 — Foundation

#### T1 — Project scaffold + toolchain

ตั้ง Next.js 16 (App Router, TS strict) + Tailwind 4 + ESLint/Prettier + Vitest + Playwright + โครงโฟลเดอร์ตามสเปค

- **Acceptance:** `npm run dev` เปิดหน้าแรกได้, `npm run lint` ผ่าน, `npm run test` รัน (เทสต์ตัวอย่าง 1 ตัวผ่าน), `npm run build` ผ่าน
- **Verify:** เปิด http://localhost:3000 เห็นหน้า, รัน 3 คำสั่งข้างบนผ่านหมด
- **Files:** `package.json`, `next.config`, `tailwind`, `eslint`, `.prettierrc`, `vitest.config`, `playwright.config`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.example`, `.gitignore`

#### T2 — Prisma 7 schema + migration + seed

นิยาม model ทั้งหมด (User, SignageUnit, ChecklistItem, UnitChecklist, ChangeLog) + **Prisma 7 client singleton ผ่าน driver adapter** (`PrismaBetterSqlite3` สำหรับ dev) + migration แรก + partial unique index (raw SQL) + `seed.ts`

- **Acceptance:** migrate สำเร็จ, `prisma studio` เห็นทุกตาราง, `npm run db:seed` สร้าง admin/staff/checklist/units ตัวอย่าง, partial unique index มีจริง
- **Verify:** `npx prisma migrate dev` + `npm run db:seed` ไม่ error; query นับ row ได้; ทดสอบ insert verified ที่ S/N ซ้ำ → ติด constraint
- **Test (unit):** ฟังก์ชัน discrepancy logic (`serialNumber ≠ boxSerialNumber` หรือ checklist ไม่ครบ → discrepancy) — เขียนเป็น pure function ใน `src/server/` ทดสอบก่อนต่อ UI

> ✅ **Checkpoint A** — รากฐาน DB พร้อม รีวิว schema + การตัดสินใจ uniqueness ก่อนไปต่อ

---

### 🔹 Phase 1 — Auth (vertical slice)

#### T3 — Login / logout / route protection / RBAC

Auth.js v5 (`next-auth@beta`): `auth.ts` (root) + Credentials provider, route handler `app/api/auth/[...nextauth]/route.ts`, **`proxy.ts`** (`export { auth as proxy }`) สำหรับบังคับ session, หน้า `(auth)/login`, logout, helper `requireRole()`

- **Acceptance:** ใส่รหัสถูกเข้าได้ / ผิดขึ้น error, เข้าหน้าใน `(app)` โดยไม่ล็อกอิน → redirect ไป login, logout ได้
- **Verify:** ลองล็อกอิน admin/staff ที่ seed ไว้, เข้า /units ตรงๆ ตอนยังไม่ล็อกอิน → เด้ง login
- **Test (integration):** auth success/fail, protected route redirect, `requireRole` คืน 403 เมื่อ role ไม่พอ

> ✅ **Checkpoint B** — ประตูระบบพร้อม ทุก task ถัดไปอยู่หลัง auth

---

### 🔹 Phase 2 — รายการ + ค้นหา (read path)

#### T4 — Units list + search/filter (mobile-first)

หน้า `(app)/units` แสดงรายการ (Server Component) + `GET /api/units` รองรับ query: ค้น S/N/MAC, กรอง status/displaySize/verifyState

- **Acceptance:** เห็นรายการจาก seed, ค้นด้วย S/N/MAC ได้ผลถูก, กรองตาม status/displaySize/verifyState ได้, แสดงผลดีบนจอมือถือ (แตะง่าย ≥44px)
- **Verify:** เปิดบน viewport มือถือใน devtools, พิมพ์ค้น/กดกรอง เห็นผลเปลี่ยน
- **Test (integration):** GET /api/units + query params คืนผลกรองถูก

---

### 🔹 Phase 3 — ตรวจยืนยัน (หัวใจของระบบ)

#### T5 — Unit detail + verify form + discrepancy + ChangeLog

หน้า `(app)/units/[id]` + ฟอร์มตรวจยืนยัน (กรอก S/N เครื่อง/MAC/ขนาดจอ + เช็ค checklist ตาม ChecklistItem active) + `POST /api/units/[id]/verify` ผ่าน unit service (transaction: อัปเดต + UnitChecklist + ChangeLog) + auto-flag discrepancy

- **Acceptance:** บันทึกผลแล้ว `verifyState` เปลี่ยนถูก; ถ้า S/N เครื่อง ≠ กล่อง หรือ checklist ข้อ active ใด `present=false` → ตั้ง `discrepancy` อัตโนมัติ; บันทึก `verifiedBy/At`; ทุกการเปลี่ยนมี ChangeLog
- **Verify:** ตรวจเครื่อง 1 ตัวที่ S/N ตรง+อุปกรณ์ครบ → verified; อีกตัว S/N ไม่ตรง → discrepancy; เปิดดูประวัติเห็น log
- **Test (integration):** verify → state ถูก, discrepancy auto-flag (2 เคส: S/N ไม่ตรง / อุปกรณ์ขาด), ChangeLog ถูกเขียน, ฟอร์มแสดง checklist ตาม config ปัจจุบัน

#### T6 — Edit unit + optimistic lock (409)

`PUT /api/units/[id]` แก้ข้อมูลหลัก ผ่าน service + ตรวจ `version` (optimistic lock) + ChangeLog

- **Acceptance:** แก้สำเร็จเพิ่ม version; แก้ด้วย version เก่า (มีคนแก้ก่อน) → 409 ไม่ทับเงียบ; ทุกการแก้มี ChangeLog
- **Verify:** เปิด 2 แท็บแก้ตัวเดียวกัน กด save ทั้งคู่ → ตัวหลังได้ 409 + ข้อความให้โหลดใหม่
- **Test (integration):** edit สำเร็จ + version เพิ่ม, concurrent stale version → 409, changelog ครบ

> ✅ **Checkpoint C** — flow หลัก (เคลียร์สต็อก) ใช้ได้ครบ ทดลองใช้จริง 5–10 เครื่อง รีวิว UX มือถือ ก่อนทำ import

---

### 🔹 Phase 4 — หน้าปัญหา

#### T7 — Problems view

หน้า `(app)/problems` แสดงเฉพาะ unit ที่ `verifyState='discrepancy'` พร้อมเหตุผล (S/N ไม่ตรง / อุปกรณ์ขาด) ลิงก์ไปหน้า detail

- **Acceptance:** แสดงเฉพาะ discrepancy ครบถ้วน, เห็นสาเหตุ, กดเข้าไปแก้แล้วหลุดจากรายการเมื่อแก้เป็น verified
- **Verify:** เปิด /problems เทียบกับ seed; แก้ตัวหนึ่งให้ verified แล้ว refresh ต้องหายไป
- **Test (integration):** query problems คืนเฉพาะ discrepancy

---

### 🔹 Phase 5 — Import (admin) — ขนานกับ Phase 6 ได้

#### T8 — Import Excel/CSV + column mapping + value mapping

หน้า `(app)/import` (admin) + `POST /api/import`: อ่านไฟล์ด้วย SheetJS → แสดงหัวคอลัมน์ → ผู้ใช้แมปคอลัมน์ (pre-fill default mapping จากสเปค) → แมปค่า `สถานะ` ไทย→enum → import ทุกแถว, คอลัมน์ไม่แมปลง `attributes`, S/N ซ้ำ/ว่างติดธง discrepancy + รายงานสรุป

- **Acceptance:** ไฟล์หัวตารางต่างกันก็ import ได้, default mapping pre-fill ถูก, คอลัมน์ส่วนเกินไป `attributes`, แถว S/N ซ้ำ/ว่างไม่ถูกทิ้งแต่ติดธง+รายงาน, แถวผิดรูปแบบถูกข้ามพร้อมแจ้ง, staff เรียก → 403
- **Verify:** import ไฟล์ตัวอย่าง (สร้างจากหัวคอลัมน์จริง: S/N, Size, สถานะ, S/N Signage, MAC Address) เห็นรายงานสรุป + ข้อมูลเข้าถูก
- **Test (unit+integration):** parse/validate แถว, mapping logic, dup/blank → discrepancy, attributes overflow, RBAC 403

---

### 🔹 Phase 6 — Settings checklist (admin)

#### T9 — ChecklistItem CRUD

หน้า `(app)/settings` (admin): เพิ่ม/ลบ/จัดลำดับ/ปิดใช้ ChecklistItem

- **Acceptance:** admin เพิ่ม/ลบได้, ฟอร์มตรวจ (T5) สะท้อนรายการปัจจุบัน, เพิ่มรายการใหม่ไม่ย้อนทำให้เครื่องที่ verified แล้วกลายเป็น discrepancy, staff เข้าไม่ได้ (403)
- **Verify:** เพิ่ม "รีโมท" แล้วเปิดฟอร์มตรวจเครื่องใหม่เห็นข้อนี้; เครื่องที่ verified ก่อนหน้ายังคงสถานะเดิม
- **Test (integration):** CRUD checklist, active toggle, ไม่กระทบ verified เดิม, RBAC

---

### 🔹 Phase 7 — Hardening + Ship prep

#### T10 — E2E + RBAC sweep + docs

Playwright E2E flow หลักบน viewport มือถือ + ตรวจ RBAC ครบทุก endpoint + README + `.env.example` + ตรวจ `.gitignore` กัน `.env`

- **Acceptance:** E2E: ล็อกอิน → ค้นหา → ตรวจยืนยัน → เห็นใน /problems → logout ผ่านบนจอมือถือ; staff โดน 403 ทุก endpoint admin; README รันตามได้จริง
- **Verify:** `npm run test:e2e` ผ่าน; ทำตาม README จากเครื่องเปล่าได้
- **Test (e2e):** happy path + RBAC negative cases

> ✅ **Checkpoint D (Final)** — go/no-go: lint+test+build+e2e เขียว, ทดลองใช้จริงกับทีม 2–3 คน

---

## ความเสี่ยง / จุดเฝ้าระวัง

- **ข้อมูล Excel จริงรกกว่าที่คิด** (ค่าสถานะแปลก, S/N ปนรูปแบบ) → value-mapping UI ใน T8 ต้องยืดหยุ่น + รายงานสิ่งที่ map ไม่ได้
- **Optimistic lock ใน Server Components** → ต้องส่ง `version` ปัจจุบันลงฟอร์มและตรวจฝั่ง server เสมอ
- **partial unique index** ต่าง dialect (SQLite/Postgres) — เขียน raw SQL ให้รองรับ target ที่จะ deploy จริง
- **mobile-first** อย่าปล่อยให้เป็น desktop-first แล้วค่อยย่อ — ทดสอบบน viewport มือถือทุก task ที่มี UI

## ลำดับแนะนำ

T1 → T2 → **[Checkpoint A]** → T3 → **[Checkpoint B]** → T4 → T5 → T6 → **[Checkpoint C]** → T7 → (T8 ∥ T9) → T10 → **[Checkpoint D]**

---

## Phase 9 — หมายเหตุ + Soft delete + Audit log (SPEC §8)

> อ้างอิง [SPEC.md §8](../SPEC.md). หลัก: **soft delete + retention 30 วัน** (ไม่ hard delete ตรงๆ เพราะ ChangeLog/UnitChecklist `onDelete: Cascade` จะถูกทำลาย = เสีย audit trail). PK เป็น `cuid()` จึงไม่มีปัญหา "เสีย index". migration ทั้งหมด **additive** (nullable col / enum value / table ใหม่) → ปลอดภัยกับข้อมูล prod เดิม. รัน migration **local เท่านั้น**; prod รันตอน deploy.

### Dependency Graph (Phase 9)

```
T14 (คอลัมน์หมายเหตุ) ── อิสระ (ไม่มี migration, ใช้ field note เดิม) → ship ได้เลย

T15 (schema+migration+types) ─┬─→ T16 (delete-unit service + กรอง deletedAt ทุก read)
   [Checkpoint E: review schema]│        ├─→ T17 (ลบจาก detail)
                                │        ├─→ T18 (bulk ลบในตาราง)
                                │        └─→ T19 (หน้า /trash: กู้คืน/purge)
                                └─────────→ T20 (หน้า /audit + เมนู home)
                                                   [Checkpoint F: go/no-go]
```

### T14 — คอลัมน์ "หมายเหตุ" ใน Table view  *(ไม่มี migration)*

- `src/server/units.ts`: `listSelect` += `note: true` (+ ปรับ integration test ที่เช็ค shape ถ้ามี)
- `src/lib/sort-units.ts`: `SortKey` += `'note'` (+ unit test เรียง note locale ไทย, ค่าว่างไปท้าย)
- `src/components/units/UnitsTable.tsx`: เพิ่มคอลัมน์ "หมายเหตุ" — `max-w` + `truncate` + `title={note}`, ค่าว่าง = "—"
- **Acceptance:** ตารางมีคอลัมน์หมายเหตุ, คลิกหัวเรียงได้, ข้อความยาวถูกตัด + hover เห็นเต็ม, dark ครบ
- **Verify:** `npm run test` (sort-units + units) · `lint` · `typecheck` · ดูจริงใน table view

### T15 — Schema + migration (additive) + types  ⬅ ฐานของ delete ทั้งหมด

- `prisma/schema.prisma`:
  - `SignageUnit`: `deletedAt DateTime?` · `deletedById String?` · `deletedBy User? @relation("deletedBy", ...)` · `@@index([deletedAt])`
  - `User`: เพิ่ม back-relation `deletedUnits SignageUnit[] @relation("deletedBy")`
  - `enum ChangeAction { ... restore }` (เพิ่มค่า)
  - `model DeletionArchive { id, originalId String, serialNumber String?, snapshot Json, deletedAt DateTime?, purgedAt DateTime @default(now()), purgedById String, purgedBy User @relation(...) }` (+ back-relation ใน User)
- `npx prisma migrate dev --name soft_delete_audit` (**ชี้ local เท่านั้น**) → `prisma generate`
- `src/types/signage.ts`: `CHANGE_ACTIONS` += `'restore'` + เพิ่ม `CHANGE_ACTION_LABELS: Record<ChangeAction,string>` (import/verify/edit/delete/restore → ไทย)
- **Acceptance:** `prisma validate` ผ่าน · migration ใช้ได้บน local · client generate ใหม่มี field/enum/model ครบ · typecheck เขียว
- **Verify:** `npx prisma validate` · `npm run typecheck`
- **⛳ Checkpoint E** — รีวิว schema/migration ก่อนสร้าง service (ยืนยัน additive ล้วน, ไม่กระทบ prod)

### T16 — `delete-unit` service + กรอง `deletedAt` ทุก read  *(TDD, หัวใจ)*

- `src/server/delete-unit.ts` (ใหม่):
  - `softDeleteUnit(id, actorId)` — tx: `updateMany({where:{id, deletedAt:null}}, {deletedAt:now, deletedById, version:{increment:1}})` (count 0 → NotFound/แจ้งลบไปแล้ว) + `ChangeLog(action='delete', field='deletedAt')`
  - `softDeleteUnits(ids, actorId)` — วนใน tx เดียว (bulk), คืนจำนวนที่ลบจริง
  - `restoreUnit(id, actorId)` — tx: set `deletedAt=null, deletedById=null, version++` + `ChangeLog(action='restore')`
  - `purgeUnit(id, actorId)` — tx: เขียน `DeletionArchive` (snapshot ทั้ง unit เป็น Json) ก่อน → `signageUnit.delete` (cascade ล้าง log/checklist ของตัวนั้น)
  - `purgeExpired(actorId, days=30)` — purge ทุกตัวที่ `deletedAt < now-days`
- กรอง soft-deleted ออกจาก read ทั้งหมด:
  - `src/server/units.ts`: `buildUnitWhere` ใส่ `deletedAt: null` (ครอบ list + export ที่ใช้ร่วม) · `getUnitDetail` คืน `null` ถ้า `unit.deletedAt != null` · เพิ่ม `listDeletedUnits()` (deletedAt != null, join deletedBy, เรียง deletedAt desc)
  - `src/server/problems.ts`: where เพิ่ม `deletedAt: null`
- **Tests (integration, local DB):** ลบแล้วหายจาก `listUnits`/`getUnitDetail`/`listProblemUnits`/export · ยังอยู่ใน `listDeletedUnits` · มี ChangeLog `delete` · restore กลับมาครบ + ChangeLog `restore` · purge → row หาย + มี DeletionArchive snapshot · purgeExpired ลบเฉพาะเกินกำหนด
- **Acceptance:** ครบตาม test ข้างบน + RBAC (service เรียกจาก action ที่ `requireRole(['admin'])`)
- **Verify:** `$env:DATABASE_URL=local; npm run test`

### T17 — ลบจากหน้า detail (admin)  *(vertical: detail → soft delete → หาย)*

- `src/app/(app)/units/[id]/actions.ts`: `deleteUnitAction` — `requireRole(['admin'])` → `softDeleteUnit` → `revalidatePath('/units')` → `redirect('/units')`
- `src/app/(app)/units/[id]/DeleteUnitButton.tsx` (client): ปุ่มแดง + dialog ยืนยัน (กดยืนยันซ้ำ) กัน fat-finger; แสดงเฉพาะ admin
- `units/[id]/page.tsx`: ส่ง `isAdmin` + render ปุ่ม
- **Acceptance:** admin เห็นปุ่ม ลบแล้วเด้งกลับ /units และเครื่องหาย · staff ไม่เห็นปุ่ม + action 403 · มี ChangeLog
- **Verify:** test action guard (ถ้าทำได้) · ดูจริง 2 role

### T18 — Bulk ลบในตาราง (admin)

- `UnitsTable.tsx`: prop `isAdmin`; ถ้า admin → คอลัมน์ checkbox ต่อแถว + "เลือกทั้งหมด" + แถบ action ลอย "ลบ N เครื่อง"
- `units/page.tsx`: ส่ง `isAdmin` ผ่าน `UnitsView` → `UnitsTable`
- action `bulkDeleteAction(ids)` (admin) → `softDeleteUnits` → revalidate
- **Acceptance:** เลือกหลายตัว → ลบ → หายหมด + ยืนยันก่อนลบ · staff ไม่เห็น checkbox
- **Verify:** ดูจริง + test service ครอบแล้วใน T16

### T19 — หน้า `/trash` (admin)

- `src/app/(app)/trash/page.tsx` — guard `requireRole`/redirect; `listDeletedUnits()`; ตาราง: S/N, ใครลบ, ลบเมื่อ (เวลาไทย `formatThaiDateTime`), **เหลือ N วัน** (30 − อายุ; เกิน = ป้าย "ครบกำหนด"); ปุ่ม กู้คืน / ลบถาวร(ยืนยันเข้ม); ส่วนล่าง DeletionArchive ("ลบถาวรแล้ว"); ปุ่ม "ล้างถาวรที่ครบกำหนด"
- `trash/actions.ts`: `restoreAction` · `purgeAction` · `purgeExpiredAction` (ทั้งหมด admin)
- **Acceptance:** เห็นของที่ลบ + วันคงเหลือถูก · กู้คืนกลับมาในรายการปกติ · ลบถาวรแล้ว row หาย + ขึ้นใน archive · staff เข้าไม่ได้
- **Verify:** ดูจริง flow ลบ→trash→กู้คืน / ลบ→purge

### T20 — หน้า `/audit` (admin) + เมนู home

- `src/server/audit.ts` (ใหม่): `listAuditLog({ action?, userId?, page, perPage=50 })` → rows + total (join user + unit สำหรับลิงก์/ป้าย)
- `src/app/(app)/audit/page.tsx` — guard; ตาราง: เวลา(ไทย), ผู้ใช้, action (badge ใช้ `CHANGE_ACTION_LABELS`), เครื่อง (ลิงก์ถ้ายังอยู่), field old→new; GET-form กรอง action/ผู้ใช้ + pagination (`take/skip`)
- `src/app/(app)/page.tsx`: เพิ่มการ์ด admin "ถังขยะ" (/trash) + "บันทึกการเปลี่ยนแปลง" (/audit)
- **Acceptance:** เห็น log ทุก action เรียงใหม่→เก่า · กรอง `delete` แล้วเหลือเฉพาะลบ · pagination ทำงาน · staff เข้าไม่ได้
- **Verify:** `npm run test` (audit service) · ดูจริง
- **⛳ Checkpoint F (Final §8)** — `lint` + `typecheck` + `test` + `build` + e2e เขียวครบ → แจ้งผู้ใช้ commit

### ความเสี่ยง / จุดเฝ้าระวัง (Phase 9)

- **ลืมกรอง `deletedAt`** ในที่ใดที่หนึ่ง → ผีโผล่. กันด้วย integration test ครอบ list/detail/problems/export ใน T16
- **purge ทำ ChangeLog ของตัวนั้นหาย (cascade)** = ตั้งใจ; หลักฐานถาวรอยู่ใน DeletionArchive snapshot
- **enum `restore` ต้อง migrate ก่อนใช้** — T15 ต้องเสร็จ+generate ก่อน service เขียน action restore
- **migration ห้ามรันชน Neon** — สลับ `DATABASE_URL` เป็น local ก่อน `migrate dev`

### ลำดับแนะนำ (Phase 9)

T14 → T15 → **[Checkpoint E]** → T16 → T17 → T18 → T19 → T20 → **[Checkpoint F]**
