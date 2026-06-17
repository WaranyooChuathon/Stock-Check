# PORTFOLIO-SPEC — StockCheck (Generic Asset Tracker) · Live Demo

> สเปคของการแปลง **โปรเจกต์งานจริง (Smart Signage stock) → live demo "StockCheck" ที่ track สินค้า/ทรัพย์สินอะไรก็ได้รายตัว**
> company-safe · กดเล่นได้ทันที · ต่อ PostgreSQL จริงบน Neon
> single source of truth ของงาน portfolio — ไม่ทับ `SPEC.md` เดิม · อ้างอิง `PORTFOLIO-PLAYBOOK.md`

---

## 1. Objective (วัตถุประสงค์)

แปลงเครื่องมือตรวจนับสต็อก **Smart Signage** (ผูกกับ signage) → **"StockCheck"** ระบบ **ตรวจนับ/ยืนยันทรัพย์สินรายตัว (serialized asset) แบบ generic — track สินค้าอะไรก็ได้** (signage, laptop, เครื่องมือ, เฟอร์นิเจอร์ ฯลฯ) พร้อม deploy เป็น live demo บน Neon เพื่อโชว์ **full-stack + database + การออกแบบระบบ generic**

### เป้าหมายหลัก

1. **Generic asset tracker** — 1 แถว = 1 ชิ้นจริง (S/N) · มี **หมวดหมู่ (category)** · signage เป็นแค่ 1 หมวด · เพิ่มหมวดอื่นได้
2. **Engine ที่ generalize อยู่แล้ว** — verify รายตัว, จับ discrepancy (= checklist ไม่ครบ), audit trail, soft-delete, optimistic lock, import column-mapping → ใช้กับสินค้าอะไรก็ได้
3. **Full-stack จริง** — Vercel + **Neon Postgres ส่วนตัว** (seed หลายหมวดสินค้า); mutation persist จริง
4. **กดเล่นได้ทันที** — ปุ่ม "เข้าสู่ Live Demo" 1 คลิก (คงหน้า login โชว์)
5. **Dual-mode data layer (จุดขาย architecture)** — มี `DATABASE_URL`=Prisma จริง / ไม่มี=deterministic mock (CI/local รันได้ไม่ต้อง config)
6. **รักษาข้อมูล demo** — ปุ่ม "Reset demo" + cron re-seed
7. **Company-safe 100%** — repo ใหม่ · Neon บัญชีส่วนตัวใหม่ · ข้อมูลสมมติ · ไม่มีชื่อ/แบรนด์/credential จริง
8. **โชว์ได้** — README case-study 2 ภาษา + screenshots + demo banner

### กลุ่มผู้ใช้ (target)

- **Recruiter** — เปิด URL กดเล่นได้จริง 2 นาที, เห็นว่า track ได้หลายหมวดสินค้า + ต่อ DB จริง
- **Dev/architect** — เห็น generic domain (category + attributes JSON + config checklist), dual-mode data layer, server-service pattern, RBAC, audit, soft-delete

---

## 2. แนวทางที่ตัดสินใจแล้ว (Decisions — locked)

| หัวข้อ | ตัวเลือก |
|--------|----------|
| **Positioning** | Generic **asset/stock tracker** — signage = 1 category; รองรับสินค้าอะไรก็ได้ |
| **แบรนด์** | **StockCheck / ตรวจนับสต็อก** |
| **Rename โค้ด** | `SignageUnit` → **`Item`** (model + client accessor + Prisma types); route `/units` + component `Unit*` คงไว้ (= "รายการ/ชิ้น" generic) |
| **Generic ระดับ** | core + `category` field + `attributes` JSON (ไม่ทำ dynamic per-category attribute UI — over-engineer) |
| **Deploy data** | Neon Postgres ส่วนตัวใหม่ (prod) |
| **Data layer** | dual-mode: `DATABASE_URL`=real / ไม่มี=mock |
| **Login** | คงหน้า login + ปุ่ม "เข้าสู่ Live Demo" |
| **ข้อมูล demo** | ปุ่ม "Reset demo" + cron re-seed |
| **ภาษา UI** | คงไทย · README 2 ภาษา |

---

## 3. Domain genericization (model `Item`)

> additive/rename บน **repo ใหม่** (migration ใหม่หมด — ไม่กระทบ prod เดิม)

**Item** (เดิม `SignageUnit`):

