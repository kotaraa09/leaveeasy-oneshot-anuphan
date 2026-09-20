// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก (signup.html)
//
// ⚠️ หน้า signup.html ยังไม่มีอยู่ในโปรเจกต์ตอนที่เขียนไฟล์นี้ (ทีมสร้าง HTML เป็นคนสร้าง)
// เขียนแบบกัน null ไว้ตามชื่อช่องที่คาดไว้ — คาดไว้ดังนี้:
//   <form id="ฟอร์มสมัครสมาชิก">
//     <input id="name" type="text">
//     <input id="email" type="email">
//     <input id="password" type="password">
//     <div id="ข้อความเตือน" class="alert alert-error hidden"></div>
//     <button id="ปุ่มสมัครสมาชิก" type="submit">สมัครสมาชิก</button>
//   </form>
// ⚠️ ห้ามมีช่องเลือกบทบาทในหน้านี้ — role เริ่มที่ employee เสมอ (บังคับใน js/auth.js)
// ─────────────────────────────────────────────────────────────

import { สมัครสมาชิก, แปลข้อผิดพลาดAuth } from "./auth.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัครสมาชิก");
  if (!ฟอร์ม) return; // หน้านี้ยังไม่มีฟอร์มตามที่คาดไว้ — ข้ามไปเงียบ ๆ

  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มสมัครสมาชิก");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    ซ่อนเตือน();

    var ช่องชื่อ = document.getElementById("name");
    var ช่องอีเมล = document.getElementById("email");
    var ช่องรหัสผ่าน = document.getElementById("password");

    var name = ช่องชื่อ ? ช่องชื่อ.value.trim() : "";
    var email = ช่องอีเมล ? ช่องอีเมล.value.trim() : "";
    var password = ช่องรหัสผ่าน ? ช่องรหัสผ่าน.value : "";

    if (!name || !email || !password) {
      แสดงเตือน("กรอกชื่อ อีเมล และรหัสผ่านให้ครบก่อนสมัครสมาชิก");
      return;
    }
    if (password.length < 6) {
      แสดงเตือน("รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    ตั้งค่าปุ่ม(true);
    สมัครสมาชิก(name, email, password)
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        แสดงเตือน(แปลข้อผิดพลาดAuth(err));
        ตั้งค่าปุ่ม(false);
      });
  });

  function แสดงเตือน(ข้อความ) {
    if (!กล่องเตือน) { alert(ข้อความ); return; }
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
  function ซ่อนเตือน() {
    if (กล่องเตือน) กล่องเตือน.classList.add("hidden");
  }
  function ตั้งค่าปุ่ม(กำลังทำงาน) {
    if (!ปุ่ม) return;
    ปุ่ม.disabled = กำลังทำงาน;
    ปุ่ม.textContent = กำลังทำงาน ? "กำลังสมัครสมาชิก…" : "สมัครสมาชิก";
  }
})();
