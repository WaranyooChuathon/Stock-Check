# SPEC — ระบบเช็ค/ตรวจนับสต็อก Smart Signage รายตัว

> สเปคนี้เป็น "แหล่งความจริงเดียว" (single source of truth) ของโปรเจกต์
> ปรับแก้ได้เสมอ แต่ทุกการเขียนโค้ดต้องอ้างอิงเอกสารนี้
> ที่มาของแนวคิด ดู [docs/ideas/stock-check.md](docs/ideas/stock-check.md)

---

## 1. Objective (วัตถุประสงค์)

สร้างเครื่องมือให้ทีม **2-3 คน** ใช้ **เคลียร์/ตรวจนับสต็อกเครื่อง Smart Signage รายตัวให้เสร็จไว** และใช้ดูแลต่อในระยะยาว ผ่านมือถือ/แท็บเล็ต/โน้ตบุ๊ก (mobile-first)

> 📌 **แนวคิดหลัก: ติดตามทรัพย์สิน "รายตัว" (serialized asset) + workflow การตรวจยืนยัน (audit)**
> ของในสต็อกคือเครื่อง Smart Signage ที่แต่ละตัวมีตัวตนเฉพาะ (S/N, MAC, ขนาดจอ) **ไม่ใช่ของกองรวมนับจำนวน** ระบบจึงเก็บ "1 แถว = 1 เครื่องจริง" และมีสถานะการตรวจ (ยังไม่ตรวจ / ตรวจแล้ว / พบปัญหา) เพื่อเดินเคลียร์ของจริงให้ตรงกับข้อมูล

### ปัญหาที่ต้องแก้ (จากหน้างานจริง)

1. **ไม่รู้ว่ามีกี่ตัว แต่ละตัวอยู่ไหน/สถานะอะไร** — บางตัวอยู่ในสต็อก บางตัวออกไปแล้ว (เช่าซื้อ/ซื้อขาด/โครงการทดสอบ) บางตัวส่งซ่อม/เสีย/สูญหาย
2. **ข้อมูลกายภาพไม่ตรง** (รับงานต่อมาแบบไม่เคลียร์) — ใส่กล่องผิด S/N, ในกล่องอุปกรณ์ไม่ครบ (สาย AC, ขาตั้ง/เสา, เสา Wi-Fi)
3. **Excel กลางหยาบเกินไป** — มีแค่ S/N, MAC, ขนาดจอ ต้องยกระดับให้ละเอียดและเชื่อถือได้
4. ต้อง **เคลียร์ให้ไว** โดยหลายคนช่วยกันตรวจพร้อมกันโดยไม่แก้ทับกัน

### เป้าหมายหลัก

- **นำเข้าข้อมูลตั้งต้นจาก Excel เดิม** (S/N, MAC, ขนาดจอ) เป็นจุดเริ่ม แล้วทยอยตรวจยืนยันรายตัว
- **ตรวจยืนยันรายตัว (verify):** เปิดเครื่อง → เช็ค S/N จริงตรงกับที่พิมพ์บนกล่องไหม, MAC, ขนาดจอ, อุปกรณ์ครบไหม → ตั้งสถานะ "ตรวจแล้ว" หรือ "พบปัญหา"
- **เห็นรายการ "ตัวที่มีปัญหา"** (S/N กล่องไม่ตรงเครื่อง / อุปกรณ์ไม่ครบ) เพื่อตามเคลียร์
- **ค้นหา/กรอง** ตาม S/N, MAC, ขนาดจอ, สถานะ, สถานะการตรวจ
- เก็บ **ประวัติการแก้ไขรายตัว** (ใคร/แก้อะไร/เมื่อไร) + กันการแก้ทับกัน (optimistic lock)
- **ระบบล็อกอิน** แยกสิทธิ์ admin / staff

### กลุ่มผู้ใช้ (ร้านเดียว ทีม 2-3 คน ใช้บนมือถือ/แท็บเล็ต/โน้ตบุ๊ก)

- `staff` — คนเดินตรวจ: ค้นหา, ดู, ตรวจยืนยันเครื่อง (แก้ S/N/MAC/อุปกรณ์/สถานะ)
- `admin` — ผู้ดูแล: ทำได้ทุกอย่างของ staff + import Excel + เพิ่ม/ลบเครื่อง + จัดการผู้ใช้

### สิ่งที่ "ยังไม่ทำ" ในเวอร์ชันแรก (Non-goals / V1)

- ผูกชื่อลูกค้า/โครงการรายตัว (รอบนี้ **เก็บแค่สถานะพอ**)
- เชื่อมต่อบาร์โค้ด/QR สแกนฮาร์ดแวร์ (เพิ่มทีหลังได้)
- Realtime websocket sync (ทีมเล็ก optimistic lock + audit log พอ)
- หลายสาขา/หลายคลัง
- รายงานวิเคราะห์ขั้นสูง / กราฟ / แจ้งเตือนอัตโนมัติ
- ระบบขาย/POS

