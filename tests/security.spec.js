// ─────────────────────────────────────────────────────────────
// tests/security.spec.js — เทสต์ความปลอดภัยตาม US-08 และ firestore.rules
//   เทสต์ 4: ยังไม่ล็อกอิน เปิดหน้ารายการใบลา ต้องอ่านข้อมูลไม่ได้เลย
//   เทสต์ 5: ผู้ใช้ที่ไม่ใช่เจ้าของและไม่ใช่ manager/hr เปิด URL ใบลาของคนอื่นตรง ๆ ต้องเข้าไม่ได้
//
// ทั้งสองเทสต์ "ผ่าน" แปลว่าเข้าไม่ได้ — ถ้าอ่านข้อมูลสำเร็จ แปลว่าเป็นช่องโหว่จริง
// ต้องรายงานทันที ห้ามแก้เทสต์ให้ผ่าน และห้ามแก้ firestore.rules เอง
//
// การเด้งหน้า (redirect) ของ UI ไม่นับว่าปลอดภัย — ยามตัวจริงคือ firestore.rules
// สองเทสต์นี้จึงยิงอ่าน Firestore ตรง ๆ ผ่าน page.evaluate() (ข้าม UI ไปเลย) เป็นเกณฑ์ตัดสินหลัก
// และคาดหวัง error code 'permission-denied' จาก Firestore SDK เท่านั้น
//
// ⚠️ เทสต์ 5 สลับบทบาทจากที่ระบุไว้ในตารางบัญชีทดสอบตอนแรก:
//    ให้ "ผู้อนุมัติ" เป็นเจ้าของใบลา (ยื่นใบลาของตัวเอง — ระบบไม่ได้ห้าม role ใดยื่นใบลาให้ตัวเอง)
//    และให้ "ผู้ขอลา" เป็นผู้บุกรุก เพราะ firestore.rules (isApproverOrHr()) อนุญาตให้ manager/hr
//    เปิดใบลาของทุกคนได้เสมอตามสเปก US-08 ("ผู้อนุมัติและฝ่ายบุคคลเปิดได้ทุกใบ") — ถ้าใช้ manager
//    เป็นผู้บุกรุกตามที่ระบุไว้แต่แรก เทสต์จะ fail ทั้งที่ระบบทำถูกสเปก
//    เจ้าของโครงงานยืนยันการสลับบทบาทนี้แล้ว
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const {
  readAccounts, login, logout,
  readAllLeaveRequestsDirect, readOneLeaveRequestDirect
} = require('./helpers');

const accounts = readAccounts();

test('4. ยังไม่ล็อกอิน เปิดหน้ารายการใบลา ต้องอ่านข้อมูลไม่ได้เลย (US-08)', async ({ page }) => {
  await page.goto('/leave-requests.html');

  // ตัวชี้เบื้องต้นเท่านั้น (ไม่ใช่เกณฑ์หลัก): ยังไม่ล็อกอินจึงถูกเด้งไปหน้าเข้าสู่ระบบ
  await page.waitForURL(/login\.html/);

  // ★ เกณฑ์ตัดสินหลัก: ยิงอ่าน Firestore ตรง ๆ ผ่าน SDK (ข้าม UI) ต้องโดนปฏิเสธ
  const ผล = await readAllLeaveRequestsDirect(page);
  expect(
    ผล.ok,
    `คาดว่าจะอ่านไม่ได้ แต่กลับอ่านสำเร็จ (size=${ผล.size}) — นี่คือช่องโหว่ความปลอดภัยจริง ต้องหยุดและรายงาน`
  ).toBe(false);
  expect(ผล.code).toBe('permission-denied');
});

test('5. ผู้ใช้ที่ไม่ใช่เจ้าของ (และไม่ใช่ manager/hr) เปิด URL ใบลาของคนอื่นตรง ๆ ต้องเข้าไม่ได้ (US-08)', async ({ page }) => {
  // ── เตรียมข้อมูล: ผู้อนุมัติยื่นใบลาของตัวเอง (เป็นเจ้าของใบนี้) ──
  await login(page, accounts['ผู้อนุมัติ']);
  const title = `เทสต์อัตโนมัติ ${Date.now()}`;

  await page.goto('/new-leave-request.html');
  await page.getByLabel('หัวข้อ').fill(title);
  await page.getByLabel('เหตุผลการลา').fill('ใบลาของผู้อนุมัติเอง ใช้ทดสอบสิทธิ์เข้าถึงข้ามบัญชีเท่านั้น');
  await page.getByLabel('ประเภทการลา').selectOption({ index: 1 });
  await page.getByLabel('วันที่เริ่มลา').fill('2026-11-05');
  await page.getByLabel('วันที่สิ้นสุด').fill('2026-11-05');
  await page.getByRole('button', { name: 'บันทึก' }).click();
  await page.waitForURL(/leave-requests\.html$/);

  const แถว = page.locator('tr.clickable', { hasText: title });
  const leaveRequestId = (await แถว.getAttribute('data-id')) || '';
  expect(leaveRequestId, 'ต้องอ่าน id ของใบลาที่เตรียมไว้ได้').toBeTruthy();
  console.log(`[เทสต์ 5] เตรียมใบลาของผู้อนุมัติ id=${leaveRequestId} title="${title}"`);

  await logout(page);

  // ── สวมบทบาทผู้บุกรุก: ผู้ขอลา (ไม่ใช่เจ้าของ ไม่ใช่ manager/hr) ──
  await login(page, accounts['ผู้ขอลา']);

  await page.goto(`/leave-request-detail.html?id=${encodeURIComponent(leaveRequestId)}`);
  // ตัวชี้เบื้องต้นเท่านั้น: หน้าเว็บต้องแสดงข้อความว่าเข้าไม่ได้ (มาจาก catch error ของ Security Rules)
  await expect(page.getByText('เปิดใบขอลานี้ไม่ได้')).toBeVisible();

  // ★ เกณฑ์ตัดสินหลัก: ยิงอ่านใบลานี้ตรง ๆ ผ่าน SDK (ข้าม UI) ต้องโดนปฏิเสธ
  const ผล = await readOneLeaveRequestDirect(page, leaveRequestId);
  expect(
    ผล.ok,
    `คาดว่าจะอ่านไม่ได้ แต่กลับอ่านสำเร็จ — นี่คือช่องโหว่ความปลอดภัยจริง: ${JSON.stringify(ผล.data)}`
  ).toBe(false);
  expect(ผล.code).toBe('permission-denied');

  // ── เก็บกวาด: กลับไปเป็นผู้อนุมัติ ลบใบลาทดสอบทิ้ง (ยังเป็นรอพิจารณา จึงลบได้ตามกฎ US-07) ──
  await logout(page);
  await login(page, accounts['ผู้อนุมัติ']);
  page.once('dialog', (dialog) => dialog.accept());
  await page.goto(`/leave-request-detail.html?id=${encodeURIComponent(leaveRequestId)}`);
  await page.getByRole('button', { name: 'ลบใบลานี้' }).click();
  await page.waitForURL(/leave-requests\.html$/);
  console.log(`[เทสต์ 5] เก็บกวาดสำเร็จ: ลบใบลา id=${leaveRequestId} ออกจากฐานข้อมูลแล้ว`);
});
