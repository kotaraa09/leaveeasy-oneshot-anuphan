# LeaveEasy — ระบบขอลาออนไลน์

## 🌐 เปิดเว็บที่ใช้งานได้จริง

### 👉 https://leaveeasy-oneshot-anuphan.web.app

## 🧪 ผลการทดสอบอัตโนมัติ

### 👉 [test-results.md](test-results.md)

---

**ADT-RAISE Non-Degree Batch 2 · Module 2 — ใบงานที่ 4 สัปดาห์ที่ 9**
**ผู้จัดทำ:** อนุพันธ์ เอกอาภรณ์ภิรมย์

ระบบขอลาออนไลน์ภาษาไทย สร้างขึ้นใหม่ทั้งระบบในรอบเดียวจาก `leaveeasy-spec.md`
เขียนด้วย **HTML · CSS · JavaScript ธรรมดา** ไม่มี framework ไม่มีขั้นตอน build
ข้อมูลอยู่บน **Firebase** (Firestore + Authentication + Hosting) และมีผู้ช่วย AI ผ่าน **OpenRouter**

> สมัครสมาชิกเองจะได้บทบาท **ผู้ขอลา** เสมอ · เปลี่ยนเป็น `manager` / `hr` ต้องแก้ใน Firebase Console

---

## หน้าจอ

| ไฟล์ | หน้าอะไร |
|---|---|
| `index.html` | หน้าแรก รวมลิงก์ไปทุกหน้า |
| `leave-requests.html` | รายการใบลา |
| `new-leave-request.html` | ยื่นใบลาใหม่ + ปุ่มให้ AI ช่วยจัดประเภท |
| `leave-request-detail.html` | รายละเอียดใบลา · อนุมัติ/ไม่อนุมัติ · ความเห็น · ลบ |
| `leave-types.html` | จัดการประเภทการลา (เฉพาะฝ่ายบุคคล) |
| `dashboard.html` | แดชบอร์ดสรุป — โครงหน้าเปล่าตามสเปก ยังไม่ต่อข้อมูลจริง |
| `login.html` · `signup.html` | เข้าสู่ระบบ / สมัครสมาชิก |
| `seed.html` | ใส่ข้อมูลตัวอย่างครั้งเดียวตอนตั้งระบบ |

## สถานะใบลามี 3 ค่าเท่านั้น

`รอพิจารณา` → `อนุมัติ` หรือ `ไม่อนุมัติ` — **เดินหน้าอย่างเดียว ย้อนกลับไม่ได้**
ใบที่พิจารณาแล้วแก้สถานะต่อไม่ได้และลบไม่ได้ บังคับจริงที่ `firestore.rules` ไม่ใช่แค่ซ่อนปุ่ม

## ผู้ช่วย AI ที่ใช้สร้างระบบนี้

อยู่ใน `.claude/agents/` — แบ่งงานกันคนละส่วน คนละโมเดล

| ผู้ช่วย | โมเดล | รับผิดชอบ |
|---|---|---|
| `ui-builder` | haiku | หน้าจอทั้งหมด + CSS |
| `data-auth` | sonnet | Firestore · Authentication · Security Rules · ข้อมูลตัวอย่าง |
| `ai-feature` | sonnet | ปุ่มให้ AI ช่วยจัดประเภทการลา (US-09) |
| `tester` | sonnet | ชุดทดสอบ Playwright |

## รันในเครื่อง

```bash
npm install
npm run dev     # เปิดที่ http://localhost:3100
npm test        # รันชุดทดสอบ Playwright
```

ปุ่ม AI ต้องมีไฟล์ `js/ai-key.js` ในเครื่อง — ก๊อปจาก `js/ai-key.example.js` แล้วใส่คีย์
**ไฟล์นี้ถูก `.gitignore` กันไว้ ไม่ขึ้น GitHub**
ชุดทดสอบต้องมี `tests/accounts.json` — ก๊อปจาก `tests/accounts.example.json` แล้วใส่บัญชีทดสอบ
**ไฟล์นี้ถูกกันไว้เช่นกัน**

## สิ่งที่ยังไม่ได้ทำ

ดู [BACKLOG.md](BACKLOG.md) — รวมถึงเรื่องที่คีย์ AI ยังถูกส่งขึ้น Hosting อยู่ ซึ่งยังแก้ไม่จบ