---

## 2. Tech Stack & Commands (เทคโนโลยีและคำสั่ง)

### Tech Stack — ✅ verified กับ docs ทางการ (June 2026)

| ส่วน                  | เทคโนโลยี                                             | เวอร์ชัน             | หมายเหตุ verify                                   |
| --------------------- | ----------------------------------------------------- | -------------------- | ------------------------------------------------- |
| Framework             | Next.js (App Router) + TypeScript                     | **16.x** (≥16.2 LTS) | Turbopack default, async request APIs, `proxy.ts` |
| Runtime               | React                                                 | **19.2**             | มากับ Next 16                                     |
| ฐานข้อมูล             | PostgreSQL (dev + prod) ผ่าน Prisma ORM               | **Prisma 7.x**       | บังคับ driver adapter; ได้ native enum + Json     |
| — driver adapter      | `@prisma/adapter-pg` (`PrismaPg`) + `pg`              | latest               | ใช้ทั้ง dev/prod                                  |
| — dev DB              | PostgreSQL 17 (local, winget) ฐานข้อมูล `signage_dev` | 17.x                 | —                                                 |
| Authentication        | Auth.js (`next-auth@beta`, v5) — Credentials          | beta                 | config `auth.ts`, `AUTH_SECRET`                   |
| UI                    | Tailwind CSS                                          | **4.3**              | `@tailwindcss/postcss`, config ใน CSS             |
| Import Excel/CSV      | SheetJS (`xlsx`)                                      | latest               |                                                   |
| Validation            | Zod                                                   | latest               |                                                   |
| Password hashing      | bcrypt / argon2                                       | —                    |                                                   |
| Unit/Integration test | Vitest                                                | latest               |                                                   |
| E2E test              | Playwright                                            | latest               |                                                   |
| Lint / Format         | ESLint (Flat Config) + Prettier                       | latest               | `next lint` ถูกลบ — ใช้ ESLint CLI                |

**ข้อกำหนดสภาพแวดล้อม:** Node.js **≥ 20.9**, TypeScript **≥ 5.1**

