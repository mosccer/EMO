/* EMO — single-page, zero-deps mood randomizer */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {
  mode: $("#mode"),
  burstCount: $("#burstCount"),
  search: $("#search"),
  btnRoll: $("#btnRoll"),
  btnWheel: $("#btnWheel"),
  btnBurst: $("#btnBurst"),
  btnReset: $("#btnReset"),
  btnCopy: $("#btnCopy"),
  btnSave: $("#btnSave"),
  btnLang: $("#btnLang"),
  langLabel: $("#langLabel"),
  stats: $("#stats"),
  statusText: $("#statusText"),
  viewer: $("#viewer"),
  moodEmoji: $("#moodEmoji"),
  moodName: $("#moodName"),
  moodCategory: $("#moodCategory"),
  moodDesc: $("#moodDesc"),
  moodTagline: $("#moodTagline"),
  moodBadge: $("#moodBadge"),
  colorDot: $("#colorDot"),
  colorCode: $("#colorCode"),
  valEnergy: $("#valEnergy"),
  valValence: $("#valValence"),
  valArousal: $("#valArousal"),
  barEnergy: $("#barEnergy"),
  barArousal: $("#barArousal"),
  barValenceLeft: $("#barValenceLeft"),
  barValenceRight: $("#barValenceRight"),
  searchResults: $("#searchResults"),
  history: $("#history"),
  favorites: $("#favorites"),
  toast: $("#toast"),

  wheelModal: $("#wheelModal"),
  btnWheelClose: $("#btnWheelClose"),
  btnWheelSpin: $("#btnWheelSpin"),
  wheelCanvas: $("#wheelCanvas"),
  wheelCurrentLabel: $("#wheelCurrentLabel"),

  statTotal: $("#statTotal"),
  statUnique: $("#statUnique"),
  statAvgEnergy: $("#statAvgEnergy"),
  statAvgValence: $("#statAvgValence"),
  statAvgArousal: $("#statAvgArousal"),
  statsCanvas: $("#statsCanvas"),
  topMoods: $("#topMoods"),

  diaryNote: $("#diaryNote"),
  diaryTags: $("#diaryTags"),
  btnDiarySave: $("#btnDiarySave"),
  diaryList: $("#diaryList"),
};

// ---------- Data: mood generation (200+ items) ----------

const CATEGORY_ORDER = [
  "ความสุข",
  "ความรัก",
  "ความเศร้า",
  "ความโกรธ",
  "ความกลัว",
  "ความกังวล",
  "ความสงบ",
  "ความตื่นเต้น",
  "ความอาย",
  "ความผิดหวัง",
  "ความคิดถึง",
  "ความสับสน",
  "ความภาคภูมิใจ",
  "ความอิจฉา",
  "ความขอบคุณ",
  "ความโดดเดี่ยว",
  "ความหวัง",
  "ความเบื่อ",
  "ความโล่งใจ",
  "อารมณ์ผสมและซับซ้อน",
];

const CATEGORY_THEME = {
  ความสุข: { color: "#34d399", emoji: "😄" },
  ความรัก: { color: "#fb7185", emoji: "💗" },
  ความเศร้า: { color: "#60a5fa", emoji: "😢" },
  ความโกรธ: { color: "#f97316", emoji: "😠" },
  ความกลัว: { color: "#a78bfa", emoji: "😨" },
  ความกังวล: { color: "#fbbf24", emoji: "😟" },
  ความสงบ: { color: "#22d3ee", emoji: "😌" },
  ความตื่นเต้น: { color: "#f472b6", emoji: "🤩" },
  ความอาย: { color: "#fda4af", emoji: "😳" },
  ความผิดหวัง: { color: "#94a3b8", emoji: "😞" },
  ความคิดถึง: { color: "#38bdf8", emoji: "🥺" },
  ความสับสน: { color: "#c084fc", emoji: "😵‍💫" },
  ความภาคภูมิใจ: { color: "#a3e635", emoji: "🏆" },
  ความอิจฉา: { color: "#10b981", emoji: "😒" },
  ความขอบคุณ: { color: "#f59e0b", emoji: "🙏" },
  ความโดดเดี่ยว: { color: "#64748b", emoji: "🌙" },
  ความหวัง: { color: "#5eead4", emoji: "✨" },
  ความเบื่อ: { color: "#a1a1aa", emoji: "🥱" },
  ความโล่งใจ: { color: "#2dd4bf", emoji: "😮‍💨" },
  "อารมณ์ผสมและซับซ้อน": { color: "#7c3aed", emoji: "🧩" },
};

// Helper for stable pseudo variety without being repetitive:
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const hash32 = (s) => {
  // FNV-1a-ish
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const mulberry32 = (seed) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
};

const TAGLINES_BY_CATEGORY = {
  ความสุข: [
    "ปล่อยให้รอยยิ้มทำงานของมัน",
    "ความสว่างเล็ก ๆ ก็พอเปลี่ยนวันได้",
    "วันนี้ใจเบาขึ้นนิดหนึ่ง",
  ],
  ความรัก: [
    "อ่อนโยนกับตัวเองพอ ๆ กับคนที่รัก",
    "ความใกล้ชิดเริ่มจากความจริงใจ",
    "หัวใจมีพื้นที่เสมอ ถ้าเราเปิดไว้",
  ],
  ความเศร้า: [
    "ความเศร้าไม่ได้ผิด—แค่ขอเวลาหน่อย",
    "หายใจลึก ๆ แล้วค่อย ๆ ไป",
    "วันนี้ไม่ไหวก็ไม่เป็นไร",
  ],
  ความโกรธ: [
    "พลังนี้มีค่าถ้าเราใช้มันอย่างฉลาด",
    "ตั้งขอบเขตแล้วใจจะปลอดภัยขึ้น",
    "หยุดสักนิดก่อนตอบโต้",
  ],
  ความกลัว: [
    "กลัวไม่เท่ากับแพ้",
    "ก้าวเล็ก ๆ ก็เป็นความกล้าหาญ",
    "อยู่กับมันอย่างอ่อนโยน",
  ],
  ความกังวล: [
    "คิดได้ แต่อย่าให้คิดพาไปไกลเกิน",
    "แยกสิ่งที่ควบคุมได้ออกจากที่ควบคุมไม่ได้",
    "กลับมาที่ลมหายใจ",
  ],
  ความสงบ: [
    "นิ่ง ๆ แต่ไม่หยุดเติบโต",
    "ความเงียบคือพื้นที่ของใจ",
    "สบาย ๆ ก็พอ",
  ],
  ความตื่นเต้น: [
    "พลังงานพร้อม—ใช้มันให้คุ้ม",
    "ลองสิ่งใหม่ ๆ แบบปลอดภัย",
    "วันนี้มีประกาย",
  ],
  ความอาย: [
    "เราเป็นมนุษย์ธรรมดาได้",
    "ความอายคือสัญญาณว่าเราสนใจ",
    "ค่อย ๆ เปิดพื้นที่ให้ตัวเอง",
  ],
  ความผิดหวัง: [
    "ผิดหวังได้ แปลว่าเราเคยหวัง",
    "เรียนรู้แล้วค่อยเริ่มใหม่",
    "ให้ใจพักก่อนตัดสิน",
  ],
  ความคิดถึง: [
    "ความคิดถึงคือความรักในรูปแบบหนึ่ง",
    "เก็บความทรงจำไว้แบบไม่ทำร้ายตัวเอง",
    "คิดถึงได้ แต่ยังอยู่กับปัจจุบัน",
  ],
  ความสับสน: [
    "สับสนได้ แปลว่าเรากำลังจัดระบบใหม่",
    "ถามคำถามดี ๆ แล้วคำตอบจะมา",
    "พักก่อน แล้วค่อยเลือก",
  ],
  ความภาคภูมิใจ: [
    "ยกย่องความพยายามของตัวเอง",
    "เก่งมากที่ยังไปต่อ",
    "ภูมิใจอย่างพอดีและจริงใจ",
  ],
  ความอิจฉา: [
    "อิจฉาเป็นข้อมูล ไม่ใช่ความผิด",
    "เปลี่ยนมันเป็นแรงบันดาลใจ",
    "กลับมามองเส้นทางของเรา",
  ],
  ความขอบคุณ: [
    "ขอบคุณเล็ก ๆ ทำให้ใจใหญ่ขึ้น",
    "มองเห็นสิ่งดี ๆ ที่มีอยู่แล้ว",
    "ซาบซึ้งกับปัจจุบัน",
  ],
  ความโดดเดี่ยว: [
    "โดดเดี่ยวไม่ได้แปลว่าไร้ค่า",
    "เชื่อมต่อทีละนิด",
    "อยู่กับตัวเองแบบเป็นมิตร",
  ],
  ความหวัง: [
    "มีทางเสมอ แม้ยังไม่เห็นทั้งหมด",
    "ความหวังคือเชื้อไฟของวันพรุ่งนี้",
    "เริ่มจากก้าวที่ทำได้",
  ],
  ความเบื่อ: [
    "เบื่อคือสัญญาณว่าเราต้องการความหมาย",
    "ลองเปลี่ยนจังหวะเล็ก ๆ",
    "พักให้พอแล้วค่อยไปต่อ",
  ],
  ความโล่งใจ: [
    "ปล่อยวางแล้วพื้นที่จะกลับมา",
    "เบาลงแล้วดีขึ้นจริง ๆ",
    "วันนี้ผ่านไปได้แล้ว",
  ],
  "อารมณ์ผสมและซับซ้อน": [
    "ใจมีได้หลายอย่างพร้อมกัน",
    "ไม่ต้องเลือกข้าง—แค่รับรู้",
    "ซับซ้อนคือความเป็นมนุษย์",
  ],
};