- 🔒 **แกนนิ่ง (logic-bearing, คงไว้):** `serialNumber` (unique เฉพาะกลุ่ม verified), `status`, `verifyState`, `version`, `location`, `note`
- 🆕 **`category String?`** — หมวดสินค้า (เช่น `signage`, `laptop`, `tool`, `furniture`). free-form; UI เสนอค่าที่มี + พิมพ์ใหม่ได้; ใช้กรอง/จัดกลุ่ม
- 🧩 **generic optional (คงคอลัมน์, ชื่อ generic):** `name`/`model` (ชื่อ/รุ่นสินค้า, default ลบ "Smart Signage"), `secondaryCode` (เดิม `boxSerialNumber` — รหัสรอง/asset tag), `secondaryLocation` (เดิม `boxLocation`), `accessoryNote`
- 🔧 **ย้ายไป `attributes` JSON (signage-specific):** `displaySize`, `macAddress` → กลายเป็น attribute ของหมวด signage (ไม่ใช่คอลัมน์ typed อีกต่อไป)
- soft-delete / verifiedBy / timestamps — เหมือนเดิม

**ChecklistItem** — เพิ่ม `category String?` (null = ใช้ทุกหมวด); verify form แสดงเฉพาะ item ของหมวดนั้น (+ item กลาง)

**Status enum** — `in_stock | lease_or_sold | trial | repair_lost` generic พออยู่แล้ว (คงไว้)

**Discrepancy** — นิยามเดิม "checklist (active) ขาด" = generic อยู่แล้ว ไม่ต้องแก้ logic

**Seed (mock + Neon)** — หลายหมวด: signage (จอ+MAC ใน attributes), laptop (CPU/RAM ใน attributes), เครื่องมือช่าง, เฟอร์นิเจอร์ — checklist ต่างกันต่อหมวด → โชว์ genericity

---

## 4. Scope — สิ่งที่จะทำ (In-scope)

### 4.1 Genericize domain (real Prisma)
- rename `SignageUnit`→`Item` ทั้งโค้ด (model, `prisma.item`, `Prisma.Item*` types, server services, type alias)
- เพิ่ม `Item.category`, `ChecklistItem.category`; ย้าย `displaySize`/`macAddress`→attributes; rename box→secondary fields
- migration ใหม่ (รัน local/Neon) + seed หลายหมวด
- rebrand UI/label "Signage" → "StockCheck/รายการ/สินค้า"; เพิ่มคอลัมน์/ฟิลเตอร์ `category`; แสดง attributes ในหน้า detail

### 4.2 Dual-mode data layer
- `src/lib/demo.ts` `isDemoMode()` · `src/server/mock/store.ts` (seed generic เดียวกัน) · ทุก service เพิ่ม branch mock · shape ตรง type เดิม

### 4.3 Demo auth — ปุ่ม "เข้าสู่ Live Demo" (auto sign-in demo admin), คง proxy guard

### 4.4 Reset + re-seed — `seedDemo()` reuse · `/api/demo/reset` (token guard) · cron (Vercel Cron แนะนำ) · DemoBanner + ปุ่ม Reset

### 4.5 Polish — grep genericize confirm · README/README-TH case-study · ARCHITECTURE.md (dual-mode + generic domain)

### 4.6 Deploy — Neon ส่วนตัว (sin1) · Vercel env (`DATABASE_URL`,`DIRECT_DATABASE_URL`,`AUTH_SECRET`,`DEMO_RESET_TOKEN`) · secret scan

---

## 5. นอกขอบเขต (Out-of-scope)

- ❌ **dynamic per-category attribute UI** (admin นิยาม field เองผ่านจอ) — over-engineer; ใช้ `attributes` JSON + import mapping พอ
- ❌ ไม่แตะ repo/Neon บริษัทเดิม · ไม่ใช้ Supabase (ใช้ Prisma+Neon เอง)
- ❌ ไม่แปล UI เป็นอังกฤษ (README แทน) · ไม่ทำ realtime/multi-tenant/feature ใหม่นอกเหนือ generic
- ❌ ไม่ทำ E2E ใหม่รอบนี้ (verify ด้วย browser); unit/integration test เฉพาะส่วนที่แตะ

---

## 6. Commands

```bash
npm run dev          # ไม่มี DATABASE_URL → demo mock; มี → Neon/Postgres จริง
npm run db:seed      # seed หลายหมวดสินค้า (เมื่อต่อ DB จริง)
npm run build        # ต้องผ่านทั้งมี/ไม่มี DATABASE_URL
npm run lint && npm run typecheck && npm run test
# Deploy: vercel-build = prisma migrate deploy && next build
```

---

## 7. Project Structure (ส่วนที่เพิ่ม/แก้)

