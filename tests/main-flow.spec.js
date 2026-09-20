// ─────────────────────────────────────────────────────────────
// tests/main-flow.spec.js — เส้นทางหลักของระบบ (สเปกหัวข้อ 1)
//   เทสต์ 1: ยื่นใบลาแล้วไปโผล่ในรายการ พร้อมสถานะ รอพิจารณา (US-01, US-02)
//   เทสต์ 2: ผู้อนุมัติกดอนุมัติแล้วสถานะเปลี่ยนเป็น อนุมัติ (US-04)
//
// สองเทสต์นี้รันแบบ serial และใช้ใบลาใบเดียวกันต่อกัน (ยื่น → พิจารณา → อนุมัติ)
// เพื่อจำลอง "เส้นทางหลักของระบบ" ตามสเปกข้อ 1 โดยไม่ต้องสร้างข้อมูลทดสอบซ้ำสองชุด
//
// ⚠️ ใบลาที่สร้างในไฟล์นี้จะถูกอนุมัติ แล้ว "ลบไม่ได้อีกต่อไป" ตาม firestore.rules
//    (allow delete อนุญาตเฉพาะสถานะ รอพิจารณา เท่านั้น) — เป็นข้อมูลค้างถาวรในฐานข้อมูลโดยตั้งใจ
//    เจ้าของโครงงานรับทราบแล้วว่าจะลบเองทีหลังผ่าน Firebase Console
//    ดู document id ที่ log ออกมาตอนรัน (และในสรุปผลที่ test-results.md)
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const { readAccounts, login } = require('./helpers');

const accounts = readAccounts();

test.describe.serial('เส้นทางหลัก: ยื่นใบลา → ผู้อนุมัติพิจารณา → อนุมัติ', () => {
  const title = `เทสต์อัตโนมัติ ${Date.now()}`;
  let leaveRequestId = '';

  test('1. ยื่นใบลาแล้วไปโผล่ในรายการ พร้อมสถานะรอพิจารณา (US-01, US-02)', async ({ page }) => {
    await login(page, accounts['ผู้ขอลา']);

    await page.goto('/new-leave-request.html');
    await page.getByLabel('หัวข้อ').fill(title);
    await page.getByLabel('เหตุผลการลา').fill('สร้างโดยเทสต์อัตโนมัติของ Tester agent ไม่ใช่การลาจริง');

    const ช่องประเภท = page.getByLabel('ประเภทการลา');
    const ตัวเลือกทั้งหมด = await ช่องประเภท.locator('option').all();
    expect(ตัวเลือกทั้งหมด.length, 'ต้องมีประเภทการลาอย่างน้อย 1 รายการให้เลือก (โหลดจาก leaveTypes)').toBeGreaterThan(1);
    await ช่องประเภท.selectOption({ index: 1 }); // ตัวแรกที่ไม่ใช่ "— เลือกประเภทการลา —"

    await page.getByLabel('วันที่เริ่มลา').fill('2026-11-01');
    await page.getByLabel('วันที่สิ้นสุด').fill('2026-11-02');

    await page.getByRole('button', { name: 'บันทึก' }).click();

    // บันทึกสำเร็จแล้วต้องพากลับหน้ารายการเองตามสเปก US-02
    await page.waitForURL(/leave-requests\.html$/);

    const แถว = page.locator('tr.clickable', { hasText: title });
    await expect(แถว).toContainText('รอพิจารณา');

    leaveRequestId = (await แถว.getAttribute('data-id')) || '';
    expect(leaveRequestId, 'ต้องอ่าน id ของใบลาที่สร้างใหม่จาก data-id ของแถวได้').toBeTruthy();
    console.log(`[เทสต์ 1] สร้างใบลาใหม่ id=${leaveRequestId} title="${title}"`);

    // ★ โหลดหน้าใหม่แล้วตรวจซ้ำ — พิสูจน์ว่าอ่านจาก Firestore จริง ไม่ใช่แค่ state ค้างอยู่บนจอ
    await page.reload();
    const แถวหลังโหลดใหม่ = page.locator('tr.clickable', { hasText: title });
    await expect(แถวหลังโหลดใหม่).toContainText('รอพิจารณา');
  });

  test('2. ผู้อนุมัติกดอนุมัติแล้วสถานะเปลี่ยนเป็นอนุมัติ (US-04)', async ({ page }) => {
    test.skip(!leaveRequestId, 'ข้ามเพราะเทสต์ 1 ไม่ผ่าน จึงไม่มีใบลาให้อนุมัติต่อ');

    await login(page, accounts['ผู้อนุมัติ']);

    await page.goto(`/leave-request-detail.html?id=${encodeURIComponent(leaveRequestId)}`);

    const แถวสถานะ = page.locator('.field-row', { hasText: 'สถานะ' });
    await expect(แถวสถานะ).toContainText('รอพิจารณา');

    await page.getByRole('button', { name: 'อนุมัติ', exact: true }).click();

    // สถานะบนหน้าจอต้องเปลี่ยนทันที และปุ่มอนุมัติ/ไม่อนุมัติต้องหายไป (เปลี่ยนสถานะต่อไม่ได้แล้ว)
    await expect(แถวสถานะ).toContainText('อนุมัติ');
    await expect(page.getByRole('button', { name: 'อนุมัติ', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'ไม่อนุมัติ', exact: true })).toHaveCount(0);

    // ★ โหลดหน้ารายละเอียดใหม่แล้วตรวจซ้ำ — พิสูจน์ว่าเขียนลง Firestore จริง ไม่ใช่แค่ state บนจอ
    await page.reload();
    const แถวสถานะหลังโหลดใหม่ = page.locator('.field-row', { hasText: 'สถานะ' });
    await expect(แถวสถานะหลังโหลดใหม่).toContainText('อนุมัติ');

    console.log(
      `[เทสต์ 2] ใบลา id=${leaveRequestId} title="${title}" อนุมัติสำเร็จ — ` +
      `ค้างถาวรในฐานข้อมูลตั้งแต่นี้ (ลบไม่ได้อีกต่อไปตามกฎ เพราะสถานะไม่ใช่ รอพิจารณา แล้ว)`
    );
  });
});