const SEEDS = [
  // Each seed makes multiple variants via intensity/texture modifiers
  { category: "ความสุข", name: "ดีใจ", desc: "รู้สึกเป็นสุขและเบิกบาน", energy: 70, valence: 80, arousal: 55, emoji: "😄" },
  { category: "ความสุข", name: "ปลื้มใจ", desc: "อบอุ่นและพึงพอใจในสิ่งที่เกิดขึ้น", energy: 55, valence: 75, arousal: 35, emoji: "😊" },
  { category: "ความสุข", name: "สนุก", desc: "มีความเพลิดเพลินและอยากทำต่อ", energy: 75, valence: 70, arousal: 65, emoji: "😆" },
  { category: "ความสุข", name: "ขำ", desc: "หัวเราะกับเรื่องเล็ก ๆ อย่างเป็นธรรมชาติ", energy: 60, valence: 65, arousal: 55, emoji: "😂" },

  { category: "ความรัก", name: "รัก", desc: "รู้สึกผูกพันและห่วงใย", energy: 55, valence: 75, arousal: 40, emoji: "💗" },
  { category: "ความรัก", name: "เอ็นดู", desc: "อยากปกป้องและดูแลอย่างอ่อนโยน", energy: 45, valence: 70, arousal: 35, emoji: "🥰" },
  { category: "ความรัก", name: "คิดถึงแบบอบอุ่น", desc: "นึกถึงใครบางคนด้วยความสบายใจ", energy: 40, valence: 55, arousal: 25, emoji: "🫶" },
  { category: "ความรัก", name: "หลงใหล", desc: "ดึงดูดแรงและอยากอยู่ใกล้", energy: 75, valence: 70, arousal: 75, emoji: "😍" },

  { category: "ความเศร้า", name: "เศร้า", desc: "รู้สึกหดหู่และใจหนัก", energy: 25, valence: -65, arousal: 25, emoji: "😢" },
  { category: "ความเศร้า", name: "เสียใจ", desc: "รู้สึกเจ็บปวดจากการสูญเสีย/ผิดหวัง", energy: 30, valence: -75, arousal: 35, emoji: "😭" },
  { category: "ความเศร้า", name: "เหงา", desc: "รู้สึกขาดการเชื่อมต่อกับคนอื่น", energy: 25, valence: -55, arousal: 30, emoji: "🥀" },
  { category: "ความเศร้า", name: "ห่อเหี่ยว", desc: "พลังใจลดลง ไม่ค่อยอยากทำอะไร", energy: 15, valence: -45, arousal: 15, emoji: "😔" },

  { category: "ความโกรธ", name: "โกรธ", desc: "ไม่พอใจและอยากตอบโต้", energy: 70, valence: -60, arousal: 75, emoji: "😠" },
  { category: "ความโกรธ", name: "ฉุนเฉียว", desc: "หงุดหงิดง่าย อารมณ์ขึ้นเร็ว", energy: 60, valence: -45, arousal: 70, emoji: "😤" },
  { category: "ความโกรธ", name: "ไม่พอใจ", desc: "ติดใจและรู้สึกว่ามีบางอย่างไม่ถูกต้อง", energy: 45, valence: -35, arousal: 45, emoji: "😑" },
  { category: "ความโกรธ", name: "เดือด", desc: "ความโกรธแรงจนรู้สึกร้อนวูบวาบ", energy: 85, valence: -70, arousal: 85, emoji: "🔥" },

  { category: "ความกลัว", name: "กลัว", desc: "กังวลต่อภัยคุกคามหรือสิ่งไม่แน่นอน", energy: 55, valence: -60, arousal: 75, emoji: "😨" },
  { category: "ความกลัว", name: "หวาดผวา", desc: "กลัวมากจนร่างกายตอบสนองชัดเจน", energy: 75, valence: -80, arousal: 90, emoji: "😱" },
  { category: "ความกลัว", name: "ระแวง", desc: "ไม่มั่นใจและคอยจับสังเกต", energy: 45, valence: -50, arousal: 55, emoji: "👀" },
  { category: "ความกลัว", name: "ตื่นตระหนก", desc: "กลัวจนควบคุมสติยาก", energy: 85, valence: -85, arousal: 95, emoji: "🫨" },

  { category: "ความกังวล", name: "กังวล", desc: "คิดวนถึงความเสี่ยง/ผลลัพธ์", energy: 45, valence: -35, arousal: 55, emoji: "😟" },
  { category: "ความกังวล", name: "เครียด", desc: "รู้สึกกดดันและตึงตัว", energy: 55, valence: -45, arousal: 70, emoji: "😣" },
  { category: "ความกังวล", name: "กระวนกระวาย", desc: "อยู่ไม่สุข อยากขยับ/ทำอะไรสักอย่าง", energy: 60, valence: -35, arousal: 80, emoji: "😬" },
  { category: "ความกังวล", name: "ลังเล", desc: "ตัดสินใจไม่ลง กลัวเลือกผิด", energy: 35, valence: -20, arousal: 40, emoji: "🤔" },

  { category: "ความสงบ", name: "สงบ", desc: "ผ่อนคลายและใจนิ่ง", energy: 30, valence: 30, arousal: 15, emoji: "😌" },
  { category: "ความสงบ", name: "สบายใจ", desc: "ปลอดภัยและผ่อนคลาย", energy: 35, valence: 40, arousal: 20, emoji: "🌿" },
  { category: "ความสงบ", name: "มั่นคง", desc: "รู้สึกยืนอยู่บนพื้นได้ ไม่ไหวไปตามอารมณ์", energy: 40, valence: 35, arousal: 25, emoji: "🪨" },
  { category: "ความสงบ", name: "ปล่อยวาง", desc: "ยอมรับและคลายการยึดติด", energy: 25, valence: 45, arousal: 10, emoji: "🍃" },

  { category: "ความตื่นเต้น", name: "ตื่นเต้น", desc: "คึกคักและอยากเริ่ม", energy: 80, valence: 65, arousal: 85, emoji: "🤩" },
  { category: "ความตื่นเต้น", name: "คึกคะนอง", desc: "พลังล้นและซุกซน", energy: 85, valence: 55, arousal: 90, emoji: "😜" },
  { category: "ความตื่นเต้น", name: "ลุ้น", desc: "ตื่นตัวรอผลลัพธ์", energy: 70, valence: 25, arousal: 85, emoji: "🎯" },
  { category: "ความตื่นเต้น", name: "ท้าทาย", desc: "อยากลองของยากและพิสูจน์ตัวเอง", energy: 75, valence: 45, arousal: 70, emoji: "⚡" },

  { category: "ความอาย", name: "อาย", desc: "อยากหลบสายตา รู้สึกเขิน", energy: 35, valence: -10, arousal: 55, emoji: "😳" },
  { category: "ความอาย", name: "เขิน", desc: "อายแบบน่ารัก ๆ เมื่อถูกสนใจ", energy: 30, valence: 10, arousal: 50, emoji: "🫣" },
  { category: "ความอาย", name: "ประหม่า", desc: "ตื่น ๆ เกร็ง ๆ ในสถานการณ์ใหม่", energy: 45, valence: -15, arousal: 70, emoji: "😅" },
  { category: "ความอาย", name: "อับอาย", desc: "อายหนักจากการถูกตำหนิ/เสียหน้า", energy: 50, valence: -55, arousal: 75, emoji: "🫠" },

  { category: "ความผิดหวัง", name: "ผิดหวัง", desc: "ผลลัพธ์ไม่เป็นอย่างที่หวัง", energy: 35, valence: -55, arousal: 35, emoji: "😞" },
  { category: "ความผิดหวัง", name: "ท้อ", desc: "อยากหยุดเพราะเหนื่อยใจ", energy: 20, valence: -45, arousal: 25, emoji: "🥲" },
  { category: "ความผิดหวัง", name: "หมดหวังชั่วคราว", desc: "รู้สึกว่าทางเลือกน้อยลงมาก", energy: 15, valence: -70, arousal: 20, emoji: "🌧️" },
  { category: "ความผิดหวัง", name: "เจ็บใจ", desc: "ผิดหวังปนโกรธและเสียดาย", energy: 55, valence: -55, arousal: 60, emoji: "💢" },

  { category: "ความคิดถึง", name: "คิดถึง", desc: "อยากพบ/กลับไปเชื่อมต่อกับสิ่งสำคัญ", energy: 35, valence: 10, arousal: 35, emoji: "🥺" },
  { category: "ความคิดถึง", name: "โหยหา", desc: "คิดถึงแบบแรงจนรู้สึกว่าง", energy: 45, valence: -15, arousal: 55, emoji: "🕯️" },
  { category: "ความคิดถึง", name: "นึกถึงวันเก่า", desc: "ใจย้อนกลับไปที่ความทรงจำ", energy: 30, valence: 15, arousal: 25, emoji: "📼" },
  { category: "ความคิดถึง", name: "อบอุ่นปนเหงา", desc: "คิดถึงแบบทั้งดีและเจ็บนิด ๆ", energy: 30, valence: -5, arousal: 30, emoji: "🫧" },

  { category: "ความสับสน", name: "สับสน", desc: "ข้อมูลเยอะจนจับทิศทางยาก", energy: 40, valence: -20, arousal: 55, emoji: "😵‍💫" },
  { category: "ความสับสน", name: "งง", desc: "ไม่เข้าใจสิ่งที่เกิดขึ้น", energy: 35, valence: -10, arousal: 45, emoji: "❓" },
  { category: "ความสับสน", name: "ลังเลใจ", desc: "ใจแบ่งเป็นสองฝั่ง", energy: 35, valence: -5, arousal: 40, emoji: "🧭" },
  { category: "ความสับสน", name: "คิดไม่ตก", desc: "ติดอยู่กับคำถามเดิม ๆ", energy: 45, valence: -25, arousal: 65, emoji: "🌀" },

  { category: "ความภาคภูมิใจ", name: "ภูมิใจ", desc: "เห็นคุณค่าในความพยายาม/ผลลัพธ์", energy: 55, valence: 65, arousal: 40, emoji: "🏆" },
  { category: "ความภาคภูมิใจ", name: "มั่นใจ", desc: "เชื่อว่าทำได้และพร้อมลงมือ", energy: 65, valence: 55, arousal: 55, emoji: "💪" },
  { category: "ความภาคภูมิใจ", name: "ยินดีกับตัวเอง", desc: "ชื่นชมตัวเองอย่างจริงใจ", energy: 45, valence: 60, arousal: 30, emoji: "🌟" },
  { category: "ความภาคภูมิใจ", name: "สง่างาม", desc: "นิ่งแต่ทรงพลัง รู้จักคุณค่าตัวเอง", energy: 45, valence: 50, arousal: 25, emoji: "🦚" },

  { category: "ความอิจฉา", name: "อิจฉา", desc: "อยากได้สิ่งที่คนอื่นมี", energy: 50, valence: -25, arousal: 55, emoji: "😒" },
  { category: "ความอิจฉา", name: "น้อยใจ", desc: "รู้สึกว่าตัวเองไม่ได้รับการใส่ใจ", energy: 35, valence: -35, arousal: 40, emoji: "🥺" },
  { category: "ความอิจฉา", name: "เปรียบเทียบ", desc: "ใจเผลอวัดค่าตัวเองกับคนอื่น", energy: 45, valence: -20, arousal: 50, emoji: "📏" },
  { category: "ความอิจฉา", name: "หมั่นไส้", desc: "ไม่ชอบใจแบบกึ่งขำกึ่งหงุดหงิด", energy: 55, valence: -25, arousal: 55, emoji: "😏" },

  { category: "ความขอบคุณ", name: "ขอบคุณ", desc: "เห็นคุณค่าและรู้สึกซาบซึ้ง", energy: 35, valence: 60, arousal: 20, emoji: "🙏" },
  { category: "ความขอบคุณ", name: "ซาบซึ้ง", desc: "อิ่มเอมและอบอุ่นลึก ๆ", energy: 30, valence: 70, arousal: 15, emoji: "🥹" },
  { category: "ความขอบคุณ", name: "ปลาบปลื้ม", desc: "ซึ้งใจจนมีน้ำตา", energy: 35, valence: 75, arousal: 25, emoji: "💛" },
  { category: "ความขอบคุณ", name: "ยกย่อง", desc: "ชื่นชมผู้อื่น/โลกอย่างจริงใจ", energy: 40, valence: 55, arousal: 25, emoji: "🙌" },

  { category: "ความโดดเดี่ยว", name: "โดดเดี่ยว", desc: "เหมือนอยู่คนเดียวแม้มีคนรอบตัว", energy: 20, valence: -55, arousal: 25, emoji: "🌙" },
  { category: "ความโดดเดี่ยว", name: "ตัดขาด", desc: "รู้สึกแยกจากผู้คน/โลก", energy: 15, valence: -60, arousal: 20, emoji: "🕳️" },
  { category: "ความโดดเดี่ยว", name: "ห่างเหิน", desc: "ระยะห่างทางใจเพิ่มขึ้น", energy: 20, valence: -40, arousal: 20, emoji: "🧊" },
  { category: "ความโดดเดี่ยว", name: "ว่างเปล่า", desc: "เหมือนขาดความหมายหรือความรู้สึก", energy: 10, valence: -50, arousal: 10, emoji: "🫥" },

  { category: "ความหวัง", name: "หวัง", desc: "เชื่อว่าสิ่งดี ๆ ยังเป็นไปได้", energy: 45, valence: 45, arousal: 35, emoji: "✨" },
  { category: "ความหวัง", name: "มีกำลังใจ", desc: "พร้อมจะลองอีกครั้ง", energy: 55, valence: 50, arousal: 45, emoji: "🌈" },
  { category: "ความหวัง", name: "มองโลกในแง่ดี", desc: "ตีความสิ่งต่าง ๆ ไปทางสร้างสรรค์", energy: 50, valence: 55, arousal: 35, emoji: "☀️" },
  { category: "ความหวัง", name: "ฮึบ", desc: "ใจฮึดขึ้นมาสู้ต่อ", energy: 65, valence: 40, arousal: 60, emoji: "🚀" },

  { category: "ความเบื่อ", name: "เบื่อ", desc: "ขาดความสนใจและแรงจูงใจ", energy: 20, valence: -10, arousal: 15, emoji: "🥱" },
  { category: "ความเบื่อ", name: "จำเจ", desc: "ทุกอย่างเหมือนเดิมจนใจล้า", energy: 18, valence: -15, arousal: 12, emoji: "🧱" },
  { category: "ความเบื่อ", name: "หมดไฟ", desc: "พลังใจร่อยหรอ ไม่อยากเริ่ม", energy: 10, valence: -25, arousal: 10, emoji: "🕯️" },
  { category: "ความเบื่อ", name: "เฉยชา", desc: "รู้สึกช้า ๆ ไม่มีอารมณ์ร่วม", energy: 12, valence: -10, arousal: 8, emoji: "😶" },

  { category: "ความโล่งใจ", name: "โล่งใจ", desc: "ความกดดันลดลงทันที", energy: 30, valence: 55, arousal: 20, emoji: "😮‍💨" },
  { category: "ความโล่งใจ", name: "สบายใจขึ้น", desc: "เหมือนยกของหนักลงจากอก", energy: 35, valence: 45, arousal: 25, emoji: "🫧" },
  { category: "ความโล่งใจ", name: "ผ่านพ้น", desc: "รู้สึกว่ารอดแล้ว", energy: 40, valence: 40, arousal: 35, emoji: "✅" },
  { category: "ความโล่งใจ", name: "ปลอดภัย", desc: "รู้สึกไม่ถูกคุกคามและวางใจได้", energy: 35, valence: 50, arousal: 15, emoji: "🛟" },

  // Mixed/complex seeds (more nuanced)
  { category: "อารมณ์ผสมและซับซ้อน", name: "ขมหวาน", desc: "สุขกับบางอย่างแต่เจ็บลึก ๆ ในเวลาเดียวกัน", energy: 45, valence: 10, arousal: 40, emoji: "🍯" },
  { category: "อารมณ์ผสมและซับซ้อน", name: "ตื้นตันปนหนักใจ", desc: "ซึ้งใจแต่มีความกังวลซ่อนอยู่", energy: 40, valence: 15, arousal: 45, emoji: "🎐" },
  { category: "อารมณ์ผสมและซับซ้อน", name: "โล่งใจปนหวั่น", desc: "ดีขึ้นแล้วแต่ยังไม่ไว้ใจเต็มที่", energy: 45, valence: 15, arousal: 55, emoji: "🫧" },
  { category: "อารมณ์ผสมและซับซ้อน", name: "สงบแต่โดดเดี่ยว", desc: "นิ่งขึ้นแต่ยังรู้สึกห่างจากผู้คน", energy: 25, valence: -10, arousal: 15, emoji: "🌙" },
];

