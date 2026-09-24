# EMO — Mood Randomizer (Offline)

## ภาษาไทย

แอปเว็บแบบ **HTML/CSS/JavaScript ล้วน ๆ** สำหรับ “สุ่มอารมณ์” แบบละเอียด ครอบคลุม และ **ไม่ซ้ำง่าย** (weighted random + ลงโทษการซ้ำ + กระจายหมวด) พร้อมลูกเล่นอีกเพียบ ใช้งานได้ทั้งมือถือและเดสก์ท็อป และติดตั้งเป็นแอป (PWA) ได้

### อารมณ์

- **585 อารมณ์ใน 26 หมวด** (สุ่มได้จริงทั้งหมด) จากคลังกว่า 2,600 แบบ
- หมวดใหม่: ประหลาดใจ, อยากรู้, รังเกียจ, เห็นใจ, ทึ่ง, เหนื่อยล้า
- อารมณ์ใหม่ร่วมสมัย เช่น มูฟออน, เซ็ง, งอน, ปลง, ฟีลกู้ด, แบตสังคมหมด, หิวจนหงุดหงิด, กลัวตกกระแส
- แต่ละอารมณ์มี: ชื่อ, คำอธิบาย, พลังงาน (0–100), Valence (-100..+100), Arousal (0–100), สี + emoji, คำคม และ **“ลองทำดู”** (คำแนะนำที่ติ๊กได้)

### ลูกเล่น

- 🎲 **สุ่มอารมณ์** พร้อมแอนิเมชันสับไพ่, พลุกระดาษ, เสียง และการสั่น
- ⚡ **สุ่มรัว** 1–30 ครั้ง
- 🎡 **วงล้อ** เลือกหมวดแล้วสุ่มอารมณ์ในหมวด (บนมือถือปัดวงล้อเพื่อหมุนได้)
- 🧪 **ผสมอารมณ์** รวม 2 อารมณ์เป็นอารมณ์ใหม่ (บันทึก/ค้นหาได้)
- 🔮 **ดวงอารมณ์ประจำวัน** การ์ดพลิก + สีมงคล + เลขนำโชค
- 🎚️ **เช็คอินใจ** เลื่อนแถบความรู้สึก แล้วแอปจะหาอารมณ์ที่ใกล้เคียงที่สุด
- 🗺️ **แผนที่อารมณ์** แตะตำแหน่งบนแผนที่ (สุข/เศร้า × ตื่นตัว/สงบ) เพื่อเลือกอารมณ์
- 🫁 **ฝึกหายใจแบบกล่อง** 4-4-4-4 (แนะนำอัตโนมัติเมื่ออารมณ์ตึงเครียด)
- 📸 **การ์ดอารมณ์** สร้างรูป PNG เพื่อแชร์/ดาวน์โหลด
- 🏅 **ความสำเร็จ 23 รางวัล** + 🔥 สตรีครายวัน
- 📳 **เขย่าเพื่อสุ่ม** (มือถือ) และความลับซ่อนอยู่ในลูกแก้ว 😉

### ข้อมูลของฉัน

- ประวัติล่าสุด, ที่บันทึกไว้, สถิติ (กราฟ 7 วัน, Top 6, สตรีค, หมวดที่เจอ)
- ไดอารี่ผูกกับอารมณ์: แท็ก, ค้นหา/กรอง, แก้ไขในที่, ลบแบบยืนยัน
- ข้อมูลทั้งหมดเก็บใน localStorage ของเครื่องคุณเท่านั้น

### UX/UI

- ธีมมืด/สว่าง (ตามระบบอัตโนมัติ), สีทั้งแอปเปลี่ยนตามอารมณ์แบบนุ่มนวล
- ภาษาไทย/อังกฤษ, คีย์ลัด (กด `?` เพื่อดู), รองรับ `prefers-reduced-motion`
- **มือถือ**: การ์ดผลลัพธ์อยู่บนสุด, ปุ่มสุ่มลอย (FAB), หน้าต่างแบบ bottom sheet ลากลงเพื่อปิด, ปัดซ้าย/ขวาเพื่อเปลี่ยนแท็บ, ปุ่มขนาดนิ้วแตะ, รองรับ safe-area (notch), ช่องกรอกไม่ซูมบน iOS
- PWA: ไอคอน PNG/maskable, ทางลัดบนหน้าจอหลัก, ทำงานออฟไลน์

### คีย์ลัด

`Space`/`R` สุ่ม • `B` สุ่มรัว • `W` วงล้อ • `M` ผสม • `D` ดวงวันนี้ • `K` เช็คอิน • `H` หายใจ • `S` บันทึก • `C` คัดลอก • `P` การ์ด • `T` ธีม • `L` ภาษา • `/` ค้นหา • `?` ช่วยเหลือ

### วิธีรัน

1. เปิดไฟล์ `index.html` ด้วยเบราว์เซอร์ได้ทันที (หรือเสิร์ฟผ่าน static server เพื่อใช้ PWA/ออฟไลน์)
2. ไม่ต้องติดตั้งหรือ build อะไรเพิ่ม

### ไฟล์ในโปรเจกต์

- `index.html` โครงหน้า + modal ทั้งหมด
- `style.css` ธีม Glass / Aurora / Responsive / Mobile bottom sheet
- `data.js` คลังอารมณ์, หมวด, คำคม, คำแนะนำ
- `script.js` ระบบสุ่ม + UI + ลูกเล่น + สถิติ + ไดอารี่ + รางวัล + storage
- `sw.js`, `manifest.json`, `icons/` PWA และไอคอน

---

## English

An **offline, zero-dependency** HTML/CSS/JavaScript web app that randomizes human moods in a detailed, varied way (weighted random + anti-repeat penalties + category spreading), packed with playful extras. Works on phones and desktops and installs as a PWA.

### Moods

- **585 rollable moods across 26 categories**, drawn from a 2,600+ library
- New categories: Surprise, Curiosity, Disgust, Compassion, Awe, Fatigue
- Each mood has a name, description, energy, valence, arousal, color + emoji, a tagline and checkable **“Try this”** suggestions

### Toys

- 🎲 Roll with shuffle animation, confetti, sound and haptics • ⚡ Burst (1–30)
- 🎡 Spin wheel (flick it on touch screens) • 🧪 Mood mixer • 🔮 Daily mood fortune
- 🎚️ Check-in sliders → closest moods • 🗺️ Tap-to-pick mood map (valence × arousal)
- 🫁 Box breathing (suggested automatically for tense moods) • 📸 Shareable PNG mood card
- 🏅 23 achievements + 🔥 daily streak • 📳 Shake to roll • plus a hidden easter egg

### Your data

History, saved moods, stats (7-day chart, top 6, streak, categories met) and a mood-linked diary with tags, filtering and inline editing. Everything stays in your browser's localStorage.

### UX/UI

Dark/light themes (follows the system), mood-tinted UI, Thai/English, keyboard shortcuts (`?`), reduced-motion support. On phones: result card first, floating roll button, drag-to-close bottom sheets, swipe between tabs, finger-sized targets, safe-area aware, no iOS input zoom.

### Run locally

Open `index.html` in a browser, or serve the folder statically to enable the offline service worker. No build step, no external libraries.
