# Portfolio Plan — StockCheck (Generic Asset Tracker) · Live Demo

> แตกงานจาก [PORTFOLIO-SPEC.md](../PORTFOLIO-SPEC.md) · checklist: [portfolio-todo.md](portfolio-todo.md)
> ไม่ทับ `plan.md`/`todo.md` (โปรดักต์จริง)

## หลักการ slice
vertical slice (ทำจบเป็นเส้น verify ได้). 2 แกนเสี่ยง = **(A) genericize domain (rename+migration)** และ **(B) dual-mode data layer** → ทำก่อน + checkpoint ชัด

## Dependency graph (ลำดับ)

```
P0 Bootstrap ─> P1 Genericize domain ─> P2 Dual-mode ─> P3 Demo auth ─┐
   (USER+AI)      (AI, real Prisma)       (AI)            (AI)         │
                          │                                            ├─> P5 Polish ─> P6 Verify ─> P7 Deploy
                          └────────────> P4 Reset+cron ────────────────┘   (AI)        (AI)       (USER+AI)
                                            (AI, ต้องมี DB test)
```

- **P1 บล็อก P2** (mock ต้องสะท้อน shape generic `Item` ใหม่)
- **P2 บล็อก pages ทุกหน้า** (วิ่งได้ทั้งมี/ไม่มี DB)
- **P4 reset** ต้องการ DB จริง test → คู่ขนาน P3 ได้
- **P7 deploy** รอ P5+P6 + USER จัด Neon/Vercel

## แบ่งงาน

| ทำเอง (USER) | AI ทำได้ |
|---|---|
| สร้าง Neon project ส่วนตัวใหม่ (sin1) → connection strings | โค้ดทั้งหมด (rename, migration, mock, reset, banner, generic UI) |
| สร้าง GitHub repo + Vercel + ตั้ง env (4 ตัว) | seed หลายหมวด, runbook, README/ARCHITECTURE |
| บอก path โฟลเดอร์ใหม่ | copy repo + strip .git/.env (เมื่อได้ path) |
| `git push` + deploy (⛔ ห้าม AI auto) | secret scan, verify browser, screenshots |
| **ตัดสิน:** วิธี cron (แนะนำ Vercel Cron), category free-form vs config table | ตั้ง cron/category ตามที่เลือก |

## Checkpoints
- **CP-A (หลัง P1):** ต่อ Postgres local → `Item` ใช้งานครบ (CRUD/verify/import), seed ≥3 หมวด, ไม่เหลือ symbol "signage", regression เขียว
- **CP-B (หลัง P2):** ไม่มี `DATABASE_URL` → ทุกหน้า mock + mutation ในเซสชัน; มี → real ไม่ regression
- **CP-C (หลัง P4):** ต่อ Neon/local → reset คืน seed, token guard 401, cron config ถูก
- **CP-D (หลัง P6):** screenshot ครบ + README สมบูรณ์ → ก่อน deploy
- **CP-E (หลัง P7):** live URL, "เข้าสู่ Live Demo" + Reset ทำงานบน prod

## Phase summary
| Phase | งาน | เจ้าของ | gate |
|---|---|---|---|
| P0 | bootstrap repo ใหม่ | USER+AI | path |
| P1 | genericize domain (Item+category, migration, rebrand) | AI | CP-A |
| P2 | dual-mode data layer + mock | AI | CP-B |
| P3 | ปุ่ม "เข้าสู่ Live Demo" | AI | — |
| P4 | reset endpoint + cron + DemoBanner | AI | CP-C |
| P5 | genericize sweep + README + ARCHITECTURE | AI | — |
| P6 | verify browser + screenshots | AI | CP-D |
| P7 | Neon + Vercel deploy + runbook | USER+AI | CP-E |

## ความเสี่ยง / กันพลาด
- **rename ตกหล่น** → typecheck + grep "signage|SignageUnit" เป็น gate ของ P1
- **migration บน Neon บริษัท** → รัน local/Neon **ส่วนตัว** เท่านั้น (P1/P7)
- **mock shape เพี้ยน** → ผูก type เดิม, tsc จับ
- **reset endpoint ถูกยิงมั่ว** → token guard
- **เผลอ commit secret / แตะ repo เดิม** → ทำบนโฟลเดอร์ใหม่ + secret scan ก่อน push