> **⚠️ Version-specific gotchas (verified) — ต้องทำตามนี้ตอน implement:**
>
> - **Async Request APIs (Next 16):** `params`, `searchParams`, `cookies()`, `headers()` เป็น Promise — ต้อง `await` ทุกที่ (กระทบ `units/[id]`, route handlers)
>   _(src: nextjs.org/docs/app/guides/upgrading/version-16#async-request-apis-breaking-change)_
> - **Route protection:** ใช้ไฟล์ `src/proxy.ts` (ไม่ใช่ `middleware.ts` ซึ่ง deprecated ใน Next 16; เมื่อใช้ `src/` ต้องวางใน `src/`) — `export { auth as proxy } from "@/auth"`
>   _(src: authjs.dev/getting-started/installation + nextjs.org/.../version-16#middleware-to-proxy)_
> - **Prisma 7 client:** ต้องสร้างผ่าน driver adapter เสมอ — `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`; generator ใหม่ `prisma-client` output ไป `src/generated/prisma`; `url` ของ Migrate อยู่ใน `prisma.config.ts` (ไม่อยู่ใน schema แล้ว)
>   _(src: prisma.io/docs/orm/reference/prisma-config-reference)_
> - **Lint:** ESLint Flat Config + รัน ESLint CLI ตรงๆ (`next lint` ถูกลบใน Next 16); scripts dev/build ไม่ต้องใส่ `--turbopack`
> - **Auth.js v5:** `npm install next-auth@beta`, config ที่ `auth.ts` (root) export `handlers, signIn, signOut, auth`; route handler `app/api/auth/[...nextauth]/route.ts`; `AUTH_SECRET` บังคับ (`npx auth secret`)

### Commands

```bash
npm install                 # ติดตั้ง dependency
npm run dev                 # รัน dev (http://localhost:3000)

npx prisma migrate dev      # สร้าง/อัปเดตฐานข้อมูลตาม schema
npx prisma studio           # เปิด GUI ดูข้อมูล
npm run db:seed             # ใส่ admin เริ่มต้น + ข้อมูลตัวอย่าง

npm run build && npm run start   # production
npm run lint                # ตรวจคุณภาพโค้ด
npm run test                # Vitest (unit/integration)
npm run test:e2e            # Playwright (E2E)
```

---

## 3. Project Structure (โครงสร้างโปรเจกต์)

```
Check_Stock_signage/
├── SPEC.md
├── README.md
├── package.json
├── .env                        # ค่าลับ (ไม่ commit) — ดู .env.example (AUTH_SECRET, DATABASE_URL)
├── .env.example
├── eslint.config.mjs           # ESLint Flat Config
├── postcss.config.mjs          # @tailwindcss/postcss
├── prisma.config.ts            # Prisma 7 config (Migrate datasource url + seed)
├── prisma/
│   ├── schema.prisma           # model: User, SignageUnit, ChecklistItem, UnitChecklist, ChangeLog (native enums)
│   ├── migrations/             # SQL migrations (มี partial unique index)
│   └── seed.ts                 # admin/staff + checklist + ข้อมูลตัวอย่าง
├── src/
│   ├── auth.ts                 # Auth.js v5 config (export handlers/signIn/signOut/auth)
│   ├── proxy.ts                # route protection (export { auth as proxy }) — แทน middleware (Next 16, ต้องอยู่ใน src/)
│   ├── app/
│   │   ├── (auth)/login/       # หน้า login (server action + useActionState)
│   │   ├── (app)/              # ต้องล็อกอิน (layout ตรวจ session)
│   │   │   ├── units/          # รายการ + ค้นหา/กรอง (mobile-first)
│   │   │   ├── units/[id]/     # รายละเอียด + ฟอร์มตรวจยืนยัน + ประวัติ
│   │   │   ├── problems/       # รายการเครื่องที่ "พบปัญหา" ไว้ตามเคลียร์
│   │   │   ├── import/         # หน้านำเข้า Excel/CSV + เลือก/แมปคอลัมน์เอง (admin)
│   │   │   └── settings/       # จัดการ ChecklistItem (เพิ่ม/ลบรายการอุปกรณ์) (admin)
│   │   ├── api/
│   │   │   ├── units/          # GET/POST/PUT/DELETE (PUT ใช้ optimistic lock)
│   │   │   ├── units/[id]/verify/   # POST บันทึกผลตรวจยืนยัน
│   │   │   ├── import/         # POST นำเข้า Excel
│   │   │   └── auth/           # NextAuth handler
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/                    # prisma client, auth config, utils
│   ├── server/                 # business logic (unit service, import service, audit)
│   └── types/
└── tests/
    ├── unit/                   # Vitest (pure logic)
    ├── integration/            # Vitest + DB (เช่น verifyCredentials)
    └── e2e/                    # Playwright
```

### หลักออกแบบ: "แกนนิ่ง + ขอบยืดหยุ่น" (Stable Core + Flexible Edges)

ระบบ **ไม่ฟิกตายตัว** แต่ก็ **ไม่ใช่ dynamic schema ล้วน** (เลี่ยงกับดัก EAV) — แบ่งเป็น:

- **แกนนิ่ง (typed, มีตรรกะผูกอยู่ — ห้ามทำเป็น dynamic):** `serialNumber`, `boxSerialNumber`, `status`, `verifyState`, `version` คือ "สมอง" ของแอป ทุก feature (จับ discrepancy, หน้าปัญหา, ตรวจยืนยัน, กันแก้ชนกัน) พึ่งฟิลด์เหล่านี้
- **ขอบยืดหยุ่น (ผู้ใช้ปรับเองได้):**
  1. **Import column mapping** — อัปโหลด Excel แล้วผู้ใช้เลือกเองว่าหัวคอลัมน์ไหน → map เข้าฟิลด์ไหน (คอลัมน์ที่ไม่เลือกข้ามได้) แนวคิดยืมจากเครื่องมือ Data Matcher เดิม
  2. **Checklist เพิ่ม/ลบเองได้** — เก็บเป็น **config table** (`ChecklistItem`) ไม่ใช่ boolean ตายตัว
  3. **คอลัมน์อื่นที่อยากพ่วง** — เก็บใน JSON column `attributes` ก้อนเดียว (ยืดหยุ่นโดยไม่ระเบิดเป็นตารางย่อย)
- **default = ค่าที่เสนอในสเปคนี้** (checklist 2 อย่าง, ขนาดจอ 4 ค่า) ผู้ใช้ปรับเพิ่มทีหลังได้

**Default column mapping (จาก Excel กลางเดิม):**
| คอลัมน์ใน Excel | → ฟิลด์ | หมายเหตุ |
|----------------|---------|----------|
| `S/N Signage` | `serialNumber` | S/N จริงของเครื่อง |
| `S/N` | `boxSerialNumber` | S/N บนกล่อง (ใช้เทียบหา discrepancy) |
| `Size` | `displaySize` | map ค่าเป็น enum 18.5/24/32/43 |
| `MAC Address` | `macAddress` | |
| `สถานะ` | `status` | **ต้อง map ค่าไทย → enum** ตอน import (UI ให้ผู้ใช้จับคู่ค่าที่เจอ → in*stock/lease_or_sold/trial/repair_lost) |
*(mapping นี้เป็นค่าตั้งต้นที่ pre-fill ให้ ผู้ใช้ปรับได้ตอน import)\_

**User**: `id`, `username`/`email`, `passwordHash`, `role` (`admin` | `staff`), `createdAt`

**SignageUnit** (1 แถว = 1 เครื่องจริง):

- 🔒 **แกนนิ่ง:** `serialNumber` (S/N จริงของเครื่อง — _unique เฉพาะกลุ่ม `verified`_, เฟส import ปล่อยซ้ำได้แล้วติดธง ดูกติกาด้านล่าง), `boxSerialNumber` (S/N บนกล่อง — **อาจไม่ตรง** เก็บแยกเพื่อจับ discrepancy), `status` (enum: `in_stock` | `lease_or_sold` | `trial` | `repair_lost`), `verifyState` (enum: `unverified` | `verified` | `discrepancy`), `version` (optimistic lock)
- 🧩 **typed แต่ปรับ default ได้:** `macAddress`, `displaySize` (default enum: `18.5` | `24` | `32` | `43` นิ้ว), `model` (default `"Smart Signage"`), `location` (ตำแหน่งในคลัง, ใช้ตอน `in_stock`)
- 🔧 **ขอบยืดหยุ่น:** `attributes` (JSON — คอลัมน์เสริมที่ผู้ใช้พ่วงมาตอน import), `accessoryNote`, `note`
- `verifiedBy` (userId), `verifiedAt`, `createdAt`, `updatedAt`

**ChecklistItem** (config รายการอุปกรณ์ที่จะเช็ค — ผู้ใช้เพิ่ม/ลบได้): `id`, `label`, `order`, `active`
_(seed default 2 รายการ: "สายไฟ AC", "เสา Wi-Fi"; admin เพิ่มได้)_

**UnitChecklist** (ผลเช็คอุปกรณ์ต่อเครื่อง): `id`, `unitId`, `checklistItemId`, `present` (boolean) — โยงเครื่องกับ ChecklistItem

**ChangeLog** (audit trail รายตัว): `id`, `unitId`, `userId`, `action` (`import` | `verify` | `edit` | `delete`), `field`, `oldValue`, `newValue`, `createdAt`

> **กติกาสำคัญ:**
>
> - ทุกการแก้ไข SignageUnit ต้องเขียน ChangeLog (ใคร/แก้อะไร/เมื่อไร) ภายใน transaction เดียวกัน
> - การแก้ข้อมูลใช้ `version` ตรวจ optimistic lock — ถ้า version ไม่ตรง = มีคนแก้ไปก่อน ตอบ 409 ให้โหลดใหม่
> - `verifyState` ตั้งเป็น `discrepancy` อัตโนมัติเมื่อ `serialNumber` ≠ `boxSerialNumber` หรือมี ChecklistItem (active) ที่ `present = false`
> - **แกนนิ่งห้ามเก็บใน `attributes` JSON** — ฟิลด์ที่มีตรรกะต้องเป็นคอลัมน์ typed เสมอ (เพื่อ unique constraint, query, validation)
> - การ import ผ่าน column mapping ที่ผู้ใช้เลือก — **นำเข้าทุกแถว** (ข้อมูลเดิมรก เป้าคือเห็นเพื่อไล่เคลียร์) แถวที่ `serialNumber` ซ้ำ/ว่าง **ไม่ปฏิเสธทิ้ง** แต่ติดธง `discrepancy` + รายงานสรุปให้ ไม่ทับเงียบ
> - ⚠️ **จุดต้อง finalize ตอน /plan:** `serialNumber` ไม่ควรเป็น unique แบบเข้มระดับ DB ในเฟส import (ข้อมูลซ้ำจริง) — เสนอใช้ surrogate `id` เป็น PK, `serialNumber` ทำ unique เฉพาะกลุ่มที่ `verified` แล้ว หรือทำ soft-check + ธง discrepancy แทน

---

## 4. Code Style (สไตล์การเขียนโค้ด)

- **ภาษา:** TypeScript เท่านั้น (strict mode) — เลี่ยง `any`
- **ตั้งชื่อ:** ตัวแปร/ฟังก์ชัน `camelCase`, React component `PascalCase`
- **Format:** Prettier (2 spaces, single quote) — ESLint ต้องผ่านก่อน commit
- **Component:** เน้น Server Components, ใช้ `"use client"` เฉพาะที่ต้อง interactive
- **UI mobile-first:** ออกแบบจอมือถือก่อน, ปุ่ม/ช่องแตะง่าย (เป้า ≥ 44px), ฟอร์มตรวจยืนยันต้องกรอกเร็วด้วยมือเดียว
- **Database:** เข้าผ่าน Prisma client singleton ที่ `src/lib/prisma.ts` เท่านั้น
- **Audit:** การแก้ไข unit ต้องผ่าน service ที่ `src/server/` ภายใน transaction (แก้ข้อมูล + เขียน ChangeLog พร้อมกัน) — ห้ามแก้ unit จาก route handler ตรงๆ โดยไม่ลง log
- **API:** validate input ทุก endpoint ด้วย Zod
- **ภาษา UI:** ข้อความหน้าจอ **ภาษาไทย**, โค้ด/comment สำคัญเป็นอังกฤษ
- **Error handling:** ตอบ status code ถูกต้อง (400/401/403/404/409/500) พร้อมข้อความที่อ่านเข้าใจ

---

## 5. Testing Strategy (กลยุทธ์การทดสอบ)

**หลักการ:** ฟีเจอร์ที่มี logic ต้องมีเทสต์ครอบคลุมก่อนถือว่าเสร็จ

| ระดับ       | เครื่องมือ       | ครอบคลุมอะไร                                                                                                 |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------------ |
| Unit        | Vitest           | logic: ตรวจจับ discrepancy, parse/validate แถว Excel, validation                                             |
| Integration | Vitest + test DB | API: verify, import (upsert/ซ้ำ), edit + optimistic lock, audit log, สิทธิ์                                  |
| E2E         | Playwright       | flow หลัก: ล็อกอิน → ค้นหาเครื่อง → ตรวจยืนยัน → เห็นในรายการปัญหา → ล็อกเอาต์ (ทดสอบบน viewport มือถือด้วย) |

**Acceptance Criteria ต่อฟีเจอร์**

- ✅ ล็อกอิน: รหัสถูกเข้าได้/ผิดขึ้น error, เข้าหน้าใน `(app)` โดยไม่ล็อกอินถูก redirect ไป login
- ✅ Import Excel: อัปโหลดแล้วเลือก/แมปคอลัมน์เองได้ (หัวตารางต่างกันก็ import ได้), คอลัมน์ที่ไม่เลือกไป `attributes`, แถว S/N ซ้ำถูกรายงานไม่ทับเงียบ, แถวผิดรูปแบบถูกข้ามพร้อมแจ้ง
- ✅ Checklist ปรับได้: admin เพิ่ม/ลบ ChecklistItem ได้, ฟอร์มตรวจแสดงรายการตาม config ปัจจุบัน, เพิ่มรายการใหม่ไม่กระทบเครื่องที่ตรวจไปแล้ว
- ✅ ค้นหา/กรอง: ค้นด้วย S/N/MAC ถูกต้อง, กรองตามขนาดจอ/สถานะ/สถานะการตรวจได้
- ✅ ตรวจยืนยัน: บันทึกผลแล้ว `verifyState` เปลี่ยนถูก, ถ้า S/N เครื่อง ≠ กล่อง หรืออุปกรณ์ไม่ครบ → ตั้ง `discrepancy` อัตโนมัติ, บันทึก verifiedBy/At
- ✅ รายการปัญหา: หน้า `/problems` แสดงเฉพาะ unit ที่ `discrepancy` ครบถ้วน
- ✅ กันการชนกัน: แก้ด้วย version เก่า (มีคนแก้ก่อน) ต้องได้ 409 ไม่ทับเงียบ; ทุกการแก้มี ChangeLog
- ✅ ประวัติ: เปิดเครื่องเห็นรายการแก้ไขเรียงเวลา ใคร/แก้อะไร
- ✅ สิทธิ์: staff เรียก API ลบเครื่อง/import ต้องได้ 403

**เกณฑ์ผ่าน:** `npm run lint`, `npm run test`, `npm run build` ต้องผ่านก่อน merge

---

## 6. Boundaries (ขอบเขตการทำงาน)

### ✅ Always (ทำได้เสมอ ไม่ต้องถาม)

- เขียน/แก้โค้ดในโครงสร้างที่กำหนดในสเปคนี้
- เพิ่มเทสต์ให้ฟีเจอร์ใหม่
- รัน lint/test/build เพื่อตรวจสอบ
- แก้ bug ที่ทำให้เทสต์ fail
- เก็บรหัสผ่านแบบ hash เสมอ

### ⚠️ Ask First (ถามก่อนทำ)

- เพิ่ม dependency ที่ไม่ได้ระบุในสเปค
- เปลี่ยน data model / schema หลังมีข้อมูลจริงแล้ว (ต้อง migrate)
- เปลี่ยนเทคโนโลยีหลัก (เช่น ย้าย SQLite → Postgres)
- เปลี่ยน flow auth / สิทธิ์
- เพิ่มฟีเจอร์นอกขอบเขต V1 (เช่น ผูกลูกค้า, บาร์โค้ด)

### 🚫 Never (ห้ามทำเด็ดขาด)

- commit ไฟล์ `.env` หรือค่าลับ/รหัสผ่านจริง
- เก็บรหัสผ่านเป็น plaintext
- ลบ/รีเซ็ตฐานข้อมูลจริงโดยไม่ได้รับอนุญาต (เช่น `prisma migrate reset` บน prod)
- ปิด/ข้ามระบบ auth เพื่อความสะดวก
- เขียน SQL ดิบเสี่ยง injection — ใช้ Prisma เท่านั้น
- **แก้ไข SignageUnit โดยไม่เขียน ChangeLog** (ทำลาย audit trail)
- import แล้วทับข้อมูล S/N ที่มีอยู่แบบเงียบๆ โดยไม่รายงาน
- push ขึ้น remote / deploy โดยไม่ได้รับการยืนยัน

---

## ขั้นถัดไป (Next Steps)

1. ยืนยันสเปคนี้ (+ ส่งตัวอย่างหัวคอลัมน์ Excel เดิม จะ map ได้แม่นขึ้น)
2. `/plan` — แตกงานเป็น task ย่อยตามลำดับ
3. Implement: ตั้งโปรเจกต์ → schema → auth → import Excel → รายการ/ค้นหา → ฟอร์มตรวจยืนยัน → หน้าปัญหา → เทสต์

---

## 7. ส่วนเสริมรอบที่ 2 — เวลาไทย + Table view (spec ฟีเจอร์)

### 7.1 แสดงเวลาเป็นเวลาไทย (Asia/Bangkok)

**ปัญหา:** บน prod (Vercel) เซิร์ฟเวอร์เป็น UTC เวลาที่ render (เช่นประวัติการแก้ไข) จึงเพี้ยนจากเวลาไทย

**ทำ:**

- util กลาง `src/lib/datetime.ts` → `formatThaiDateTime(date)` ใช้ `Intl.DateTimeFormat('th-TH-u-ca-gregory', { timeZone: 'Asia/Bangkok', dateStyle:'medium', timeStyle:'short', hourCycle:'h23' })` (ชื่อเดือนไทย + **ปี ค.ศ.**, 24 ชม.)
- แทนการเรียก `toLocaleString` ตรงๆ ทุกที่ที่โชว์เวลา (ตอนนี้: ประวัติใน `units/[id]`; ใช้ util เดิมกับเวลาอื่นที่จะเพิ่มภายหลัง)

**Acceptance:** เวลาเดียวกัน (instant UTC) แสดงเป็นเวลา Bangkok (+7) เสมอ ไม่ว่ารันที่ server tz ใด — เทสต์ util ด้วย instant คงที่

### 7.2 มุมมอง Table (สลับ Card/Table) + sort + ฟิลเตอร์เพิ่ม

**ทำ (ตามที่ผู้ใช้เลือก):**

- **สลับ Card/Table ได้** — ปุ่มสลับมุมมอง จำค่าใน `localStorage` (`unitsView`); การ์ดเหมาะมือถือ, ตารางเหมาะโน้ตบุ๊ก
- **Table** คอลัมน์: S/N เครื่อง · S/N Software · ขนาดจอ · สถานะ · การตรวจ · ตำแหน่งเครื่อง · ตำแหน่งกล่อง — คลิกแถว → หน้า detail; มือถือเลื่อนแนวนอนได้
- **Sort** คลิกหัวคอลัมน์เพื่อเรียง (S/N, ขนาดจอ, สถานะ, การตรวจ, ตำแหน่ง) สลับ asc/desc — ทำฝั่ง client บนผลที่โหลดมา
- **ฟิลเตอร์เพิ่ม** (ฝั่ง server, ต่อจากเดิม): `location` (ค้นตำแหน่งเครื่อง, contains) + `hasBox` (มีกล่อง/ไม่มีกล่อง — อิง `boxLocation` ว่าง/ไม่ว่าง)

**สถาปัตยกรรม:** ดึงข้อมูล server-side (`listUnits` + filter) เหมือนเดิม → ส่งให้ client component `UnitsView` (เลือก card/table + sort ฝั่ง client). ฟิลเตอร์ยังเป็น GET form (URL state). ขยาย `listSelect` ให้มี `boxSerialNumber`, `boxLocation`.

**ไฟล์ที่เกี่ยวข้อง:**

- `src/lib/unit-filters.ts` — เพิ่ม `location`, `hasBox` (+ test)
- `src/server/units.ts` — `buildUnitWhere` รองรับ location/hasBox; `listSelect` เพิ่ม box fields (+ integration test)
- `src/components/units/UnitsView.tsx` (client) — toggle + table + sort; `UnitsTable.tsx`
- `src/lib/sort-units.ts` — `sortUnits(units, key, dir)` pure (+ unit test)
- `src/components/units/UnitFiltersForm.tsx` — เพิ่มช่องตำแหน่ง + select มีกล่อง
- `src/app/(app)/units/page.tsx` — ส่ง units ให้ `UnitsView`

**Acceptance:**

- ✅ สลับ Card↔Table ได้ + จำค่าไว้ (refresh แล้วยังมุมมองเดิม)
- ✅ Table แสดงครบทุกคอลัมน์ + คลิกแถวไป detail + มือถือ scroll แนวนอนได้
- ✅ Sort: คลิกหัวคอลัมน์เรียงถูก สลับ asc/desc
- ✅ ฟิลเตอร์ location (contains) + hasBox (มี/ไม่มีกล่อง) กรองถูก รวมกับฟิลเตอร์เดิมแบบ AND
- ✅ a11y: ตารางใช้ `<table>` semantic, หัว sort เป็นปุ่ม, contrast ผ่านทั้ง light/dark

**ขอบเขต:** ไม่มี migration (ใช้ field เดิม) · ไม่ทำ pagination รอบนี้ (sort/ฟิลเตอร์บนผลทั้งหมด) · mobile-first + dark variants ครบ

---

## 8. ส่วนเสริมรอบที่ 3 — คอลัมน์หมายเหตุ + ลบเครื่อง (soft delete) + Audit log

### 8.0 การตัดสินใจเชิงสถาปัตยกรรม: hard delete vs soft delete

**คำถามผู้ใช้:** "การลบทำให้เสียเลข index ของตัวที่ลบและกู้ไม่ได้ใช่ไหม ควรลบไหม?"

**ข้อสรุป:**

- **เรื่องเสีย "เลข index" ไม่ใช่ปัญหาในระบบนี้** — PK เป็น `cuid()` (สตริงสุ่ม) ไม่ใช่ auto-increment integer จึงไม่มีลำดับให้เสีย/ช่องว่าง/ใช้ซ้ำ. (ที่เคยเรียนเป็นเคสของ integer sequence PK)
- **ปัญหาจริงคือ cascade:** `ChangeLog` + `UnitChecklist` มี `onDelete: Cascade` → hard delete เครื่อง = **ทำลาย audit trail ของเครื่องนั้นถาวร** ซึ่งขัดกับหัวใจระบบ (ตรวจสอบย้อนหลังได้)
- **ทางออก = soft delete + retention 30 วัน** (ตรงกับไอเดีย "backup 30 วันก่อนลบ" ของผู้ใช้): ลบ = ติดธง `deletedAt`, ซ่อนจากรายการ แต่ยังกู้คืนได้; เกิน 30 วันค่อย purge (ลบจริง) โดยเก็บ snapshot เป็นหลักฐานถาวรก่อน

### 8.1 คอลัมน์ "หมายเหตุ" ใน Table view

- ฟิลด์ `note` **มีอยู่แล้วใน schema** ([schema.prisma:77](prisma/schema.prisma#L77)) — ไม่ต้อง migrate
- เพิ่ม `note: true` ใน `listSelect` ([src/server/units.ts](src/server/units.ts)) → เพิ่มคอลัมน์ "หมายเหตุ" ใน `UnitsTable` (sort ได้ด้วย locale ไทย, ค่าว่าง = "—" ไปท้าย); ตัดข้อความยาวด้วย truncate + `title`

### 8.2 ลบเครื่อง (admin เท่านั้น) — Soft delete

**Data model (migration เพิ่ม field/enum/table แบบ additive ล้วน — ไม่กระทบข้อมูล prod เดิม):**

- `SignageUnit.deletedAt DateTime?` (null = ใช้งานปกติ) + `@@index([deletedAt])`
- `SignageUnit.deletedById String?` + relation → ใช้แสดง "ใครลบ" ในถังขยะโดยไม่ต้อง join ChangeLog
- `ChangeAction` เพิ่มค่า `restore` (ALTER TYPE ADD VALUE — additive, ปลอดภัยบน prod)
- model ใหม่ `DeletionArchive` (snapshot ตอน purge เพื่อเก็บหลักฐานถาวรหลัง row หาย): `{ id, originalId, serialNumber?, snapshot Json, deletedAt, purgedAt, purgedById }`

**พฤติกรรม:**

| การกระทำ | ใคร | ทำอะไร | log |
|---|---|---|---|
| **ลบ** (soft) | admin | `deletedAt=now()`, `deletedById`, `version++` ใน transaction → หายจากทุกรายการ/ค้นหา/export | `ChangeLog(action=delete)` |
| **กู้คืน** | admin | `deletedAt=null`, `deletedById=null`, `version++` | `ChangeLog(action=restore)` |
| **ลบถาวร** (purge) | admin | เขียน `DeletionArchive` (snapshot) ก่อน → `prisma.signageUnit.delete` (cascade ล้าง ChangeLog/UnitChecklist ของตัวนั้น) | snapshot ใน DeletionArchive |

- **รายการปกติทั้งหมดต้องกรอง `deletedAt: null`** — แก้ `buildUnitWhere` ให้ใส่ `deletedAt: null` เป็นค่าตั้งต้น (กระทบ list + export + problems + count); `getUnitDetail` คืน null ถ้า soft-deleted (กันลิงก์เก่า)
- guard: server service เช็ค `requireRole(['admin'])`; ปุ่ม UI แสดงเฉพาะ admin (`hasRole`)

**จุดวางปุ่มลบ (ผู้ใช้เลือก: ทั้งสองที่):**

- **หน้า detail** `/units/[id]` — ปุ่ม "ลบเครื่อง" (admin) + dialog ยืนยัน (พิมพ์/กดยืนยัน) กัน fat-finger
- **ในตาราง** — checkbox เลือกหลายแถว + แถบ action ลอย "ลบ N เครื่อง" (bulk soft delete) + ยืนยัน

### 8.3 ถังขยะ (Trash) `/trash` — admin เท่านั้น

- list เครื่องที่ `deletedAt != null` เรียงตามวันลบล่าสุด: S/N, ใครลบ, ลบเมื่อ (เวลาไทย), **เหลือ N วันก่อนถูกลบถาวร** (30 − อายุ)
- ปุ่มต่อแถว: **กู้คืน** / **ลบถาวร** (purge, มี dialog ยืนยันเข้ม "ลบถาวรกู้ไม่ได้")
- ส่วนล่าง: **ลบถาวรแล้ว** — รายการจาก `DeletionArchive` (S/N, ลบเมื่อ, purge เมื่อ) เป็นหลักฐาน
- retention เป็น manual: ไม่มี cron; ตัวที่เกิน 30 วันจะมีป้าย "ครบกำหนด" + ปุ่ม "ล้างถาวรทั้งหมดที่ครบกำหนด"

### 8.4 หน้า Audit Log `/audit` — admin เท่านั้น

- แสดง `ChangeLog` ทั้งหมด (ทุก action: import/verify/edit/delete/restore) เรียงใหม่→เก่า, pagination แบบ `take/skip` (เช่นหน้าละ 50)
- คอลัมน์: เวลา (เวลาไทย), ผู้ใช้, action (badge สี), เครื่อง (ลิงก์ไป detail ถ้ายังอยู่), field/old→new
- **กรองตาม action** (เช่นดูเฉพาะ `delete`) + กรองตามผู้ใช้ — GET form (URL state)
- ลิงก์เข้าหน้านี้ + `/trash` จากเมนูหน้า home (การ์ด admin-only) และ header

### 8.5 ไฟล์ที่เกี่ยวข้อง

- `prisma/schema.prisma` + migration ใหม่ (รัน **local เท่านั้น**; prod รันตอน deploy ผ่าน `vercel-build`)
- `src/server/delete-unit.ts` (ใหม่) — `softDeleteUnit`/`softDeleteUnits`/`restoreUnit`/`purgeUnit`/`purgeExpired` + TDD test
- `src/server/units.ts` — `buildUnitWhere` ใส่ `deletedAt:null`; `listSelect` เพิ่ม `note`; `getUnitDetail` กัน soft-deleted; `listDeletedUnits()`
- `src/server/audit.ts` (ใหม่) — `listAuditLog({ action?, userId?, page })`
- `src/components/units/UnitsTable.tsx` — คอลัมน์หมายเหตุ + checkbox เลือก + bulk action bar
- `src/lib/sort-units.ts` — เพิ่ม `note` ใน `SortKey`
- `src/app/(app)/units/[id]/` — ปุ่มลบ (DeleteUnitButton client + action)
- `src/app/(app)/trash/page.tsx` + actions · `src/app/(app)/audit/page.tsx`
- `src/app/(app)/page.tsx` — การ์ดเมนู admin: ถังขยะ + Audit log
- `src/types/signage.ts` — label ของ `ChangeAction` (รวม restore)

### 8.6 Acceptance

- ✅ Table มีคอลัมน์ "หมายเหตุ" (sort ได้, ตัดยาว, ค่าว่างไปท้าย)
- ✅ admin ลบเครื่องได้จาก detail + เลือกหลายตัวในตาราง; staff ลบไม่ได้ (UI ซ่อน + server 403)
- ✅ เครื่องที่ลบหายจาก list/ค้นหา/export/problems/detail ทันที แต่ยังอยู่ในถังขยะ
- ✅ กู้คืนแล้วกลับมาในรายการปกติครบ (รวม checklist + ประวัติเดิม)
- ✅ ทุกการลบ/กู้คืนมี ChangeLog; purge เก็บ snapshot ใน DeletionArchive
- ✅ หน้า /trash โชว์ "เหลือกี่วัน" + กู้คืน/ลบถาวร; /audit กรอง action ได้
- ✅ ทุก migration เป็น additive (nullable col / enum value / table ใหม่) — ไม่แตะข้อมูล prod เดิม
- ✅ lint + typecheck + test (เพิ่มเทสต์ใหม่) + build เขียว; mobile-first + dark variants ครบ

**ขอบเขต/ความปลอดภัย:** ไม่ auto-commit git · migration รัน local เท่านั้น · ไม่อ่าน `.env` · ทุก operation บน prod เป็น additive · ไม่ทำ cron purge รอบนี้ (manual)
