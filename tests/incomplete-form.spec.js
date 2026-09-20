// ─────────────────────────────────────────────────────────────
// tests/incomplete-form.spec.js
//   เทสต์ 3: เว้นช่องหัวข้อว่างแล้วกดบันทึก (US-02)
//
// ⚠️ หมายเหตุสำคัญที่พบระหว่างอ่านโค้ด:
//    ช่อง "หัวข้อ" (id="title") มี attribute required ของ HTML5
//    เมื่อกดปุ่ม "บันทึก" ทั้งที่หัวข้อว่าง เบราว์เซอร์จะบล็อกการ submit ด้วย
//    native constraint validation ของตัวมันเอง "ก่อน" ที่ event submit จะถูกยิงด้วยซ้ำ
//    ผลคือฟังก์ชันตรวจ "กรอกไม่ครบ" ที่เขียนไว้ใน js/new-leave-request.js จะไม่ถูกเรียกเลย
//    ในกรณีนี้ — ข้อความเตือนที่เทสต์นี้ตรวจเจอจึงเป็นข้อความมาตรฐานของเบราว์เซอร์
//    (element.validationMessage) ไม่ใช่ข้อความที่โค้ดของแอปเขียนขึ้นเอง
//    ถือเป็นพฤติกรรมมาตรฐานของเบราว์เซอร์ ไม่ใช่บั๊ก และยังตรงตามเกณฑ์ของ US-02
//    ("ระบบต้องไม่รับ และขึ้นข้อความบอก") แต่ต้องระบุให้ชัดว่ากลไกมาจากไหน
// ─────────────────────────────────────────────────────────────

const { test, expect } = require('@playwright/test');
const { readAccounts, login } = require('./helpers');

const accounts = readAccounts();

test('เว้นช่องหัวข้อว่างแล้วกดบันทึก ต้องไม่สร้างใบลา และมีข้อความเตือน (US-02)', async ({ page }) => {
  await login(page, accounts['ผู้ขอลา']);

  await page.goto('/leave-requests.html');
  const จำนวนก่อน = await page.locator('tr.clickable').count();

  await page.goto('/new-leave-request.html');

  // ไม่กรอกช่อง "หัวข้อ" โดยตั้งใจ — กรอกช่องอื่นให้ครบเพื่อตัดตัวแปรอื่นออก
  await page.getByLabel('เหตุผลการลา').fill('เทสต์ฟอร์มไม่ครบ ต้องไม่ถูกบันทึก');
  await page.getByLabel('ประเภทการลา').selectOption({ index: 1 });
  await page.getByLabel('วันที่เริ่มลา').fill('2026-11-01');
  await page.getByLabel('วันที่สิ้นสุด').fill('2026-11-02');

  await page.getByRole('button', { name: 'บันทึก' }).click();

  // ยังอยู่หน้าเดิม — ไม่ถูกพาไปหน้ารายการ แปลว่าไม่ถูกบันทึก
  await expect(page).toHaveURL(/new-leave-request\.html$/);

  // เบราว์เซอร์ต้องปฏิเสธช่องหัวข้อด้วย native constraint validation
  const ผลตรวจ = await page.locator('#title').evaluate((el) => ({
    valid: el.checkValidity(),
    message: el.validationMessage
  }));
  expect(ผลตรวจ.valid, 'ช่องหัวข้อต้องถูกตีว่า invalid โดยเบราว์เซอร์').toBe(false);
  expect(ผลตรวจ.message.length, 'เบราว์เซอร์ต้องมีข้อความเตือน (native validationMessage)').toBeGreaterThan(0);
  console.log(
    `[เทสต์ 3] ข้อความเตือนมาจากเบราว์เซอร์ (native HTML5 validationMessage): "${ผลตรวจ.message}" ` +
    `— ไม่ใช่ข้อความที่โค้ดของแอปเขียนขึ้นเอง (เพราะ required บล็อกก่อน submit event จะยิง)`
  );

  // โหลดหน้ารายการใหม่ แล้วนับจำนวนแถวอีกครั้ง — ต้องไม่เพิ่มขึ้นเลย
  await page.goto('/leave-requests.html');
  await page.reload();
  const จำนวนหลัง = await page.locator('tr.clickable').count();
  expect(จำนวนหลัง, 'จำนวนใบลาในรายการต้องไม่เพิ่มขึ้นหลังกดบันทึกด้วยฟอร์มที่ไม่ครบ').toBe(จำนวนก่อน);
});
