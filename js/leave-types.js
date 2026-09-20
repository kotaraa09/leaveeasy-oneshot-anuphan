// ─────────────────────────────────────────────────────────────
// js/leave-types.js — หน้าที่ 4 จัดการประเภทการลา
// US-06 · เฉพาะฝ่ายบุคคล (hr) เพิ่ม/แก้/ลบได้ (ดูตารางบทบาทในสเปกหัวข้อ 2)
// อ่าน/เขียนผ่าน js/leave-types-data.js เท่านั้น ไม่คุยกับ Firestore ตรง ๆ ที่นี่
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import {
  เฝ้าดูประเภทการลา, เพิ่มประเภทการลา, แก้ชื่อประเภทการลา, ลบประเภทการลา
} from "./leave-types-data.js";

(async function () {
  var ที่วางตาราง = document.getElementById("ตารางประเภท");
  if (!ที่วางตาราง) return;

  var ช่องชื่อใหม่ = document.getElementById("ชื่อประเภทใหม่");
  var กล่องเตือน = document.getElementById("เตือนประเภท");
  var ปุ่มเพิ่ม = document.getElementById("ปุ่มเพิ่ม");

  var โปรไฟล์ = await ต้องล็อกอิน();
  var แก้ไขได้ = โปรไฟล์.role === "hr";
  var รายการล่าสุด = [];

  if (!แก้ไขได้) {
    if (ช่องชื่อใหม่) ช่องชื่อใหม่.disabled = true;
    if (ปุ่มเพิ่ม) ปุ่มเพิ่ม.disabled = true;
    var กล่องฟอร์ม = ช่องชื่อใหม่ ? ช่องชื่อใหม่.closest(".card") : null;
    if (กล่องฟอร์ม) {
      var แจ้ง = document.createElement("p");
      แจ้ง.className = "hint";
      แจ้ง.textContent = "หน้านี้แก้ไขได้เฉพาะฝ่ายบุคคล คุณดูรายการได้อย่างเดียว";
      กล่องฟอร์ม.appendChild(แจ้ง);
    }
  }

  if (ปุ่มเพิ่ม) ปุ่มเพิ่ม.addEventListener("click", เพิ่มประเภท);

  // เฝ้าดูแบบเรียลไทม์ — เพิ่มแล้วตารางอัปเดตทันทีตาม US-06
  เฝ้าดูประเภทการลา(function (รายการ) {
    รายการล่าสุด = รายการ;
    วาดตาราง(รายการ);
  });

  function วาดตาราง(รายการ) {
    if (รายการ.length === 0) {
      ที่วางตาราง.innerHTML = "<p>ยังไม่มีประเภทการลาในระบบ</p>";
      return;
    }

    var html = "<table><thead><tr><th>ชื่อประเภทการลา</th><th>จัดการ</th></tr></thead><tbody>";
    รายการ.forEach(function (ประเภท) {
      html +=
        "<tr><td>" + esc(ประเภท.name) + "</td><td>" +
        (แก้ไขได้
          ? '<button type="button" class="btn-ghost" data-edit="' + esc(ประเภท.id) + '">แก้ไข</button> ' +
            '<button type="button" class="btn-danger" data-del="' + esc(ประเภท.id) + '">ลบ</button>'
          : "—") +
        "</td></tr>";
    });
    html += "</tbody></table>";
    ที่วางตาราง.innerHTML = html;

    if (!แก้ไขได้) return;

    ที่วางตาราง.querySelectorAll("[data-edit]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { แก้ประเภท(ปุ่ม.dataset.edit); });
    });
    ที่วางตาราง.querySelectorAll("[data-del]").forEach(function (ปุ่ม) {
      ปุ่ม.addEventListener("click", function () { ลบประเภท(ปุ่ม.dataset.del); });
    });
  }

  async function เพิ่มประเภท() {
    if (!แก้ไขได้ || !ช่องชื่อใหม่) return;
    var ชื่อ = ช่องชื่อใหม่.value.trim();
    if (!ชื่อ) {
      แสดงเตือน("พิมพ์ชื่อประเภทการลาก่อน จึงจะเพิ่มได้");
      return;
    }
    ซ่อนเตือน();
    try {
      await เพิ่มประเภทการลา(ชื่อ);
      ช่องชื่อใหม่.value = "";
    } catch (e) {
      console.error(e);
      แสดงเตือน("เพิ่มประเภทการลาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function แก้ประเภท(id) {
    var ประเภท = รายการล่าสุด.find(function (t) { return t.id === id; });
    var ชื่อใหม่ = prompt("แก้ชื่อประเภทการลา", ประเภท ? ประเภท.name : "");
    if (ชื่อใหม่ === null) return; // กดยกเลิก
    if (!ชื่อใหม่.trim()) { alert("ชื่อประเภทการลาว่างเปล่าไม่ได้"); return; }
    try {
      await แก้ชื่อประเภทการลา(id, ชื่อใหม่.trim());
    } catch (e) {
      console.error(e);
      alert("แก้ชื่อประเภทการลาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function ลบประเภท(id) {
    var ประเภท = รายการล่าสุด.find(function (t) { return t.id === id; });
    if (!confirm('ยืนยันการลบประเภท "' + (ประเภท ? ประเภท.name : "") + '" หรือไม่')) return;
    try {
      await ลบประเภทการลา(id);
    } catch (e) {
      console.error(e);
      alert("ลบประเภทการลาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  function แสดงเตือน(ข้อความ) {
    if (!กล่องเตือน) { alert(ข้อความ); return; }
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
  function ซ่อนเตือน() {
    if (กล่องเตือน) กล่องเตือน.classList.add("hidden");
  }
})();
