# EMO — Mood Randomizer (Offline)

## ภาษาไทย

แอปเว็บแบบ **HTML/CSS/JavaScript ล้วน ๆ** สำหรับ “สุ่มอารมณ์” แบบละเอียด ครอบคลุม และ **ไม่ซ้ำง่าย** (มีระบบ weighted + ลงโทษการซ้ำ + ความใหม่ของผลลัพธ์)

### ฟีเจอร์หลัก

- **สุ่มอารมณ์**: แสดง
  - ชื่ออารมณ์
  - คำอธิบายสั้น ๆ
  - ระดับพลังงาน (0–100)
  - ระดับความสุข/เศร้า (Valence, -100..+100)
  - ระดับความสงบ/ตื่นตัว (Arousal, 0–100)
  - สีประจำอารมณ์ + emoji
- **โหมดสุ่ม**
  - สุ่มแบบปกติ
  - ไม่ให้ซ้ำอารมณ์เดิมติดกัน
  - เน้นความหลากหลาย (แนะนำ)
- **สุ่มต่อเนื่อง**: สุ่มหลายครั้งต่อเนื่อง (1–30 ครั้ง)
- **ค้นหาอารมณ์จากชื่อ/หมวด**: แตะผลลัพธ์เพื่อแสดง
- **คัดลอกผลลัพธ์**: คัดลอกเป็นข้อความพร้อมค่าสเกลทั้งหมด
- **บันทึกอารมณ์ที่สุ่มได้**: เก็บในเครื่อง (localStorage)
- **ประวัติการสุ่มล่าสุด**: แตะเพื่อย้อนกลับไปดู
- **วงล้อ (Spin Wheel)**: หมุนวงล้อเพื่อสุ่ม “หมวด” แล้วสุ่มอารมณ์ในหมวดนั้น
- **สถิติส่วนตัว**
  - อารมณ์ที่สุ่มบ่อยสุด (Top 6)
  - ค่าเฉลี่ยพลังงาน / valence / arousal
  - แนวโน้ม 7 วัน (กราฟ mini ด้วย Canvas)
- **ไดอารี่**
  - บันทึกโน้ต/เหตุการณ์ + แท็ก + เวลา โดยผูกกับอารมณ์ที่กำลังแสดง
  - ดู/แก้ไข/ลบรายการไดอารี่

### วิธีรัน

1. เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์ (Chrome/Edge/Firefox) ได้ทันที
2. ไม่ต้องติดตั้งอะไรเพิ่ม และใช้งานได้แบบออฟไลน์

### ไฟล์ในโปรเจกต์

- `index.html` UI หลัก + modal วงล้อ + ส่วนสถิติ/ไดอารี่
- `style.css` ธีม Modern / Clean / Card UI / Soft gradient / Responsive
- `script.js` คลังอารมณ์ + ระบบสุ่มอัจฉริยะ + วงล้อ + สถิติ + ไดอารี่ + storage

---

## English

An **offline, zero-dependency** HTML/CSS/JavaScript web app that “randomizes human moods” in a detailed, varied way. It uses **weighted random** + **anti-repeat penalties** to reduce repetitive picks.

### Key features

- **Random mood** output with:
  - name, description
  - energy (0–100)
  - valence (-100..+100)
  - arousal (0–100)
  - mood color + emoji
- **Randomization modes**
  - normal
  - no consecutive repeats
  - diversity-focused (recommended)
- **Burst mode** (1–30 rolls)
- **Search** by mood name/category
- **Copy result** to clipboard (text with all scales)
- **Favorites** (saved locally)
- **Recent history**
- **Spin Wheel**: spins for a category, then picks a mood within that category
- **Personal stats**
  - top 6 most-rolled moods
  - average energy/valence/arousal
  - 7-day trend mini chart (Canvas)
- **Diary**
  - save notes + tags + timestamp attached to the currently displayed mood
  - view/edit/delete diary entries

### Run locally

Open `index.html` in your browser. No build steps, no external libraries, works offline.

