# เช็คสต็อก Smart Signage

เครื่องมือให้ทีมเล็ก (2–3 คน) **เคลียร์/ตรวจนับสต็อกเครื่อง Smart Signage รายตัว** บนมือถือ/แท็บเล็ต/โน้ตบุ๊ก — ติดตามทรัพย์สินรายตัว (S/N, MAC, ขนาดจอ) + workflow ตรวจยืนยันที่จับ "S/N ใส่กล่องผิด / อุปกรณ์ไม่ครบ" อัตโนมัติ

> รายละเอียดการออกแบบทั้งหมดอยู่ใน [SPEC.md](SPEC.md) · งาน/แผนใน [tasks/](tasks/)

## ความสามารถ

- 🔐 ล็อกอิน + แยกสิทธิ์ **admin / staff**
- 📋 รายการเครื่อง + ค้นหา (S/N, MAC) + กรอง (สถานะ, สถานะการตรวจ, ขนาดจอ)
- ✅ **ตรวจยืนยันรายตัว** — เทียบ S/N เครื่องกับกล่อง + เช็คอุปกรณ์ → จับ discrepancy อัตโนมัติ
- ⚠️ หน้า **เครื่องที่มีปัญหา** รวม discrepancy พร้อมเหตุผล
- 🕑 ประวัติการแก้ไขรายตัว (audit) + **กันการแก้ชนกัน** (optimistic lock)
- 📥 **นำเข้า Excel/CSV** + จับคู่คอลัมน์เอง (admin)
- ⚙️ จัดการรายการอุปกรณ์ที่ใช้ตรวจ (admin)

## เทคโนโลยี (verified June 2026)

Next.js 16 (App Router) · React 19.2 · TypeScript · Prisma 7 + PostgreSQL · Auth.js v5 · Tailwind CSS 4 · Vitest · Playwright

## ความต้องการของระบบ

- **Node.js ≥ 20.9**
- **PostgreSQL** (เช่น เวอร์ชัน 17)

## ติดตั้งและรัน (จากเครื่องเปล่า)

```bash
# 1) ติดตั้ง dependency
npm install

# 2) สร้างฐานข้อมูล PostgreSQL ชื่อ signage_dev
#    (ตัวอย่างถ้าใช้ Postgres local, superuser postgres)
psql -U postgres -c "CREATE DATABASE signage_dev"

# 3) ตั้งค่า environment
cp .env.example .env
#    แก้ DATABASE_URL ให้ตรงกับ Postgres ของคุณ
#    สร้าง AUTH_SECRET:  npx auth secret   (หรือใส่สตริงสุ่มเอง)

# 4) สร้างตาราง + ใส่ข้อมูลตัวอย่าง
npx prisma migrate dev
npm run db:seed

# 5) รัน dev server → http://localhost:3000
npm run dev
```

### บัญชีทดสอบ (จาก seed)

| บทบาท | username | password   |
| ----- | -------- | ---------- |
| admin | `admin`  | `admin123` |
| staff | `staff`  | `staff123` |

> ⚠️ เปลี่ยนรหัสผ่านก่อนใช้งานจริง — บัญชี seed สำหรับ dev เท่านั้น

## คำสั่ง

| คำสั่ง                            | ทำอะไร                                            |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | รัน dev server                                    |
| `npm run build` / `npm run start` | build / รัน production                            |
| `npm run lint`                    | ESLint                                            |
| `npm run typecheck`               | ตรวจชนิดข้อมูล (tsc)                              |
| `npm run format`                  | จัดรูปแบบด้วย Prettier                            |
| `npm run test`                    | Vitest (unit + integration — ต้องมี Postgres รัน) |
| `npm run test:e2e`                | Playwright E2E (mobile viewport)                  |
| `npm run db:seed`                 | รีเซ็ต + ใส่ข้อมูลตัวอย่าง                        |
| `npm run db:studio`               | เปิด Prisma Studio ดูข้อมูล                       |

## สิทธิ์การใช้งาน (RBAC)

| ความสามารถ                    | staff | admin |
| ----------------------------- | :---: | :---: |
| ดู/ค้นหา/กรองเครื่อง          |  ✅   |  ✅   |
| ตรวจยืนยัน / แก้ข้อมูลเครื่อง |  ✅   |  ✅   |
| นำเข้า Excel (`/import`)      |   —   |  ✅   |
| จัดการอุปกรณ์ (`/settings`)   |   —   |  ✅   |

หน้าเว็บถูกป้องกันด้วย `src/proxy.ts` (redirect ไป `/login`); API ป้องกันด้วย `requireRole()` (คืน 401/403)

## โครงสร้างโดยย่อ

```
src/
  auth.ts            Auth.js v5 config
  proxy.ts           route protection (Next 16)
  app/(auth)/login   หน้าล็อกอิน
  app/(app)/         หน้าหลังล็อกอิน: units, units/[id], problems, import, settings
  app/api/           units (GET), import (POST), auth
  server/            business logic (verify, update-unit, import, problems, discrepancy, units, checklist)
  lib/               prisma client, rbac, errors, utils
  types/             enums + Auth.js type augmentation
prisma/              schema (PostgreSQL, native enums) + migrations + seed
tests/               unit / integration (Vitest) + e2e (Playwright)
```

## Deploy ขึ้น Vercel

1. **ฐานข้อมูล:** สร้าง PostgreSQL บน cloud (Neon / Supabase / Vercel Postgres / Prisma Postgres)
   - สำหรับ serverless **แนะนำใช้ connection แบบ pooled** (เช่น Neon pooler endpoint) เพื่อกัน connection หมด
2. **Env vars บน Vercel:**
   - `DATABASE_URL` = connection **pooled** (Neon: host มี `-pooler`) — แอปใช้ runtime
   - `DIRECT_DATABASE_URL` = connection **direct/unpooled** (Neon: host ไม่มี `-pooler`) — Prisma Migrate ใช้
   - `AUTH_SECRET` = สตริงสุ่ม (`npx auth secret` หรือ `openssl rand -base64 33`)
   - _ไม่ต้องตั้ง `AUTH_URL`/`trustHost`_ — Auth.js v5 ตรวจจับ Vercel อัตโนมัติ
3. **Build:** Vercel จะรัน script `vercel-build` ให้เอง = `prisma migrate deploy && next build`
   (และ `postinstall` รัน `prisma generate` ให้ตอน install — เพราะ `src/generated/` ไม่ได้ commit)
4. **ข้อมูลเริ่มต้น:** หลัง deploy ครั้งแรก สร้าง admin คนแรกด้วยการรัน seed ครั้งเดียว
   (`DATABASE_URL=<prod> npm run db:seed`) หรือเพิ่มผ่านหน้า `/users` ภายหลัง — **อย่าลืมเปลี่ยนรหัส seed**

> หมายเหตุ: รายละเอียด pooling ของแต่ละผู้ให้บริการต่างกัน — ตรวจกับ docs ของผู้ให้บริการที่เลือกอีกที

## หมายเหตุ

- เก็บรหัสผ่านแบบ hash (bcrypt) เสมอ — ห้าม commit `.env`
- `serialNumber` ไม่ unique ระดับ DB ทั่วไป แต่ unique เฉพาะกลุ่ม `verified` (partial index) — รองรับข้อมูล import ที่ S/N ซ้ำ/ว่าง โดยติดธง "พบปัญหา"