```
prisma/schema.prisma           # SignageUnit→Item +category; ChecklistItem +category; ย้าย signage fields
prisma/seed.ts                 # → export seedDemo(); หลายหมวดสินค้า
src/
  lib/demo.ts                  # isDemoMode() (ใหม่)
  server/mock/store.ts         # in-memory generic store (ใหม่)
  server/*.ts                  # prisma.signageUnit→prisma.item + branch mock
  types/inventory.ts           # (เดิม signage.ts) enums/labels generic + CATEGORY labels
  app/(auth)/login/            # +ปุ่ม "เข้าสู่ Live Demo"
  app/api/demo/reset/route.ts  # re-seed (token-guarded) (ใหม่)
  components/DemoBanner.tsx     # banner + Reset (ใหม่)
  components/units/*            # +category column/filter; attributes ในหน้า detail
README.md README-TH.md ARCHITECTURE.md DEPLOY.md   # ใหม่
PORTFOLIO-SPEC.md
```

---

## 8. Code Style — คงเดิม (TS strict, server-service, mobile-first+dark, ห้าม auto-commit/commit secret); mock+seed deterministic; rename ครบ (ไม่เหลือ "signage" ในชื่อ symbol/โค้ด นอกจากค่า category)

---

## 9. Testing Strategy

| ระดับ | ครอบคลุม |
|-------|----------|
| Unit | mock store deterministic, optimistic-lock 409, discrepancy (generic checklist) เขียว, category filter |
| Integration | rename/migration: CRUD/verify/import บน `Item` ถูก; reset endpoint token guard; checklist ต่อ category |
| Build | `npm run build` ผ่านทั้งมี/ไม่มี `DATABASE_URL` |
| Manual (verify) | browser ทุกหน้า + หลายหมวดสินค้า + Reset + screenshot |

---

## 10. Acceptance Criteria

- ✅ track ได้หลายหมวด: seed มี ≥3 หมวด (signage/laptop/อื่น), กรอง/แสดง `category` ได้, attributes โชว์ในหน้า detail
- ✅ ไม่มี symbol/ชื่อ/label ผูก "signage" หลงเหลือ (นอกจากค่า category) — rename `Item` ครบ, tsc เขียว
- ✅ engine generic ทำงาน: verify→discrepancy เมื่อ checklist ขาด (หมวดไหนก็ได้), audit/soft-delete/optimistic-lock 409 เหมือนเดิม
- ✅ มี `DATABASE_URL` (Neon) → mutation persist; ไม่มี → demo mock รัน dev/build ได้ ไม่มี error DB/secret
- ✅ regression: ฟีเจอร์เดิมทุกอย่างทำงานบน `Item`
- ✅ ปุ่ม "เข้าสู่ Live Demo" 1 คลิกเข้า admin; ปุ่ม "Reset demo" คืน seed; reset endpoint ไม่มี/ผิด token → 401
- ✅ README/README-TH: ปัญหา→stack→ฟีเจอร์→architecture(dual-mode+generic)+live URL+demo login+screenshots+"ต่อ Neon จริง"
- ✅ ไม่มีข้อมูลบริษัท/ลูกค้า/พิกัด/อีเมล/secret จริง · Neon ส่วนตัวใหม่ · `.env*` gitignore · git history สะอาด
- ✅ lint+typecheck+test เขียว · mobile-first + dark ครบ

---

## 11. Boundaries

- ✅ **Always:** ทำในโครงสร้างนี้ · rename ครบ · เพิ่ม branch demo ไม่แตะ business logic · เพิ่ม test ส่วนที่แตะ · รัน lint/typecheck/test/build · migration บน repo+Neon **ส่วนตัว** เท่านั้น
- ⚠️ **Ask First:** เพิ่ม dependency · เปลี่ยน type ที่ pages ใช้แบบ breaking · เลือกวิธี cron · ขอบเขต category (free-form vs config table)
- 🚫 **Never:** แตะ repo/Neon/ข้อมูลบริษัทเดิม · commit `.env`/secret/token · ข้อมูลบริษัทจริงใน seed/mock · auto-commit/push/deploy · ปิด auth · reset endpoint ไม่มี token guard

---

## ขั้นถัดไป (playbook)
0–1 เสร็จ (สำรวจ+spec) → **`/plan` อัปเดตแล้ว** ([tasks/portfolio-plan.md](tasks/portfolio-plan.md), [tasks/portfolio-todo.md](tasks/portfolio-todo.md)) → `/build` เริ่ม P0 (รอ path จาก user)