const INTENSITY_MODS = [
  { name: "เล็กน้อย", d: "เบา ๆ ยังพอไหว", e: -15, v: 0, a: -10, w: 0.9 },
  { name: "พอดี ๆ", d: "ระดับกำลังดี รับรู้ชัดเจน", e: 0, v: 0, a: 0, w: 1.0 },
  { name: "ชัดเจน", d: "เด่นชัดจนสังเกตตัวเองได้", e: 10, v: 0, a: 10, w: 0.95 },
  { name: "เข้มข้น", d: "แรงจนมีผลต่อการตัดสินใจ", e: 20, v: 0, a: 20, w: 0.85 },
];

const TEXTURE_MODS = [
  { name: "เงียบ ๆ", extra: "ออกมาแบบเงียบ ๆ ในใจ", e: -5, a: -10, w: 1.0 },
  { name: "วูบวาบ", extra: "มาเป็นระลอก วูบวาบ", e: 8, a: 15, w: 0.95 },
  { name: "ยืดเยื้อ", extra: "ค้างอยู่นานกว่าปกติ", e: -8, a: -5, w: 0.9 },
  { name: "ปนความคิด", extra: "มีความคิดวนร่วมด้วย", e: 0, a: 10, w: 0.9 },
  { name: "ปนกายภาพ", extra: "รู้สึกได้ทางร่างกายด้วย", e: 6, a: 12, w: 0.9 },
];

const SPECIALTY_MOODS = [
  // Weird / niche / specific emotions (Thai-friendly names)
  { name: "ฟุ้งซ่าน", category: "ความกังวล", description: "ใจลอย คิดกระโดดไปมา", energy: 45, valence: -15, arousal: 65, color: "#fbbf24", emoji: "🫧", weight: 0.95 },
  { name: "ใจแป้ว", category: "ความผิดหวัง", description: "ความหวังหล่นหายทันที", energy: 25, valence: -50, arousal: 30, color: "#94a3b8", emoji: "🫤", weight: 0.9 },
  { name: "อิ่มเอม", category: "ความสุข", description: "อุ่น ๆ แน่น ๆ แบบสุขใจ", energy: 40, valence: 70, arousal: 20, color: "#34d399", emoji: "🥰", weight: 0.95 },
  { name: "สับสนเชิงบวก", category: "อารมณ์ผสมและซับซ้อน", description: "งงแต่ตื่นเต้นเหมือนได้เรียนรู้อะไรใหม่", energy: 60, valence: 25, arousal: 70, color: "#7c3aed", emoji: "🧠", weight: 0.85 },
  { name: "เคร่งขรึม", category: "ความสงบ", description: "นิ่ง สุขุม จริงจัง", energy: 35, valence: 10, arousal: 20, color: "#22d3ee", emoji: "🧘", weight: 0.9 },
  { name: "ระทึก", category: "ความตื่นเต้น", description: "ลุ้นแบบหัวใจเต้นแรง", energy: 75, valence: 15, arousal: 90, color: "#f472b6", emoji: "🫀", weight: 0.9 },
  { name: "สะเทือนใจ", category: "ความเศร้า", description: "เศร้าปนซึ้งจนใจสั่น", energy: 35, valence: -45, arousal: 45, color: "#60a5fa", emoji: "🫧", weight: 0.85 },
  { name: "ใจฟู", category: "ความรัก", description: "อุ่นใจจนเหมือนพองฟู", energy: 45, valence: 70, arousal: 30, color: "#fb7185", emoji: "🫶", weight: 1.0 },
  { name: "หวั่นไหว", category: "ความรัก", description: "ใจสั่นกับความหมายบางอย่าง", energy: 55, valence: 35, arousal: 65, color: "#fb7185", emoji: "💓", weight: 0.9 },
  { name: "ประหลาดใจ", category: "ความตื่นเต้น", description: "เจอสิ่งที่ไม่คาดคิด", energy: 60, valence: 25, arousal: 75, color: "#f472b6", emoji: "😮", weight: 0.95 },
  { name: "หวิว ๆ", category: "อารมณ์ผสมและซับซ้อน", description: "ว่าง ๆ เบา ๆ แต่ก็หน่วง", energy: 25, valence: -10, arousal: 30, color: "#7c3aed", emoji: "🌫️", weight: 0.9 },
  { name: "น้อยอกน้อยใจ", category: "ความอิจฉา", description: "รู้สึกไม่ถูกเห็นคุณค่า", energy: 35, valence: -40, arousal: 35, color: "#10b981", emoji: "🥺", weight: 0.9 },
  { name: "เข็ดหลาบ", category: "ความกลัว", description: "กลัวซ้ำเพราะเคยเจ็บมาแล้ว", energy: 45, valence: -45, arousal: 55, color: "#a78bfa", emoji: "🧊", weight: 0.85 },
  { name: "ระอา", category: "ความเบื่อ", description: "เบื่อจนเริ่มรำคาญ", energy: 30, valence: -25, arousal: 35, color: "#a1a1aa", emoji: "🙄", weight: 0.9 },
  { name: "ใจหาย", category: "ความกลัว", description: "ตกใจวูบเหมือนหัวใจหล่น", energy: 65, valence: -40, arousal: 85, color: "#a78bfa", emoji: "🫨", weight: 0.9 },
  { name: "รู้สึกผิด", category: "ความผิดหวัง", description: "โทษตัวเองกับสิ่งที่ทำ/ไม่ได้ทำ", energy: 30, valence: -55, arousal: 40, color: "#94a3b8", emoji: "😔", weight: 0.9 },
  { name: "ละอายใจ", category: "ความอาย", description: "อายเพราะรู้ว่าทำไม่เหมาะสม", energy: 35, valence: -50, arousal: 55, color: "#fda4af", emoji: "🫣", weight: 0.85 },
  { name: "หงุดหงิด", category: "ความโกรธ", description: "ระคายเคืองเพราะอะไรไม่เป็นใจ", energy: 50, valence: -35, arousal: 60, color: "#f97316", emoji: "😤", weight: 1.0 },
  { name: "ตัดพ้อ", category: "ความเศร้า", description: "น้อยใจปนเศร้า อยากให้เข้าใจ", energy: 30, valence: -45, arousal: 35, color: "#60a5fa", emoji: "🥺", weight: 0.85 },
  { name: "สำนึก", category: "ความขอบคุณ", description: "รับรู้คุณค่าบางอย่างอย่างลึกซึ้ง", energy: 30, valence: 50, arousal: 20, color: "#f59e0b", emoji: "🕯️", weight: 0.85 },
  { name: "ตื้นตัน", category: "ความขอบคุณ", description: "รู้สึกซึ้งจนเกือบน้ำตาไหล", energy: 35, valence: 70, arousal: 25, color: "#f59e0b", emoji: "🥹", weight: 0.95 },
  { name: "โอเคแบบหมดแรง", category: "ความโล่งใจ", description: "โล่งใจแต่ยังเหนื่อย", energy: 20, valence: 35, arousal: 20, color: "#2dd4bf", emoji: "😮‍💨", weight: 0.85 },
  { name: "สงสัย", category: "ความสับสน", description: "อยากรู้คำตอบและค้นหาเหตุผล", energy: 45, valence: 10, arousal: 50, color: "#c084fc", emoji: "🧐", weight: 0.95 },
];

