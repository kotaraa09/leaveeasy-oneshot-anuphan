// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// บันทึกจริงลง Firestore · US-02 · requesterId มาจากคนที่ล็อกอินอยู่จริง (US-08)
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebase-init.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { ดึงประเภทการลาทั้งหมด } from "./leave-types-data.js";
import { เรียกAI, แปลข้อผิดพลาดAI } from "./ai.js";

(async function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  if (!ฟอร์ม) return;

  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var ป้ายAI = document.getElementById("ป้ายAI");
  var ข้อความAI = document.getElementById("ข้อความAI");

  var โปรไฟล์ = await ต้องล็อกอิน();

  // เติมรายการเลื่อนลงด้วยประเภทการลาจริงจาก Firestore (ผ่าน leave-types-data.js เท่านั้น)
  var ประเภททั้งหมด = [];
  try {
    ประเภททั้งหมด = await ดึงประเภทการลาทั้งหมด();
    ประเภททั้งหมด.forEach(function (ประเภท) {
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = ประเภท.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  } catch (e) {
    console.error(e);
    แสดงเตือน("โหลดรายการประเภทการลาไม่สำเร็จ ลองรีเฟรชหน้าใหม่อีกครั้ง");
  }

  // ── US-09: ปุ่มให้ AI ช่วยจัดประเภทการลา ──────────────────────
  // AI แค่ "เสนอ" ค่าลงใน <select> ที่มีอยู่แล้ว — ไม่เขียนอะไรลง Firestore
  // เอง ผู้ใช้ยังกดบันทึกฟอร์มตามปกติ และแก้ประเภทที่ AI เลือกได้เสมอ
  if (ปุ่มAI) {
    ปุ่มAI.addEventListener("click", async function () {
      ซ่อนข้อความAI();
      ซ่อนป้ายAI();

      var เหตุผล = document.getElementById("reason").value.trim();
      if (!เหตุผล) {
        แสดงข้อความAI("กรอกเหตุผลการลาก่อน แล้วค่อยกดให้ AI ช่วยจัดประเภท", true);
        return;
      }
      if (!ประเภททั้งหมด.length) {
        แสดงข้อความAI("ยังไม่มีประเภทการลาในระบบให้เลือก", true);
        return;
      }

      ตั้งค่าปุ่มAI(true);
      try {
        var รายชื่อประเภท = ประเภททั้งหมด.map(function (t) { return t.name; });
        var ข้อความระบบ =
          "คุณคือผู้ช่วยจัดประเภทการลาให้พนักงานในระบบลางานออนไลน์ " +
          "หน้าที่ของคุณคือเลือกประเภทการลาที่เหมาะสมที่สุดจาก \"รายชื่อประเภทการลาที่มีอยู่จริง\" ที่ผู้ใช้ให้มาเท่านั้น " +
          "ต้องตอบกลับด้วยชื่อประเภทการลาตรงตัวตามที่ปรากฏในรายชื่อเพียงชื่อเดียว " +
          "ห้ามอธิบายเพิ่มเติม ห้ามใส่เครื่องหมายคำพูดหรือคำอื่นปนมา " +
          "ถ้าไม่มีประเภทใดในรายชื่อเหมาะสมเลย ให้ตอบว่า ไม่ทราบ";
        var ข้อความผู้ใช้ =
          "รายชื่อประเภทการลาที่มีอยู่จริงในระบบ: " + รายชื่อประเภท.join(", ") +
          "\n\nเหตุผลการลาที่พนักงานพิมพ์ไว้: \"" + เหตุผล + "\"" +
          "\n\nกรุณาตอบชื่อประเภทการลาที่เหมาะสมที่สุดเพียงชื่อเดียว ให้ตรงตามรายชื่อด้านบนเป๊ะ ๆ";

        var คำตอบ = await เรียกAI(ข้อความระบบ, ข้อความผู้ใช้);
        var ประเภทที่ตรง = จับคู่ประเภท(คำตอบ, ประเภททั้งหมด);

        if (!ประเภทที่ตรง) {
          แสดงข้อความAI("AI จัดประเภทการลาให้ไม่ได้ (ผลลัพธ์ไม่ตรงกับประเภทที่มีอยู่จริงในระบบ) กรุณาเลือกประเภทเอง", true);
          return;
        }

        ช่องประเภท.value = ประเภทที่ตรง.id;
        แสดงป้ายAI();
        แสดงข้อความAI("AI เสนอประเภท \"" + ประเภทที่ตรง.name + "\" — ตรวจสอบและแก้ไขเป็นประเภทอื่นได้ก่อนกดบันทึก", false);
      } catch (e) {
        console.error(e);
        แสดงข้อความAI(แปลข้อผิดพลาดAI(e), true);
      } finally {
        ตั้งค่าปุ่มAI(false);
      }
    });

    // ผู้ใช้เลือกประเภทเองหลังจากนั้น — ค่านี้ไม่ใช่ข้อเสนอของ AI แล้ว ซ่อนป้ายทิ้ง
    ช่องประเภท.addEventListener("change", function () {
      ซ่อนป้ายAI();
    });
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();
    ซ่อนเตือน();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      แสดงเตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      แสดงเตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = ประเภททั้งหมด.find(function (t) { return t.id === ค่า.leaveTypeId; });
    if (!ประเภท) {
      แสดงเตือน("ประเภทการลาที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่");
      return;
    }

    ตั้งค่าปุ่ม(true);

    addDoc(collection(db, "leaveRequests"), {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา", // ใบใหม่เริ่มที่ รอพิจารณา เสมอ ผู้ขอลาเลือกเองไม่ได้
      requesterId: โปรไฟล์.uid, requesterName: โปรไฟล์.name,
      approverId: "", approverName: "", // ยังไม่มีการมอบหมายผู้อนุมัติในหน้านี้ (นอกขอบเขต Module 2)
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    })
      .then(function () {
        location.href = "leave-requests.html";
      })
      .catch(function (err) {
        console.error(err);
        แสดงเตือน("บันทึกใบลาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
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
    if (!ปุ่มบันทึก) return;
    ปุ่มบันทึก.disabled = กำลังทำงาน;
    ปุ่มบันทึก.textContent = กำลังทำงาน ? "กำลังบันทึก…" : "บันทึก";
  }

  // ── ตัวช่วยของปุ่ม AI (US-09) ──
  function ตั้งค่าปุ่มAI(กำลังทำงาน) {
    if (!ปุ่มAI) return;
    ปุ่มAI.disabled = กำลังทำงาน;
    ปุ่มAI.textContent = กำลังทำงาน ? "AI กำลังช่วยคิด…" : "ให้ AI ช่วยจัดประเภทการลา";
  }
  function แสดงข้อความAI(ข้อความ, เป็นข้อผิดพลาด) {
    if (!ข้อความAI) return;
    ข้อความAI.textContent = ข้อความ;
    ข้อความAI.classList.remove("hidden");
    ข้อความAI.classList.toggle("ai-hint-error", !!เป็นข้อผิดพลาด);
  }
  function ซ่อนข้อความAI() {
    if (ข้อความAI) ข้อความAI.classList.add("hidden");
  }
  function แสดงป้ายAI() {
    if (ป้ายAI) ป้ายAI.classList.remove("hidden");
  }
  function ซ่อนป้ายAI() {
    if (ป้ายAI) ป้ายAI.classList.add("hidden");
  }

  // จับคู่คำตอบดิบจาก AI กับประเภทการลาที่มีอยู่จริงเท่านั้น — ไม่ตรงคืน null
  function จับคู่ประเภท(คำตอบดิบ, รายการ) {
    var คำตอบ = String(คำตอบดิบ || "").trim();
    // ตัดเครื่องหมายคำพูด/จุดท้ายประโยคที่ AI อาจใส่ปนมาโดยไม่ได้ตั้งใจ
    คำตอบ = คำตอบ.replace(/^["'“”]+|["'“”]+$/g, "").replace(/[.。]+$/g, "").trim();

    var ตรงเป๊ะ = รายการ.find(function (t) { return String(t.name).trim() === คำตอบ; });
    if (ตรงเป๊ะ) return ตรงเป๊ะ;

    // เผื่อ AI ตอบมาพร้อมคำอื่นปนมา ลองหาว่าชื่อประเภทไหนอยู่ในคำตอบบ้าง
    // (เลือกชื่อที่ยาวที่สุดที่ match กันชื่อประเภทซ้อนกัน)
    var ผู้สมัคร = รายการ.filter(function (t) {
      return คำตอบ.indexOf(String(t.name).trim()) !== -1;
    });
    if (!ผู้สมัคร.length) return null;
    ผู้สมัคร.sort(function (a, b) { return String(b.name).length - String(a.name).length; });
    return ผู้สมัคร[0];
  }
})();
