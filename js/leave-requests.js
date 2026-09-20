// ─────────────────────────────────────────────────────────────
// js/leave-requests.js — หน้าที่ 1 รายการใบลา
// อ่านจาก Firestore จริง · US-01 · US-08 (employee เห็นเฉพาะของตัวเอง)
// ─────────────────────────────────────────────────────────────

import { ต้องล็อกอิน } from "./auth.js";
import { db } from "./firebase-init.js";
import {
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

(async function () {
  var กล่อง = document.getElementById("ผลลัพธ์");
  if (!กล่อง) return;

  // ยังไม่ล็อกอินจะถูกเด้งไปหน้า login.html ให้เองแล้วหยุดโค้ดตรงนี้ค้างไว้
  var โปรไฟล์ = await ต้องล็อกอิน();

  var ใบลาทั้งหมด;
  try {
    ใบลาทั้งหมด = await โหลดใบลา(โปรไฟล์);
  } catch (e) {
    console.error(e);
    กล่อง.innerHTML = "<p>โหลดข้อมูลใบลาไม่สำเร็จ ลองรีเฟรชหน้าใหม่อีกครั้ง</p>";
    return;
  }

  // ถ้ามีสถานะติดมาท้าย URL ให้กรองเฉพาะสถานะนั้น (มาจากลิงก์กล่องตัวเลขในแดชบอร์ด)
  var สถานะที่กรอง = ค่าจากURL("status");
  if (สถานะที่กรอง) {
    ใบลาทั้งหมด = ใบลาทั้งหมด.filter(function (ใบ) { return ใบ.status === สถานะที่กรอง; });
    var หัวข้อย่อย = document.querySelector(".subtitle");
    if (หัวข้อย่อย) {
      หัวข้อย่อย.textContent =
        "กำลังแสดงเฉพาะใบลาที่สถานะ " + สถานะที่กรอง + " · กดเมนู รายการใบลา เพื่อดูทั้งหมด";
    }
  }

  // ใหม่ไปเก่า
  ใบลาทั้งหมด.sort(function (a, b) {
    return (b.createdAt || "") < (a.createdAt || "") ? -1 : 1;
  });

  แสดงตาราง(ใบลาทั้งหมด);

  // ── โหลดใบลาตามสิทธิ์: employee เห็นเฉพาะของตัวเอง · manager/hr เห็นทั้งหมด ──
  async function โหลดใบลา(โปรไฟล์) {
    var คอลเลกชัน = collection(db, "leaveRequests");
    var คำสั่ง =
      โปรไฟล์.role === "manager" || โปรไฟล์.role === "hr"
        ? คอลเลกชัน
        : query(คอลเลกชัน, where("requesterId", "==", โปรไฟล์.uid));

    var สแนป = await getDocs(คำสั่ง);
    var รายการ = [];
    สแนป.forEach(function (d) { รายการ.push(Object.assign({ id: d.id }, d.data())); });
    return รายการ;
  }

  function แสดงตาราง(รายการ) {
    if (รายการ.length === 0) {
      กล่อง.innerHTML = "<p>ยังไม่มีใบขอลาในระบบ</p>";
      return;
    }

    var html =
      "<table><thead><tr>" +
      "<th>หัวข้อ</th>" +
      "<th>ประเภทการลา</th>" +
      "<th>สถานะ</th>" +
      '<th class="hide-mobile">ผู้ขอลา</th>' +
      '<th class="hide-mobile">วันที่ลา</th>' +
      "</tr></thead><tbody>";

    รายการ.forEach(function (ใบ) {
      html +=
        '<tr class="clickable" data-id="' + esc(ใบ.id) + '">' +
        "<td>" + esc(ใบ.title) + "</td>" +
        "<td>" + esc(ใบ.leaveTypeName) + "</td>" +
        "<td>" + ป้ายสถานะ(ใบ.status) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.requesterName) + "</td>" +
        '<td class="hide-mobile">' + esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate) + "</td>" +
        "</tr>";
    });

    html += "</tbody></table>";
    กล่อง.innerHTML = html;

    // กดที่แถวไหน ไปหน้ารายละเอียดของใบนั้น
    กล่อง.querySelectorAll("tr.clickable").forEach(function (แถว) {
      แถว.addEventListener("click", function () {
        location.href = "leave-request-detail.html?id=" + encodeURIComponent(แถว.dataset.id);
      });
    });
  }
})();