function buildMoods() {
  const moods = [];
  const seen = new Set();

  const add = (m) => {
    const key = `${m.name}__${m.category}`;
    if (seen.has(key)) return;
    seen.add(key);
    moods.push(m);
  };

  // Generate variants from seeds × intensity × texture
  for (const s of SEEDS) {
    const theme = CATEGORY_THEME[s.category] ?? { color: "#7c3aed", emoji: "🙂" };
    for (const inten of INTENSITY_MODS) {
      for (const tex of TEXTURE_MODS) {
        const name = `${s.name} (${inten.name} • ${tex.name})`;
        const description = `${s.desc} ${inten.d} ${tex.extra}`.trim();

        const energy = clamp(Math.round(s.energy + inten.e + tex.e), 0, 100);
        const valence = clamp(Math.round(s.valence + inten.v), -100, 100);
        const arousal = clamp(Math.round(s.arousal + inten.a + tex.a), 0, 100);

        // Slightly vary color per variant (deterministic)
        const rnd = mulberry32(hash32(name));
        const hueShift = Math.round((rnd() - 0.5) * 18); // -9..+9
        const color = shiftHue(theme.color, hueShift);
        const emoji = s.emoji || theme.emoji;

        // Weight: mildly prefer moderate intensity; avoid over-favoring extremes
        const baseW = 1.0 * inten.w * tex.w;
        const w = clamp(baseW, 0.55, 1.15);

        add({
          name,
          category: s.category,
          description,
          energy,
          valence,
          arousal,
          color,
          emoji,
          weight: w,
        });
      }
    }
  }

  // Add specialty moods (as-is)
  for (const m of SPECIALTY_MOODS) add(m);

  // Ensure we cover categories listed: add some extra handcrafted, category-specific items
  const extra = buildExtraHandcrafted();
  for (const m of extra) add(m);

  // Sort by category order then name for deterministic search UI
  const orderIndex = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  moods.sort((a, b) => {
    const oa = orderIndex.has(a.category) ? orderIndex.get(a.category) : 999;
    const ob = orderIndex.has(b.category) ? orderIndex.get(b.category) : 999;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name, "th");
  });

  // Keep it "a lot, but still easy to use": cap to ~200–300 while preserving diversity.
  return capMoodsRoundRobin(moods, 280, orderIndex);
}

function capMoodsRoundRobin(sortedMoods, limit, orderIndex) {
  if (sortedMoods.length <= limit) return sortedMoods;

  const groups = new Map();
  for (const m of sortedMoods) {
    const cat = m.category || "อื่น ๆ";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(m);
  }

  const cats = Array.from(groups.keys()).sort((a, b) => {
    const oa = orderIndex.has(a) ? orderIndex.get(a) : 999;
    const ob = orderIndex.has(b) ? orderIndex.get(b) : 999;
    if (oa !== ob) return oa - ob;
    return a.localeCompare(b, "th");
  });

  // Deterministic variety within each category: take evenly spread items
  const pointers = new Map();
  for (const c of cats) pointers.set(c, 0);

  const picked = [];
  const pickedKeys = new Set();
  while (picked.length < limit) {
    let progressed = false;
    for (const c of cats) {
      if (picked.length >= limit) break;
      const arr = groups.get(c);
      const i = pointers.get(c) ?? 0;
      if (!arr || i >= arr.length) continue;

      // Jump with a step so we don't only take the first alphabetical variants
      const step = Math.max(1, Math.floor(arr.length / 18));
      const idx = (i * step) % arr.length;
      pointers.set(c, i + 1);

      const m = arr[idx];
      const key = moodKey(m);
      if (pickedKeys.has(key)) continue;
      pickedKeys.add(key);
      picked.push(m);
      progressed = true;
    }
    if (!progressed) break;
  }

  // If still short (rare), fill from start
  if (picked.length < limit) {
    for (const m of sortedMoods) {
      if (picked.length >= limit) break;
      const key = moodKey(m);
      if (pickedKeys.has(key)) continue;
      pickedKeys.add(key);
      picked.push(m);
    }
  }

  // Keep category order
  picked.sort((a, b) => {
    const oa = orderIndex.has(a.category) ? orderIndex.get(a.category) : 999;
    const ob = orderIndex.has(b.category) ? orderIndex.get(b.category) : 999;
    if (oa !== ob) return oa - ob;
    return a.name.localeCompare(b.name, "th");
  });
  return picked;
}

function buildExtraHandcrafted() {
  const theme = (cat) => CATEGORY_THEME[cat] ?? { color: "#7c3aed", emoji: "🙂" };
  const mk = (name, category, description, energy, valence, arousal, emoji, weight = 0.95) => ({
    name,
    category,
    description,
    energy,
    valence,
    arousal,
    color: theme(category).color,
    emoji: emoji || theme(category).emoji,
    weight,
  });

  return [
    mk("ขำกลบเกลื่อน", "อารมณ์ผสมและซับซ้อน", "หัวเราะเพื่อปกป้องตัวเองจากความอึดอัด", 45, 5, 55, "🙂", 0.8),
    mk("ยิ้มเจื่อน", "อารมณ์ผสมและซับซ้อน", "ยิ้มทั้งที่ใจไม่ไปด้วย", 25, -10, 30, "😬", 0.85),
    mk("คาดหวัง", "ความหวัง", "คาดหวังผลลัพธ์แบบมีภาพในใจ", 45, 25, 45, "🔭", 0.9),
    mk("ปลอดโปร่ง", "ความสงบ", "หัวโล่ง ใจโปร่ง", 35, 40, 15, "🌤️", 0.95),
    mk("เหนื่อยใจ", "ความเศร้า", "เหนื่อยแบบอธิบายไม่หมด", 15, -35, 20, "😮‍💨", 0.95),
    mk("ใจร้อน", "ความโกรธ", "หงุดหงิดจนอยากให้จบเร็ว ๆ", 65, -35, 75, "🥵", 0.9),
    mk("หวั่น ๆ", "ความกังวล", "กังวลเบา ๆ เหมือนมีอะไรค้าง", 35, -15, 45, "🫧", 1.0),
    mk("กล้าหาญเงียบ ๆ", "ความหวัง", "กล้าที่จะทำ แม้ไม่ดัง", 55, 35, 40, "🛡️", 0.85),
    mk("อุ่นใจ", "ความรัก", "รู้สึกได้รับการดูแลและยอมรับ", 40, 65, 25, "🫶", 1.0),
    mk("ตื่นรู้", "ความสงบ", "รู้สึกชัดเจนและอยู่กับปัจจุบัน", 45, 45, 35, "🧘", 0.85),
    mk("หมั่นใจในวันนี้", "ความภาคภูมิใจ", "มั่นใจแบบพอดี ๆ กับสิ่งที่ทำได้", 55, 50, 45, "✅", 0.9),
    mk("เสียดาย", "ความเศร้า", "อยากให้เรื่องนั้นเป็นอีกแบบ", 30, -35, 35, "🫧", 0.95),
    mk("เกรงใจ", "ความอาย", "ไม่อยากรบกวน/ทำให้ลำบาก", 30, -5, 40, "🙇", 0.95),
    mk("เขินปนดีใจ", "อารมณ์ผสมและซับซ้อน", "เขินแต่ก็สุขใจ", 45, 35, 55, "😳", 0.9),
    mk("กังวลปนหวัง", "อารมณ์ผสมและซับซ้อน", "ใจสู้ แต่ยังห่วง", 50, 5, 65, "🫨", 0.9),
    mk("โกรธแต่รักอยู่", "อารมณ์ผสมและซับซ้อน", "ไม่พอใจแต่ยังห่วงใย", 60, -5, 65, "💗", 0.85),
    mk("เศร้าแบบสงบ", "อารมณ์ผสมและซับซ้อน", "เศร้าแต่ไม่แตกสลาย", 20, -35, 15, "🌧️", 0.9),
  ];
}

// Basic hue shift using HSL conversion (small shifts only)
function shiftHue(hex, deg) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  hsl.h = (hsl.h + deg + 360) % 360;
  const out = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgbToHex(out.r, out.g, out.b);
}

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r, g, b) {
  const to = (n) => n.toString(16).padStart(2, "0");
  return `#${to(clamp(Math.round(r), 0, 255))}${to(clamp(Math.round(g), 0, 255))}${to(clamp(Math.round(b), 0, 255))}`;
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}
function hslToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rp = 0, gp = 0, bp = 0;
  if (0 <= h && h < 60) [rp, gp, bp] = [c, x, 0];
  else if (60 <= h && h < 120) [rp, gp, bp] = [x, c, 0];
  else if (120 <= h && h < 180) [rp, gp, bp] = [0, c, x];
  else if (180 <= h && h < 240) [rp, gp, bp] = [0, x, c];
  else if (240 <= h && h < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];
  return { r: (rp + m) * 255, g: (gp + m) * 255, b: (bp + m) * 255 };
}

const MOODS = buildMoods();

// ---------- Smart random: weighted + anti-repeat ----------

const STORAGE_KEYS = {
  favorites: "emo_favorites_v1",
  history: "emo_history_v1",
  rolls: "emo_roll_events_v1",
  diary: "emo_diary_v1",
  lang: "emo_lang_v1",
};

const state = {
  lastMoodKey: null,
  recentKeys: [], // newest first
  recentMax: 24,
  penalties: new Map(), // key -> penalty multiplier [0.1..1]
  favorites: loadJson(STORAGE_KEYS.favorites, []),
  history: loadJson(STORAGE_KEYS.history, []),
  rollEvents: loadJson(STORAGE_KEYS.rolls, []),
  diary: loadJson(STORAGE_KEYS.diary, []),
  lang: loadJson(STORAGE_KEYS.lang, "th"),
  current: null,
  rolling: false,
};

// ---------- i18n ----------

