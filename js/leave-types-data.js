// ─────────────────────────────────────────────────────────────
// js/leave-types-data.js — ที่เดียวที่คุยกับโฟลเดอร์ leaveTypes บน Firestore
//
// หน้าอื่น (new-leave-request.js · leave-types.js) ต้อง import จากไฟล์นี้เท่านั้น
// ห้ามเปิด collection(db, "leaveTypes") ตรง ๆ ในไฟล์อื่นอีก
// ─────────────────────────────────────────────────────────────

import { db } from "./firebase-init.js";
import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

function เรียงตามชื่อ(รายการ) {
  return รายการ.slice().sort(function (a, b) {
    return String(a.name || "").localeCompare(String(b.name || ""), "th");
  });
}

function สแนปเป็นรายการ(สแนป) {
  var รายการ = [];
  สแนป.forEach(function (d) { รายการ.push(Object.assign({ id: d.id }, d.data())); });
  return เรียงตามชื่อ(รายการ);
}

// ดึงประเภทการลาทั้งหมดครั้งเดียว — ใช้เติม <select> ในหน้ายื่นใบลาใหม่
export async function ดึงประเภทการลาทั้งหมด() {
  var สแนป = await getDocs(collection(db, "leaveTypes"));
  return สแนปเป็นรายการ(สแนป);
}

// เฝ้าดูแบบเรียลไทม์ — คืนฟังก์ชัน unsubscribe ไว้เรียกตอนออกจากหน้า
export function เฝ้าดูประเภทการลา(รับข้อมูล) {
  return onSnapshot(collection(db, "leaveTypes"), function (สแนป) {
    รับข้อมูล(สแนปเป็นรายการ(สแนป));
  });
}

export async function เพิ่มประเภทการลา(ชื่อ) {
  return addDoc(collection(db, "leaveTypes"), { name: ชื่อ });
}

export async function แก้ชื่อประเภทการลา(id, ชื่อใหม่) {
  return updateDoc(doc(db, "leaveTypes", id), { name: ชื่อใหม่ });
}

export async function ลบประเภทการลา(id) {
  return deleteDoc(doc(db, "leaveTypes", id));
}
