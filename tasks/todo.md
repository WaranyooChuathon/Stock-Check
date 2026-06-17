# TODO — Smart Signage Stock System

รายละเอียดเต็ม + acceptance criteria ดู [plan.md](plan.md) · สเปค [SPEC.md](../SPEC.md)
ทำทีละ task ตามลำดับ; ติ๊กเมื่อ lint+test+build ผ่าน และ acceptance ครบ

## Phase 0 — Foundation

- [x] **T1** Project scaffold + toolchain (Next.js 16/TS/Tailwind 4/ESLint/Prettier/Vitest/Playwright) ✅
- [x] **T2** Prisma 7 schema + migration + partial unique index + seed (admin/staff/2 checklist/14 units) + discrepancy pure-fn + unit test ✅
- [ ] ⛳ **Checkpoint A** — รีวิว schema + การตัดสินใจ uniqueness ← **อยู่ตรงนี้**

## Phase 1 — Auth

- [x] **T3** Login/logout + route protection (src/proxy.ts) + RBAC `requireRole()`/`hasRole()` + integration test ✅
- [ ] ⛳ **Checkpoint B** — ประตูระบบพร้อม ← **อยู่ตรงนี้**

## Phase 2 — รายการ + ค้นหา

- [x] **T4** Units list + search/filter (mobile-first) + `GET /api/units` + test ✅

## Phase 3 — ตรวจยืนยัน (หัวใจ)

- [x] **T5** Unit detail + verify form + discrepancy auto-flag + UnitChecklist + ChangeLog (transaction) + serial-conflict guard + test ✅
- [x] **T6** Edit unit + optimistic lock (409, atomic) + ChangeLog + test ✅
- [ ] ⛳ **Checkpoint C** — ทดลองใช้จริง 5–10 เครื่อง รีวิว UX มือถือ ← **อยู่ตรงนี้**

## Phase 4 — หน้าปัญหา

- [x] **T7** Problems view (เฉพาะ discrepancy + เหตุผล) + nav link + test ✅

## Phase 5 — Import (admin)

- [x] **T8** Import Excel/CSV + column mapping + value mapping (สถานะ→enum) + ทุกแถว/ติดธงซ้ำ-ว่าง + RBAC 403 + test ✅

## Phase 6 — Settings (admin)

- [x] **T9** ChecklistItem CRUD (เพิ่ม/toggle/ลบ) + ไม่กระทบ verified เดิม (getUnitDetail ใช้ record จริง) + RBAC + test ✅

## Phase 7 — Hardening + Ship

- [x] **T10** E2E (mobile viewport, 3 tests) + RBAC sweep + README + `.env.example` + ตรวจ `.gitignore` ✅
- [x] ⛳ **Checkpoint D (Final)** — go/no-go: lint+test(43)+build+e2e(3) เขียวครบ ✅ **GO**

## Phase 8 — ส่วนเสริมหลัง MVP (ผู้ใช้ขอ)

- [x] **T11** Export Excel/CSV หน้า /units ตามตัวกรอง (+ attributes) + test ✅
- [x] **T12** หน้าจัดการผู้ใช้ (admin): เพิ่ม/รีเซ็ตรหัส/เลือก role + RBAC + test ✅
- [x] **T13** เตรียม deploy Vercel: postinstall(generate) + vercel-build(migrate deploy) + README deploy + env notes ✅

## Phase 9 — หมายเหตุ + Soft delete + Audit log (SPEC §8)

รายละเอียด + acceptance ดู [plan.md Phase 9](plan.md) · ทำ TDD · migration รัน **local เท่านั้น** (additive ล้วน)

- [x] **T14** คอลัมน์ "หมายเหตุ" ใน table (listSelect note + sortUnits 'note' + UnitsTable คอลัมน์ truncate) + test ✅
- [x] **T15** schema+migration additive (`deletedAt`/`deletedById`/`DeletionArchive`/ChangeAction+=`restore`) + types (`CHANGE_ACTION_LABELS`) → generate ✅
- [x] ⛳ **Checkpoint E** — รีวิว schema/migration: SQL additive ล้วน ไม่กระทบ prod ✅
- [x] **T16** `delete-unit.ts` service (soft/bulk/restore/purge/purgeExpired) + กรอง `deletedAt` ทุก read + integration test (8 เคส) ✅
- [x] **T17** ลบจากหน้า detail (admin): deleteUnitAction + DeleteUnitButton + ยืนยัน + RBAC ✅
- [x] **T18** Bulk ลบในตาราง (admin): checkbox + action bar + bulkDeleteAction ✅
- [x] **T19** หน้า `/trash` (admin): กู้คืน/ลบถาวร + เหลือ N วัน + DeletionArchive + purge ที่ครบกำหนด ✅
- [x] **T20** หน้า `/audit` (admin): listAuditLog + กรอง action/ผู้ใช้ + pagination + การ์ดเมนู home + test (2 เคส) ✅
- [x] ⛳ **Checkpoint F (Final §8)** — lint+typecheck+test(71)+build เขียวครบ ✅ (e2e/visual smoke ยังไม่รัน)
