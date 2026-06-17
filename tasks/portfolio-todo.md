# Portfolio TODO — StockCheck (Generic Asset Tracker) · Live Demo

> แผนเต็ม: [portfolio-plan.md](portfolio-plan.md) · spec: [PORTFOLIO-SPEC.md](../PORTFOLIO-SPEC.md)
> 🧑 USER · 🤖 AI · ⛔ ห้าม AI auto (push/deploy)

---

## P0 — Bootstrap repo ใหม่ (company-safe)
- [ ] 🧑 **P0.1** บอก path โฟลเดอร์ใหม่ (เช่น `d:/Project-Me-Coder/stockcheck-demo`)
- [ ] 🤖 **P0.2** copy ไป path ใหม่ — ตัด `.git/`, `.env`, `node_modules/`, `src/generated/` (ของเดิมไม่ถูกแตะ)
- [ ] 🤖 **P0.3** `git init` + ตรวจ `.gitignore` ครอบ `.env*`/`node_modules`/`src/generated`

> ⚠️ P1+ ทำใน **โฟลเดอร์ใหม่** เท่านั้น

---

## P1 — Genericize domain → `Item` (AI, real Prisma) ✅ เสร็จ → **CP-A**
- [x] 🤖 **P1.1** schema: `SignageUnit`→`Item`; +`Item.category`+`@@index`, `ChecklistItem.category`; ย้าย `displaySize`/`macAddress`→attributes; `model` nullable. **คง `boxSerialNumber`/`boxLocation`** (relabel "รหัสรอง/ที่เก็บรอง" — ลด churn 10 ไฟล์)
- [x] 🤖 **P1.2** migration `init` ใหม่ (รัน stockcheck_dev local) + partial unique index + `prisma generate`
- [x] 🤖 **P1.3** rename ทั้งโค้ด: `prisma.item`, `Prisma.Item*`, `types/signage.ts`→`types/inventory.ts`; symbol `SignageUnit/signageUnit` เหลือ **0**
- [x] 🤖 **P1.4** `seed.ts`: 14 ชิ้น 4 หมวด (signage จอ/MAC ใน attributes · laptop cpu/ram · tool · furniture) · checklist ต่อหมวด · export `seedDemo()`
- [x] 🤖 **P1.5** UI generic: rebrand→StockCheck · คอลัมน์/ฟิลเตอร์ `category` (datalist autocomplete) · attributes section ในหน้า detail · `listCategories()`
- [x] 🤖 **P1.6** อัปเดต test → generic (verify/units/update-unit/export/import/sort/filters)

> **CP-A ✅:** typecheck 0 · lint สะอาด · **test 71/71** · **build ผ่าน** · seed 4 หมวด · ไม่เหลือ symbol signage. → รอ review ก่อน P2

---

## P2 — Dual-mode data layer (AI) → **CP-B**
- [x] 🤖 **P2.1** `src/lib/demo.ts` `isDemoMode()` + test
- [x] 🤖 **P2.2** `src/server/mock/{data,store}.ts` — dataset กลาง (seed+mock ใช้ร่วม) + in-memory store 23 fns + test (11 เคส)
- [x] 🤖 **P2.3** wire read services → mock: units(list/detail/trash/categories), problems, audit, export, checklist, users
- [x] 🤖 **P2.4** wire write services → mock: verify, update-unit (optimistic 409), import, delete-unit (×6)
- [x] 🤖 **P2.5** `auth-verify` mock branch (demo users, bcrypt)

> **CP-B ✅:** boot demo (`DEMO_MOCK=1`) — ทุกหน้า render ด้วย mock, mutation ในเซสชัน, ไม่มี console error; real mode 81/81 test ไม่ regression.

---

## P3 — ปุ่ม "เข้าสู่ Live Demo" (AI) ✅ เสร็จ
- [x] 🤖 **P3.1** ปุ่ม "🚀 เข้าสู่ Live Demo" + `enterDemo` action (auto sign-in admin); hint บัญชีทดสอบ; mobile+dark+≥44px
  - _verified browser:_ คลิก → เข้า `/units` เป็น admin · detail โชว์ specs/attributes · ฟิลเตอร์หมวด · เวลาไทย · 0 console error (screenshots ใน docs/screenshots)

