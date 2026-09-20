// ─────────────────────────────────────────────────────────────
// js/firebase-init.js — จุดเชื่อมต่อ Firebase ของทั้งระบบ
//
// ไฟล์นี้ทำอย่างเดียว: เปิดการเชื่อมต่อไปยัง Firebase แล้วส่งต่อให้หน้าอื่นใช้
// หน้าไหนต้องการคุยกับฐานข้อมูลให้ดึง db · หน้าไหนต้องการรู้ว่าใครล็อกอินอยู่ให้ดึง auth
// ไม่ต้องตั้งค่าซ้ำในไฟล์อื่นอีก
//
// 🔓 ค่า firebaseConfig ข้างล่างนี้ "ไม่ใช่ความลับ"
//    Firebase ออกแบบมาให้เปิดเผยได้ ใครเปิดหน้าเว็บเราก็เห็นค่านี้อยู่แล้ว
//    สิ่งที่กันคนอื่นเข้าถึงข้อมูลจริง ๆ คือ Security Rules (ไฟล์ firestore.rules)
//    ไม่ใช่การซ่อนค่าพวกนี้ — จึง commit ขึ้น GitHub ได้ตามปกติ
//
// ⚠️ ไฟล์นี้เป็นแบบ module จึงต้องเปิดผ่าน http://localhost:3000
//    เปิดด้วยการดับเบิลคลิกไฟล์ (file://) เบราว์เซอร์จะบล็อก
// ─────────────────────────────────────────────────────────────

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBF6G90hF_YzhjT8y4DyIMZY1Ai5TxLgbU",
  authDomain: "leaveeasy-anuphan.firebaseapp.com",
  projectId: "leaveeasy-anuphan",
  storageBucket: "leaveeasy-anuphan.firebasestorage.app",
  messagingSenderId: "794901713437",
  appId: "1:794901713437:web:0251ef5a0977bae366acf4"
  // measurementId ตัดออก — Analytics ไม่อยู่ในขอบเขต Module 2
};

// เปิดการเชื่อมต่อครั้งเดียว แล้วแบ่งให้ทั้ง db และ auth ใช้ร่วมกัน
const app = initializeApp(firebaseConfig);

// ตัวเชื่อมต่อฐานข้อมูล ที่หน้าอื่นจะดึงไปใช้
export const db = getFirestore(app);

// ตัวเชื่อมต่อระบบล็อกอิน — ปกติหน้าอื่นไม่ต้องดึงตัวนี้ไปใช้ตรง ๆ
// ให้เรียกผ่านตัวช่วยใน js/auth.js แทน จะได้ไม่ต้องเขียนเรื่องเดิมซ้ำทุกหน้า
export const auth = getAuth(app);
