// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// US-03 (ดู) · US-04 (เปลี่ยนสถานะ) · US-05 (ความเห็น) · US-07 (ลบ) · US-08 (สิทธิ์ตามบทบาท)
//
// หมายเหตุ: สเปกหัวข้อ 5.2 ไม่มีช่อง aiSuggestion และไม่มีโฟลเดอร์ย่อย aiLog
//    ไฟล์นี้ไม่แตะต้อง ปล่อยว่างไว้ให้ js/ai.js หรือสคริปต์ของทีม AI จัดการเอง
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebase-init.js";
import {
  doc, getDoc, updateDoc, deleteDoc,
  collection, addDoc, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  if (!กล่องใบลา) return;

  if (!รหัสใบลา) {
    กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — ลิงก์ไม่ถูกต้อง</p>";
    return;
  }

  var โปรไฟล์ = await ต้องล็อกอิน();

  var ใบ;
  try {
    var สแนปใบลา = await getDoc(doc(db, "leaveRequests", รหัสใบลา));
    if (!สแนปใบลา.exists()) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = Object.assign({ id: สแนปใบลา.id }, สแนปใบลา.data());
  } catch (e) {
    console.error(e);
    // ผู้ใช้คนหนึ่งเปิดใบลาของอีกคนไม่ได้ — Security Rules จะปฏิเสธและเข้ามาที่นี่
    กล่องใบลา.innerHTML = "<p>เปิดใบขอลานี้ไม่ได้ — คุณอาจไม่มีสิทธิ์เข้าถึงใบนี้</p>";
    return;
  }

  var ความเห็นทั้งหมด = [];
  try {
    ความเห็นทั้งหมด = await โหลดความเห็น();
  } catch (e) {
    console.error(e);
  }

  วาดใบลา();
  วาดความเห็น();
  if (กล่องความเห็น) กล่องความเห็น.classList.remove("hidden");

  var ปุ่มส่ง = document.getElementById("ปุ่มส่งความเห็น");
  if (ปุ่มส่ง) ปุ่มส่ง.addEventListener("click", ส่งความเห็น);

  async function โหลดความเห็น() {
    var คำสั่ง = query(
      collection(db, "leaveRequests", รหัสใบลา, "approvals"),
      orderBy("createdAt", "asc")
    );
    var สแนป = await getDocs(คำสั่ง);
    var รายการ = [];
    สแนป.forEach(function (d) { รายการ.push(Object.assign({ id: d.id }, d.data())); });
    return รายการ;
  }

  function เป็นเจ้าของ() { return โปรไฟล์.uid === ใบ.requesterId; }
  function เป็นผู้มีสิทธิ์อนุมัติ() { return โปรไฟล์.role === "manager" || โปรไฟล์.role === "hr"; }

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ/ไม่อนุมัติ เฉพาะผู้อนุมัติ-ฝ่ายบุคคล และใบยังรอพิจารณาเท่านั้น (US-04 · US-08)
    var ปุ่มต่างๆ = "";
    if (ใบ.status === "รอพิจารณา" && เป็นผู้มีสิทธิ์อนุมัติ()) {
      ปุ่มต่างๆ +=
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>';
    }
    // ปุ่มลบ เฉพาะเจ้าของใบ และใบยังรอพิจารณาเท่านั้น (US-07)
    if (ใบ.status === "รอพิจารณา" && เป็นเจ้าของ()) {
      ปุ่มต่างๆ += '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลานี้</button>';
    }

    if (ปุ่มต่างๆ) {
      html += '<div class="btn-row">' + ปุ่มต่างๆ + "</div>";
    } else if (ใบ.status !== "รอพิจารณา") {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
    var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
    var ปุ่มลบ = document.getElementById("ปุ่มลบ");
    if (ปุ่มอนุมัติ) ปุ่มอนุมัติ.addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
    if (ปุ่มไม่อนุมัติ) ปุ่มไม่อนุมัติ.addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
    if (ปุ่มลบ) ปุ่มลบ.addEventListener("click", ลบใบลา);
  }

  // ── เปลี่ยนสถานะ — แก้เฉพาะช่อง status ช่องเดียว ห้ามเขียนทับทั้งไฟล์ ──
  async function เปลี่ยนสถานะ(สถานะใหม่) {
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็นทั้งหมด.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }
    try {
      await updateDoc(doc(db, "leaveRequests", รหัสใบลา), { status: สถานะใหม่ });
      ใบ.status = สถานะใหม่;
      วาดใบลา();
    } catch (e) {
      console.error(e);
      alert("เปลี่ยนสถานะไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  // ── ลบใบลา + ไล่ลบโฟลเดอร์ย่อย approvals ก่อนเสมอ (Firestore ไม่ลบตามให้) ──
  async function ลบใบลา() {
    if (!confirm("ยืนยันการลบใบขอลานี้หรือไม่ — ลบแล้วกู้คืนไม่ได้")) return;
    try {
      await ลบโฟลเดอร์ย่อยทั้งหมด("approvals");
      await deleteDoc(doc(db, "leaveRequests", รหัสใบลา));
      location.href = "leave-requests.html";
    } catch (e) {
      console.error(e);
      alert("ลบใบขอลาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }

  async function ลบโฟลเดอร์ย่อยทั้งหมด(ชื่อโฟลเดอร์) {
    var สแนป = await getDocs(collection(db, "leaveRequests", รหัสใบลา, ชื่อโฟลเดอร์));
    var งานลบ = [];
    สแนป.forEach(function (d) { งานลบ.push(deleteDoc(d.ref)); });
    await Promise.all(งานลบ);
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (!ที่วาง) return;
    if (ความเห็นทั้งหมด.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็นทั้งหมด
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ ──
  async function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      if (เตือน) {
        เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
        เตือน.classList.remove("hidden");
      }
      return;
    }
    if (เตือน) เตือน.classList.add("hidden");

    var ข้อมูลใหม่ = {
      authorId: โปรไฟล์.uid, authorName: โปรไฟล์.name,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    try {
      var เอกสารใหม่ = await addDoc(collection(db, "leaveRequests", รหัสใบลา, "approvals"), ข้อมูลใหม่);
      ความเห็นทั้งหมด.push(Object.assign({ id: เอกสารใหม่.id }, ข้อมูลใหม่));
      ช่อง.value = "";
      วาดความเห็น();
      วาดใบลา(); // อาจปลดล็อกปุ่ม "ไม่อนุมัติ" ได้แล้วถ้านี่คือความเห็นแรกของใบ
    } catch (e) {
      console.error(e);
      alert("ส่งความเห็นไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    }
  }
})();
