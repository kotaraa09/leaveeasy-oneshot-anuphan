// ─────────────────────────────────────────────────────────────
// js/auth.js — รวมเรื่องล็อกอินไว้ที่เดียว (Firebase Authentication)
//
// ไฟล์อื่นห้ามเรียก onAuthStateChanged · signOut · signInWithEmailAndPassword ตรง ๆ
// ให้ import ตัวช่วยจากไฟล์นี้แทนเสมอ
//
// ⚠️ ไฟล์นี้เป็น ES module — หน้าที่จะใช้ต้องโหลดสคริปต์หน้าเป็น
//    <script type="module" src="js/หน้านั้น.js"></script>
//    (ไฟล์นี้เองไม่ต้องถูกอ้างตรง ๆ ในหน้า HTML — หน้าไหน import จากมันก็พอ
//    ยกเว้นหน้าที่ต้องการแค่แสดงชื่อผู้ใช้ใน #navUser โดยไม่มีสคริปต์อื่น เช่น index.html
//    หน้านั้นให้เพิ่ม <script type="module" src="js/auth.js"></script> เอง)
// ─────────────────────────────────────────────────────────────

import { auth, db } from "./firebase-init.js";
import {
  onAuthStateChanged,
  signOut as _signOut,
  signInWithEmailAndPassword as _signIn,
  createUserWithEmailAndPassword as _signUp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

// หน้าที่เปิดได้โดยไม่ต้องล็อกอิน — เพิ่มหน้าใหม่ต้องแก้ที่นี่
export const หน้าที่ไม่ต้องล็อกอิน = ["index.html", "login.html", "signup.html", ""];

// ── รอสถานะล็อกอินครั้งแรกจาก Firebase (แคชไว้ ไม่ต้องรอซ้ำทุกครั้งที่เรียก) ──
let สถานะพร้อม = null;
function รอสถานะล็อกอินครั้งแรก() {
  if (!สถานะพร้อม) {
    สถานะพร้อม = new Promise(function (resolve) {
      const เลิกฟัง = onAuthStateChanged(auth, function (user) {
        เลิกฟัง();
        resolve(user);
      });
    });
  }
  return สถานะพร้อม;
}

// ── โหลดโปรไฟล์จาก users/{uid} มาผูกกับ user ของ Firebase Auth ──
async function โหลดโปรไฟล์(user) {
  if (!user) return null;
  try {
    const สแนป = await getDoc(doc(db, "users", user.uid));
    const ข้อมูล = สแนป.exists() ? สแนป.data() : {};
    return {
      uid: user.uid,
      email: user.email || ข้อมูล.email || "",
      name: ข้อมูล.name || user.email || "ผู้ใช้ไม่ทราบชื่อ",
      role: ข้อมูล.role || "employee"
    };
  } catch (e) {
    console.error("โหลดโปรไฟล์ผู้ใช้ไม่สำเร็จ", e);
    return { uid: user.uid, email: user.email || "", name: user.email || "ผู้ใช้", role: "employee" };
  }
}

// อยากรู้ว่าใครล็อกอินอยู่ แต่ไม่ต้องการไล่คนที่ยังไม่ล็อกอินออก — คืน null ถ้ายังไม่ล็อกอิน
export async function ผู้ใช้ปัจจุบัน() {
  const user = await รอสถานะล็อกอินครั้งแรก();
  return โหลดโปรไฟล์(user);
}

// บรรทัดแรกของหน้าที่ต่อฐาน — ยังไม่ล็อกอินจะเด้งไปหน้าเข้าสู่ระบบและหยุดโค้ดที่เหลือให้เอง
export async function ต้องล็อกอิน() {
  const โปรไฟล์ = await ผู้ใช้ปัจจุบัน();
  if (!โปรไฟล์) {
    const หน้านี้ = location.pathname.split("/").pop() || "index.html";
    const กลับมาที่ = encodeURIComponent(หน้านี้ + location.search);
    location.href = "login.html?ต่อ=" + กลับมาที่;
    // คืน Promise ที่ไม่มีวัน resolve — โค้ดที่ await เรียกนี้จะหยุดค้างเฉย ๆ
    // ระหว่างที่เบราว์เซอร์กำลังเปลี่ยนหน้าไปหน้าเข้าสู่ระบบพอดี
    return new Promise(function () {});
  }
  return โปรไฟล์;
}

// ── ตัวช่วยเรียก Firebase Authentication ──
export async function เข้าสู่ระบบ(email, password) {
  return _signIn(auth, email, password);
}

export async function สมัครสมาชิก(name, email, password) {
  const ผลลัพธ์ = await _signUp(auth, email, password);
  // role เริ่มที่ employee เสมอ · ใช้ uid เป็นชื่อไฟล์ด้วย setDoc (ห้าม addDoc)
  await setDoc(doc(db, "users", ผลลัพธ์.user.uid), {
    name: name,
    email: email,
    role: "employee"
  });
  return ผลลัพธ์.user;
}

export async function ออกจากระบบ() {
  await _signOut(auth);
  location.href = "index.html";
}

// แปลรหัส error ของ Firebase Auth เป็นข้อความไทย
export function แปลข้อผิดพลาดAuth(e) {
  const รหัส = (e && e.code) || "";
  const แผนที่ = {
    "auth/invalid-email": "อีเมลไม่ถูกต้อง",
    "auth/user-not-found": "ไม่พบบัญชีผู้ใช้นี้ในระบบ",
    "auth/wrong-password": "รหัสผ่านไม่ถูกต้อง",
    "auth/invalid-credential": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/email-already-in-use": "อีเมลนี้มีผู้ใช้ในระบบแล้ว",
    "auth/weak-password": "รหัสผ่านสั้นเกินไป ต้องยาวอย่างน้อย 6 ตัวอักษร",
    "auth/too-many-requests": "ลองผิดหลายครั้งเกินไป กรุณารอสักครู่แล้วลองใหม่",
    "auth/network-request-failed": "เชื่อมต่ออินเทอร์เน็ตไม่ได้ กรุณาลองใหม่"
  };
  return แผนที่[รหัส] || "เกิดข้อผิดพลาด (" + (รหัส || "ไม่ทราบสาเหตุ") + ") กรุณาลองใหม่อีกครั้ง";
}

// ── เติมชื่อคนล็อกอิน + ปุ่มออกจากระบบ ใน #navUser ของทุกหน้าที่ import ไฟล์นี้ ──
// (js/nav.js สร้าง <span id="navUser"> ว่างไว้ให้แล้ว — ที่นี่มาเติมเนื้อหาทับทั้งก้อน)
(function ผูกแถบผู้ใช้() {
  const กล่อง = document.getElementById("navUser");
  if (!กล่อง) return;

  onAuthStateChanged(auth, async function (user) {
    กล่อง.innerHTML = "";
    if (!user) {
      const ลิงก์ = document.createElement("a");
      ลิงก์.href = "login.html";
      ลิงก์.textContent = "เข้าสู่ระบบ";
      กล่อง.appendChild(ลิงก์);
      return;
    }

    const โปรไฟล์ = await โหลดโปรไฟล์(user);

    const ชื่อ = document.createElement("span");
    ชื่อ.className = "nav-username";
    ชื่อ.textContent = โปรไฟล์ ? โปรไฟล์.name : user.email;

    const ปุ่ม = document.createElement("button");
    ปุ่ม.type = "button";
    ปุ่ม.className = "btn-ghost";
    ปุ่ม.id = "ปุ่มออกจากระบบ";
    ปุ่ม.textContent = "ออกจากระบบ";
    ปุ่ม.addEventListener("click", ออกจากระบบ);

    กล่อง.appendChild(ชื่อ);
    กล่อง.appendChild(document.createTextNode(" "));
    กล่อง.appendChild(ปุ่ม);
  });
})();