const I18N = {
  th: {
    "app.title": "สุ่มอารมณ์",
    "app.subtitle": "ละเอียด • ครอบคลุม • ไม่ซ้ำง่าย",
    "controls.title": "การควบคุม",
    "controls.mode": "โหมดสุ่ม",
    "controls.burstCount": "สุ่มต่อเนื่อง (ครั้ง)",
    "controls.search": "ค้นหาอารมณ์จากชื่อ",
    "mode.normal": "สุ่มแบบปกติ",
    "mode.noRepeatConsecutive": "ไม่ให้ซ้ำอารมณ์เดิมติดกัน",
    "mode.diverse": "เน้นความหลากหลาย (แนะนำ)",
    "actions.roll": "สุ่มอารมณ์",
    "actions.wheel": "วงล้อ",
    "actions.burst": "สุ่มต่อเนื่อง",
    "actions.reset": "รีเซ็ต",
    "actions.copy": "คัดลอก",
    "actions.save": "บันทึก",
    "actions.close": "ปิด",
    "actions.spin": "หมุนวงล้อ",
    "actions.diarySave": "บันทึก",
    "search.placeholder": "พิมพ์ชื่ออารมณ์ เช่น ดีใจ, กังวล, โดดเดี่ยว...",
    "search.resultsTitle": "ผลการค้นหา",
    "hint.tapToShow": "แตะเพื่อแสดง",
    "hint.tapToBack": "แตะเพื่อย้อนกลับ",
    "viewer.readyDesc": "กดปุ่ม “สุ่มอารมณ์” เพื่อเริ่มต้น",
    "favorites.title": "ที่บันทึกไว้",
    "favorites.subtitle": "เก็บในเครื่อง (local)",
    "history.title": "ประวัติล่าสุด",
    "stats.title": "สถิติส่วนตัว",
    "stats.subtitle": "7 วันล่าสุด",
    "stats.total": "สุ่มทั้งหมด",
    "stats.unique": "อารมณ์ไม่ซ้ำ",
    "stats.avgEnergy": "เฉลี่ยพลังงาน",
    "stats.avgValence": "เฉลี่ย Valence",
    "stats.avgArousal": "เฉลี่ย Arousal",
    "stats.trendTitle": "แนวโน้ม 7 วัน",
    "stats.trendHint": "จำนวนครั้ง + ค่าเฉลี่ย",
    "stats.topTitle": "อารมณ์ที่สุ่มบ่อยสุด",
    "stats.topHint": "Top 6",
    "diary.title": "ไดอารี่",
    "diary.subtitle": "บันทึกคู่กับอารมณ์",
    "diary.noteLabel": "โน้ต/เหตุการณ์ (ผูกกับอารมณ์ที่กำลังแสดง)",
    "diary.tagsLabel": "แท็ก (คั่นด้วย , )",
    "diary.tagsPlaceholder": "งาน, ครอบครัว, สุขภาพ...",
    "diary.listTitle": "รายการไดอารี่ล่าสุด",
    "diary.listHint": "แตะเพื่อดู/แก้ไข",
    "wheel.title": "วงล้อสุ่มอารมณ์",
    "wheel.hint": "วงล้อจะเลือก “หมวด” แล้วสุ่มอารมณ์ในหมวดนั้นให้อีกที",
    "footer.offline": "EMO ทำงานแบบออฟไลน์ 100% • ไม่ใช้ไลบรารีภายนอก",

    "toast.copied": "คัดลอกแล้ว",
    "toast.copyFail": "คัดลอกไม่สำเร็จ",
    "toast.nothingToCopy": "ยังไม่มีผลลัพธ์ให้คัดลอก",
    "toast.saved": "บันทึกแล้ว",
    "toast.unsaved": "ลบออกจากที่บันทึกแล้ว",
    "toast.removed": "ลบออกแล้ว",
    "toast.reset": "รีเซ็ตแล้ว",
    "toast.wheelCat": (cat) => `วงล้อได้หมวด: ${cat}`,
    "toast.burstDone": (n) => `สุ่มต่อเนื่องเสร็จแล้ว (${n} ครั้ง)`,
    "status.ready": "พร้อม",
    "status.search": "ค้นหา",

    "stats.legend.count": "Count",
    "stats.legend.energy": "Energy",
    "stats.legend.arousal": "Arousal",
    "stats.legend.valence": "Valence",

    "diary.noMood": "ยังไม่มีอารมณ์ให้ผูกไดอารี่",
    "diary.needInput": "ใส่โน้ตหรือแท็กอย่างน้อย 1 อย่าง",
    "diary.saved": "บันทึกไดอารี่แล้ว",
    "diary.edited": "แก้ไขแล้ว",
    "diary.deleted": "ลบแล้ว",
    "diary.editNote": "แก้โน้ต",
    "diary.editTags": "แก้แท็ก (คั่นด้วย , )",
    "diary.confirmDelete": "ลบไดอารี่รายการนี้?",
    "diary.none": "ยังไม่มีไดอารี่ ลองบันทึกโน้ตหลังสุ่ม",
    "stats.none": "ยังไม่มีสถิติ ลองสุ่มสักพัก",
    "history.none": "ยังไม่มีประวัติ ลองสุ่มดู",
    "favorites.none": "ยังไม่มีที่บันทึก กด “บันทึก” ตอนสุ่มได้อารมณ์ที่ชอบ",
    "search.none": "ไม่พบผลลัพธ์ ลองพิมพ์คำอื่น",
  },
  en: {
    "app.title": "Mood Randomizer",
    "app.subtitle": "Detailed • Broad • Less repetitive",
    "controls.title": "Controls",
    "controls.mode": "Mode",
    "controls.burstCount": "Burst (times)",
    "controls.search": "Search moods",
    "mode.normal": "Normal random",
    "mode.noRepeatConsecutive": "No consecutive repeats",
    "mode.diverse": "Diversity-focused (recommended)",
    "actions.roll": "Roll",
    "actions.wheel": "Wheel",
    "actions.burst": "Burst",
    "actions.reset": "Reset",
    "actions.copy": "Copy",
    "actions.save": "Save",
    "actions.close": "Close",
    "actions.spin": "Spin wheel",
    "actions.diarySave": "Save",
    "search.placeholder": "Type a mood name (Thai) or a category…",
    "search.resultsTitle": "Search results",
    "hint.tapToShow": "Tap to show",
    "hint.tapToBack": "Tap to revisit",
    "viewer.readyDesc": "Press “Roll” to start",
    "favorites.title": "Saved",
    "favorites.subtitle": "Stored locally",
    "history.title": "Recent history",
    "stats.title": "Your stats",
    "stats.subtitle": "Last 7 days",
    "stats.total": "Total rolls",
    "stats.unique": "Unique moods",
    "stats.avgEnergy": "Avg energy",
    "stats.avgValence": "Avg valence",
    "stats.avgArousal": "Avg arousal",
    "stats.trendTitle": "7-day trend",
    "stats.trendHint": "count + averages",
    "stats.topTitle": "Most rolled moods",
    "stats.topHint": "Top 6",
    "diary.title": "Diary",
    "diary.subtitle": "Save notes with a mood",
    "diary.noteLabel": "Note / event (attached to the current mood)",
    "diary.tagsLabel": "Tags (comma-separated)",
    "diary.tagsPlaceholder": "work, family, health…",
    "diary.listTitle": "Recent diary entries",
    "diary.listHint": "Tap to view/edit",
    "wheel.title": "Mood Wheel",
    "wheel.hint": "The wheel picks a category, then a mood within it",
    "footer.offline": "EMO is 100% offline • no external libraries",

    "toast.copied": "Copied",
    "toast.copyFail": "Copy failed",
    "toast.nothingToCopy": "Nothing to copy yet",
    "toast.saved": "Saved",
    "toast.unsaved": "Removed from saved",
    "toast.removed": "Removed",
    "toast.reset": "Reset",
    "toast.wheelCat": (cat) => `Wheel category: ${cat}`,
    "toast.burstDone": (n) => `Burst finished (${n})`,
    "status.ready": "Ready",
    "status.search": "Search",

    "stats.legend.count": "Count",
    "stats.legend.energy": "Energy",
    "stats.legend.arousal": "Arousal",
    "stats.legend.valence": "Valence",

    "diary.noMood": "No mood to attach yet",
    "diary.needInput": "Add a note or at least one tag",
    "diary.saved": "Diary saved",
    "diary.edited": "Updated",
    "diary.deleted": "Deleted",
    "diary.editNote": "Edit note",
    "diary.editTags": "Edit tags (comma-separated)",
    "diary.confirmDelete": "Delete this diary entry?",
    "diary.none": "No diary entries yet",
    "stats.none": "No stats yet — roll a bit",
    "history.none": "No history yet — try rolling",
    "favorites.none": "No saved moods yet",
    "search.none": "No results — try another query",
  },
};

const CATEGORY_LABELS = {
  en: {
    ความสุข: "Happiness",
    ความรัก: "Love",
    ความเศร้า: "Sadness",
    ความโกรธ: "Anger",
    ความกลัว: "Fear",
    ความกังวล: "Anxiety",
    ความสงบ: "Calm",
    ความตื่นเต้น: "Excitement",
    ความอาย: "Shame / Embarrassment",
    ความผิดหวัง: "Disappointment",
    ความคิดถึง: "Longing / Missing",
    ความสับสน: "Confusion",
    ความภาคภูมิใจ: "Pride",
    ความอิจฉา: "Envy",
    ความขอบคุณ: "Gratitude",
    ความโดดเดี่ยว: "Loneliness",
    ความหวัง: "Hope",
    ความเบื่อ: "Boredom",
    ความโล่งใจ: "Relief",
    "อารมณ์ผสมและซับซ้อน": "Mixed / Complex",
  },
};

function t(key, ...args) {
  const lang = state.lang === "en" ? "en" : "th";
  const entry = I18N[lang]?.[key];
  if (typeof entry === "function") return entry(...args);
  if (typeof entry === "string") return entry;
  const th = I18N.th?.[key];
  if (typeof th === "function") return th(...args);
  return typeof th === "string" ? th : key;
}

function categoryLabel(cat) {
  if (state.lang !== "en") return cat;
  return CATEGORY_LABELS.en?.[cat] ?? cat;
}

function applyI18nToDom() {
  document.documentElement.lang = state.lang === "en" ? "en" : "th";
  if (els.langLabel) els.langLabel.textContent = state.lang === "en" ? "EN" : "ไทย";

  for (const el of document.querySelectorAll("[data-i18n]")) {
    const key = el.getAttribute("data-i18n");
    if (!key) continue;
    el.textContent = t(key);
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) continue;
    el.setAttribute("placeholder", t(key));
  }

  if (state.current) els.moodCategory.textContent = categoryLabel(state.current.category);
  renderStats();
  renderDiary();
  updateSearchResults();
}

function toggleLanguage() {
  state.lang = state.lang === "en" ? "th" : "en";
  saveJson(STORAGE_KEYS.lang, state.lang);
  applyI18nToDom();
  toast(state.lang === "en" ? "Language: English" : "ภาษา: ไทย");
}

function moodKey(m) {
  return `${m.name}__${m.category}`;
}

function scoreFor(m, mode) {
  const key = moodKey(m);
  const baseW = typeof m.weight === "number" ? m.weight : 1.0;

  // Anti-repeat: hard stop for consecutive if enabled
  if (mode === "noRepeatConsecutive" && state.lastMoodKey && key === state.lastMoodKey) return 0;

  // Diversity mode: apply recency penalty smoothly
  let penalty = state.penalties.get(key) ?? 1.0;

  // Further reduce items seen in recent list (stronger)
  const idx = state.recentKeys.indexOf(key);
  if (idx >= 0) {
    const extra = 1 - clamp((state.recentMax - idx) / state.recentMax, 0.1, 1);
    // recent (idx small) => extra near 0, older => extra near 0.9
    const recencyMult = clamp(0.15 + extra, 0.15, 1.0);
    penalty *= recencyMult;
  }

  // Mildly prefer under-represented categories in recent history (diversity)
  if (mode === "diverse") {
    const catCount = countRecentCategory(m.category);
    const catMult = clamp(1.15 - catCount * 0.08, 0.65, 1.15);
    penalty *= catMult;
  }

  // Small jitter to avoid ties being too deterministic
  const jitter = 0.98 + Math.random() * 0.06;
  return Math.max(0, baseW * penalty * jitter);
}

function countRecentCategory(cat) {
  const top = state.recentKeys.slice(0, 14);
  let c = 0;
  for (const key of top) {
    const m = keyToMood(key);
    if (m && m.category === cat) c++;
  }
  return c;
}

const keyIndex = new Map(MOODS.map((m) => [moodKey(m), m]));
function keyToMood(key) {
  return keyIndex.get(key) || null;
}

function weightedPick(list, getW) {
  let total = 0;
  const weights = new Array(list.length);
  for (let i = 0; i < list.length; i++) {
    const w = getW(list[i]);
    weights[i] = w;
    total += w;
  }
  if (total <= 0) {
    // Fallback: uniform
    return list[Math.floor(Math.random() * list.length)];
  }
  let r = Math.random() * total;
  for (let i = 0; i < list.length; i++) {
    r -= weights[i];
    if (r <= 0) return list[i];
  }
  return list[list.length - 1];
}

