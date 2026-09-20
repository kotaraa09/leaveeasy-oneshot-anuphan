// ─────────────────────────────────────────────────────────────
// playwright.config.js — ตั้งค่าการรันเทสต์อัตโนมัติของ LeaveEasy
//
// รันทั้งหมดด้วย:  npm test    (หรือ npx playwright test)
// ดูรายชื่อเทสต์โดยไม่รันจริง:  npx playwright test --list
//
// ⚠️ ไม่แตะ script "dev" ใน package.json — ตั้งพอร์ต 3100 ไว้ตั้งใจ
//    (พอร์ต 3000 ชนกับโครงงานอื่นในเครื่องนี้)
// ─────────────────────────────────────────────────────────────

const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },

  // เทสต์ใช้บัญชีล็อกอินร่วมกัน (มีแค่ 2 บัญชีทดสอบ) — รันเรียงลำดับ ไม่รันขนาน
  // กันปัญหาสอง worker แย่งกันล็อกอิน/ออกจากระบบพร้อมกันจนผลไม่คงที่
  fullyParallel: false,
  workers: 1,
  retries: 0,

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },

  // สั่งเซิร์ฟเวอร์ dev ให้เอง ถ้ามีเปิดค้างอยู่แล้วที่พอร์ต 3100 ใช้ตัวที่เปิดอยู่แทนการเปิดซ้ำ
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3100/index.html',
    reuseExistingServer: true,
    timeout: 60 * 1000
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
