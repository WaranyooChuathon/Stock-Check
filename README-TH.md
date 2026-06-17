# StockCheck — ระบบตรวจนับทรัพย์สินรายตัว (Live Demo)

[English](README.md) · **ภาษาไทย**

> เครื่องมือ mobile-first ให้ทีมเล็ก **ตรวจนับ / ยืนยัน / ตรวจสอบย้อนหลังสินค้าหรือทรัพย์สินรายตัว** — 1 แถว = 1 ชิ้นจริง พร้อม workflow การตรวจยืนยันและประวัติการแก้ไขครบถ้วน
> **นี่คือ live demo** เปิดเล่นได้ทันทีไม่มี login wall · รันบน PostgreSQL จริง และ fallback เป็นข้อมูล in-memory แบบ deterministic โดยไม่ต้องตั้งค่าอะไรเลย

🔗 **Live Demo:** _ใส่หลัง deploy_ — `https://<your-app>.vercel.app`
🔑 **เข้าใช้งาน:** กดปุ่ม **"🚀 เข้าสู่ Live Demo"** หรือใช้ `admin` / `admin123` (ผู้ดูแล) · `staff` / `staff123` (พนักงาน)
👤 **โดย:** Waranyoo Chuathon · [GitHub](https://github.com/WaranyooChuathon)
📐 **สถาปัตยกรรม:** ดู [ARCHITECTURE.md](ARCHITECTURE.md)

---

## ภาพหน้าจอ

| รายการสินค้า (การ์ด) | รายละเอียด + ตรวจยืนยัน |
|:--:|:--:|
| ![Items](docs/screenshots/units-list.png) | ![Detail](docs/screenshots/unit-detail.png) |

## ภาพรวม

StockCheck ติดตามสต็อกแบบ **ทรัพย์สินรายตัว (serialized)** — 1 แถว = 1 ชิ้นจริง ไม่ใช่การนับจำนวนกอง
แต่ละชิ้นมีตัวตน (S/N, หมวด, สเปค) และสถานะการตรวจ ทีมจึงเดินเคลียร์ของจริงให้ตรงกับข้อมูล และติดธงตัวที่ไม่ตรงได้

เป็นระบบ **generic** — สินค้าจัดอยู่ใน **หมวด (category)** แบบพิมพ์เองได้ (signage, laptop, เครื่องมือช่าง, เฟอร์นิเจอร์, …)
แต่ละหมวดมีสเปคของตัวเอง (เก็บใน JSON `attributes`) และมี checklist การตรวจของหมวดนั้น — demo seed ไว้ 4 หมวดเพื่อโชว์

> ที่มา: ดัดแปลงจากเครื่องมือ "สต็อก Smart Signage" ภายในของจริง แล้ว genericize ให้เป็น portfolio demo ที่ company-safe — ทุกชื่อ/S/N/ข้อมูลเป็นของสมมติทั้งหมด

## ปัญหาที่แก้

- **ไม่รู้ว่ามีอะไรบ้าง** — ของไหลข้ามสถานะ (ในสต็อก / เช่าซื้อ-ขาย / ทดสอบ / ซ่อม-สูญหาย) จนข้อมูลไม่ตรงของจริง
- **Excel แบนๆ ไม่พอ** — ต้องมีตัวตนรายชิ้น, ประวัติการตรวจ, และกันสองคนแก้แถวเดียวกันทับกัน
- **ต้องเคลียร์ไว + เชื่อถือได้** — หลายคนช่วยกันตรวจพร้อมกัน ทุกการแก้มี log ไม่ทับเงียบ

## ฟีเจอร์

- **รายการสินค้า** — ค้นด้วย S/N, กรองตามหมวด / สถานะ / การตรวจ / ตำแหน่ง, สลับมุมมองการ์ด ⇄ ตาราง + sort, export Excel/CSV
- **ตรวจยืนยันรายตัว** — บันทึก S/N จริง, หมวด, สถานะ และ checklist อุปกรณ์ตามหมวด; ติดธง **discrepancy** อัตโนมัติเมื่อขาด
- **หน้าปัญหา** — รวมตัวที่ติดธงพร้อมเหตุผล ไว้ไล่เคลียร์
- **นำเข้า Excel/CSV** — อัปโหลดแล้วจับคู่คอลัมน์เอง; คอลัมน์ที่ไม่ map ไปอยู่ `attributes`; ข้อมูลรก (S/N ซ้ำ/ว่าง) นำเข้า + ติดธง ไม่ทิ้งเงียบ
- **Soft delete + ถังขยะ** — ลบแล้วกู้คืนได้ภายใน 30 วัน ก่อน purge (เก็บ snapshot ถาวร)
- **Audit log** — ทุกการกระทำ (นำเข้า/ตรวจ/แก้ไข/ลบ/กู้คืน) บันทึก ใคร/เมื่อ กรอง + แบ่งหน้าได้
- **Optimistic locking** — แก้ชนกันได้ 409 ไม่ทับเงียบ
- **RBAC** — admin / staff · **dark mode** · เวลาไทย · mobile-first ทุกหน้า

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript |
| ฐานข้อมูล | PostgreSQL ผ่าน Prisma 7 (driver adapter `@prisma/adapter-pg`) — prod ใช้ **Neon** |
| Auth | Auth.js v5 (`next-auth`) — Credentials + JWT |
| UI | Tailwind CSS 4 + next-themes (dark mode) |
| นำเข้า/ส่งออก | SheetJS (`xlsx`) · ตรวจ input ด้วย Zod |
| ทดสอบ | Vitest (unit + integration) |
| Deploy | Vercel (region `sin1`) + Vercel Cron |

## สถาปัตยกรรมข้อมูล (prod vs demo)

StockCheck ใช้ **dual-mode data layer** — ทุกหน้าเรียก service ใน `src/server/*` ชุดเดียวกัน ซึ่งสลับด้วย `isDemoMode()`:

```
มี DATABASE_URL   → Prisma จริงบน PostgreSQL (Neon)        ← production
ไม่มี DATABASE_URL → mock in-memory แบบ deterministic       ← CI / local / preview
```

mock store จำลองพฤติกรรมจริง (optimistic-lock 409, กฎ discrepancy, soft-delete, audit) ทำให้ UI เหมือนกันทั้งสองโหมด —
build ผ่านและแอป boot ได้โดย **ไม่มี secret และไม่มี DB**. มี endpoint `/api/demo/reset` (มี token guard) + Vercel Cron
คอย re-seed ข้อมูล demo สาธารณะไม่ให้รก. รายละเอียดดู [ARCHITECTURE.md](ARCHITECTURE.md)

## เริ่มใช้งาน

```bash
npm install

# เริ่มเร็ว — ไม่ต้องมี DB (ใช้ข้อมูล demo in-memory):
npm run dev          # http://localhost:3000

# ต่อ DB จริง:
cp .env.example .env            # ตั้ง DATABASE_URL + AUTH_SECRET
npx prisma migrate deploy
npm run db:seed                 # ข้อมูลสมมติ 4 หมวด
npm run dev
```

เกณฑ์ผ่าน: `npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`

## Deploy เวอร์ชันของคุณเอง

ดู **[DEPLOY.md](DEPLOY.md)** สำหรับ runbook เต็ม (Neon + Vercel) — สรุป: สร้าง Neon project ส่วนตัว, push ขึ้น GitHub repo ใหม่,
import บน Vercel, ตั้ง `DATABASE_URL`, `DIRECT_DATABASE_URL`, `AUTH_SECRET`, `DEMO_RESET_TOKEN` (หรือ `CRON_SECRET`).
`vercel-build` รัน migration ให้อัตโนมัติ

---

_เป็น portfolio demo บนข้อมูลสมมติ — ไม่ได้เชื่อมต่อระบบของบริษัทใด_