---

## P4 — Reset + re-seed (AI) ✅ เสร็จ → **CP-C**
- [x] 🤖 **P4.1** แยก `seedDemo` → `src/server/seed-demo.ts` (side-effect-free) + `demo-reset.ts` `resetDemoData()` (demo→resetMockStore / real→seedDemo); prisma/seed.ts = CLI wrapper
- [x] 🤖 **P4.2** `app/api/demo/reset/route.ts` — GET+POST, guard `DEMO_RESET_TOKEN`/`CRON_SECRET` (Bearer หรือ x-demo-reset-token); 503 ไม่มี token / 401 ผิด / 200 ถูก (มี test 4 เคส)
- [x] 🤖 **P4.3** Vercel Cron ใน `vercel.json` (`0 */6 * * *` → /api/demo/reset; ใช้ Bearer CRON_SECRET อัตโนมัติ)
- [x] 🤖 **P4.4** `components/DemoBanner.tsx` ทุกหน้า (root layout) — label + GitHub/Resume + ปุ่ม "↺ Reset demo" (admin, server action) — verified browser

> **CP-C ✅:** test 85/85 · build ผ่าน · browser: banner ทุกหน้า + Reset ทำงาน (ข้อมูลกลับ seed) + 0 console error. ⚠️ ตั้ง Resume URL ใน DemoBanner.tsx (ตอนนี้ชี้ GitHub ชั่วคราว)

---

## P5 — Genericize sweep + Polish (AI)
- [ ] 🤖 **P5.1** grep sweep — ไม่มีชื่อบริษัท/ลูกค้า/พิกัด/อีเมล/secret จริง + ไม่เหลือ symbol signage
- [ ] 🤖 **P5.2** `README.md` (อังกฤษ) case study: ปัญหา→stack→ฟีเจอร์(generic/category)→architecture(dual-mode)→live URL→demo login→screenshots; ระบุ "ต่อ Neon จริง"
- [ ] 🤖 **P5.3** `README-TH.md` (ไทย) + สลับภาษา
- [ ] 🤖 **P5.4** `ARCHITECTURE.md` (ออปชัน) — generic domain + dual-mode + RBAC/audit/soft-delete

---

## P6 — Verify + Screenshots (AI) → **CP-D**
- [ ] 🤖 **P6.1** `/verify` browser ทุกหน้า + หลายหมวดสินค้า render ถูก
- [ ] 🤖 **P6.2** screenshot หน้าเด่น → `docs/` + ฝัง README

> **CP-D:** screenshot ครบ + README สมบูรณ์ → review ก่อน deploy

---

## P7 — Deploy: Neon + Vercel (USER+AI) → **CP-E**
- [ ] 🧑 **P7.1** สร้าง Neon project ส่วนตัวใหม่ (sin1) → `DATABASE_URL`(pooled) + `DIRECT_DATABASE_URL`(direct)
- [ ] 🤖 **P7.2** `DEPLOY.md` runbook — ขั้น USER + ลำดับ migrate/seed/env + secret scan
- [ ] 🤖 **P7.3** secret scan git history/working tree ก่อน push
- [ ] 🧑 **P7.4** GitHub repo + Vercel + env 4 ตัว (DATABASE_URL, DIRECT_DATABASE_URL, AUTH_SECRET, DEMO_RESET_TOKEN)
- [ ] 🧑⛔ **P7.5** `git push` + deploy (`vercel-build` รัน migrate; seed ครั้งแรกผ่าน reset/CLI)
- [ ] 🤖 **P7.6** verify live: URL จริง → "เข้าสู่ Live Demo" + Reset + ทุกหน้า

> **CP-E:** live demo เปิดได้, generic + full-stack Neon, company-safe ✅

---

## นอกขอบเขต (ย้ำ)
dynamic per-category attribute UI · Supabase · แปล UI อังกฤษ · realtime/multi-tenant · feature ใหม่ · E2E ใหม่ · แตะ repo/Neon บริษัทเดิม
