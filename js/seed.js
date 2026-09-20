// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่างจาก js/data.js ลง Firestore จริง
// ใช้ครั้งเดียวตอนตั้งระบบ (ดูวิธีใช้ใน seed.html)
//
// ⚠️ ก่อนกดปุ่มนี้ Firestore rules ต้องเปิดให้เขียนได้ก่อน (ดูคำเตือนใน seed.html)
//    เพราะข้อมูลตัวอย่างใช้รหัสไฟล์ตายตัว (u001, lr001, ...) ที่ไม่ตรงกับ uid ของบัญชีจริง
//    จึงเขียนผ่านกฎ Security Rules แบบรายบุคคลไม่ได้ — ต้องตั้ง rules ชั่วคราวเป็นแบบเปิดก่อน
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-init.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(function () {
  var ปุ่ม = document.getElementById("ปุ่มใส่ข้อมูล");
  var บันทึก = document.getElementById("บันทึกผล");
  if (!ปุ่ม) return;

  ปุ่ม.addEventListener("click", function () { ใส่ข้อมูลตัวอย่าง(); });

  async function ใส่ข้อมูลตัวอย่าง() {
    if (!window.LEAVE_DATA) {
      เขียนบันทึก("❌ ไม่พบ window.LEAVE_DATA — ตรวจว่า seed.html โหลด js/data.js ก่อน js/seed.js แล้วหรือยัง");
      return;
    }

    ปุ่ม.disabled = true;
    ล้างบันทึก();
    เขียนบันทึก("กำลังใส่ข้อมูลตัวอย่างลง Firestore…");

    try {
      var ข้อมูล = window.LEAVE_DATA;

      // 📁 users — ตัดช่อง id ออกก่อนเขียนเสมอ เพราะ id คือชื่อไฟล์ ไม่ใช่ช่องข้อมูลข้างใน
      for (var i = 0; i < ข้อมูล.users.length; i++) {
        var u = ข้อมูล.users[i];
        await setDoc(doc(db, "users", u.id), { name: u.name, email: u.email, role: u.role });
        เขียนบันทึก("✅ users/" + u.id);
      }

      // 📁 leaveTypes
      for (var j = 0; j < ข้อมูล.leaveTypes.length; j++) {
        var t = ข้อมูล.leaveTypes[j];
        await setDoc(doc(db, "leaveTypes", t.id), { name: t.name });
        เขียนบันทึก("✅ leaveTypes/" + t.id);
      }

      // 📁 leaveRequests
      for (var k = 0; k < ข้อมูล.leaveRequests.length; k++) {
        var r = ข้อมูล.leaveRequests[k];
        var ข้อมูลใบลา = Object.assign({}, r);
        delete ข้อมูลใบลา.id;
        await setDoc(doc(db, "leaveRequests", r.id), ข้อมูลใบลา);
        เขียนบันทึก("✅ leaveRequests/" + r.id);
      }

      // 📁 leaveRequests/{รหัสใบลา}/approvals — โฟลเดอร์ย่อยที่ซ้อนอยู่ในใบลาแต่ละใบ
      for (var m = 0; m < ข้อมูล.approvals.length; m++) {
        var a = ข้อมูล.approvals[m];
        var ข้อมูลความเห็น = {
          authorId: a.authorId,
          authorName: a.authorName,
          message: a.message,
          createdAt: a.createdAt
        };
        await setDoc(doc(db, "leaveRequests", a.requestId, "approvals", a.id), ข้อมูลความเห็น);
        เขียนบันทึก("✅ leaveRequests/" + a.requestId + "/approvals/" + a.id);
      }

      เขียนบันทึก("🎉 ใส่ข้อมูลตัวอย่างครบแล้ว — เปิด Firebase Console เพื่อตรวจสอบได้เลย");
    } catch (e) {
      console.error(e);
      เขียนบันทึก("❌ เกิดข้อผิดพลาด: " + (e && e.message ? e.message : e));
      เขียนบันทึก("ถ้าเห็นคำว่า permission-denied ให้ตั้ง Firestore rules ชั่วคราวเป็นแบบเปิดก่อน (ดูคำแนะนำด้านบน)");
    } finally {
      ปุ่ม.disabled = false;
    }
  }

  function เขียนบันทึก(บรรทัด) {
    if (!บันทึก) { console.log(บรรทัด); return; }
    var p = document.createElement("div");
    p.textContent = บรรทัด;
    บันทึก.appendChild(p);
  }
  function ล้างบันทึก() {
    if (บันทึก) บันทึก.innerHTML = "";
  }
})();
