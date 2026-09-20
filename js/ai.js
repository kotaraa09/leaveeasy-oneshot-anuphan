// ─────────────────────────────────────────────────────────────
// js/ai.js — ที่เดียวที่คุยกับ OpenRouter (US-09)
//
// ไฟล์อื่นห้าม fetch ไป openrouter.ai ตรง ๆ — เรื่องคีย์ · ชื่อรุ่นโมเดล ·
// เวลารอ ต้องแก้ที่ไฟล์นี้ที่เดียว
//
// คีย์จริงอยู่ใน js/ai-key.js (ไฟล์นี้ถูก .gitignore กันไว้ ไม่ขึ้น GitHub)
// โหลดด้วย dynamic import แบบมี try/catch — ไม่มีไฟล์คีย์ก็พังแค่ปุ่ม AI
// ไม่พังทั้งหน้า
// ─────────────────────────────────────────────────────────────

var ชื่อโมเดล = "openai/gpt-4o-mini";
var เวลาตัดรอมิลลิวินาที = 15000;

// โหลดไฟล์คีย์แบบปลอดภัย — ไม่มีไฟล์ / โหลดพัง ก็คืนค่าว่างแทนที่จะทำหน้าพัง
async function โหลดคีย์() {
  try {
    var โมดูล = await import("./ai-key.js");
    var ค่า = โมดูล && โมดูล.คีย์OpenRouter;
    if (!ค่า) return "";
    return String(ค่า).trim();
  } catch (e) {
    return "";
  }
}

// ถามก่อนยิง จะได้บอกผู้ใช้ตรง ๆ ว่ายังไม่ได้ใส่คีย์ แทนที่จะรอให้เจอ 401
export async function มีคีย์ไหม() {
  var คีย์ = await โหลดคีย์();
  return !!คีย์;
}

// ถาม AI หนึ่งครั้ง · ตัดเวลารอที่ 15 วินาที · ไม่สำเร็จให้โยน error
export async function เรียกAI(ข้อความระบบ, ข้อความผู้ใช้) {
  var คีย์ = await โหลดคีย์();
  if (!คีย์) {
    throw new Error("ไม่มีคีย์AI");
  }

  var ตัวควบคุม = new AbortController();
  var หมดเวลา = false;
  var ตัวจับเวลา = setTimeout(function () {
    หมดเวลา = true;
    ตัวควบคุม.abort();
  }, เวลาตัดรอมิลลิวินาที);

  try {
    var ตอบกลับ = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + คีย์,
        "Content-Type": "application/json"
      },
      signal: ตัวควบคุม.signal,
      body: JSON.stringify({
        model: ชื่อโมเดล,
        temperature: 0.2,
        messages: [
          { role: "system", content: ข้อความระบบ },
          { role: "user", content: ข้อความผู้ใช้ }
        ]
      })
    });

    if (!ตอบกลับ.ok) {
      var ข้อผิดพลาด = new Error("HTTP " + ตอบกลับ.status);
      ข้อผิดพลาด.สถานะ = ตอบกลับ.status;
      throw ข้อผิดพลาด;
    }

    var json = await ตอบกลับ.json();
    var เนื้อหา = json && json.choices && json.choices[0] && json.choices[0].message
      && json.choices[0].message.content;

    if (!เนื้อหา || !String(เนื้อหา).trim()) {
      throw new Error("AI ไม่ตอบกลับข้อความ");
    }
    return String(เนื้อหา).trim();
  } catch (e) {
    if (หมดเวลา || e.name === "AbortError") {
      var หมดเวลาError = new Error("หมดเวลารอ");
      หมดเวลาError.หมดเวลา = true;
      throw หมดเวลาError;
    }
    throw e;
  } finally {
    clearTimeout(ตัวจับเวลา);
  }
}

// แปลง error เป็นข้อความไทยที่บอกทางออก ก่อนแสดงบนหน้าจอ
export function แปลข้อผิดพลาดAI(e) {
  if (!e) return "เรียก AI ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

  if (e.หมดเวลา) {
    return "รอ AI นานเกิน 15 วินาที กรุณาลองใหม่ หรือเลือกประเภทการลาเอง";
  }
  if (e.message === "ไม่มีคีย์AI") {
    return "ยังไม่ได้ตั้งค่าคีย์ AI ของระบบ กรุณาเลือกประเภทการลาเอง";
  }
  if (e.สถานะ === 401) {
    return "คีย์ AI ใช้งานไม่ได้ (ถูกเพิกถอนหรือไม่ถูกต้อง) กรุณาแจ้งผู้ดูแลระบบ";
  }
  if (e.สถานะ === 429) {
    return "เรียกใช้ AI ถี่เกินไป กรุณารอสักครู่แล้วลองใหม่";
  }
  if (e.name === "TypeError") {
    return "เชื่อมต่อ AI ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";
  }
  return "เรียก AI ไม่สำเร็จ กรุณาลองใหม่ หรือเลือกประเภทการลาเอง";
}
