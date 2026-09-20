// ─────────────────────────────────────────────────────────────
// tests/helpers.js — ตัวช่วยรวมสำหรับเทสต์ LeaveEasy
//
// ไม่แก้ไฟล์ระบบใด ๆ — ไฟล์นี้เป็นของชุดเทสต์เท่านั้น
// ─────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

// อ่านบัญชีทดสอบจาก tests/accounts.json (ถูก .gitignore กันไว้ ห้ามฝังอีเมล/รหัสผ่านที่อื่น)
// ⚠️ จงใจ "ไม่ตรวจรหัสผ่านที่นี่" — ฟังก์ชันนี้ถูกเรียกตอน Playwright โหลดไฟล์เทสต์
//    (รวมถึงตอนสั่ง --list ที่ไม่ได้รันจริง) ถ้าโยน error ตรงนี้จะทำให้ --list พังไปด้วย
//    การตรวจว่ารหัสผ่านครบหรือยังอยู่ใน login() แทน ซึ่งทำงานเฉพาะตอนเทสต์รันจริงเท่านั้น
function readAccounts() {
  const ไฟล์ = path.join(__dirname, 'accounts.json');
  const raw = fs.readFileSync(ไฟล์, 'utf-8');
  return JSON.parse(raw);
}

// ล็อกอินผ่านฟอร์มจริงที่ login.html (ไม่ลัดผ่าน SDK ตรง ๆ) แล้วรอจนกว่าจะพ้นหน้า login
async function login(page, account) {
  if (!account || !account.password) {
    throw new Error(
      'tests/accounts.json ยังไม่มีรหัสผ่านของบัญชีทดสอบนี้ — เติมรหัสผ่านก่อนรันเทสต์จริง ' +
      '(ดูโครงสร้างตัวอย่างใน tests/accounts.example.json)'
    );
  }
  await page.goto('/login.html');
  await page.getByLabel('อีเมล').fill(account.email);
  await page.getByLabel('รหัสผ่าน').fill(account.password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click();
  await page.waitForURL(function (url) { return !url.pathname.endsWith('/login.html'); });
}

// ออกจากระบบผ่านปุ่มในแถบเมนู (js/auth.js เป็นคนเติมปุ่มนี้ให้เอง)
async function logout(page) {
  const ปุ่มออกจากระบบ = page.getByRole('button', { name: 'ออกจากระบบ' });
  if ((await ปุ่มออกจากระบบ.count()) === 0) return; // ยังไม่ได้ล็อกอินอยู่แล้ว ไม่ต้องทำอะไร
  await ปุ่มออกจากระบบ.click();
  await page.waitForURL(function (url) {
    return url.pathname.endsWith('/index.html') || url.pathname === '/';
  });
}

// ยิงอ่านคอลเลกชัน leaveRequests ทั้งหมดตรง ๆ ผ่าน Firestore SDK ในบริบทหน้าเว็บ
// (ไม่ผ่านหน้าจอ UI เลย) — ใช้พิสูจน์ว่า Security Rules ปฏิเสธจริง ไม่ใช่แค่ UI เด้งหน้า
async function readAllLeaveRequestsDirect(page) {
  return page.evaluate(async function () {
    const { db } = await import('/js/firebase-init.js');
    const { collection, getDocs } = await import(
      'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'
    );
    try {
      const สแนป = await getDocs(collection(db, 'leaveRequests'));
      return { ok: true, size: สแนป.size };
    } catch (e) {
      return { ok: false, code: e.code || '', message: e.message || String(e) };
    }
  });
}

// ยิงอ่านใบลาใบเดียวตรง ๆ ผ่าน Firestore SDK ในบริบทหน้าเว็บ (ไม่ผ่าน UI)
async function readOneLeaveRequestDirect(page, id) {
  return page.evaluate(async function (id) {
    const { db } = await import('/js/firebase-init.js');
    const { doc, getDoc } = await import(
      'https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js'
    );
    try {
      const สแนป = await getDoc(doc(db, 'leaveRequests', id));
      return { ok: true, exists: สแนป.exists(), data: สแนป.exists() ? สแนป.data() : null };
    } catch (e) {
      return { ok: false, code: e.code || '', message: e.message || String(e) };
    }
  }, id);
}

module.exports = {
  readAccounts,
  login,
  logout,
  readAllLeaveRequestsDirect,
  readOneLeaveRequestDirect
};
