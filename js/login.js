// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ (login.html)
//
// ⚠️ หน้า login.html ยังไม่มีอยู่ในโปรเจกต์ตอนที่เขียนไฟล์นี้ (ทีมสร้าง HTML เป็นคนสร้าง)
// เขียนแบบกัน null ไว้ตามชื่อช่องที่คาดไว้ ถ้า element จริงไม่ตรงชื่อ ให้แก้ id ในไฟล์นี้
// หรือฝั่ง HTML ให้ตรงกัน — คาดไว้ดังนี้:
//   <form id="ฟอร์มเข้าสู่ระบบ">
//     <input id="email" type="email">
//     <input id="password" type="password">
//     <div id="ข้อความเตือน" class="alert alert-error hidden"></div>
//     <button id="ปุ่มเข้าสู่ระบบ" type="submit">เข้าสู่ระบบ</button>
//   </form>
// ─────────────────────────────────────────────────────────────

import { เข้าสู่ระบบ, แปลข้อผิดพลาดAuth } from "./auth.js";

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
  if (!ฟอร์ม) return; // หน้านี้ยังไม่มีฟอร์มตามที่คาดไว้ — ข้ามไปเงียบ ๆ ไม่ทำให้หน้าอื่นพัง

  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    ซ่อนเตือน();

    var ช่องอีเมล = document.getElementById("email");
    var ช่องรหัสผ่าน = document.getElementById("password");
    var email = ช่องอีเมล ? ช่องอีเมล.value.trim() : "";
    var password = ช่องรหัสผ่าน ? ช่องรหัสผ่าน.value : "";

    if (!email || !password) {
      แสดงเตือน("กรอกอีเมลและรหัสผ่านให้ครบก่อนเข้าสู่ระบบ");
      return;
    }

    ตั้งค่าปุ่ม(true);
    เข้าสู่ระบบ(email, password)
      .then(function () {
        var ต่อ = new URLSearchParams(location.search).get("ต่อ");
        location.href = ต่อ ? decodeURIComponent(ต่อ) : "leave-requests.html";
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
    ปุ่ม.textContent = กำลังทำงาน ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ";
  }
})();