function applyAfterPick(m) {
  const key = moodKey(m);
  state.lastMoodKey = key;
  state.recentKeys.unshift(key);
  state.recentKeys = state.recentKeys.slice(0, state.recentMax);

  // Update penalties:
  // - picked mood gets strong penalty (so it won't come back soon)
  // - others slowly recover back to 1
  for (const [k, p] of state.penalties) {
    const recovered = clamp(p + 0.035, 0.1, 1.0);
    state.penalties.set(k, recovered);
    if (recovered >= 0.999) state.penalties.delete(k);
  }
  state.penalties.set(key, 0.12);
}

function pickMood() {
  const mode = els.mode.value;
  const picked = weightedPick(MOODS, (m) => scoreFor(m, mode));
  applyAfterPick(picked);
  return picked;
}

function pickMoodFromCategory(category) {
  const mode = els.mode.value;
  const list = MOODS.filter((m) => m.category === category);
  const picked = weightedPick(list.length ? list : MOODS, (m) => scoreFor(m, mode));
  applyAfterPick(picked);
  return picked;
}

// ---------- UI rendering ----------

function pct(n, min, max) {
  const x = (n - min) / (max - min);
  return `${clamp(x * 100, 0, 100).toFixed(0)}%`;
}

function formatSigned(n) {
  const s = n > 0 ? "+" : "";
  return `${s}${n}`;
}

function showMood(m, { source = "สุ่ม", announce = true } = {}) {
  state.current = m;

  // Accent styling
  const c = m.color || (CATEGORY_THEME[m.category]?.color ?? "#7c3aed");
  document.documentElement.style.setProperty("--accent", c);
  const c2 = shiftHue(c, 18);
  document.documentElement.style.setProperty("--accent2", c2);

  els.moodEmoji.textContent = m.emoji || CATEGORY_THEME[m.category]?.emoji || "🙂";
  els.moodName.textContent = m.name;
  els.moodCategory.textContent = categoryLabel(m.category);
  els.moodDesc.textContent = m.description;
  els.colorDot.style.background = c;
  els.colorCode.textContent = c;

  els.valEnergy.textContent = `${m.energy}/100`;
  els.valValence.textContent = `${formatSigned(m.valence)} (ช่วง -100..+100)`;
  els.valArousal.textContent = `${m.arousal}/100`;

  // Bars
  els.barEnergy.style.width = pct(m.energy, 0, 100);
  els.barArousal.style.width = pct(m.arousal, 0, 100);
  if (m.valence < 0) {
    els.barValenceLeft.style.width = pct(Math.abs(m.valence), 0, 100);
    els.barValenceRight.style.width = "0%";
  } else {
    els.barValenceRight.style.width = pct(m.valence, 0, 100);
    els.barValenceLeft.style.width = "0%";
  }

  // Tagline
  els.moodTagline.textContent = pickTagline(m.category, m);

  // Status + save button state
  const timeLocale = state.lang === "en" ? "en-US" : "th-TH";
  els.statusText.textContent = `${source} • ${new Date().toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" })}`;
  syncSaveButton();

  if (announce) {
    recordRollEvent(m, source);
    pushHistory(m);
    renderHistory();
    renderStats();
  }
}

function pickTagline(category, m) {
  const list = TAGLINES_BY_CATEGORY[category] ?? TAGLINES_BY_CATEGORY["อารมณ์ผสมและซับซ้อน"];
  const seed = hash32(`${m.name}|${m.category}|${m.energy}|${m.valence}|${m.arousal}`);
  const rnd = mulberry32(seed);
  const base = list[Math.floor(rnd() * list.length)];

  // Add a tiny contextual hint
  const hint = buildHint(m);
  return hint ? `${base} · ${hint}` : base;
}

function buildHint(m) {
  const parts = [];
  if (m.energy >= 75) parts.push(state.lang === "en" ? "High energy" : "พลังสูง");
  else if (m.energy <= 20) parts.push(state.lang === "en" ? "Low energy" : "พลังต่ำ");

  if (m.valence >= 55) parts.push(state.lang === "en" ? "Positive" : "โทนบวก");
  else if (m.valence <= -55) parts.push(state.lang === "en" ? "Negative" : "โทนลบ");
  else parts.push(state.lang === "en" ? "Neutral" : "โทนกลาง");

  if (m.arousal >= 75) parts.push(state.lang === "en" ? "Aroused" : "ตื่นตัว");
  else if (m.arousal <= 20) parts.push(state.lang === "en" ? "Calm" : "สงบ");

  // Keep short
  return parts.slice(0, 2).join(" • ");
}

function toast(msg) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => els.toast.classList.remove("show"), 1500);
}

function animateRoll() {
  els.viewer.classList.remove("rolling");
  // force reflow
  void els.viewer.offsetWidth;
  els.viewer.classList.add("rolling");
  window.clearTimeout(animateRoll._t);
  animateRoll._t = window.setTimeout(() => els.viewer.classList.remove("rolling"), 900);
}

// ---------- Sound & Haptics ----------

let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function playSound(type) {
  initAudio();
  if (!audioCtx) return;
  try {
    const time = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(300, time + 0.04);
      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      osc.start(time);
      osc.stop(time + 0.04);
    } else if (type === "chime") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
      
      const osc2 = audioCtx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, time); // E6
      osc2.connect(gain);
      osc2.start(time);
      osc2.stop(time + 0.8);
      
      osc.start(time);
      osc.stop(time + 0.8);
    }
  } catch (e) {}
}

function triggerHaptic() {
  if (navigator.vibrate) {
    try { navigator.vibrate([50, 50, 50]); } catch (e) {}
  }
}

// ---------- Search ----------

function normalizeText(s) {
  return (s || "").toString().trim().toLowerCase();
}

function updateSearchResults() {
  const q = normalizeText(els.search.value);
  els.searchResults.innerHTML = "";
  if (!q) {
    // show quick chips of categories
    const cats = CATEGORY_ORDER.slice(0, 10);
    for (const cat of cats) {
      els.searchResults.appendChild(makeChip({ name: categoryLabel(cat), meta: state.lang === "en" ? "Category" : "หมวด", color: CATEGORY_THEME[cat]?.color || "#7c3aed" }, () => {
        els.search.value = cat;
        updateSearchResults();
      }));
    }
    return;
  }

  const results = [];
  for (const m of MOODS) {
    const name = normalizeText(m.name);
    const cat = normalizeText(m.category);
    if (name.includes(q) || cat.includes(q)) results.push(m);
    if (results.length >= 24) break;
  }

  if (results.length === 0) {
    const div = document.createElement("div");
    div.className = "muted small";
    div.textContent = t("search.none");
    els.searchResults.appendChild(div);
    return;
  }

  for (const m of results) {
    els.searchResults.appendChild(makeChip(
      { name: m.name, meta: categoryLabel(m.category), color: m.color, emoji: m.emoji },
      () => showMood(m, { source: t("status.search") ?? (state.lang === "en" ? "Search" : "ค้นหา"), announce: true })
    ));
  }
}

function makeChip({ name, meta, color, emoji }, onClick) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "chip";
  el.title = "แตะเพื่อแสดง";
  el.addEventListener("click", onClick);

  const dot = document.createElement("span");
  dot.className = "dotMini";
  dot.style.background = color || "#7c3aed";

  const nm = document.createElement("span");
  nm.className = "chipName";
  nm.textContent = emoji ? `${emoji} ${name}` : name;

  const mt = document.createElement("span");
  mt.className = "chipMeta";
  mt.textContent = meta || "";

  el.appendChild(dot);
  el.appendChild(nm);
  el.appendChild(mt);
  return el;
}

// ---------- History & favorites ----------

function pushHistory(m) {
  const item = {
    key: moodKey(m),
    t: Date.now(),
  };
  state.history.unshift(item);
  state.history = dedupeByKey(state.history, 60);
  saveJson(STORAGE_KEYS.history, state.history);
}

function recordRollEvent(m, source) {
  const ev = {
    key: moodKey(m),
    category: m.category,
    t: Date.now(),
    energy: m.energy,
    valence: m.valence,
    arousal: m.arousal,
    source,
  };
  state.rollEvents.unshift(ev);
  // Keep enough for meaningful stats but still light
  if (state.rollEvents.length > 2000) state.rollEvents.length = 2000;
  saveJson(STORAGE_KEYS.rolls, state.rollEvents);
}

function dedupeByKey(list, max) {
  const out = [];
  const seen = new Set();
  for (const it of list) {
    if (!it || !it.key) continue;
    if (seen.has(it.key)) continue;
    seen.add(it.key);
    out.push(it);
    if (out.length >= max) break;
  }
  return out;
}

function isFavoriteKey(key) {
  return state.favorites.some((x) => x && x.key === key);
}

function toggleFavoriteCurrent() {
  if (!state.current) return;
  const key = moodKey(state.current);
  if (isFavoriteKey(key)) {
    state.favorites = state.favorites.filter((x) => x.key !== key);
    toast(t("toast.unsaved"));
  } else {
    state.favorites.unshift({ key, t: Date.now() });
    state.favorites = dedupeByKey(state.favorites, 80);
    toast(t("toast.saved"));
  }
  saveJson(STORAGE_KEYS.favorites, state.favorites);
  syncSaveButton();
  renderFavorites();
}

function syncSaveButton() {
  const cur = state.current;
  if (!cur) {
    els.btnSave.querySelector(".ic").textContent = "☆";
    return;
  }
  const key = moodKey(cur);
  els.btnSave.querySelector(".ic").textContent = isFavoriteKey(key) ? "★" : "☆";
}

function renderHistory() {
  els.history.innerHTML = "";
  if (!state.history.length) {
    const div = document.createElement("div");
    div.className = "muted small";
    div.textContent = t("history.none");
    els.history.appendChild(div);
    return;
  }
  for (const it of state.history.slice(0, 14)) {
    const m = keyToMood(it.key);
    if (!m) continue;
    els.history.appendChild(renderItem(m, it.t, { allowRemove: false }));
  }
}

function renderFavorites() {
  els.favorites.innerHTML = "";
  if (!state.favorites.length) {
    const div = document.createElement("div");
    div.className = "muted small";
    div.textContent = t("favorites.none");
    els.favorites.appendChild(div);
    return;
  }
  for (const it of state.favorites.slice(0, 18)) {
    const m = keyToMood(it.key);
    if (!m) continue;
    els.favorites.appendChild(renderItem(m, it.t, { allowRemove: true }));
  }
}

function renderItem(m, t, { allowRemove }) {
  const el = document.createElement("div");
  el.className = "item";
  el.addEventListener("click", () => showMood(m, { source: "ประวัติ/บันทึก", announce: false }));

  const left = document.createElement("div");
  left.className = "itemLeft";

  const emo = document.createElement("div");
  emo.className = "itemEmoji";
  emo.textContent = m.emoji || "🙂";

  const txt = document.createElement("div");
  txt.className = "itemText";
  const name = document.createElement("div");
  name.className = "itemName";
  name.textContent = m.name;
  const meta = document.createElement("div");
  meta.className = "itemMeta";
  const time = new Date(t).toLocaleString("th-TH", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  meta.textContent = `${m.category} • ${time}`;
  txt.appendChild(name);
  txt.appendChild(meta);

  left.appendChild(emo);
  left.appendChild(txt);

  const right = document.createElement("div");
  right.className = "itemRight";
  const dot = document.createElement("span");
  dot.className = "miniDot";
  dot.style.background = m.color || "#7c3aed";
  right.appendChild(dot);

  if (allowRemove) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "miniBtn";
    btn.textContent = "ลบ";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.favorites = state.favorites.filter((x) => x.key !== moodKey(m));
      saveJson(STORAGE_KEYS.favorites, state.favorites);
      syncSaveButton();
      renderFavorites();
      toast("ลบออกแล้ว");
    });
    right.appendChild(btn);
  }

  el.appendChild(left);
  el.appendChild(right);
  return el;
}

