# 🎯 Portfolio Playbook — เปลี่ยนโปรเจกต์งาน → Live Demo สำหรับ Portfolio

ชุด prompt + skill ที่ใช้ซ้ำได้กับทุกโปรเจกต์ เพื่อแปลงงานบริษัท/งานเก่าให้เป็น
**live demo ที่กดเล่นได้จริง · company-safe · พร้อมโชว์ recruiter**
แทนค่าในวงเล็บ `[...]` ตามโปรเจกต์ แล้วพิมพ์ตามลำดับ

> ถอดจากกระบวนการจริงของ Smart Signage Dashboard (2026-06) — decouple → mock → polish → deploy → (full-stack)

---

## ลำดับ prompt

### 0. สำรวจ + ตัดสินใจแนวทาง *(ยังไม่แก้โค้ด)*
```
อ่าน README / โครงสร้าง / markdown ของโปรเจกต์ [ชื่อโปรเจกต์] แล้วสรุปให้ฟัง:
(1) มันทำอะไร tech stack อะไร
(2) จุดไหนผูกกับข้อมูล/credential/ระบบของบริษัทบ้าง
(3) เหมาะเอาไปทำ portfolio demo แบบไหนให้กดเล่นได้ทันทีโดยไม่อิงข้อมูลบริษัท
เสนอแนวทางมาก่อน อย่าเพิ่งแก้โค้ด
```
🛠️ ไม่ต้องใช้ skill (analysis) · ถ้า requirement คลุมเครือ → `interview-me`

### 1. เขียน Spec
```
/spec ทำเวอร์ชัน portfolio ของ [โปรเจกต์]: แยกเป็น repo ใหม่ที่ company-safe (ไม่แตะของเดิม),
กดเล่นได้ทันทีไม่มี login wall, ใช้ข้อมูลตัวอย่างเพื่อการสาธิตแทน [DB/API จริง], genericize ชื่อ/แบรนด์บริษัท
— กำหนด acceptance + สิ่งที่อยู่นอกขอบเขต
```
🛠️ `/spec`

### 2. แตกแผน
```
/plan แตกงานจาก spec เป็น task ย่อยมี acceptance + ลำดับ dependency
และแยกชัดว่าอันไหนฉันต้องทำเอง (สร้าง repo/บัญชี cloud) อันไหน AI ทำได้
```
🛠️ `/plan`

### 3. แยกโปรเจกต์ + ลงมือ
```
/build เริ่ม task แรก: copy โปรเจกต์ไปโฟลเดอร์/repo ใหม่ (ตัด .git/.env/node_modules)
เพื่อไม่แตะของบริษัท แล้วทำ data layer แบบ env-toggle (มี env = ต่อจริง / ไม่มี = mock)
```
🛠️ `/build` (+ incremental-implementation)

### 4. Mock data + ตัดการพึ่งข้อมูลจริง *(ทีละ task)*
```
อ่าน component ที่ดึงข้อมูลทั้งหมด แล้วสร้าง mock layer ที่ generate ข้อมูลตัวอย่างเพื่อการสาธิต realistic
แบบ deterministic ให้ shape ตรงกับของจริงเป๊ะ → rewire ทุกหน้าให้อ่านจาก mock โดยไม่แตะ UI/CSS
Constraint: build ต้องผ่านโดยไม่มี secret ใด ๆ
```

### 5. Genericize + Polish ให้เป็นผลงาน
```
genericize ชื่อบริษัท/แบรนด์/ข้อมูลระบุตัวตนทั้งหมดเป็นชื่อสมมติ
+ เพิ่ม demo banner (ลิงก์ GitHub/resume)
+ เขียน README แบบ case study (ปัญหา → stack → ฟีเจอร์ → architecture)
ห้ามมีข้อมูลบริษัทหลุดแม้แต่จุดเดียว
```

### 6. Verify + Screenshots
```
/verify เปิดแอปจริงด้วย browser เช็คทุกหน้า render ถูก + ถ่าย screenshot หน้าเด่น ๆ มาใส่ README
```
🛠️ `/verify` หรือ `browser-testing-with-devtools`

### 7. Deploy
```
เขียน runbook deploy [Vercel/Netlify/…]: ขั้นตอนที่ฉันต้องทำเอง (push GitHub, ตั้ง env)
+ ตรวจว่าไม่มี secret หลุดใน git ก่อน push
```
🛠️ `shipping-and-launch` (+ `ci-cd-and-automation` ถ้าจะตั้ง CI)

### 8. *(ออปชัน)* ยกระดับเป็น Full-Stack จริง
```
/spec ยกระดับ demo เป็น full-stack จริงบน [Supabase/backend] โปรเจกต์ใหม่ของฉัน
seed ข้อมูลตัวอย่างเพื่อการสาธิต — คง env-toggle (มี env=real / ไม่มี=mock) เพื่อพิสูจน์ backend โดยยัง company-safe
```
🛠️ `/spec` → `/plan` → `/build` (วนซ้ำ)

### 9. ไฟล์กำกับ session หน้า
```
สร้าง CLAUDE.md: รวม context + กฎ (dual-mode, ห้ามแตะ repo บริษัท, ห้าม commit secret)
+ workflow skill (/spec→/plan→/build) + รายการงานค้างอนาคต
```
🛠️ `context-engineering` หรือ `/init`

---

## 🧭 งานแบบไหน → skill ไหน

| งาน | skill |
|------|-------|
| requirement ยังไม่ชัด อยากให้ซักก่อน | `interview-me` |
| ฟีเจอร์ใหม่ที่ใหญ่ | `/spec` → `/plan` → `/build` |
| bug / แก้เล็ก | `/build` หรือ `/test` (Prove-It) |
| เช็คว่าทำงานจริง | `/verify` · `browser-testing-with-devtools` |
| ก่อน merge | `/code-review` |
| เตรียม launch | `shipping-and-launch` |
| ทำให้โค้ดสะอาดขึ้น | `/simplify` · `code-simplification` |
| ตั้ง context ให้ session ใหม่ | `context-engineering` · `/init` |

## ✍️ หลัก 5 ข้อเขียน prompt ให้ได้ผล
1. **ทีละ task** — อย่ารวมหลายเรื่องในข้อความเดียว
2. **ระบุไฟล์/component** ที่ให้แก้ — ลด ambiguity
3. **บอก behavior ที่อยากได้ + constraint** (เช่น "ห้ามแตะ logic ดึงข้อมูล")
4. **บอก default state** เสมอเมื่อมี toggle/option
5. **บอก scope** ชัด — UI only หรือรวม logic

## ✅ หลักการ company-safe (กันข้อมูลบริษัทหลุด)
- ทำบน **repo/โฟลเดอร์ใหม่** เสมอ — ไม่แตะของเดิม
- **ข้อมูลตัวอย่างเพื่อการสาธิตล้วน** · genericize ชื่อบริษัท/ลูกค้า/พิกัด/อีเมล
- ใช้ **บัญชี cloud / key ใหม่** — ห้ามใช้ของบริษัท
- `.env*` ต้อง gitignore · ตรวจไม่มี JWT/secret ใน git ก่อน push
- credential ที่โชว์ในหน้า demo = ของปลอมที่ตั้งใจให้ public