// ---------- Stats ----------

function renderStats() {
  if (!els.statTotal) return;
  const evs = Array.isArray(state.rollEvents) ? state.rollEvents : [];
  const total = evs.length;
  const unique = new Set(evs.map((e) => e && e.key).filter(Boolean)).size;

  const avg = (field) => {
    if (!total) return null;
    let s = 0;
    let n = 0;
    for (const e of evs) {
      const v = e?.[field];
      if (typeof v === "number" && Number.isFinite(v)) {
        s += v;
        n++;
      }
    }
    return n ? s / n : null;
  };

  const avgEnergy = avg("energy");
  const avgValence = avg("valence");
  const avgArousal = avg("arousal");

  els.statTotal.textContent = total.toLocaleString("th-TH");
  els.statUnique.textContent = unique.toLocaleString("th-TH");
  els.statAvgEnergy.textContent = avgEnergy == null ? "—" : `${Math.round(avgEnergy)}/100`;
  els.statAvgValence.textContent = avgValence == null ? "—" : `${formatSigned(Math.round(avgValence))}`;
  els.statAvgArousal.textContent = avgArousal == null ? "—" : `${Math.round(avgArousal)}/100`;

  renderTopMoods();
  drawTrend7d();
}

function renderTopMoods() {
  if (!els.topMoods) return;
  els.topMoods.innerHTML = "";
  const evs = Array.isArray(state.rollEvents) ? state.rollEvents : [];
  if (!evs.length) {
    const div = document.createElement("div");
    div.className = "muted small";
    div.textContent = "ยังไม่มีสถิติ ลองสุ่มสักพัก";
    els.topMoods.appendChild(div);
    return;
  }

  const counts = new Map();
  for (const e of evs) {
    if (!e?.key) continue;
    counts.set(e.key, (counts.get(e.key) ?? 0) + 1);
  }

  const rows = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, count]) => ({ m: keyToMood(key), key, count }))
    .filter((x) => x.m);

  const max = rows.length ? rows[0].count : 1;
  for (const r of rows) {
    const el = document.createElement("div");
    el.className = "topRow";
    el.addEventListener("click", () => showMood(r.m, { source: "สถิติ (Top)", announce: false }));

    const left = document.createElement("div");
    left.className = "topLeft";

    const dot = document.createElement("span");
    dot.className = "miniDot";
    dot.style.background = r.m.color || "#7c3aed";

    const name = document.createElement("div");
    name.className = "topName";
    name.textContent = `${r.m.emoji || "🙂"} ${r.m.name}`;

    left.appendChild(dot);
    left.appendChild(name);

    const bar = document.createElement("div");
    bar.className = "miniBar";
    const fill = document.createElement("div");
    fill.className = "miniBarFill";
    fill.style.width = `${clamp((r.count / max) * 100, 0, 100).toFixed(0)}%`;
    bar.appendChild(fill);

    const right = document.createElement("div");
    right.className = "topCount";
    right.textContent = `${r.count} ครั้ง`;

    el.appendChild(left);
    el.appendChild(bar);
    el.appendChild(right);
    els.topMoods.appendChild(el);
  }
}

function startOfDayTs(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function lastNDaysStarts(n) {
  const today = startOfDayTs(Date.now());
  const out = [];
  for (let i = n - 1; i >= 0; i--) out.push(today - i * 86400000);
  return out;
}

function drawTrend7d() {
  const canvas = els.statsCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const css = canvas.getBoundingClientRect();
  const w = Math.max(320, Math.floor(css.width));
  const h = Math.max(160, Math.floor(css.height));
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const days = lastNDaysStarts(7);
  const buckets = new Map(days.map((t) => [t, { c: 0, e: 0, v: 0, a: 0 }]));
  for (const ev of state.rollEvents || []) {
    const day = startOfDayTs(ev.t || 0);
    const b = buckets.get(day);
    if (!b) continue;
    b.c += 1;
    b.e += ev.energy ?? 0;
    b.v += ev.valence ?? 0;
    b.a += ev.arousal ?? 0;
  }

  const seriesCount = [];
  const seriesEnergy = [];
  const seriesValence = [];
  const seriesArousal = [];
  for (const t of days) {
    const b = buckets.get(t);
    const c = b?.c ?? 0;
    seriesCount.push(c);
    seriesEnergy.push(c ? b.e / c : 0);
    seriesValence.push(c ? b.v / c : 0);
    seriesArousal.push(c ? b.a / c : 0);
  }

  ctx.clearRect(0, 0, w, h);

  // background grid
  ctx.fillStyle = "rgba(0,0,0,.10)";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const y = (h * i) / 5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const pad = 18;
  const plotX0 = pad;
  const plotY0 = pad;
  const plotW = w - pad * 2;
  const plotH = h - pad * 2 - 14;

  const xAt = (i) => plotX0 + (plotW * i) / 6;

  // Count bars (scaled)
  const maxC = Math.max(1, ...seriesCount);
  for (let i = 0; i < 7; i++) {
    const bh = (seriesCount[i] / maxC) * (plotH * 0.55);
    const x = xAt(i) - 8;
    const y = plotY0 + plotH - bh;
    ctx.fillStyle = "rgba(255,255,255,.14)";
    ctx.fillRect(x, y, 16, bh);
  }

  // Lines: energy (0..100), arousal (0..100), valence (-100..100)
  drawLine(seriesEnergy, 0, 100, "rgba(34,211,238,.95)");
  drawLine(seriesArousal, 0, 100, "rgba(52,211,153,.95)");
  drawLine(seriesValence, -100, 100, "rgba(251,113,133,.95)");

  // axis labels (days)
  ctx.fillStyle = "rgba(255,255,255,.70)";
  ctx.font = "700 11px ui-sans-serif, system-ui, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < 7; i++) {
    const d = new Date(days[i]);
    const label = d.toLocaleDateString("th-TH", { weekday: "short" });
    ctx.fillText(label, xAt(i), plotY0 + plotH + 4);
  }

  // legend
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let lx = 10, ly = 8;
  legend("Count", "rgba(255,255,255,.18)");
  legend("Energy", "rgba(34,211,238,.95)");
  legend("Arousal", "rgba(52,211,153,.95)");
  legend("Valence", "rgba(251,113,133,.95)");

  function legend(name, color) {
    ctx.fillStyle = color;
    ctx.fillRect(lx, ly + 4, 10, 4);
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.fillText(name, lx + 14, ly);
    lx += 72;
  }

  function drawLine(series, min, max, stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 7; i++) {
      const v = series[i];
      const yn = (v - min) / (max - min);
      const y = plotY0 + plotH - clamp(yn, 0, 1) * plotH;
      const x = xAt(i);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

// ---------- Copy ----------

function moodToText(m) {
  return [
    `อารมณ์: ${m.emoji || ""} ${m.name}`,
    `หมวด: ${m.category}`,
    `คำอธิบาย: ${m.description}`,
    `พลังงาน: ${m.energy}/100`,
    `ความสุข/เศร้า (Valence): ${formatSigned(m.valence)} (ช่วง -100..+100)`,
    `ความสงบ/ตื่นตัว (Arousal): ${m.arousal}/100`,
    `สีประจำอารมณ์: ${m.color}`,
  ].join("\n");
}

async function copyCurrent() {
  if (!state.current) return toast(t("toast.nothingToCopy"));
  const text = moodToText(state.current);
  try {
    await navigator.clipboard.writeText(text);
    toast(t("toast.copied"));
  } catch {
    // Fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast(t("toast.copied"));
    } catch {
      toast(t("toast.copyFail"));
    } finally {
      ta.remove();
    }
  }
}

// ---------- Burst rolling ----------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function rollOnce({ source = "สุ่ม" } = {}) {
  initAudio();
  animateRoll();
  // short "shuffling" illusion
  const flashes = 7;
  for (let i = 0; i < flashes; i++) {
    const fake = weightedPick(MOODS, (m) => (m.weight ?? 1) * (0.85 + Math.random() * 0.3));
    showMood(fake, { source: "กำลังสุ่ม…", announce: false });
    playSound("click");
    await sleep(40 + i * 10);
  }
  const m = pickMood();
  playSound("chime");
  triggerHaptic();
  showMood(m, { source, announce: true });
  return m;
}

async function rollBurst() {
  if (state.rolling) return;
  const n = clamp(parseInt(els.burstCount.value || "5", 10) || 5, 1, 30);
  state.rolling = true;
  setControlsEnabled(false);
  try {
    for (let i = 0; i < n; i++) {
      await rollOnce({ source: `สุ่มต่อเนื่อง (${i + 1}/${n})` });
      await sleep(180);
    }
    toast(t("toast.burstDone", n));
  } finally {
    state.rolling = false;
    setControlsEnabled(true);
  }
}

function setControlsEnabled(enabled) {
  for (const el of [els.btnRoll, els.btnBurst, els.mode, els.burstCount, els.search, els.btnReset]) {
    el.disabled = !enabled;
  }
}

function resetDiversity() {
  state.lastMoodKey = null;
  state.recentKeys = [];
  state.penalties.clear();
  toast(t("toast.reset"));
}

// ---------- Wheel (spin wheel) ----------

const wheel = {
  angle: 0, // radians
  spinning: false,
  raf: 0,
  cats: CATEGORY_ORDER.slice(),
  // derived on init
  colors: [],
  emoji: [],
};

function wheelInit() {
  wheel.cats = CATEGORY_ORDER.slice();
  wheel.colors = wheel.cats.map((c) => CATEGORY_THEME[c]?.color ?? "#7c3aed");
  wheel.emoji = wheel.cats.map((c) => CATEGORY_THEME[c]?.emoji ?? "🧩");
  wheelRender();
  window.addEventListener("resize", wheelRender, { passive: true });
}

function wheelOpen() {
  els.wheelModal.classList.add("show");
  els.wheelModal.setAttribute("aria-hidden", "false");
  wheelRender();
}

function wheelClose() {
  if (wheel.spinning) return;
  els.wheelModal.classList.remove("show");
  els.wheelModal.setAttribute("aria-hidden", "true");
}

const SHORT_CATS = {
  "ความสุข": "สุข", "ความรัก": "รัก", "ความเศร้า": "เศร้า", "ความโกรธ": "โกรธ",
  "ความกลัว": "กลัว", "ความกังวล": "กังวล", "ความสงบ": "สงบ", "ความตื่นเต้น": "ตื่นเต้น",
  "ความอาย": "อาย", "ความผิดหวัง": "ผิดหวัง", "ความคิดถึง": "คิดถึง", "ความสับสน": "สับสน",
  "ความภาคภูมิใจ": "ภูมิใจ", "ความอิจฉา": "อิจฉา", "ความขอบคุณ": "ขอบคุณ",
  "ความโดดเดี่ยว": "โดดเดี่ยว", "ความหวัง": "หวัง", "ความเบื่อ": "เบื่อ",
  "ความโล่งใจ": "โล่งใจ", "อารมณ์ผสมและซับซ้อน": "ซับซ้อน"
};
function shortCategoryLabel(cat) {
  if (state.lang === "en") {
    return (CATEGORY_LABELS.en[cat] || cat).split("/")[0].trim();
  }
  return SHORT_CATS[cat] || cat;
}

function wheelRender() {
  const canvas = els.wheelCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Handle high-DPI scaling; keep drawing buffer square
  const css = canvas.getBoundingClientRect();
  const size = Math.max(260, Math.floor(Math.min(css.width, css.height)));
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  canvas.width = Math.floor(size * dpr);
  canvas.height = Math.floor(size * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const r = size / 2;
  const cx = r;
  const cy = r;
  const cats = wheel.cats;
  const n = cats.length;
  const seg = (Math.PI * 2) / n;

  // background
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wheel.angle);

  for (let i = 0; i < n; i++) {
    const a0 = i * seg;
    const a1 = a0 + seg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r - 8, a0, a1);
    ctx.closePath();
    ctx.fillStyle = wheel.colors[i];
    ctx.globalAlpha = 0.92;
    ctx.fill();

    // segment border
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Ferris wheel style label (always upright)
    const mid = a0 + seg / 2;
    ctx.save();
    
    const tx = Math.cos(mid) * r * 0.72;
    const ty = Math.sin(mid) * r * 0.72;
    ctx.translate(tx, ty);
    
    // Counter-rotate the canvas so text is upright relative to the screen
    ctx.rotate(-wheel.angle);

    const label = shortCategoryLabel(cats[i]);
    const emoji = wheel.emoji[i];
    
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Heavy stroke for readability
    ctx.shadowColor = "rgba(0,0,0,0.85)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,0.7)";
    
    // Emoji
    ctx.font = `${Math.max(16, Math.floor(size * 0.065))}px sans-serif`;
    ctx.strokeText(emoji, 0, -8);
    ctx.fillText(emoji, 0, -8);
    
    // Text
    ctx.fillStyle = "#ffffff";
    ctx.font = `900 ${Math.max(11, Math.floor(size * 0.04))}px ui-sans-serif, system-ui, sans-serif`;
    ctx.strokeText(label, 0, 12);
    ctx.fillText(label, 0, 12);
    
    ctx.restore();
  }

  // center hub
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(10,12,20,.78)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.86)";
  ctx.font = `900 ${Math.max(12, Math.floor(size * 0.04))}px ui-sans-serif, system-ui, Segoe UI, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SPIN", 0, 1);
  ctx.restore();
  
  if (els.wheelCurrentLabel) {
    els.wheelCurrentLabel.textContent = categoryLabel(wheelCategoryAtPointer());
  }

  // outer ring
  ctx.rotate(-wheel.angle);
  ctx.beginPath();
  ctx.arc(0, 0, r - 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,.22)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wheelIndexAtPointer() {
  const cats = wheel.cats;
  const n = cats.length;
  const seg = (Math.PI * 2) / n;
  let a = (-Math.PI / 2 - wheel.angle) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return clamp(Math.floor(a / seg), 0, n - 1);
}

function wheelCategoryAtPointer() {
  return wheel.cats[wheelIndexAtPointer()];
}

function wheelSpin() {
  if (wheel.spinning) return;
  wheel.spinning = true;
  els.btnWheelSpin.disabled = true;

  initAudio();
  let lastIndex = -1;

  const start = performance.now();
  const startAngle = wheel.angle;
  const turns = 5 + Math.random() * 4; // 5..9
  const extra = Math.random() * Math.PI * 2;
  const target = startAngle + turns * Math.PI * 2 + extra;
  const duration = 2400 + Math.random() * 700;

  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic
    wheel.angle = startAngle + (target - startAngle) * ease;
    wheelRender();

    const curIndex = wheelIndexAtPointer();
    if (curIndex !== lastIndex) {
      if (lastIndex !== -1 && t < 0.98) playSound("click");
      lastIndex = curIndex;
    }

    if (t < 1) {
      wheel.raf = requestAnimationFrame(tick);
      return;
    }
    wheel.spinning = false;
    els.btnWheelSpin.disabled = false;
    const cat = wheel.cats[curIndex];
    const catLabel = categoryLabel(cat);
    const m = pickMoodFromCategory(cat);
    playSound("chime");
    triggerHaptic();
    animateRoll();
    showMood(m, { source: state.lang === "en" ? `Wheel • ${catLabel}` : `วงล้อ • ${catLabel}`, announce: true });
    toast(t("toast.wheelCat", catLabel));
    wheelClose();
  };

  wheel.raf = requestAnimationFrame(tick);
}

// ---------- Storage ----------

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// ---------- Init ----------

function updateStats() {
  const byCat = new Map();
  for (const m of MOODS) byCat.set(m.category, (byCat.get(m.category) ?? 0) + 1);
  const cats = CATEGORY_ORDER.filter((c) => byCat.has(c)).length;
  els.stats.textContent = `${MOODS.length.toLocaleString("th-TH")} อารมณ์ • ${cats} หมวด`;
}

function hydrateFromStorage() {
  // Drop unknown keys (in case data changes)
  state.history = (state.history || []).filter((x) => x && typeof x.key === "string" && keyIndex.has(x.key));
  state.favorites = (state.favorites || []).filter((x) => x && typeof x.key === "string" && keyIndex.has(x.key));
  saveJson(STORAGE_KEYS.history, state.history);
  saveJson(STORAGE_KEYS.favorites, state.favorites);

  state.rollEvents = (state.rollEvents || []).filter((e) => e && typeof e.key === "string" && keyIndex.has(e.key));
  saveJson(STORAGE_KEYS.rolls, state.rollEvents);

  state.diary = (state.diary || []).filter((d) => d && typeof d.key === "string" && keyIndex.has(d.key));
  saveJson(STORAGE_KEYS.diary, state.diary);
}

function wireEvents() {
  els.btnRoll.addEventListener("click", () => rollOnce({ source: "สุ่ม" }));
  els.btnWheel.addEventListener("click", wheelOpen);
  els.btnBurst.addEventListener("click", rollBurst);
  els.btnReset.addEventListener("click", () => {
    resetDiversity();
    els.search.value = "";
    updateSearchResults();
  });
  els.btnCopy.addEventListener("click", copyCurrent);
  els.btnSave.addEventListener("click", toggleFavoriteCurrent);
  els.search.addEventListener("input", () => updateSearchResults());

  els.btnDiarySave.addEventListener("click", saveDiaryEntry);
  els.btnLang.addEventListener("click", toggleLanguage);

  els.btnWheelClose.addEventListener("click", wheelClose);
  els.btnWheelSpin.addEventListener("click", wheelSpin);
  els.wheelModal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close) wheelClose();
  });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") wheelClose();
    if (e.key === "Enter" && (document.activeElement === els.search || document.activeElement === els.mode)) {
      rollOnce({ source: "สุ่ม" });
    }
  });
}

function initialRender() {
  updateStats();
  hydrateFromStorage();
  renderHistory();
  renderFavorites();
  updateSearchResults();
  wheelInit();
  renderStats();
  renderDiary();
  applyI18nToDom();

  // Show a default mood (not counted as history)
  const starter = weightedPick(MOODS, (m) => (m.weight ?? 1) * 0.8);
  showMood(starter, { source: "ตัวอย่าง", announce: false });
  els.statusText.textContent = t("status.ready");
}

wireEvents();
initialRender();

// ---------- Diary ----------

function parseTags(raw) {
  const s = (raw || "").toString();
  const parts = s.split(",").map((x) => x.trim()).filter(Boolean);
  // dedupe
  const out = [];
  const seen = new Set();
  for (const p of parts) {
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out.slice(0, 12);
}

function saveDiaryEntry() {
  if (!state.current) return toast(t("diary.noMood"));
  const note = (els.diaryNote.value || "").trim();
  const tags = parseTags(els.diaryTags.value);
  if (!note && tags.length === 0) return toast(t("diary.needInput"));

  const entry = {
    id: `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    key: moodKey(state.current),
    t: Date.now(),
    note,
    tags,
  };
  state.diary.unshift(entry);
  if (state.diary.length > 400) state.diary.length = 400;
  saveJson(STORAGE_KEYS.diary, state.diary);
  els.diaryNote.value = "";
  els.diaryTags.value = "";
  renderDiary();
  toast(t("diary.saved"));
}

function renderDiary() {
  if (!els.diaryList) return;
  els.diaryList.innerHTML = "";
  if (!state.diary.length) {
    const div = document.createElement("div");
    div.className = "muted small";
    div.textContent = t("diary.none");
    els.diaryList.appendChild(div);
    return;
  }

  for (const d of state.diary.slice(0, 20)) {
    const m = keyToMood(d.key);
    if (!m) continue;
    els.diaryList.appendChild(renderDiaryItem(d, m));
  }
}

function renderDiaryItem(d, m) {
  const wrap = document.createElement("div");
  wrap.className = "diaryItem";

  const top = document.createElement("div");
  top.className = "diaryTop";

  const title = document.createElement("div");
  title.className = "diaryTitle";
  title.textContent = `${m.emoji || "🙂"} ${m.name}`;
  title.title = "แตะเพื่อแสดงอารมณ์นี้";
  title.style.cursor = "pointer";
  title.addEventListener("click", () => showMood(m, { source: "ไดอารี่", announce: false }));

  const right = document.createElement("div");
  right.style.display = "flex";
  right.style.gap = "8px";
  const btnEdit = document.createElement("button");
  btnEdit.type = "button";
  btnEdit.className = "miniBtn";
  btnEdit.textContent = "แก้";
  btnEdit.addEventListener("click", () => editDiaryEntry(d.id));
  const btnDel = document.createElement("button");
  btnDel.type = "button";
  btnDel.className = "miniBtn";
  btnDel.textContent = "ลบ";
  btnDel.addEventListener("click", () => deleteDiaryEntry(d.id));
  right.appendChild(btnEdit);
  right.appendChild(btnDel);

  top.appendChild(title);
  top.appendChild(right);

  const meta = document.createElement("div");
  meta.className = "diaryMeta";
  const time = new Date(d.t).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  meta.appendChild(tagSpan(`${m.category} • ${time}`, true));
  for (const t of d.tags || []) meta.appendChild(tagSpan(`#${t}`));

  const note = document.createElement("div");
  note.className = "diaryNoteText";
  note.textContent = (d.note || "").trim() || "—";

  wrap.appendChild(top);
  wrap.appendChild(meta);
  wrap.appendChild(note);
  return wrap;
}

function tagSpan(text, muted = false) {
  const s = document.createElement("span");
  s.className = "tag";
  s.textContent = text;
  if (muted) s.style.opacity = "0.85";
  return s;
}

function editDiaryEntry(id) {
  const idx = state.diary.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const cur = state.diary[idx];
  const newNote = window.prompt(t("diary.editNote"), cur.note || "");
  if (newNote === null) return;
  const newTags = window.prompt(t("diary.editTags"), (cur.tags || []).join(", "));
  if (newTags === null) return;
  cur.note = (newNote || "").trim();
  cur.tags = parseTags(newTags);
  saveJson(STORAGE_KEYS.diary, state.diary);
  renderDiary();
  toast(t("diary.edited"));
}

function deleteDiaryEntry(id) {
  const ok = window.confirm(t("diary.confirmDelete"));
  if (!ok) return;
  state.diary = state.diary.filter((x) => x.id !== id);
  saveJson(STORAGE_KEYS.diary, state.diary);
  renderDiary();
  toast(t("diary.deleted"));
}

// ---------- PWA / Offline Worker ----------

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.log('SW Registration failed: ', err);
    });
  });
}

