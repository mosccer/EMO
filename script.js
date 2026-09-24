/* EMO — single-page, zero-deps mood randomizer. Mood data lives in data.js */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const ID_LIST = [
  // top bar
  "btnLang", "langLabel", "btnTheme", "themeIcon", "btnSound", "soundIcon", "btnHelp", "btnHelpFooter",
  "stats", "streakChip", "streakValue",
  // controls
  "btnRoll", "modeGroup", "modeHint", "burstCount", "burstMinus", "burstPlus", "btnBurst", "btnReset",
  "btnWheel", "btnMixer", "btnDaily", "btnCheckin", "btnBreathe", "btnShake",
  "search", "searchResults", "searchTitle", "searchCount",
  // viewer
  "viewer", "moodBadge", "moodEmoji", "moodName", "moodCategory", "moodDesc", "moodTagline", "statusText",
  "btnSave", "btnCopy", "btnShare", "btnDiaryQuick", "btnBreatheQuick",
  "valEnergy", "valValence", "valArousal", "barEnergy", "barArousal", "barValenceLeft", "barValenceRight",
  "tryList", "colorDot", "colorCode", "mapCanvas",
  // side tabs
  "sideCard", "history", "favorites",
  "statTotal", "statUnique", "statStreak", "statCats", "statAvgEnergy", "statAvgValence", "statAvgArousal", "statsCanvas", "topMoods",
  "diaryAttach", "diaryNote", "diaryTags", "btnDiarySave", "diaryFilter", "diaryList",
  "badgeCount", "badgeProgressFill", "badgeGrid",
  // misc
  "fabRoll", "toast", "srLive", "fxCanvas",
  // wheel
  "wheelModal", "wheelCanvas", "wheelPointer", "wheelHub", "wheelCurrentLabel", "btnWheelSpin",
  // mixer
  "mixStage", "mixEmojiA", "mixNameA", "mixCatA", "mixRerollA", "mixEmojiB", "mixNameB", "mixCatB", "mixRerollB",
  "mixResult", "mixResultEmoji", "mixResultName", "mixResultDesc", "mixResultBars", "btnMixGo", "btnMixUse",
  // daily
  "dailyCard", "dailyFlip", "dailyDate", "dailyEmoji", "dailyName", "dailyStars", "dailyColorDot", "dailyColor",
  "dailyNumber", "dailyAdvice", "btnDailyUse",
  // check-in
  "checkinFace", "ciEnergy", "ciValence", "ciArousal", "ciEnergyOut", "ciValenceOut", "ciArousalOut", "checkinMatches",
  // breathe
  "breatheCircle", "breathePhase", "breatheCount", "breatheDot", "breatheRounds", "btnBreatheStart", "breatheBtnLabel", "breatheBtnIcon",
  // help
  "helpList", "helpTips",
];
const els = Object.fromEntries(ID_LIST.map((id) => [id, document.getElementById(id)]));

// ---------- Small helpers ----------

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
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
const prefersReducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const pickOne = (arr) => arr[Math.floor(Math.random() * arr.length)];

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
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}
function rgbToHex(r, g, b) {
  const to = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
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
function mixHex(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  if (!A || !B) return a || b;
  return rgbToHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}
function luminance(hex) {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
function hexA(hex, a) {
  const c = hexToRgb(hex);
  return c ? `rgba(${c.r},${c.g},${c.b},${a})` : hex;
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

// Size a canvas to its CSS box at device pixel ratio. Returns null while hidden.
function prepCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);
  const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

// ---------- Mood library ----------

const orderIndex = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
const catOrder = (c) => (orderIndex.has(c) ? orderIndex.get(c) : 999);
const byCategoryThenName = (a, b) => catOrder(a.category) - catOrder(b.category) || a.name.localeCompare(b.name, "th");
const themeOf = (cat) => CATEGORY_THEME[cat] ?? { color: "#7c3aed", emoji: "🙂" };

function moodKey(m) {
  return `${m.name}__${m.category}`;
}
function moodColor(m) {
  return m?.color || themeOf(m?.category).color;
}
function moodEmoji(m) {
  return m?.emoji || themeOf(m?.category).emoji;
}
// "ดีใจ (เล็กน้อย • เงียบ ๆ)" -> "ดีใจ"
function baseName(m) {
  return (m?.name || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function buildAllMoods() {
  const moods = [];
  const seen = new Set();
  const add = (m) => {
    const key = moodKey(m);
    if (seen.has(key)) return;
    seen.add(key);
    moods.push(m);
  };

  // Generate variants from seeds × intensity × texture
  for (const s of SEEDS) {
    const theme = themeOf(s.category);
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
        const w = clamp(1.0 * inten.w * tex.w, 0.55, 1.15);

        add({ name, category: s.category, description, energy, valence, arousal, color, emoji, weight: w, variant: true });
      }
    }
  }

  for (const m of SPECIALTY_MOODS) add(m);

  for (const [name, category, description, energy, valence, arousal, emoji, weight = 0.95] of EXTRA_MOODS) {
    const theme = themeOf(category);
    add({ name, category, description, energy, valence, arousal, color: theme.color, emoji: emoji || theme.emoji, weight });
  }

  moods.sort(byCategoryThenName);
  return moods;
}

// Keep the random pool "a lot, but still easy to use" while preserving category diversity.
function capMoodsRoundRobin(sortedMoods, limit) {
  if (sortedMoods.length <= limit) return sortedMoods;

  const groups = new Map();
  for (const m of sortedMoods) {
    if (!groups.has(m.category)) groups.set(m.category, []);
    groups.get(m.category).push(m);
  }
  const cats = Array.from(groups.keys()).sort((a, b) => catOrder(a) - catOrder(b) || a.localeCompare(b, "th"));

  const pointers = new Map(cats.map((c) => [c, 0]));
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

  if (picked.length < limit) {
    for (const m of sortedMoods) {
      if (picked.length >= limit) break;
      const key = moodKey(m);
      if (pickedKeys.has(key)) continue;
      pickedKeys.add(key);
      picked.push(m);
    }
  }

  picked.sort(byCategoryThenName);
  return picked;
}

// Every generated mood stays resolvable (so saved data never goes missing).
// The random pool is every handcrafted mood plus an evenly spread subset of seed variants.
const ALL_MOODS = buildAllMoods();
const MOODS = ALL_MOODS.filter((m) => !m.variant)
  .concat(capMoodsRoundRobin(ALL_MOODS.filter((m) => m.variant), 520))
  .sort(byCategoryThenName);
const keyIndex = new Map(ALL_MOODS.map((m) => [moodKey(m), m]));
function keyToMood(key) {
  return keyIndex.get(key) || null;
}

// ---------- Storage & state ----------

const STORAGE_KEYS = {
  favorites: "emo_favorites_v1",
  history: "emo_history_v1",
  rolls: "emo_roll_events_v1",
  diary: "emo_diary_v1",
  lang: "emo_lang_v1",
  theme: "emo_theme_v1",
  sound: "emo_sound_v1",
  mode: "emo_mode_v1",
  tab: "emo_tab_v1",
  custom: "emo_custom_v1",
  counters: "emo_counters_v1",
  badges: "emo_badges_v1",
  tried: "emo_tried_v1",
};

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
    // ignore (private mode / quota)
  }
}
const asArray = (x) => (Array.isArray(x) ? x : []);
const asObject = (x) => (x && typeof x === "object" && !Array.isArray(x) ? x : {});

const MODES = ["normal", "noRepeatConsecutive", "diverse"];
const TABS = ["history", "favorites", "stats", "diary", "badges"];

const state = {
  lastMoodKey: null,
  recentKeys: [], // newest first
  recentMax: 24,
  penalties: new Map(), // key -> penalty multiplier [0.1..1]
  favorites: asArray(loadJson(STORAGE_KEYS.favorites, [])),
  history: asArray(loadJson(STORAGE_KEYS.history, [])),
  rollEvents: asArray(loadJson(STORAGE_KEYS.rolls, [])),
  diary: asArray(loadJson(STORAGE_KEYS.diary, [])),
  custom: asArray(loadJson(STORAGE_KEYS.custom, [])),
  counters: asObject(loadJson(STORAGE_KEYS.counters, {})),
  badges: asObject(loadJson(STORAGE_KEYS.badges, {})),
  tried: asObject(loadJson(STORAGE_KEYS.tried, {})),
  lang: loadJson(STORAGE_KEYS.lang, "th") === "en" ? "en" : "th",
  theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
  sound: loadJson(STORAGE_KEYS.sound, true) !== false,
  mode: MODES.includes(loadJson(STORAGE_KEYS.mode, "diverse")) ? loadJson(STORAGE_KEYS.mode, "diverse") : "diverse",
  tab: TABS.includes(loadJson(STORAGE_KEYS.tab, "history")) ? loadJson(STORAGE_KEYS.tab, "history") : "history",
  current: null,
  rolling: false,
  shake: false,
  unseenBadges: 0,
  diaryEditing: null,
  diaryConfirm: null,
};

// ---------- i18n ----------

const I18N = {
  th: {
    "app.title": "สุ่มอารมณ์",
    "app.subtitle": "ละเอียด • ครอบคลุม • ไม่ซ้ำง่าย",
    "app.count": (n, c) => `${n} อารมณ์ • ${c} หมวด`,
    "top.lang": "ภาษา / Language (L)",
    "top.theme": "สลับธีมสว่าง/มืด (T)",
    "top.sound": "เปิด/ปิดเสียง",
    "top.help": "คีย์ลัด & วิธีใช้ (?)",
    "top.streak": (n) => `ใช้งานต่อเนื่อง ${n} วัน`,

    "controls.title": "การควบคุม",
    "controls.mode": "โหมดสุ่ม",
    "controls.burstCount": "สุ่มรัว (ครั้ง)",
    "controls.search": "ค้นหาอารมณ์",
    "controls.resetHint": "ล้างความจำผลล่าสุด แล้วเริ่มกระจายความหลากหลายใหม่",
    "mode.normalShort": "ปกติ",
    "mode.noRepeatShort": "ไม่ซ้ำติดกัน",
    "mode.diverseShort": "หลากหลาย ✦",
    "mode.normalHint": "สุ่มตามน้ำหนัก และลดโอกาสซ้ำเล็กน้อย",
    "mode.noRepeatHint": "ไม่มีวันได้อารมณ์เดิมสองครั้งติดกัน",
    "mode.diverseHint": "กระจายหมวดให้หลากหลายที่สุด (แนะนำ)",
    "tools.title": "ลูกเล่น",
    "tools.wheel": "วงล้อ",
    "tools.mixer": "ผสมอารมณ์",
    "tools.daily": "ดวงวันนี้",
    "tools.checkin": "เช็คอินใจ",
    "tools.breathe": "ฝึกหายใจ",
    "tools.shake": "เขย่าสุ่ม",

    "actions.roll": "สุ่มอารมณ์",
    "actions.burst": "สุ่มรัว",
    "actions.reset": "รีเซ็ต",
    "actions.copy": "คัดลอก",
    "actions.save": "บันทึก",
    "actions.saved": "บันทึกแล้ว",
    "actions.share": "การ์ด",
    "actions.diary": "จดไดอารี่",
    "actions.breathe": "หายใจ",
    "actions.close": "ปิด",
    "actions.spin": "หมุนวงล้อ",
    "actions.diarySave": "บันทึก",
    "actions.edit": "แก้",
    "actions.delete": "ลบ",
    "actions.confirmDelete": "ยืนยันลบ?",
    "actions.cancel": "ยกเลิก",
    "actions.remove": "เอาออก",

    "search.placeholder": "พิมพ์ชื่ออารมณ์หรือหมวด เช่น ดีใจ, กังวล, Hope…",
    "search.categories": "หมวดอารมณ์",
    "search.results": "ผลการค้นหา",
    "search.count": (n) => `พบ ${n}`,
    "search.none": "ไม่พบผลลัพธ์ ลองพิมพ์คำอื่น",
    "search.catMeta": (n) => `${n} แบบ`,
    "hint.tapToBack": "แตะเพื่อย้อนดู",

    "viewer.readyDesc": "กดปุ่ม “สุ่มอารมณ์” เพื่อเริ่มต้น",
    "viewer.orbHint": "แตะฉันสิ 👆",
    "viewer.tryTitle": "ลองทำดู",
    "viewer.color": "สีประจำอารมณ์",
    "meter.energy": "พลังงาน",
    "meter.energyHint": "0 = แทบไม่มีแรง, 100 = พลังสูงมาก",
    "meter.valence": "ความสุข/เศร้า (Valence)",
    "meter.valenceHint": "-100 = เศร้าหนัก, +100 = สุขมาก",
    "meter.arousal": "ความสงบ/ตื่นตัว (Arousal)",
    "meter.arousalHint": "0 = สงบมาก, 100 = ตื่นตัวมาก",
    "map.title": "แผนที่อารมณ์",
    "map.hint": "แตะเพื่อเลือก",
    "map.aria": "แผนที่อารมณ์: แกนนอนสุข/เศร้า แกนตั้งตื่นตัว/สงบ แตะเพื่อเลือกอารมณ์ใกล้ตำแหน่งนั้น",
    "map.q1": "ตื่นเต้น",
    "map.q2": "ตึงเครียด",
    "map.q3": "หม่นหมอง",
    "map.q4": "ผ่อนคลาย",

    "tabs.aria": "ข้อมูลของฉัน",
    "tabs.history": "ประวัติ",
    "tabs.favorites": "บันทึก",
    "tabs.stats": "สถิติ",
    "tabs.diary": "ไดอารี่",
    "tabs.badges": "รางวัล",

    "history.title": "ประวัติล่าสุด",
    "history.none": "ยังไม่มีประวัติ ลองสุ่มดูสิ",
    "favorites.title": "ที่บันทึกไว้",
    "favorites.subtitle": "เก็บในเครื่อง (local)",
    "favorites.none": "ยังไม่มีที่บันทึก กด ☆ บันทึก ตอนเจออารมณ์ที่ชอบ",

    "stats.title": "สถิติส่วนตัว",
    "stats.subtitle": "ทั้งหมดในเครื่องนี้",
    "stats.total": "สุ่มทั้งหมด",
    "stats.unique": "อารมณ์ไม่ซ้ำ",
    "stats.streak": "สตรีค (วัน)",
    "stats.cats": "หมวดที่เจอ",
    "stats.avgEnergy": "เฉลี่ยพลังงาน",
    "stats.avgValence": "เฉลี่ย Valence",
    "stats.avgArousal": "เฉลี่ย Arousal",
    "stats.trendTitle": "แนวโน้ม 7 วัน",
    "stats.trendHint": "จำนวนครั้ง + ค่าเฉลี่ย",
    "stats.topTitle": "อารมณ์ที่สุ่มบ่อยสุด",
    "stats.topHint": "Top 6",
    "stats.times": (n) => `${n} ครั้ง`,
    "stats.none": "ยังไม่มีสถิติ ลองสุ่มสักพัก",
    "stats.legend.count": "จำนวน",
    "stats.legend.energy": "พลังงาน",
    "stats.legend.arousal": "ตื่นตัว",
    "stats.legend.valence": "สุข/เศร้า",

    "diary.title": "ไดอารี่",
    "diary.subtitle": "บันทึกคู่กับอารมณ์",
    "diary.attachTo": "ผูกกับอารมณ์:",
    "diary.noteLabel": "โน้ต/เหตุการณ์",
    "diary.notePlaceholder": "วันนี้เกิดอะไรขึ้น? รู้สึกอย่างไร?",
    "diary.tagsLabel": "แท็ก (คั่นด้วย , )",
    "diary.tagsPlaceholder": "งาน, ครอบครัว, สุขภาพ...",
    "diary.listTitle": "รายการไดอารี่ล่าสุด",
    "diary.filter": "กรอง…",
    "diary.noMood": "ยังไม่มีอารมณ์ให้ผูกไดอารี่",
    "diary.needInput": "ใส่โน้ตหรือแท็กอย่างน้อย 1 อย่าง",
    "diary.saved": "บันทึกไดอารี่แล้ว",
    "diary.edited": "แก้ไขแล้ว",
    "diary.deleted": "ลบแล้ว",
    "diary.none": "ยังไม่มีไดอารี่ ลองจดความรู้สึกหลังสุ่มดูสิ",
    "diary.noMatch": "ไม่พบไดอารี่ที่ตรงกับคำค้น",

    "badges.title": "ความสำเร็จ",
    "badges.count": (a, b) => `ปลดล็อก ${a}/${b}`,
    "badges.unlocked": (name) => `🏅 ปลดล็อก: ${name}`,
    "badges.more": (n) => ` (+${n})`,
    "badges.secretDesc": "ความลับ… ลองเล่นกับทุกอย่างดูสิ",

    "wheel.title": "วงล้อสุ่มอารมณ์",
    "wheel.hint": "วงล้อจะเลือก “หมวด” แล้วสุ่มอารมณ์ในหมวดนั้นให้อีกที",
    "wheel.landed": (cat) => `วงล้อได้หมวด: ${cat}`,

    "mixer.title": "ห้องทดลองผสมอารมณ์",
    "mixer.lead": "เลือกอารมณ์ 2 อย่างแล้วเขย่าให้เข้ากัน ได้อารมณ์ใหม่ที่ไม่มีใครเหมือน",
    "mixer.reroll": "สุ่มใหม่",
    "mixer.go": "ผสมเลย!",
    "mixer.again": "ผสมอีกที",
    "mixer.use": "ใช้อารมณ์นี้",
    "mixer.desc": (a, pa, b, pb) => `ส่วนผสมของ “${a}” ${pa}% กับ “${b}” ${pb}% — ใจมีหลายเฉดพร้อมกัน`,

    "daily.title": "ดวงอารมณ์ประจำวัน",
    "daily.tap": "แตะเพื่อเปิดดวง",
    "daily.luckyColor": "สีมงคล",
    "daily.luckyNumber": "เลขนำโชค",
    "daily.hint": "ดวงเปลี่ยนทุกเที่ยงคืน",
    "daily.use": "ใช้เป็นอารมณ์ตอนนี้",
    "daily.advice": (s) => `คำแนะนำวันนี้: ${s}`,

    "checkin.title": "เช็คอินใจ — ตอนนี้รู้สึกยังไง?",
    "checkin.low": "หมดแรง",
    "checkin.high": "พลังเต็ม",
    "checkin.valence": "ความรู้สึกโดยรวม",
    "checkin.bad": "แย่มาก",
    "checkin.good": "ดีมาก",
    "checkin.arousal": "ใจเต้น/ตื่นตัว",
    "checkin.calm": "นิ่งสงบ",
    "checkin.alert": "ตื่นตัวสุด",
    "checkin.matches": "อารมณ์ที่ใกล้เคียงที่สุด — แตะเพื่อเลือก",
    "checkin.match": (p) => `ตรง ${p}%`,

    "breathe.title": "หายใจแบบกล่อง (4-4-4-4)",
    "breathe.hint": "3 รอบ ≈ 48 วินาที • ช่วยให้ใจนิ่งลง",
    "breathe.start": "เริ่ม",
    "breathe.stop": "หยุด",
    "breathe.again": "อีกครั้ง",
    "breathe.ready": "พร้อมไหม?",
    "breathe.in": "หายใจเข้า",
    "breathe.hold": "กลั้นไว้",
    "breathe.out": "หายใจออก",
    "breathe.done": "เยี่ยมมาก 🌿",
    "breathe.doneToast": "ฝึกหายใจครบแล้ว ใจนิ่งขึ้นไหม?",

    "help.title": "คีย์ลัด & เคล็ดลับ",
    "help.roll": "สุ่มอารมณ์",
    "help.burst": "สุ่มรัว",
    "help.wheel": "วงล้อ",
    "help.mixer": "ผสมอารมณ์",
    "help.daily": "ดวงวันนี้",
    "help.checkin": "เช็คอินใจ",
    "help.breathe": "ฝึกหายใจ",
    "help.save": "บันทึก / เอาออก",
    "help.copy": "คัดลอก",
    "help.share": "สร้างการ์ดอารมณ์",
    "help.theme": "สลับธีม",
    "help.lang": "สลับภาษา",
    "help.search": "ไปที่ช่องค้นหา",
    "help.help": "เปิดหน้านี้",
    "help.close": "ปิดหน้าต่าง",
    "help.tips": [
      "🔮 แตะลูกแก้วอารมณ์เพื่อเล่นกับมัน — ลองแตะรัว ๆ ดูสิ…",
      "🗺️ แตะบนแผนที่อารมณ์ เพื่อเลือกอารมณ์ตามตำแหน่งที่ใช่",
      "🧪 ผสมอารมณ์ได้อารมณ์ใหม่ที่บันทึกและค้นหาได้",
      "📱 บนมือถือ เปิด “เขย่าสุ่ม” แล้วเขย่าเครื่องเพื่อสุ่ม",
      "🔒 ข้อมูลทั้งหมดเก็บในเครื่องคุณเท่านั้น",
    ],

    "footer.offline": "EMO ทำงานแบบออฟไลน์ 100% • ไม่ใช้ไลบรารีภายนอก",
    "footer.shortcuts": "คีย์ลัด",

    "toast.copied": "คัดลอกแล้ว",
    "toast.copyFail": "คัดลอกไม่สำเร็จ",
    "toast.nothingToCopy": "ยังไม่มีผลลัพธ์",
    "toast.saved": "บันทึกแล้ว ⭐",
    "toast.unsaved": "เอาออกจากที่บันทึกแล้ว",
    "toast.reset": "รีเซ็ตความหลากหลายแล้ว",
    "toast.burstDone": (n) => `สุ่มรัวเสร็จแล้ว (${n} ครั้ง)`,
    "toast.lang": "ภาษา: ไทย",
    "toast.themeLight": "ธีมสว่าง ☀️",
    "toast.themeDark": "ธีมมืด 🌙",
    "toast.soundOn": "เปิดเสียงแล้ว 🔊",
    "toast.soundOff": "ปิดเสียงแล้ว 🔇",
    "toast.shakeOn": "เปิดโหมดเขย่าแล้ว — เขย่าเครื่องเพื่อสุ่ม!",
    "toast.shakeOff": "ปิดโหมดเขย่าแล้ว",
    "toast.shakeDenied": "ไม่ได้รับสิทธิ์ใช้เซ็นเซอร์การเคลื่อนไหว",
    "toast.cardSaved": "บันทึกการ์ดอารมณ์แล้ว 📸",
    "toast.cardFail": "สร้างการ์ดไม่สำเร็จ",
    "toast.party": "🎉 ปาร์ตี้อารมณ์!",
    "toast.tryDone": "เยี่ยม! ลงมือทำแล้ว ✨",

    "source.roll": "สุ่ม",
    "source.rolling": "กำลังสุ่ม…",
    "source.burst": (i, n) => `สุ่มรัว ${i}/${n}`,
    "source.revisit": "ย้อนดู",
    "source.search": "ค้นหา",
    "source.top": "สถิติ",
    "source.diary": "ไดอารี่",
    "source.sample": "ตัวอย่าง",
    "source.wheel": (c) => `วงล้อ • ${c}`,
    "source.map": "แผนที่อารมณ์",
    "source.checkin": "เช็คอินใจ",
    "source.mix": "ผสมอารมณ์",
    "source.daily": "ดวงวันนี้",
    "source.shake": "เขย่า",
    "status.ready": "พร้อม",

    "copy.mood": "อารมณ์",
    "copy.category": "หมวด",
    "copy.desc": "คำอธิบาย",
    "copy.energy": "พลังงาน",
    "copy.valence": "ความสุข/เศร้า (Valence)",
    "copy.arousal": "ความสงบ/ตื่นตัว (Arousal)",
    "copy.color": "สีประจำอารมณ์",
    "card.footer": "สุ่มอารมณ์ด้วย EMO",

    "hint.highEnergy": "พลังสูง",
    "hint.lowEnergy": "พลังต่ำ",
    "hint.positive": "โทนบวก",
    "hint.negative": "โทนลบ",
    "hint.neutral": "โทนกลาง",
    "hint.aroused": "ตื่นตัว",
    "hint.calm": "สงบ",
  },
  en: {
    "app.title": "Mood Randomizer",
    "app.subtitle": "Detailed • Broad • Less repetitive",
    "app.count": (n, c) => `${n} moods • ${c} categories`,
    "top.lang": "Language / ภาษา (L)",
    "top.theme": "Toggle light/dark (T)",
    "top.sound": "Sound on/off",
    "top.help": "Shortcuts & help (?)",
    "top.streak": (n) => `${n}-day streak`,

    "controls.title": "Controls",
    "controls.mode": "Mode",
    "controls.burstCount": "Burst (times)",
    "controls.search": "Search moods",
    "controls.resetHint": "Forget recent picks and restart the diversity balancing",
    "mode.normalShort": "Normal",
    "mode.noRepeatShort": "No repeats",
    "mode.diverseShort": "Diverse ✦",
    "mode.normalHint": "Weighted random with a light anti-repeat",
    "mode.noRepeatHint": "Never the same mood twice in a row",
    "mode.diverseHint": "Spreads across categories as much as possible (recommended)",
    "tools.title": "Toys",
    "tools.wheel": "Wheel",
    "tools.mixer": "Mixer",
    "tools.daily": "Daily",
    "tools.checkin": "Check-in",
    "tools.breathe": "Breathe",
    "tools.shake": "Shake",

    "actions.roll": "Roll",
    "actions.burst": "Burst",
    "actions.reset": "Reset",
    "actions.copy": "Copy",
    "actions.save": "Save",
    "actions.saved": "Saved",
    "actions.share": "Card",
    "actions.diary": "Diary",
    "actions.breathe": "Breathe",
    "actions.close": "Close",
    "actions.spin": "Spin",
    "actions.diarySave": "Save",
    "actions.edit": "Edit",
    "actions.delete": "Delete",
    "actions.confirmDelete": "Sure?",
    "actions.cancel": "Cancel",
    "actions.remove": "Remove",

    "search.placeholder": "Type a mood (Thai) or a category, e.g. Hope…",
    "search.categories": "Categories",
    "search.results": "Results",
    "search.count": (n) => `${n} found`,
    "search.none": "No results — try another query",
    "search.catMeta": (n) => `${n}`,
    "hint.tapToBack": "Tap to revisit",

    "viewer.readyDesc": "Press “Roll” to start",
    "viewer.orbHint": "Tap me 👆",
    "viewer.tryTitle": "Try this",
    "viewer.color": "Mood color",
    "meter.energy": "Energy",
    "meter.energyHint": "0 = drained, 100 = fully charged",
    "meter.valence": "Pleasantness (Valence)",
    "meter.valenceHint": "-100 = very unpleasant, +100 = very pleasant",
    "meter.arousal": "Activation (Arousal)",
    "meter.arousalHint": "0 = very calm, 100 = highly alert",
    "map.title": "Mood map",
    "map.hint": "Tap to pick",
    "map.aria": "Mood map: horizontal axis unpleasant to pleasant, vertical axis calm to alert. Tap to pick a nearby mood",
    "map.q1": "Excited",
    "map.q2": "Tense",
    "map.q3": "Down",
    "map.q4": "Relaxed",

    "tabs.aria": "My data",
    "tabs.history": "History",
    "tabs.favorites": "Saved",
    "tabs.stats": "Stats",
    "tabs.diary": "Diary",
    "tabs.badges": "Badges",

    "history.title": "Recent history",
    "history.none": "No history yet — try rolling",
    "favorites.title": "Saved",
    "favorites.subtitle": "Stored locally",
    "favorites.none": "Nothing saved yet — tap ☆ Save on a mood you like",

    "stats.title": "Your stats",
    "stats.subtitle": "All-time on this device",
    "stats.total": "Total rolls",
    "stats.unique": "Unique moods",
    "stats.streak": "Streak (days)",
    "stats.cats": "Categories met",
    "stats.avgEnergy": "Avg energy",
    "stats.avgValence": "Avg valence",
    "stats.avgArousal": "Avg arousal",
    "stats.trendTitle": "7-day trend",
    "stats.trendHint": "count + averages",
    "stats.topTitle": "Most rolled moods",
    "stats.topHint": "Top 6",
    "stats.times": (n) => `${n}×`,
    "stats.none": "No stats yet — roll a bit",
    "stats.legend.count": "Count",
    "stats.legend.energy": "Energy",
    "stats.legend.arousal": "Arousal",
    "stats.legend.valence": "Valence",

    "diary.title": "Diary",
    "diary.subtitle": "Notes attached to a mood",
    "diary.attachTo": "Attached to:",
    "diary.noteLabel": "Note / event",
    "diary.notePlaceholder": "What happened today? How do you feel?",
    "diary.tagsLabel": "Tags (comma-separated)",
    "diary.tagsPlaceholder": "work, family, health…",
    "diary.listTitle": "Recent entries",
    "diary.filter": "Filter…",
    "diary.noMood": "No mood to attach yet",
    "diary.needInput": "Add a note or at least one tag",
    "diary.saved": "Diary saved",
    "diary.edited": "Updated",
    "diary.deleted": "Deleted",
    "diary.none": "No diary entries yet — jot down how you feel after a roll",
    "diary.noMatch": "No entries match your filter",

    "badges.title": "Achievements",
    "badges.count": (a, b) => `${a}/${b} unlocked`,
    "badges.unlocked": (name) => `🏅 Unlocked: ${name}`,
    "badges.more": (n) => ` (+${n})`,
    "badges.secretDesc": "A secret… try playing with everything",

    "wheel.title": "Mood Wheel",
    "wheel.hint": "The wheel picks a category, then a mood within it",
    "wheel.landed": (cat) => `Wheel landed on: ${cat}`,

    "mixer.title": "Mood Mixing Lab",
    "mixer.lead": "Pick two moods and shake them together into a brand-new one",
    "mixer.reroll": "Reroll",
    "mixer.go": "Mix!",
    "mixer.again": "Mix again",
    "mixer.use": "Use this mood",
    "mixer.desc": (a, pa, b, pb) => `A blend of “${a}” ${pa}% and “${b}” ${pb}% — many shades at once`,

    "daily.title": "Daily Mood Fortune",
    "daily.tap": "Tap to reveal",
    "daily.luckyColor": "Lucky color",
    "daily.luckyNumber": "Lucky number",
    "daily.hint": "A new fortune every midnight",
    "daily.use": "Use as current mood",
    "daily.advice": (s) => `Today's tip: ${s}`,

    "checkin.title": "Check-in — how do you feel right now?",
    "checkin.low": "Drained",
    "checkin.high": "Charged",
    "checkin.valence": "Overall feeling",
    "checkin.bad": "Awful",
    "checkin.good": "Great",
    "checkin.arousal": "Activation",
    "checkin.calm": "Still",
    "checkin.alert": "Wired",
    "checkin.matches": "Closest moods — tap to pick",
    "checkin.match": (p) => `${p}% match`,

    "breathe.title": "Box breathing (4-4-4-4)",
    "breathe.hint": "3 rounds ≈ 48 seconds • helps you settle",
    "breathe.start": "Start",
    "breathe.stop": "Stop",
    "breathe.again": "Again",
    "breathe.ready": "Ready?",
    "breathe.in": "Breathe in",
    "breathe.hold": "Hold",
    "breathe.out": "Breathe out",
    "breathe.done": "Well done 🌿",
    "breathe.doneToast": "Breathing complete — feeling steadier?",

    "help.title": "Shortcuts & tips",
    "help.roll": "Roll a mood",
    "help.burst": "Burst roll",
    "help.wheel": "Wheel",
    "help.mixer": "Mood mixer",
    "help.daily": "Daily fortune",
    "help.checkin": "Check-in",
    "help.breathe": "Breathing",
    "help.save": "Save / unsave",
    "help.copy": "Copy",
    "help.share": "Make a mood card",
    "help.theme": "Toggle theme",
    "help.lang": "Toggle language",
    "help.search": "Focus search",
    "help.help": "Open this panel",
    "help.close": "Close dialog",
    "help.tips": [
      "🔮 Tap the mood orb to play with it — try tapping really fast…",
      "🗺️ Tap the mood map to pick a mood by position",
      "🧪 Mixed moods are saved and searchable",
      "📱 On phones, enable “Shake” and shake to roll",
      "🔒 Everything stays on your device",
    ],

    "footer.offline": "EMO is 100% offline • no external libraries",
    "footer.shortcuts": "Shortcuts",

    "toast.copied": "Copied",
    "toast.copyFail": "Copy failed",
    "toast.nothingToCopy": "Nothing yet",
    "toast.saved": "Saved ⭐",
    "toast.unsaved": "Removed from saved",
    "toast.reset": "Diversity reset",
    "toast.burstDone": (n) => `Burst finished (${n})`,
    "toast.lang": "Language: English",
    "toast.themeLight": "Light theme ☀️",
    "toast.themeDark": "Dark theme 🌙",
    "toast.soundOn": "Sound on 🔊",
    "toast.soundOff": "Sound off 🔇",
    "toast.shakeOn": "Shake mode on — shake your phone to roll!",
    "toast.shakeOff": "Shake mode off",
    "toast.shakeDenied": "Motion sensor permission denied",
    "toast.cardSaved": "Mood card saved 📸",
    "toast.cardFail": "Couldn't create the card",
    "toast.party": "🎉 Mood party!",
    "toast.tryDone": "Nice! One done ✨",

    "source.roll": "Roll",
    "source.rolling": "Rolling…",
    "source.burst": (i, n) => `Burst ${i}/${n}`,
    "source.revisit": "Revisit",
    "source.search": "Search",
    "source.top": "Stats",
    "source.diary": "Diary",
    "source.sample": "Sample",
    "source.wheel": (c) => `Wheel • ${c}`,
    "source.map": "Mood map",
    "source.checkin": "Check-in",
    "source.mix": "Mixer",
    "source.daily": "Daily",
    "source.shake": "Shake",
    "status.ready": "Ready",

    "copy.mood": "Mood",
    "copy.category": "Category",
    "copy.desc": "Description",
    "copy.energy": "Energy",
    "copy.valence": "Valence",
    "copy.arousal": "Arousal",
    "copy.color": "Color",
    "card.footer": "Rolled with EMO",

    "hint.highEnergy": "High energy",
    "hint.lowEnergy": "Low energy",
    "hint.positive": "Positive",
    "hint.negative": "Negative",
    "hint.neutral": "Neutral",
    "hint.aroused": "Alert",
    "hint.calm": "Calm",
  },
};

function t(key, ...args) {
  const entry = I18N[state.lang]?.[key] ?? I18N.th[key];
  if (typeof entry === "function") return entry(...args);
  if (entry !== undefined) return entry;
  return key;
}
const locale = () => (state.lang === "en" ? "en-US" : "th-TH");

function categoryLabel(cat) {
  if (state.lang !== "en") return cat;
  return CATEGORY_LABELS.en?.[cat] ?? cat;
}
function shortCategoryLabel(cat) {
  if (state.lang === "en") return (CATEGORY_LABELS.en[cat] || cat).split("/")[0].trim();
  return SHORT_CATS[cat] || cat;
}

function applyI18nToDom() {
  document.documentElement.lang = state.lang;
  els.langLabel.textContent = state.lang === "en" ? "EN" : "ไทย";

  for (const el of $$("[data-i18n]")) el.textContent = t(el.getAttribute("data-i18n"));
  for (const el of $$("[data-i18n-placeholder]")) el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  for (const el of $$("[data-i18n-title]")) {
    const s = t(el.getAttribute("data-i18n-title"));
    el.setAttribute("title", s);
    el.setAttribute("aria-label", s);
  }
  for (const el of $$("[data-i18n-aria]")) el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));

  updateHeaderCount();
  syncModeUI();
  syncSaveButton();
  updateStreak();
  if (state.current) {
    els.moodCategory.textContent = `${themeOf(state.current.category).emoji} ${categoryLabel(state.current.category)}`;
    els.moodTagline.textContent = pickTagline(state.current);
    renderTryList(state.current);
    renderDiaryAttach();
  }
  renderHistory();
  renderFavorites();
  renderStats();
  renderDiary();
  renderBadges();
  updateSearchResults();
  renderHelp();
  drawMoodMap();
  if (isModalOpen("wheelModal")) wheelRender();
  if (!breathe.running) breatheReset();
}

function toggleLanguage() {
  state.lang = state.lang === "en" ? "th" : "en";
  saveJson(STORAGE_KEYS.lang, state.lang);
  applyI18nToDom();
  toast(t("toast.lang"));
}

// ---------- Theme & sound ----------

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
  els.themeIcon.textContent = state.theme === "light" ? "☀️" : "🌙";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", state.theme === "light" ? "#f6f4ff" : "#0a0e1f");
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  saveJson(STORAGE_KEYS.theme, state.theme);
  applyTheme();
  redrawCanvases();
  toast(state.theme === "light" ? t("toast.themeLight") : t("toast.themeDark"));
}

function applySound() {
  els.soundIcon.textContent = state.sound ? "🔊" : "🔇";
  els.btnSound.setAttribute("aria-pressed", String(state.sound));
}

function toggleSound() {
  state.sound = !state.sound;
  saveJson(STORAGE_KEYS.sound, state.sound);
  applySound();
  if (state.sound) playSound("pop");
  toast(state.sound ? t("toast.soundOn") : t("toast.soundOff"));
}

function setAccent(c) {
  const root = document.documentElement.style;
  root.setProperty("--accent", c);
  root.setProperty("--accent2", shiftHue(c, 18));
  // Pick whichever ink has better contrast on the accent
  root.setProperty("--on-accent", luminance(c) > 0.22 ? "#15122b" : "#ffffff");
}

// ---------- Smart random: weighted + anti-repeat ----------

function scoreFor(m, mode) {
  const key = moodKey(m);
  const baseW = typeof m.weight === "number" ? m.weight : 1.0;

  // Anti-repeat: hard stop for consecutive if enabled
  if (mode === "noRepeatConsecutive" && state.lastMoodKey && key === state.lastMoodKey) return 0;

  let penalty = state.penalties.get(key) ?? 1.0;

  // Further reduce items seen in the recent list
  const idx = state.recentKeys.indexOf(key);
  if (idx >= 0) {
    const extra = 1 - clamp((state.recentMax - idx) / state.recentMax, 0.1, 1);
    penalty *= clamp(0.15 + extra, 0.15, 1.0);
  }

  // Prefer under-represented categories in recent history
  if (mode === "diverse") {
    const catCount = countRecentCategory(m.category);
    penalty *= clamp(1.15 - catCount * 0.08, 0.65, 1.15);
  }

  // Small jitter to avoid ties being too deterministic
  const jitter = 0.98 + Math.random() * 0.06;
  return Math.max(0, baseW * penalty * jitter);
}

function countRecentCategory(cat) {
  let c = 0;
  for (const key of state.recentKeys.slice(0, 14)) {
    const m = keyToMood(key);
    if (m && m.category === cat) c++;
  }
  return c;
}

function weightedPick(list, getW, rnd = Math.random) {
  let total = 0;
  const weights = new Array(list.length);
  for (let i = 0; i < list.length; i++) {
    const w = getW(list[i]);
    weights[i] = w;
    total += w;
  }
  if (total <= 0) return list[Math.floor(rnd() * list.length)];
  let r = rnd() * total;
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

  // Picked mood gets a strong penalty; others slowly recover back to 1
  for (const [k, p] of state.penalties) {
    const recovered = clamp(p + 0.035, 0.1, 1.0);
    state.penalties.set(k, recovered);
    if (recovered >= 0.999) state.penalties.delete(k);
  }
  state.penalties.set(key, 0.12);
}

function pickMood() {
  const picked = weightedPick(MOODS, (m) => scoreFor(m, state.mode));
  applyAfterPick(picked);
  return picked;
}

function pickMoodFromCategory(category) {
  const list = MOODS.filter((m) => m.category === category);
  const picked = weightedPick(list.length ? list : MOODS, (m) => scoreFor(m, state.mode));
  applyAfterPick(picked);
  return picked;
}

function randomPoolMood(exclude) {
  let m = null;
  for (let i = 0; i < 12; i++) {
    m = weightedPick(MOODS, (x) => x.weight ?? 1);
    if (!exclude || baseName(m) !== baseName(exclude)) break;
  }
  return m;
}

// Nearest moods in (valence, arousal[, energy]) space, one per base name for variety
function nearestMoods(target, n = 3) {
  const pool = MOODS.concat(state.custom);
  const scored = pool.map((m) => {
    const dv = (m.valence - target.valence) / 200;
    const da = (m.arousal - target.arousal) / 100;
    const de = target.energy == null ? 0 : (m.energy - target.energy) / 100;
    return { m, d: Math.sqrt(dv * dv + da * da + de * de) };
  });
  scored.sort((a, b) => a.d - b.d);
  const out = [];
  const seen = new Set();
  for (const s of scored) {
    const b = baseName(s.m);
    if (seen.has(b)) continue;
    seen.add(b);
    out.push(s);
    if (out.length >= n) break;
  }
  return out;
}

// ---------- Custom (mixed) moods ----------

function registerCustomMood(m) {
  const key = moodKey(m);
  const existing = keyIndex.get(key);
  if (existing) return existing;
  const saved = { ...m, custom: true, t: Date.now() };
  state.custom.unshift(saved);
  if (state.custom.length > 200) state.custom.length = 200;
  keyIndex.set(key, saved);
  saveJson(STORAGE_KEYS.custom, state.custom);
  return saved;
}

// ---------- Viewer ----------

function pct(n, min, max) {
  return `${clamp(((n - min) / (max - min)) * 100, 0, 100).toFixed(0)}%`;
}
function formatSigned(n) {
  return `${n > 0 ? "+" : ""}${n}`;
}

function animateValue(el, to, fmt, instant) {
  const from = el.dataset.v == null ? to : Number(el.dataset.v);
  el.dataset.v = String(to);
  cancelAnimationFrame(el._raf);
  if (instant || from === to || prefersReducedMotion()) {
    el.textContent = fmt(to);
    return;
  }
  const start = performance.now();
  const dur = 550;
  const step = (now) => {
    const k = clamp((now - start) / dur, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(Math.round(from + (to - from) * e));
    if (k < 1) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}

function showMood(m, { source = t("source.roll"), announce = true, instant = false } = {}) {
  state.current = m;
  const c = moodColor(m);
  setAccent(c);

  els.moodEmoji.textContent = moodEmoji(m);
  els.moodName.textContent = m.name;
  els.moodCategory.textContent = `${themeOf(m.category).emoji} ${categoryLabel(m.category)}`;
  els.moodDesc.removeAttribute("data-i18n");
  els.moodDesc.textContent = m.description;
  els.colorDot.style.background = c;
  els.colorCode.textContent = c;

  animateValue(els.valEnergy, m.energy, (v) => `${v}/100`, instant);
  animateValue(els.valValence, m.valence, (v) => formatSigned(v), instant);
  animateValue(els.valArousal, m.arousal, (v) => `${v}/100`, instant);

  els.barEnergy.style.width = pct(m.energy, 0, 100);
  els.barArousal.style.width = pct(m.arousal, 0, 100);
  els.barValenceLeft.style.width = m.valence < 0 ? pct(Math.abs(m.valence), 0, 100) : "0%";
  els.barValenceRight.style.width = m.valence > 0 ? pct(m.valence, 0, 100) : "0%";

  els.moodTagline.textContent = pickTagline(m);
  els.statusText.textContent = `${source} • ${new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" })}`;

  syncSaveButton();
  if (!instant) {
    renderTryList(m);
    renderDiaryAttach();
    syncBreatheSuggest(m);
  }
  drawMoodMap();

  if (announce) {
    recordRollEvent(m, source);
    pushHistory(m);
    renderHistory();
    renderStats();
    updateStreak();
    checkBadges();
    els.srLive.textContent = `${m.name} — ${categoryLabel(m.category)}`;
  }
}

function pickTagline(m) {
  const list = TAGLINES_BY_CATEGORY[m.category] ?? TAGLINES_BY_CATEGORY[MIX_CATEGORY];
  const rnd = mulberry32(hash32(`${m.name}|${m.category}|${m.energy}|${m.valence}|${m.arousal}`));
  const base = list[Math.floor(rnd() * list.length)];
  const hint = buildHint(m);
  return hint ? `${base} · ${hint}` : base;
}

function buildHint(m) {
  const parts = [];
  if (m.energy >= 75) parts.push(t("hint.highEnergy"));
  else if (m.energy <= 20) parts.push(t("hint.lowEnergy"));

  if (m.valence >= 55) parts.push(t("hint.positive"));
  else if (m.valence <= -55) parts.push(t("hint.negative"));
  else parts.push(t("hint.neutral"));

  if (m.arousal >= 75) parts.push(t("hint.aroused"));
  else if (m.arousal <= 20) parts.push(t("hint.calm"));

  return parts.slice(0, 2).join(" • ");
}

function needsCalming(m) {
  return !!m && (m.valence <= -30 || m.arousal >= 72) && m.category !== "ความสงบ";
}
function syncBreatheSuggest(m) {
  els.btnBreatheQuick.classList.toggle("suggest", needsCalming(m));
}

// "Try this" suggestions, checkable per day
function triedToday() {
  const today = dateKey();
  if (state.tried.day !== today) state.tried = { day: today, done: [] };
  if (!Array.isArray(state.tried.done)) state.tried.done = [];
  return state.tried;
}

function renderTryList(m) {
  const list = SUGGESTIONS[m.category] ?? SUGGESTIONS[MIX_CATEGORY];
  const done = new Set(triedToday().done);
  els.tryList.innerHTML = "";
  for (const pair of list) {
    const id = pair[0];
    const isDone = done.has(id);
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.setAttribute("role", "checkbox");
    li.setAttribute("aria-checked", String(isDone));
    li.classList.toggle("done", isDone);
    const chk = document.createElement("span");
    chk.className = "chk";
    chk.textContent = isDone ? "✓" : "";
    const txt = document.createElement("span");
    txt.textContent = pair[state.lang === "en" ? 1 : 0];
    li.append(chk, txt);
    const act = () => toggleTried(id, li);
    li.addEventListener("click", act);
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        act();
      }
    });
    els.tryList.appendChild(li);
  }
}

function toggleTried(id, li) {
  const tr = triedToday();
  const set = new Set(tr.done);
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
    playSound("pop");
    const r = li.getBoundingClientRect();
    fxBurst(r.left + 18, r.top + r.height / 2, { colors: [state.current ? moodColor(state.current) : "#7c3aed", "#fbbf24", "#34d399"], count: 16, power: 5 });
    toast(t("toast.tryDone"));
    bump("tried");
  }
  tr.done = Array.from(set);
  saveJson(STORAGE_KEYS.tried, tr);
  if (state.current) renderTryList(state.current);
}

// ---------- Mood map (valence × arousal) ----------

const MAP_PAD = 8;

function drawMoodMap() {
  const canvas = els.mapCanvas;
  if (!canvas) return;
  const prep = prepCanvas(canvas);
  if (!prep) return;
  const { ctx, w, h } = prep;
  const pw = w - MAP_PAD * 2;
  const ph = h - MAP_PAD * 2;
  const mx = (v) => MAP_PAD + ((v + 100) / 200) * pw;
  const my = (a) => MAP_PAD + (1 - a / 100) * ph;
  const light = state.theme === "light";

  ctx.save();
  roundRect(ctx, 0, 0, w, h, 12);
  ctx.clip();
  ctx.fillStyle = light ? "rgba(255,255,255,.5)" : "rgba(0,0,0,.16)";
  ctx.fillRect(0, 0, w, h);

  // quadrant tints, glowing from their outer corner
  const quads = [
    { x: w, y: 0, c: "#f472b6", label: t("map.q1"), ax: "right", ay: "top" },
    { x: 0, y: 0, c: "#f97316", label: t("map.q2"), ax: "left", ay: "top" },
    { x: 0, y: h, c: "#60a5fa", label: t("map.q3"), ax: "left", ay: "bottom" },
    { x: w, y: h, c: "#34d399", label: t("map.q4"), ax: "right", ay: "bottom" },
  ];
  for (const q of quads) {
    const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, Math.max(w, h) * 0.75);
    g.addColorStop(0, hexA(q.c, light ? 0.28 : 0.26));
    g.addColorStop(1, hexA(q.c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // axes
  ctx.strokeStyle = cssVar("--line-2") || "rgba(255,255,255,.2)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(mx(0), MAP_PAD);
  ctx.lineTo(mx(0), h - MAP_PAD);
  ctx.moveTo(MAP_PAD, my(50));
  ctx.lineTo(w - MAP_PAD, my(50));
  ctx.stroke();
  ctx.setLineDash([]);

  // quadrant labels
  ctx.font = "700 10.5px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = cssVar("--muted") || "rgba(255,255,255,.6)";
  for (const q of quads) {
    ctx.textAlign = q.ax === "right" ? "right" : "left";
    ctx.textBaseline = q.ay === "top" ? "top" : "bottom";
    ctx.fillText(q.label, q.ax === "right" ? w - 10 : 10, q.ay === "top" ? 8 : h - 7);
  }

  // recent trail
  const accent = state.current ? moodColor(state.current) : "#7c3aed";
  const evs = state.rollEvents.slice(0, 14).reverse();
  if (evs.length > 1) {
    ctx.strokeStyle = hexA(accent, 0.35);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    evs.forEach((e, i) => {
      const x = mx(e.valence ?? 0);
      const y = my(e.arousal ?? 50);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }
  evs.forEach((e, i) => {
    const m = keyToMood(e.key);
    ctx.fillStyle = hexA(m ? moodColor(m) : accent, 0.35 + (i / Math.max(1, evs.length)) * 0.5);
    ctx.beginPath();
    ctx.arc(mx(e.valence ?? 0), my(e.arousal ?? 50), 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // current mood
  if (state.current) {
    const x = mx(state.current.valence);
    const y = my(state.current.arousal);
    const g = ctx.createRadialGradient(x, y, 0, x, y, 24);
    g.addColorStop(0, hexA(accent, 0.75));
    g.addColorStop(1, hexA(accent, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `18px ${cssVar("--emoji") || "sans-serif"}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(moodEmoji(state.current), x, y + 1);
  }
  ctx.restore();
}

function onMapClick(e) {
  const rect = els.mapCanvas.getBoundingClientRect();
  const px = e.clientX - rect.left;
  const py = e.clientY - rect.top;
  const valence = clamp(((px - MAP_PAD) / (rect.width - MAP_PAD * 2)) * 200 - 100, -100, 100);
  const arousal = clamp((1 - (py - MAP_PAD) / (rect.height - MAP_PAD * 2)) * 100, 0, 100);
  const top = nearestMoods({ valence, arousal }, 4);
  if (!top.length) return;
  const m = weightedPick(top, (s) => 1 / (0.02 + s.d)).m;
  applyAfterPick(m);
  playSound("pop");
  fxBurst(e.clientX, e.clientY, { colors: [moodColor(m), "#ffffff"], count: 14, power: 4, gravity: 0.08 });
  showMood(m, { source: t("source.map"), announce: true });
  reveal(m, { burst: false });
  bump("map");
}

// ---------- Effects: particles ----------

const fx = { ctx: null, parts: [], raf: 0, w: 0, h: 0 };

function fxInit() {
  fx.ctx = els.fxCanvas.getContext("2d");
  fxResize();
}
function fxResize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  fx.w = window.innerWidth;
  fx.h = window.innerHeight;
  els.fxCanvas.width = Math.floor(fx.w * dpr);
  els.fxCanvas.height = Math.floor(fx.h * dpr);
  fx.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
}
function fxSpawn(p) {
  if (fx.parts.length > 420) return;
  fx.parts.push(p);
  if (!fx.raf) fx.raf = requestAnimationFrame(fxTick);
}
function fxBurst(x, y, { colors = ["#ffffff"], emojis = [], count = 36, power = 9, gravity = 0.26, spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
  if (!fx.ctx || prefersReducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const a = angle + (Math.random() - 0.5) * spread;
    const sp = power * (0.45 + Math.random() * 0.8);
    const isEmoji = emojis.length > 0 && Math.random() < 0.3;
    fxSpawn({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - (spread > 3 ? 2 : 0),
      g: gravity,
      drag: 0.982,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      life: 0,
      ttl: 55 + Math.random() * 50,
      size: isEmoji ? 18 + Math.random() * 14 : 5 + Math.random() * 6,
      color: pickOne(colors),
      shape: isEmoji ? "emoji" : Math.random() < 0.55 ? "rect" : "circle",
      ch: isEmoji ? pickOne(emojis) : null,
    });
  }
}
function fxRain(emojis, count = 50) {
  if (!fx.ctx || prefersReducedMotion() || !emojis.length) return;
  for (let i = 0; i < count; i++) {
    fxSpawn({
      x: Math.random() * fx.w,
      y: -30 - Math.random() * fx.h * 0.8,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 2 + Math.random() * 3,
      g: 0.04,
      drag: 0.995,
      rot: (Math.random() - 0.5) * 0.6,
      vr: (Math.random() - 0.5) * 0.05,
      life: 0,
      ttl: 420,
      size: 22 + Math.random() * 20,
      color: "#fff",
      shape: "emoji",
      ch: pickOne(emojis),
    });
  }
}
function fxTick() {
  const { ctx, w, h } = fx;
  ctx.clearRect(0, 0, w, h);
  const emojiFont = cssVar("--emoji") || "sans-serif";
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i];
    p.vx *= p.drag;
    p.vy = p.vy * p.drag + p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life++;
    if (p.life > p.ttl || p.y > h + 60) {
      fx.parts.splice(i, 1);
      continue;
    }
    const alpha = 1 - clamp((p.life - p.ttl * 0.7) / (p.ttl * 0.3), 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    if (p.shape === "emoji") {
      ctx.font = `${p.size}px ${emojiFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.ch, 0, 0);
    } else {
      ctx.fillStyle = p.color;
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
  fx.raf = fx.parts.length ? requestAnimationFrame(fxTick) : 0;
  if (!fx.raf) ctx.clearRect(0, 0, w, h);
}

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// ---------- Sound & haptics ----------

let audioCtx = null;

function initAudio() {
  if (!state.sound) return;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
}

function tone({ f = 440, to = null, dur = 0.12, type = "sine", vol = 0.06, at = 0 }) {
  const t0 = audioCtx.currentTime + at;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function playSound(type) {
  if (!state.sound) return;
  initAudio();
  if (!audioCtx) return;
  try {
    switch (type) {
      case "click":
        tone({ f: 800, to: 300, dur: 0.04, vol: 0.035 });
        break;
      case "chime":
        tone({ f: 880, dur: 0.8, type: "triangle", vol: 0.08 });
        tone({ f: 1318.51, dur: 0.8, vol: 0.05 });
        break;
      case "pop":
        tone({ f: 520, to: 980, dur: 0.09, vol: 0.06 });
        break;
      case "success":
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, dur: 0.24, type: "triangle", vol: 0.06, at: i * 0.08 }));
        break;
      case "whoosh":
        tone({ f: 180, to: 900, dur: 0.35, type: "sawtooth", vol: 0.018 });
        break;
      case "breath":
        tone({ f: 392, dur: 0.9, vol: 0.035 });
        break;
    }
  } catch {
    // ignore audio errors
  }
}

function haptic(pattern = [40, 40, 40]) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

function toast(msg, ms = 1700) {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => els.toast.classList.remove("show"), ms);
}

// ---------- Rolling ----------

function reveal(m, { burst = true } = {}) {
  const v = els.viewer;
  v.classList.remove("revealed");
  void v.offsetWidth;
  v.classList.add("revealed");
  clearTimeout(reveal._t);
  reveal._t = setTimeout(() => v.classList.remove("revealed"), 900);
  playSound("chime");
  haptic([30, 40, 30]);
  if (burst) {
    const c = moodColor(m);
    const { x, y } = centerOf(els.moodBadge);
    fxBurst(x, y, { colors: [c, shiftHue(c, 35), shiftHue(c, -35), "#ffffff"], emojis: [moodEmoji(m)], count: 34 });
  }
}

function setBusy(busy) {
  for (const el of [els.btnRoll, els.btnBurst, els.fabRoll, els.burstCount, els.burstMinus, els.burstPlus]) el.disabled = busy;
  els.btnRoll.classList.toggle("busy", busy);
  els.fabRoll.classList.toggle("busy", busy);
}

async function rollOnce({ source, internal = false, flashes } = {}) {
  if (!internal && state.rolling) return null;
  if (!internal) {
    state.rolling = true;
    setBusy(true);
  }
  try {
    initAudio();
    const n = prefersReducedMotion() ? 1 : flashes ?? 8;
    els.viewer.classList.remove("revealed");
    els.viewer.classList.add("rolling");
    // short "shuffling" illusion
    for (let i = 0; i < n; i++) {
      showMood(pickOne(MOODS), { source: t("source.rolling"), announce: false, instant: true });
      playSound("click");
      await sleep(38 + i * i * 2.2);
    }
    els.viewer.classList.remove("rolling");
    const m = pickMood();
    showMood(m, { source: source ?? t("source.roll"), announce: true });
    reveal(m);
    return m;
  } finally {
    els.viewer.classList.remove("rolling");
    if (!internal) {
      state.rolling = false;
      setBusy(false);
    }
  }
}

async function rollBurst() {
  if (state.rolling) return;
  const n = clamp(parseInt(els.burstCount.value || "5", 10) || 5, 1, 30);
  els.burstCount.value = String(n);
  state.rolling = true;
  setBusy(true);
  try {
    for (let i = 0; i < n; i++) {
      await rollOnce({ source: t("source.burst", i + 1, n), internal: true, flashes: 4 });
      await sleep(140);
    }
    bumpMax("burstMax", n);
    toast(t("toast.burstDone", n));
  } finally {
    state.rolling = false;
    setBusy(false);
  }
}

function stepBurst(delta) {
  const n = clamp((parseInt(els.burstCount.value || "5", 10) || 5) + delta, 1, 30);
  els.burstCount.value = String(n);
}

function resetDiversity() {
  state.lastMoodKey = null;
  state.recentKeys = [];
  state.penalties.clear();
  toast(t("toast.reset"));
}

// ---------- Mode ----------

function setMode(mode) {
  if (!MODES.includes(mode)) return;
  state.mode = mode;
  saveJson(STORAGE_KEYS.mode, mode);
  syncModeUI();
}

function syncModeUI() {
  for (const b of els.modeGroup.querySelectorAll("[data-mode]")) {
    const on = b.dataset.mode === state.mode;
    b.setAttribute("aria-checked", String(on));
    b.tabIndex = on ? 0 : -1;
  }
  const hintKey = { normal: "mode.normalHint", noRepeatConsecutive: "mode.noRepeatHint", diverse: "mode.diverseHint" }[state.mode];
  els.modeHint.textContent = t(hintKey);
}

// ---------- Search ----------

function normalizeText(s) {
  return (s || "").toString().trim().toLowerCase();
}

function updateSearchResults() {
  const q = normalizeText(els.search.value);
  els.searchResults.innerHTML = "";

  if (!q) {
    els.searchTitle.textContent = t("search.categories");
    els.searchCount.textContent = String(CATEGORY_ORDER.length);
    const counts = new Map();
    for (const m of MOODS) counts.set(m.category, (counts.get(m.category) ?? 0) + 1);
    for (const cat of CATEGORY_ORDER) {
      const th = themeOf(cat);
      els.searchResults.appendChild(
        makeChip({ name: categoryLabel(cat), meta: t("search.catMeta", counts.get(cat) ?? 0), color: th.color, emoji: th.emoji }, () => {
          els.search.value = categoryLabel(cat);
          updateSearchResults();
        })
      );
    }
    return;
  }

  const results = [];
  for (const m of state.custom.concat(MOODS)) {
    const name = normalizeText(m.name);
    const cat = normalizeText(m.category);
    const catEn = normalizeText(CATEGORY_LABELS.en[m.category]);
    if (name.includes(q) || cat.includes(q) || catEn.includes(q)) results.push(m);
  }

  els.searchTitle.textContent = t("search.results");
  els.searchCount.textContent = t("search.count", results.length);

  if (!results.length) {
    els.searchResults.appendChild(emptyState("🔍", t("search.none")));
    return;
  }

  for (const m of results.slice(0, 40)) {
    els.searchResults.appendChild(
      makeChip({ name: m.name, meta: categoryLabel(m.category), color: moodColor(m), emoji: moodEmoji(m) }, () => {
        showMood(m, { source: t("source.search"), announce: true });
        reveal(m, { burst: false });
        if (window.matchMedia("(max-width: 860px)").matches) els.viewer.scrollIntoView({ behavior: "smooth", block: "start" });
      })
    );
  }
}

function makeChip({ name, meta, color, emoji }, onClick) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = "chip";
  el.style.setProperty("--chip-c", color || "#7c3aed");
  el.addEventListener("click", onClick);

  const dot = document.createElement("span");
  dot.className = "dotMini";
  const nm = document.createElement("span");
  nm.className = "chipName";
  nm.textContent = emoji ? `${emoji} ${name}` : name;
  const mt = document.createElement("span");
  mt.className = "chipMeta";
  mt.textContent = meta || "";

  el.append(dot, nm, mt);
  return el;
}

function emptyState(icon, text) {
  const div = document.createElement("div");
  div.className = "empty";
  const ic = document.createElement("span");
  ic.className = "emptyIc";
  ic.textContent = icon;
  const tx = document.createElement("span");
  tx.textContent = text;
  div.append(ic, tx);
  return div;
}

// ---------- History & favorites ----------

function pushHistory(m) {
  state.history.unshift({ key: moodKey(m), t: Date.now() });
  state.history = dedupeByKey(state.history, 60);
  saveJson(STORAGE_KEYS.history, state.history);
}

function recordRollEvent(m, source) {
  const now = new Date();
  state.rollEvents.unshift({
    key: moodKey(m),
    category: m.category,
    t: now.getTime(),
    energy: m.energy,
    valence: m.valence,
    arousal: m.arousal,
    source,
  });
  if (state.rollEvents.length > 2000) state.rollEvents.length = 2000;
  saveJson(STORAGE_KEYS.rolls, state.rollEvents);
  if (now.getHours() < 4) bump("night");
}

function dedupeByKey(list, max) {
  const out = [];
  const seen = new Set();
  for (const it of list) {
    if (!it || !it.key || seen.has(it.key)) continue;
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
  const m = state.current;
  if (m.custom) registerCustomMood(m);
  const key = moodKey(m);
  if (isFavoriteKey(key)) {
    state.favorites = state.favorites.filter((x) => x.key !== key);
    toast(t("toast.unsaved"));
  } else {
    state.favorites.unshift({ key, t: Date.now() });
    state.favorites = dedupeByKey(state.favorites, 80);
    toast(t("toast.saved"));
    playSound("pop");
    const { x, y } = centerOf(els.btnSave);
    fxBurst(x, y, { colors: ["#fbbf24", "#fde68a", "#f59e0b"], emojis: ["⭐"], count: 18, power: 6 });
  }
  saveJson(STORAGE_KEYS.favorites, state.favorites);
  syncSaveButton();
  renderFavorites();
  checkBadges();
}

function syncSaveButton() {
  const on = !!state.current && isFavoriteKey(moodKey(state.current));
  els.btnSave.querySelector(".ic").textContent = on ? "★" : "☆";
  els.btnSave.querySelector("[data-i18n]").textContent = on ? t("actions.saved") : t("actions.save");
  els.btnSave.classList.toggle("on", on);
  els.btnSave.setAttribute("aria-pressed", String(on));
}

function renderHistory() {
  els.history.innerHTML = "";
  const items = state.history.slice(0, 30).map((it) => [keyToMood(it.key), it.t]).filter(([m]) => m);
  if (!items.length) {
    els.history.appendChild(emptyState("🕘", t("history.none")));
    return;
  }
  for (const [m, time] of items) els.history.appendChild(renderItem(m, time, { allowRemove: false }));
}

function renderFavorites() {
  els.favorites.innerHTML = "";
  const items = state.favorites.map((it) => [keyToMood(it.key), it.t]).filter(([m]) => m);
  if (!items.length) {
    els.favorites.appendChild(emptyState("⭐", t("favorites.none")));
    return;
  }
  for (const [m, time] of items) els.favorites.appendChild(renderItem(m, time, { allowRemove: true }));
}

function renderItem(m, time, { allowRemove }) {
  const el = document.createElement("div");
  el.className = "item";
  el.tabIndex = 0;
  el.setAttribute("role", "button");
  el.style.setProperty("--item-c", moodColor(m));
  const open = () => {
    showMood(m, { source: t("source.revisit"), announce: false });
    reveal(m, { burst: false });
  };
  el.addEventListener("click", open);
  el.addEventListener("keydown", (e) => {
    if (e.target === el && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open();
    }
  });

  const left = document.createElement("div");
  left.className = "itemLeft";
  const emo = document.createElement("div");
  emo.className = "itemEmoji";
  emo.textContent = moodEmoji(m);
  const txt = document.createElement("div");
  txt.className = "itemText";
  const name = document.createElement("div");
  name.className = "itemName";
  name.textContent = m.name;
  const meta = document.createElement("div");
  meta.className = "itemMeta";
  const when = new Date(time).toLocaleString(locale(), { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  meta.textContent = `${categoryLabel(m.category)} • ${when}`;
  txt.append(name, meta);
  left.append(emo, txt);

  const right = document.createElement("div");
  right.className = "itemRight";
  if (allowRemove) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "miniBtn";
    btn.textContent = t("actions.remove");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      state.favorites = state.favorites.filter((x) => x.key !== moodKey(m));
      saveJson(STORAGE_KEYS.favorites, state.favorites);
      syncSaveButton();
      renderFavorites();
      toast(t("toast.unsaved"));
    });
    right.appendChild(btn);
  } else {
    const dot = document.createElement("span");
    dot.className = "miniDot";
    dot.style.background = moodColor(m);
    right.appendChild(dot);
  }

  el.append(left, right);
  return el;
}

// ---------- Stats ----------

function computeStreak() {
  const days = new Set(state.rollEvents.map((e) => dateKey(new Date(e.t || 0))));
  const d = new Date();
  if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(dateKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function updateStreak() {
  const n = computeStreak();
  els.streakValue.textContent = String(n);
  els.streakChip.dataset.zero = n ? "0" : "1";
  els.streakChip.title = t("top.streak", n);
  els.streakChip.setAttribute("aria-label", t("top.streak", n));
}

function updateHeaderCount() {
  const cats = new Set(MOODS.map((m) => m.category)).size;
  els.stats.textContent = t("app.count", MOODS.length.toLocaleString(locale()), cats);
}

function renderStats() {
  const evs = state.rollEvents;
  const total = evs.length;
  const unique = new Set(evs.map((e) => e && e.key).filter(Boolean)).size;
  const cats = new Set(evs.map((e) => e && e.category).filter(Boolean)).size;

  const avg = (field) => {
    let s = 0, n = 0;
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

  els.statTotal.textContent = total.toLocaleString(locale());
  els.statUnique.textContent = unique.toLocaleString(locale());
  els.statStreak.textContent = `🔥 ${computeStreak()}`;
  els.statCats.textContent = `${cats}/${CATEGORY_ORDER.length}`;
  els.statAvgEnergy.textContent = avgEnergy == null ? "—" : `${Math.round(avgEnergy)}/100`;
  els.statAvgValence.textContent = avgValence == null ? "—" : formatSigned(Math.round(avgValence));
  els.statAvgArousal.textContent = avgArousal == null ? "—" : `${Math.round(avgArousal)}/100`;

  renderTopMoods();
  if (state.tab === "stats") drawTrend7d();
}

function renderTopMoods() {
  els.topMoods.innerHTML = "";
  if (!state.rollEvents.length) {
    els.topMoods.appendChild(emptyState("📊", t("stats.none")));
    return;
  }

  const counts = new Map();
  for (const e of state.rollEvents) if (e?.key) counts.set(e.key, (counts.get(e.key) ?? 0) + 1);

  const rows = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ m: keyToMood(key), count }))
    .filter((x) => x.m)
    .slice(0, 6);

  const max = rows.length ? rows[0].count : 1;
  rows.forEach((r, i) => {
    const el = document.createElement("div");
    el.className = "topRow";
    el.addEventListener("click", () => {
      showMood(r.m, { source: t("source.top"), announce: false });
      reveal(r.m, { burst: false });
    });

    const left = document.createElement("div");
    left.className = "topLeft";
    const rank = document.createElement("span");
    rank.className = "topRank";
    rank.textContent = String(i + 1);
    const name = document.createElement("div");
    name.className = "topName";
    name.textContent = `${moodEmoji(r.m)} ${r.m.name}`;
    left.append(rank, name);

    const bar = document.createElement("div");
    bar.className = "miniBar";
    const fill = document.createElement("div");
    fill.className = "miniBarFill";
    fill.style.width = `${clamp((r.count / max) * 100, 0, 100).toFixed(0)}%`;
    fill.style.background = moodColor(r.m);
    bar.appendChild(fill);

    const right = document.createElement("div");
    right.className = "topCount";
    right.textContent = t("stats.times", r.count);

    el.append(left, bar, right);
    els.topMoods.appendChild(el);
  });
}

function lastNDaysStarts(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (n - 1));
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(d.getTime());
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function drawTrend7d() {
  const prep = prepCanvas(els.statsCanvas);
  if (!prep) return;
  const { ctx, w, h } = prep;

  const days = lastNDaysStarts(7);
  const keys = days.map((ts) => dateKey(new Date(ts)));
  const buckets = new Map(keys.map((k) => [k, { c: 0, e: 0, v: 0, a: 0 }]));
  for (const ev of state.rollEvents) {
    const b = buckets.get(dateKey(new Date(ev.t || 0)));
    if (!b) continue;
    b.c += 1;
    b.e += ev.energy ?? 0;
    b.v += ev.valence ?? 0;
    b.a += ev.arousal ?? 0;
  }
  const series = keys.map((k) => buckets.get(k));
  const count = series.map((b) => b.c);
  const energy = series.map((b) => (b.c ? b.e / b.c : null));
  const valence = series.map((b) => (b.c ? b.v / b.c : null));
  const arousal = series.map((b) => (b.c ? b.a / b.c : null));

  const muted = cssVar("--muted") || "rgba(255,255,255,.65)";
  const grid = cssVar("--chart-grid") || "rgba(255,255,255,.08)";
  const x0 = 18, x1 = w - 18, yTop = 30, yBot = h - 24;
  const plotH = yBot - yTop;
  const xAt = (i) => x0 + ((x1 - x0) * i) / 6;

  ctx.strokeStyle = grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = yTop + (plotH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
  }

  const maxC = Math.max(1, ...count);
  const accent = state.current ? moodColor(state.current) : "#7c3aed";
  for (let i = 0; i < 7; i++) {
    const bh = (count[i] / maxC) * plotH * 0.6;
    ctx.fillStyle = hexA(accent, 0.28);
    roundRect(ctx, xAt(i) - 9, yBot - bh, 18, Math.max(bh, 0.01), 5);
    ctx.fill();
  }

  const lines = [
    [energy, 0, 100, "#22d3ee"],
    [arousal, 0, 100, "#34d399"],
    [valence, -100, 100, "#fb7185"],
  ];
  for (const [s, min, max, stroke] of lines) {
    const pts = [];
    s.forEach((v, i) => {
      if (v == null) return;
      pts.push([xAt(i), yBot - clamp((v - min) / (max - min), 0, 1) * plotH]);
    });
    if (!pts.length) continue;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
    ctx.fillStyle = stroke;
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = muted;
  ctx.font = "700 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  days.forEach((ts, i) => ctx.fillText(new Date(ts).toLocaleDateString(locale(), { weekday: "short" }), xAt(i), yBot + 6));

  // legend
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  let lx = x0;
  const legend = [
    [t("stats.legend.count"), hexA(accent, 0.5)],
    [t("stats.legend.energy"), "#22d3ee"],
    [t("stats.legend.arousal"), "#34d399"],
    [t("stats.legend.valence"), "#fb7185"],
  ];
  for (const [name, color] of legend) {
    ctx.fillStyle = color;
    roundRect(ctx, lx, 9, 10, 6, 3);
    ctx.fill();
    ctx.fillStyle = muted;
    ctx.fillText(name, lx + 14, 12);
    lx += 14 + ctx.measureText(name).width + 14;
  }
}

// ---------- Tabs ----------

function setTab(name, { focus = false } = {}) {
  if (!TABS.includes(name)) name = "history";
  state.tab = name;
  saveJson(STORAGE_KEYS.tab, name);
  for (const tab of $$(".tab")) {
    const on = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  }
  for (const panel of $$(".tabPanel")) panel.hidden = panel.dataset.panel !== name;
  if (name === "stats") drawTrend7d();
  if (name === "badges") {
    state.unseenBadges = 0;
    renderBadgeDot();
  }
}

function onTabKey(e) {
  const i = TABS.indexOf(state.tab);
  let next = null;
  if (e.key === "ArrowRight") next = TABS[(i + 1) % TABS.length];
  else if (e.key === "ArrowLeft") next = TABS[(i - 1 + TABS.length) % TABS.length];
  else if (e.key === "Home") next = TABS[0];
  else if (e.key === "End") next = TABS[TABS.length - 1];
  if (next) {
    e.preventDefault();
    setTab(next, { focus: true });
  }
}

// ---------- Diary ----------

function parseTags(raw) {
  const out = [];
  const seen = new Set();
  for (const p of (raw || "").toString().split(",").map((x) => x.trim()).filter(Boolean)) {
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out.slice(0, 12);
}

// Keep diary entries even if their mood key can't be resolved (never drop user notes)
function diaryMood(d) {
  const m = keyToMood(d.key);
  if (m) return m;
  const [name, category] = String(d.key || "").split("__");
  return { name: name || "—", category: category || MIX_CATEGORY, description: "", energy: 50, valence: 0, arousal: 50, color: themeOf(category).color, emoji: themeOf(category).emoji };
}

function renderDiaryAttach() {
  const m = state.current;
  els.diaryAttach.textContent = m ? `${moodEmoji(m)} ${m.name}` : "—";
}

function openDiary() {
  setTab("diary");
  els.sideCard.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => els.diaryNote.focus({ preventScroll: true }), 350);
}

function saveDiaryEntry() {
  if (!state.current) return toast(t("diary.noMood"));
  const note = (els.diaryNote.value || "").trim();
  const tags = parseTags(els.diaryTags.value);
  if (!note && tags.length === 0) return toast(t("diary.needInput"));
  if (state.current.custom) registerCustomMood(state.current);

  state.diary.unshift({
    id: `d_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    key: moodKey(state.current),
    t: Date.now(),
    note,
    tags,
  });
  if (state.diary.length > 400) state.diary.length = 400;
  saveJson(STORAGE_KEYS.diary, state.diary);
  els.diaryNote.value = "";
  els.diaryTags.value = "";
  renderDiary();
  toast(t("diary.saved"));
  playSound("pop");
  checkBadges();
}

function renderDiary() {
  els.diaryList.innerHTML = "";
  if (!state.diary.length) {
    els.diaryList.appendChild(emptyState("📔", t("diary.none")));
    return;
  }
  const q = normalizeText(els.diaryFilter.value);
  const list = state.diary.filter((d) => {
    if (!q) return true;
    const m = diaryMood(d);
    const hay = [d.note, (d.tags || []).join(" "), m.name, m.category, CATEGORY_LABELS.en[m.category]].map(normalizeText).join(" ");
    return hay.includes(q.replace(/^#/, ""));
  });
  if (!list.length) {
    els.diaryList.appendChild(emptyState("🔍", t("diary.noMatch")));
    return;
  }
  for (const d of list.slice(0, 40)) els.diaryList.appendChild(renderDiaryItem(d, diaryMood(d)));
}

function renderDiaryItem(d, m) {
  const wrap = document.createElement("div");
  wrap.className = "diaryItem";
  wrap.style.setProperty("--item-c", moodColor(m));

  const top = document.createElement("div");
  top.className = "diaryTop";

  const title = document.createElement("button");
  title.type = "button";
  title.className = "diaryTitle";
  title.textContent = `${moodEmoji(m)} ${m.name}`;
  title.addEventListener("click", () => {
    if (!keyToMood(d.key)) return;
    showMood(m, { source: t("source.diary"), announce: false });
    reveal(m, { burst: false });
  });

  const btns = document.createElement("div");
  btns.className = "diaryBtns";
  const editing = state.diaryEditing === d.id;
  if (!editing) {
    const btnEdit = document.createElement("button");
    btnEdit.type = "button";
    btnEdit.className = "miniBtn";
    btnEdit.textContent = t("actions.edit");
    btnEdit.addEventListener("click", () => {
      state.diaryEditing = d.id;
      state.diaryConfirm = null;
      renderDiary();
    });
    const confirming = state.diaryConfirm === d.id;
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = `miniBtn${confirming ? " danger" : ""}`;
    btnDel.textContent = confirming ? t("actions.confirmDelete") : t("actions.delete");
    btnDel.addEventListener("click", () => {
      if (!confirming) {
        state.diaryConfirm = d.id;
        renderDiary();
        clearTimeout(renderDiaryItem._t);
        renderDiaryItem._t = setTimeout(() => {
          if (state.diaryConfirm === d.id) {
            state.diaryConfirm = null;
            renderDiary();
          }
        }, 3000);
        return;
      }
      state.diary = state.diary.filter((x) => x.id !== d.id);
      state.diaryConfirm = null;
      saveJson(STORAGE_KEYS.diary, state.diary);
      renderDiary();
      toast(t("diary.deleted"));
    });
    btns.append(btnEdit, btnDel);
  }
  top.append(title, btns);

  const meta = document.createElement("div");
  meta.className = "diaryMeta";
  const when = new Date(d.t).toLocaleString(locale(), { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  const metaTag = document.createElement("span");
  metaTag.className = "tag";
  metaTag.textContent = `${categoryLabel(m.category)} • ${when}`;
  meta.appendChild(metaTag);
  for (const tag of d.tags || []) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "tag";
    b.textContent = `#${tag}`;
    b.addEventListener("click", () => {
      els.diaryFilter.value = `#${tag}`;
      renderDiary();
    });
    meta.appendChild(b);
  }

  wrap.append(top, meta);

  if (editing) {
    const form = document.createElement("div");
    form.className = "diaryEdit";
    const ta = document.createElement("textarea");
    ta.rows = 3;
    ta.value = d.note || "";
    const tags = document.createElement("input");
    tags.type = "text";
    tags.value = (d.tags || []).join(", ");
    tags.placeholder = t("diary.tagsPlaceholder");
    const row = document.createElement("div");
    row.className = "row";
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "miniBtn";
    cancel.textContent = t("actions.cancel");
    cancel.addEventListener("click", () => {
      state.diaryEditing = null;
      renderDiary();
    });
    const save = document.createElement("button");
    save.type = "button";
    save.className = "btn primary";
    save.textContent = t("actions.diarySave");
    save.addEventListener("click", () => {
      d.note = (ta.value || "").trim();
      d.tags = parseTags(tags.value);
      state.diaryEditing = null;
      saveJson(STORAGE_KEYS.diary, state.diary);
      renderDiary();
      toast(t("diary.edited"));
    });
    row.append(cancel, save);
    form.append(ta, tags, row);
    wrap.appendChild(form);
    setTimeout(() => ta.focus(), 0);
  } else {
    const note = document.createElement("div");
    note.className = "diaryNoteText";
    note.textContent = (d.note || "").trim() || "—";
    wrap.appendChild(note);
  }
  return wrap;
}

// ---------- Achievements ----------

const cnt = (name) => (s) => s.c[name] || 0;
const BADGES = [
  { id: "first", icon: "🎲", th: ["ก้าวแรก", "สุ่มอารมณ์ครั้งแรก"], en: ["First roll", "Roll your first mood"], get: (s) => s.total, target: 1 },
  { id: "roll10", icon: "🔟", th: ["อุ่นเครื่อง", "สุ่มครบ 10 ครั้ง"], en: ["Warming up", "Roll 10 times"], get: (s) => s.total, target: 10 },
  { id: "roll50", icon: "🎯", th: ["ขาประจำ", "สุ่มครบ 50 ครั้ง"], en: ["Regular", "Roll 50 times"], get: (s) => s.total, target: 50 },
  { id: "roll100", icon: "💯", th: ["ร้อยอารมณ์", "สุ่มครบ 100 ครั้ง"], en: ["Centurion", "Roll 100 times"], get: (s) => s.total, target: 100 },
  { id: "unique50", icon: "🦋", th: ["หลากเฉด", "เจออารมณ์ไม่ซ้ำ 50 แบบ"], en: ["Many shades", "Meet 50 unique moods"], get: (s) => s.unique, target: 50 },
  { id: "cats10", icon: "🧭", th: ["นักสำรวจ", "เจออารมณ์ครบ 10 หมวด"], en: ["Explorer", "Discover 10 categories"], get: (s) => s.cats, target: 10 },
  { id: "catsAll", icon: "🌈", th: ["ครบทุกเฉด", "เจอครบทุกหมวดอารมณ์"], en: ["Full spectrum", "Discover every category"], get: (s) => s.cats, target: CATEGORY_ORDER.length },
  { id: "fav5", icon: "⭐", th: ["นักสะสม", "บันทึกอารมณ์ 5 รายการ"], en: ["Collector", "Save 5 moods"], get: (s) => s.favs, target: 5 },
  { id: "diary1", icon: "📝", th: ["เปิดสมุด", "เขียนไดอารี่ครั้งแรก"], en: ["Dear diary", "Write your first diary entry"], get: (s) => s.diary, target: 1 },
  { id: "diary10", icon: "📚", th: ["นักบันทึก", "เขียนไดอารี่ 10 รายการ"], en: ["Chronicler", "Write 10 diary entries"], get: (s) => s.diary, target: 10 },
  { id: "streak3", icon: "🔥", th: ["ติดไฟ", "ใช้งาน 3 วันติด"], en: ["On fire", "3-day streak"], get: (s) => s.streak, target: 3 },
  { id: "streak7", icon: "🏅", th: ["ครบสัปดาห์", "ใช้งาน 7 วันติด"], en: ["Full week", "7-day streak"], get: (s) => s.streak, target: 7 },
  { id: "wheel", icon: "🎡", th: ["นักหมุน", "หมุนวงล้อ 5 ครั้ง"], en: ["Spinner", "Spin the wheel 5 times"], get: cnt("wheel"), target: 5 },
  { id: "mix", icon: "🧪", th: ["นักปรุงอารมณ์", "ผสมอารมณ์ 3 ครั้ง"], en: ["Mood chemist", "Mix moods 3 times"], get: cnt("mix"), target: 3 },
  { id: "daily", icon: "🔮", th: ["หมอดูอารมณ์", "เปิดดวงอารมณ์ประจำวัน"], en: ["Fortune teller", "Reveal your daily fortune"], get: cnt("daily"), target: 1 },
  { id: "checkin", icon: "🎚️", th: ["รู้ใจตัวเอง", "เช็คอินใจ 3 ครั้ง"], en: ["Self-aware", "Check in 3 times"], get: cnt("checkin"), target: 3 },
  { id: "breathe", icon: "🫁", th: ["ใจนิ่ง", "ฝึกหายใจครบ 1 รอบ"], en: ["Still mind", "Finish a breathing session"], get: cnt("breathe"), target: 1 },
  { id: "map", icon: "🗺️", th: ["นักเดินแผนที่", "เลือกอารมณ์จากแผนที่ 5 ครั้ง"], en: ["Cartographer", "Pick 5 moods from the map"], get: cnt("map"), target: 5 },
  { id: "tried", icon: "✅", th: ["ลงมือทำ", "ทำตามคำแนะนำ 3 อย่าง"], en: ["Doer", "Complete 3 suggestions"], get: cnt("tried"), target: 3 },
  { id: "share", icon: "📸", th: ["แชร์ความรู้สึก", "สร้างการ์ดอารมณ์"], en: ["Show & tell", "Create a mood card"], get: cnt("share"), target: 1 },
  { id: "burst", icon: "⚡", th: ["สายรัว", "สุ่มรัว 30 ครั้งรวด"], en: ["Rapid fire", "Burst-roll 30 in one go"], get: cnt("burstMax"), target: 30 },
  { id: "night", icon: "🦉", th: ["นกฮูกราตรี", "สุ่มอารมณ์ช่วงเที่ยงคืน–ตี 4"], en: ["Night owl", "Roll between midnight and 4 AM"], get: cnt("night"), target: 1 },
  { id: "egg", icon: "🥚", secret: true, th: ["ปาร์ตี้ลับ", "แตะลูกแก้วรัว ๆ 7 ครั้ง"], en: ["Secret party", "Tap the orb 7 times fast"], get: cnt("egg"), target: 1 },
];

function badgeStats() {
  return {
    total: state.rollEvents.length,
    unique: new Set(state.rollEvents.map((e) => e.key)).size,
    cats: new Set(state.rollEvents.map((e) => e.category)).size,
    favs: state.favorites.length,
    diary: state.diary.length,
    streak: computeStreak(),
    c: state.counters,
  };
}

function badgeText(b) {
  return state.lang === "en" ? b.en : b.th;
}

function checkBadges({ silent = false } = {}) {
  const s = badgeStats();
  const fresh = [];
  for (const b of BADGES) {
    if (state.badges[b.id]) continue;
    if (b.get(s) >= b.target) {
      state.badges[b.id] = Date.now();
      fresh.push(b);
    }
  }
  if (!fresh.length) return;
  saveJson(STORAGE_KEYS.badges, state.badges);
  renderBadges(fresh.map((b) => b.id));
  if (silent) return;
  if (state.tab !== "badges") state.unseenBadges += fresh.length;
  renderBadgeDot();
  const first = fresh[0];
  toast(t("badges.unlocked", `${first.icon} ${badgeText(first)[0]}`) + (fresh.length > 1 ? t("badges.more", fresh.length - 1) : ""), 2600);
  setTimeout(() => {
    playSound("success");
    fxBurst(fx.w / 2, fx.h * 0.35, { colors: ["#fbbf24", "#f472b6", "#818cf8", "#34d399"], emojis: [first.icon, "✨"], count: 60, power: 11 });
  }, 450);
}

function renderBadges(freshIds = []) {
  const s = badgeStats();
  const unlocked = BADGES.filter((b) => state.badges[b.id]).length;
  els.badgeCount.textContent = t("badges.count", unlocked, BADGES.length);
  els.badgeProgressFill.style.width = `${Math.round((unlocked / BADGES.length) * 100)}%`;
  els.badgeGrid.innerHTML = "";
  for (const b of BADGES) {
    const on = !!state.badges[b.id];
    const [name, desc] = badgeText(b);
    const el = document.createElement("div");
    el.className = `badge ${on ? "unlocked" : "locked"}${freshIds.includes(b.id) ? " fresh" : ""}`;
    const ic = document.createElement("div");
    ic.className = "bIc";
    ic.textContent = b.secret && !on ? "❔" : b.icon;
    const nm = document.createElement("div");
    nm.className = "bName";
    nm.textContent = b.secret && !on ? "???" : name;
    const ds = document.createElement("div");
    ds.className = "bDesc";
    ds.textContent = b.secret && !on ? t("badges.secretDesc") : desc;
    el.append(ic, nm, ds);
    if (!on && !b.secret && b.target > 1) {
      const bar = document.createElement("div");
      bar.className = "bBar";
      const fill = document.createElement("i");
      fill.style.width = `${Math.round(clamp(b.get(s) / b.target, 0, 1) * 100)}%`;
      bar.appendChild(fill);
      el.appendChild(bar);
    }
    if (on) el.title = new Date(state.badges[b.id]).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" });
    els.badgeGrid.appendChild(el);
  }
}

function renderBadgeDot() {
  const tab = $('.tab[data-tab="badges"]');
  let dot = tab.querySelector(".badgeDot");
  if (!state.unseenBadges) {
    dot?.remove();
    return;
  }
  if (!dot) {
    dot = document.createElement("span");
    dot.className = "badgeDot";
    tab.appendChild(dot);
  }
  dot.textContent = String(state.unseenBadges);
}

function bump(name, by = 1) {
  state.counters[name] = (state.counters[name] || 0) + by;
  saveJson(STORAGE_KEYS.counters, state.counters);
  checkBadges();
}
function bumpMax(name, v) {
  if ((state.counters[name] || 0) >= v) return;
  state.counters[name] = v;
  saveJson(STORAGE_KEYS.counters, state.counters);
  checkBadges();
}

// ---------- Copy ----------

function moodToText(m) {
  return [
    `${t("copy.mood")}: ${moodEmoji(m)} ${m.name}`,
    `${t("copy.category")}: ${categoryLabel(m.category)}`,
    `${t("copy.desc")}: ${m.description}`,
    `${t("copy.energy")}: ${m.energy}/100`,
    `${t("copy.valence")}: ${formatSigned(m.valence)} (-100..+100)`,
    `${t("copy.arousal")}: ${m.arousal}/100`,
    `${t("copy.color")}: ${moodColor(m)}`,
  ].join("\n");
}

async function copyCurrent() {
  if (!state.current) return toast(t("toast.nothingToCopy"));
  const text = moodToText(state.current);
  try {
    await navigator.clipboard.writeText(text);
    toast(t("toast.copied"));
  } catch {
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

// ---------- Share card (PNG) ----------

function segmentWords(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const seg = new Intl.Segmenter(state.lang === "en" ? "en" : "th", { granularity: "word" });
    return Array.from(seg.segment(text), (s) => s.segment);
  }
  return text.split(/(\s+)/);
}

function wrapLines(ctx, text, maxW, maxLines) {
  const words = segmentWords(text);
  const lines = [];
  let line = "";
  let i = 0;
  for (; i < words.length; i++) {
    const test = line + words[i];
    if (ctx.measureText(test).width > maxW && line.trim()) {
      lines.push(line.trim());
      line = words[i].trimStart();
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line.trim()) {
    lines.push(line.trim());
    i = words.length;
  }
  if (i < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(`${last}…`).width > maxW) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  return lines;
}

function drawShareCard(m) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const col = moodColor(m);
  const col2 = shiftHue(col, 30);
  const sans = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans Thai', sans-serif";
  const emojiFont = cssVar("--emoji") || "sans-serif";

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0a0e22");
  bg.addColorStop(1, "#161b40");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, c, a] of [[W * 0.2, H * 0.15, 760, col, 0.55], [W * 0.9, H * 0.8, 700, col2, 0.4]]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(c, a));
    g.addColorStop(1, hexA(c, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  roundRect(ctx, 70, 70, W - 140, H - 140, 60);
  ctx.fillStyle = "rgba(255,255,255,.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // orb
  const cx = W / 2, cy = 330, R = 160;
  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = 90;
  const og = ctx.createRadialGradient(cx - 50, cy - 60, 10, cx, cy, R);
  og.addColorStop(0, "rgba(255,255,255,.85)");
  og.addColorStop(0.25, col);
  og.addColorStop(1, shiftHue(col, 40));
  ctx.fillStyle = og;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawBigEmoji(ctx, moodEmoji(m), cx, cy + 6, 180, emojiFont);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // category pill
  ctx.font = `700 36px ${sans}`;
  const cat = `${themeOf(m.category).emoji} ${categoryLabel(m.category)}`;
  const pw = ctx.measureText(cat).width + 60;
  roundRect(ctx, cx - pw / 2, 540, pw, 64, 32);
  ctx.fillStyle = hexA(col, 0.25);
  ctx.fill();
  ctx.strokeStyle = hexA(col, 0.7);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.fillText(cat, cx, 573);

  // name: shrink to fit one line, otherwise wrap into two
  const maxName = W - 240;
  let size = 76;
  ctx.font = `800 ${size}px ${sans}`;
  while (size > 50 && ctx.measureText(m.name).width > maxName) {
    size -= 2;
    ctx.font = `800 ${size}px ${sans}`;
  }
  let y = 680;
  for (const line of wrapLines(ctx, m.name, maxName, 2)) {
    ctx.fillText(line, cx, y);
    y += size * 1.2;
  }
  ctx.font = `400 34px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,.75)";
  y += 10;
  for (const line of wrapLines(ctx, m.description, W - 260, 3)) {
    ctx.fillText(line, cx, y);
    y += 48;
  }

  // meters
  const rows = [
    [t("meter.energy"), m.energy, 0, 100, `${m.energy}/100`],
    [t("meter.valence"), m.valence, -100, 100, formatSigned(m.valence)],
    [t("meter.arousal"), m.arousal, 0, 100, `${m.arousal}/100`],
  ];
  let my = 985;
  for (const [label, v, min, max, text] of rows) {
    ctx.textAlign = "left";
    ctx.font = `700 30px ${sans}`;
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(label, 150, my);
    ctx.textAlign = "right";
    ctx.fillText(text, W - 150, my);
    roundRect(ctx, 150, my + 26, W - 300, 16, 8);
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fill();
    const k = clamp((v - min) / (max - min), 0, 1);
    const bw = Math.max(16, (W - 300) * k);
    const bg2 = ctx.createLinearGradient(150, 0, 150 + bw, 0);
    bg2.addColorStop(0, col);
    bg2.addColorStop(1, col2);
    roundRect(ctx, 150, my + 26, bw, 16, 8);
    ctx.fillStyle = bg2;
    ctx.fill();
    my += 78;
  }

  ctx.textAlign = "center";
  ctx.font = `600 28px ${sans}`;
  ctx.fillStyle = "rgba(255,255,255,.55)";
  const date = new Date().toLocaleDateString(locale(), { day: "numeric", month: "long", year: "numeric" });
  ctx.fillText(`${t("card.footer")} • ${date}`, cx, H - 108);
  return canvas;
}

// Large emoji glyphs can lose their color when drawn straight onto a canvas,
// so render at a bitmap-friendly size and scale the image up.
function drawBigEmoji(ctx, ch, x, y, size, font) {
  const base = 128;
  const off = document.createElement("canvas");
  off.width = off.height = Math.ceil(base * 1.4);
  const o = off.getContext("2d");
  o.font = `${base}px ${font}`;
  o.textAlign = "center";
  o.textBaseline = "middle";
  o.fillText(ch, off.width / 2, off.height / 2 + base * 0.05);
  const k = size / base;
  ctx.drawImage(off, x - (off.width * k) / 2, y - (off.height * k) / 2, off.width * k, off.height * k);
}

async function shareCard() {
  const m = state.current;
  if (!m) return toast(t("toast.nothingToCopy"));
  try {
    const canvas = drawShareCard(m);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("toBlob failed");
    const fileName = `emo-${dateKey()}-${Date.now().toString(36)}.png`;
    bump("share");
    const file = typeof File === "function" ? new File([blob], fileName, { type: "image/png" }) : null;
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "EMO", text: `${moodEmoji(m)} ${m.name}` });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast(t("toast.cardSaved"));
  } catch {
    toast(t("toast.cardFail"));
  }
}

// ---------- Modals ----------

const modalStack = [];
const FOCUSABLE = 'button:not([disabled]):not([hidden]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function isModalOpen(id) {
  return modalStack.includes(id);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (!el || isModalOpen(id)) return;
  el._returnFocus = document.activeElement;
  el.classList.add("show");
  el.setAttribute("aria-hidden", "false");
  modalStack.push(id);
  document.body.classList.add("modalOpen");
  const target = el.querySelector(".btn.primary:not([disabled])") || el.querySelector(".closeBtn");
  setTimeout(() => target?.focus(), 30);
}

function closeModal(id) {
  if (!isModalOpen(id)) return;
  if (id === "wheelModal" && wheel.spinning) return;
  if (id === "breatheModal") breatheReset();
  const el = document.getElementById(id);
  el.classList.remove("show");
  el.setAttribute("aria-hidden", "true");
  modalStack.splice(modalStack.indexOf(id), 1);
  if (!modalStack.length) document.body.classList.remove("modalOpen");
  el._returnFocus?.focus?.();
}

function closeTopModal() {
  const id = modalStack[modalStack.length - 1];
  if (id) closeModal(id);
}

function trapFocus(e) {
  const id = modalStack[modalStack.length - 1];
  const card = document.getElementById(id)?.querySelector(".modalCard");
  if (!card) return;
  const items = Array.from(card.querySelectorAll(FOCUSABLE)).filter((x) => x.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  } else if (!card.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
  }
}

// ---------- Wheel (spin wheel) ----------

const wheel = { angle: 0, spinning: false, raf: 0, cats: CATEGORY_ORDER.slice() };

function wheelOpen() {
  openModal("wheelModal");
  els.wheelCurrentLabel.classList.remove("win");
  requestAnimationFrame(wheelRender);
}

function wheelRender() {
  const prep = prepCanvas(els.wheelCanvas);
  if (!prep) return;
  const { ctx, w } = prep;
  const size = w;
  const r = size / 2;
  const cats = wheel.cats;
  const n = cats.length;
  const seg = (Math.PI * 2) / n;
  const emojiFont = cssVar("--emoji") || "sans-serif";

  ctx.save();
  ctx.translate(r, r);
  ctx.rotate(wheel.angle);

  for (let i = 0; i < n; i++) {
    const a0 = i * seg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, a0, a0 + seg);
    ctx.closePath();
    ctx.fillStyle = themeOf(cats[i]).color;
    ctx.fill();
    if (i % 2) {
      ctx.fillStyle = "rgba(0,0,0,.08)";
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // depth
  const shade = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
  shade.addColorStop(0, "rgba(255,255,255,.12)");
  shade.addColorStop(0.7, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,.28)");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // labels along the radius so many segments stay readable
  const fontPx = Math.max(10, Math.min(size * 0.034, r * seg * 0.42));
  for (let i = 0; i < n; i++) {
    const mid = i * seg + seg / 2;
    ctx.save();
    ctx.rotate(mid);
    ctx.textBaseline = "middle";
    ctx.font = `${Math.round(fontPx * 1.35)}px ${emojiFont}`;
    ctx.textAlign = "center";
    ctx.fillText(themeOf(cats[i]).emoji, r * 0.86, 0);

    ctx.font = `800 ${Math.round(fontPx)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "right";
    let label = shortCategoryLabel(cats[i]);
    const maxW = r * 0.5;
    while (label.length > 2 && ctx.measureText(label).width > maxW) label = label.slice(0, -1);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,.45)";
    ctx.strokeText(label, r * 0.76, 1);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, r * 0.76, 1);
    ctx.restore();
  }
  ctx.restore();

  els.wheelCurrentLabel.textContent = `${themeOf(wheelCategoryAtPointer()).emoji} ${categoryLabel(wheelCategoryAtPointer())}`;
}

function wheelIndexAtPointer() {
  const n = wheel.cats.length;
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
  els.wheelHub.disabled = true;
  els.wheelCurrentLabel.classList.remove("win");
  initAudio();
  playSound("whoosh");

  let lastIndex = -1;
  const start = performance.now();
  const startAngle = wheel.angle;
  const turns = 5 + Math.random() * 4; // 5..9
  const target = startAngle + turns * Math.PI * 2 + Math.random() * Math.PI * 2;
  const duration = prefersReducedMotion() ? 400 : 3200 + Math.random() * 900;

  const tick = (now) => {
    const k = clamp((now - start) / duration, 0, 1);
    const ease = 1 - Math.pow(1 - k, 4); // easeOutQuart
    wheel.angle = startAngle + (target - startAngle) * ease;
    wheelRender();

    const curIndex = wheelIndexAtPointer();
    if (curIndex !== lastIndex) {
      if (lastIndex !== -1 && k < 0.985) {
        playSound("click");
        els.wheelPointer.classList.remove("tick");
        void els.wheelPointer.offsetWidth;
        els.wheelPointer.classList.add("tick");
      }
      lastIndex = curIndex;
    }

    if (k < 1) {
      wheel.raf = requestAnimationFrame(tick);
      return;
    }
    wheelLanded(wheel.cats[curIndex]);
  };
  wheel.raf = requestAnimationFrame(tick);
}

async function wheelLanded(cat) {
  const catLabel = categoryLabel(cat);
  els.wheelCurrentLabel.classList.add("win");
  playSound("success");
  haptic([60, 40, 60]);
  const { x, y } = centerOf(els.wheelCurrentLabel);
  const c = themeOf(cat).color;
  fxBurst(x, y, { colors: [c, shiftHue(c, 40), "#ffffff", "#fbbf24"], emojis: [themeOf(cat).emoji], count: 40 });
  await sleep(prefersReducedMotion() ? 100 : 1000);

  wheel.spinning = false;
  els.btnWheelSpin.disabled = false;
  els.wheelHub.disabled = false;
  closeModal("wheelModal");
  const m = pickMoodFromCategory(cat);
  showMood(m, { source: t("source.wheel", catLabel), announce: true });
  reveal(m);
  toast(t("wheel.landed", catLabel));
  bump("wheel");
}

// ---------- Mixer ----------

const MIX_CONNECTORS = ["ปน", "แอบ", "ผสม", "คลุกเคล้า", "ซ่อน", "ครึ่ง ๆ กับ"];
const mixer = { a: null, b: null, result: null, busy: false };

function mixerOpen() {
  mixer.a = state.current || randomPoolMood();
  mixer.b = randomPoolMood(mixer.a);
  mixer.result = null;
  renderMixer();
  openModal("mixerModal");
}

function renderMixSlot(m, emo, name, cat) {
  emo.textContent = moodEmoji(m);
  name.textContent = baseName(m) || m.name;
  name.title = m.name;
  cat.textContent = categoryLabel(m.category);
}

function renderMixer() {
  renderMixSlot(mixer.a, els.mixEmojiA, els.mixNameA, els.mixCatA);
  renderMixSlot(mixer.b, els.mixEmojiB, els.mixNameB, els.mixCatB);
  const r = mixer.result;
  els.mixResult.hidden = !r;
  els.btnMixUse.hidden = !r;
  els.btnMixUse.classList.toggle("primary", !!r);
  els.btnMixGo.classList.toggle("primary", !r);
  els.btnMixGo.querySelector("[data-i18n]").textContent = r ? t("mixer.again") : t("mixer.go");
  if (!r) return;
  els.mixResult.style.setProperty("--mix-c", moodColor(r));
  els.mixResultEmoji.textContent = moodEmoji(r);
  els.mixResultName.textContent = r.name;
  els.mixResultDesc.textContent = r.description;
  els.mixResultBars.innerHTML = "";
  for (const [label, v, min, max, text] of [
    ["⚡", r.energy, 0, 100, String(r.energy)],
    ["☯", r.valence, -100, 100, formatSigned(r.valence)],
    ["〰", r.arousal, 0, 100, String(r.arousal)],
  ]) {
    const row = document.createElement("div");
    row.className = "mb";
    const l = document.createElement("span");
    l.textContent = label;
    const track = document.createElement("i");
    const fill = document.createElement("b");
    fill.style.width = pct(v, min, max);
    track.appendChild(fill);
    const val = document.createElement("span");
    val.textContent = text;
    row.append(l, track, val);
    els.mixResultBars.appendChild(row);
  }
}

function mixMoods(a, b) {
  const ra = 0.35 + Math.random() * 0.3;
  const rb = 1 - ra;
  const [dom, sub] = ra >= rb ? [a, b] : [b, a];
  const lerp = (x, y) => Math.round(x * ra + y * rb);
  const pa = Math.round(ra * 100);
  return {
    name: `${baseName(dom)} ${pickOne(MIX_CONNECTORS)} ${baseName(sub)}`,
    category: MIX_CATEGORY,
    description: t("mixer.desc", baseName(a), pa, baseName(b), 100 - pa),
    energy: lerp(a.energy, b.energy),
    valence: lerp(a.valence, b.valence),
    arousal: lerp(a.arousal, b.arousal),
    color: mixHex(moodColor(a), moodColor(b), rb),
    emoji: moodEmoji(dom),
    weight: 1,
    custom: true,
  };
}

async function mixerGo() {
  if (mixer.busy) return;
  mixer.busy = true;
  els.btnMixGo.disabled = true;
  mixer.result = null;
  renderMixer();
  els.mixStage.classList.add("mixing");
  playSound("whoosh");
  haptic([20, 30, 20, 30, 20]);
  await sleep(prefersReducedMotion() ? 50 : 650);
  els.mixStage.classList.remove("mixing");
  mixer.result = mixMoods(mixer.a, mixer.b);
  renderMixer();
  playSound("success");
  const { x, y } = centerOf(els.mixResultEmoji);
  const c = moodColor(mixer.result);
  fxBurst(x, y, { colors: [c, moodColor(mixer.a), moodColor(mixer.b), "#ffffff"], emojis: [moodEmoji(mixer.a), moodEmoji(mixer.b)], count: 36, power: 7 });
  bump("mix");
  mixer.busy = false;
  els.btnMixGo.disabled = false;
}

function mixerUse() {
  if (!mixer.result) return;
  const m = registerCustomMood(mixer.result);
  closeModal("mixerModal");
  showMood(m, { source: t("source.mix"), announce: true });
  reveal(m);
}

// ---------- Daily fortune ----------

function dailyData() {
  const now = new Date();
  const key = dateKey(now);
  const rnd = mulberry32(hash32(`emo-daily|${key}`));
  const m = weightedPick(MOODS, (x) => x.weight ?? 1, rnd);
  const lucky = 1 + Math.floor(rnd() * 99);
  const list = SUGGESTIONS[m.category] ?? SUGGESTIONS[MIX_CATEGORY];
  const sug = list[Math.floor(rnd() * list.length)];
  const stars = clamp(Math.round((m.valence + 100) / 50) + 1, 1, 5);
  return { key, now, m, lucky, sug, stars };
}

function dailyOpen() {
  const d = dailyData();
  const c = moodColor(d.m);
  els.dailyDate.textContent = d.now.toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" });
  els.dailyCard.style.setProperty("--daily-c", c);
  els.dailyEmoji.textContent = moodEmoji(d.m);
  els.dailyName.textContent = d.m.name;
  els.dailyStars.textContent = "★".repeat(d.stars) + "☆".repeat(5 - d.stars);
  els.dailyColorDot.style.background = c;
  els.dailyColor.textContent = c;
  els.dailyNumber.textContent = String(d.lucky);
  els.dailyAdvice.textContent = t("daily.advice", d.sug[state.lang === "en" ? 1 : 0]);
  const revealed = state.counters.dailyKey === d.key;
  els.dailyCard.classList.toggle("flipped", revealed);
  els.btnDailyUse.disabled = !revealed;
  openModal("dailyModal");
}

function dailyFlip() {
  if (els.dailyCard.classList.contains("flipped")) return;
  const d = dailyData();
  els.dailyCard.classList.add("flipped");
  els.btnDailyUse.disabled = false;
  playSound("whoosh");
  setTimeout(() => {
    playSound("chime");
    const { x, y } = centerOf(els.dailyCard);
    fxBurst(x, y, { colors: ["#c4b5fd", "#fbbf24", moodColor(d.m), "#ffffff"], emojis: ["✨", "🔮", moodEmoji(d.m)], count: 40 });
  }, 400);
  if (state.counters.dailyKey !== d.key) {
    state.counters.dailyKey = d.key;
    bump("daily");
  }
  setTimeout(() => els.btnDailyUse.focus(), 500);
}

function dailyUse() {
  const { m } = dailyData();
  closeModal("dailyModal");
  applyAfterPick(m);
  showMood(m, { source: t("source.daily"), announce: true });
  reveal(m);
}

// ---------- Check-in ----------

function faceFor(v, a, e) {
  if (e <= 15 && v < 15) return "😪";
  if (v >= 50) return a >= 60 ? "🤩" : a <= 30 ? "😌" : "😊";
  if (v >= 15) return a >= 60 ? "😃" : "🙂";
  if (v > -15) return a >= 65 ? "😯" : a <= 25 ? (e <= 25 ? "😴" : "😶") : "😐";
  if (v > -50) return a >= 60 ? "😟" : "😕";
  return a >= 60 ? "😣" : "😢";
}

function checkinOpen() {
  const m = state.current;
  els.ciEnergy.value = m ? m.energy : 50;
  els.ciValence.value = m ? m.valence : 0;
  els.ciArousal.value = m ? m.arousal : 50;
  checkinUpdate();
  openModal("checkinModal");
  setTimeout(() => els.ciEnergy.focus(), 40);
}

function checkinUpdate() {
  const e = Number(els.ciEnergy.value);
  const v = Number(els.ciValence.value);
  const a = Number(els.ciArousal.value);
  els.ciEnergyOut.textContent = String(e);
  els.ciValenceOut.textContent = formatSigned(v);
  els.ciArousalOut.textContent = String(a);

  const face = faceFor(v, a, e);
  if (els.checkinFace.textContent !== face) {
    els.checkinFace.textContent = face;
    els.checkinFace.classList.remove("pop");
    void els.checkinFace.offsetWidth;
    els.checkinFace.classList.add("pop");
  }

  const matches = nearestMoods({ energy: e, valence: v, arousal: a }, 3);
  if (matches[0]) els.checkinFace.style.setProperty("--ci-c", moodColor(matches[0].m));
  els.checkinMatches.innerHTML = "";
  for (const { m, d } of matches) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "match";
    b.style.setProperty("--m-c", moodColor(m));
    const em = document.createElement("span");
    em.className = "mE";
    em.textContent = moodEmoji(m);
    const nm = document.createElement("span");
    nm.className = "mN";
    nm.textContent = m.name;
    nm.title = m.name;
    const p = document.createElement("span");
    p.className = "mP";
    p.textContent = t("checkin.match", Math.round(clamp(1 - d / 0.5, 0, 1) * 100));
    b.append(em, nm, p);
    b.addEventListener("click", () => {
      closeModal("checkinModal");
      applyAfterPick(m);
      showMood(m, { source: t("source.checkin"), announce: true });
      reveal(m);
      bump("checkin");
    });
    els.checkinMatches.appendChild(b);
  }
}

// ---------- Breathing ----------

// dot corners around the box: [left, bottom] as CSS values
const BOX = { bl: ["-8px", "-8px"], tl: ["-8px", "calc(100% - 8px)"], tr: ["calc(100% - 8px)", "calc(100% - 8px)"], br: ["calc(100% - 8px)", "-8px"] };
const BREATHE_PHASES = [
  { k: "breathe.in", scale: 1, to: BOX.tl },
  { k: "breathe.hold", scale: 1, to: BOX.tr },
  { k: "breathe.out", scale: 0.6, to: BOX.br },
  { k: "breathe.hold", scale: 0.6, to: BOX.bl },
];
const breathe = { running: false, timer: 0, round: 0, rounds: 3, secs: 4 };

function breatheOpen() {
  breatheReset();
  openModal("breatheModal");
}

function breatheSetDot([left, bottom], secs) {
  els.breatheDot.style.transitionDuration = `${secs}s`;
  els.breatheDot.style.left = left;
  els.breatheDot.style.bottom = bottom;
}

function breatheRenderRounds() {
  els.breatheRounds.innerHTML = "";
  for (let i = 0; i < breathe.rounds; i++) {
    const dot = document.createElement("i");
    if (i < breathe.round) dot.className = "on";
    els.breatheRounds.appendChild(dot);
  }
}

function breatheReset() {
  breathe.running = false;
  clearTimeout(breathe.timer);
  breathe.round = 0;
  els.breatheCircle.style.transitionDuration = "0.6s";
  els.breatheCircle.style.transform = "scale(0.6)";
  breatheSetDot(BOX.bl, 0);
  els.breathePhase.textContent = t("breathe.ready");
  els.breatheCount.textContent = String(breathe.secs);
  els.breatheBtnLabel.textContent = t("breathe.start");
  els.breatheBtnIcon.textContent = "▶";
  breatheRenderRounds();
}

function breatheToggle() {
  if (breathe.running) return breatheReset();
  breatheReset();
  breathe.running = true;
  els.breatheBtnLabel.textContent = t("breathe.stop");
  els.breatheBtnIcon.textContent = "■";
  initAudio();
  breathePhase(0);
}

function breathePhase(i) {
  if (!breathe.running) return;
  const p = BREATHE_PHASES[i];
  els.breathePhase.textContent = t(p.k);
  els.breatheCircle.style.transitionDuration = `${breathe.secs}s`;
  els.breatheCircle.style.transform = `scale(${p.scale})`;
  breatheSetDot(p.to, breathe.secs);
  if (i === 0 || i === 2) playSound("breath");
  haptic(15);

  let left = breathe.secs;
  els.breatheCount.textContent = String(left);
  const tick = () => {
    if (!breathe.running) return;
    left--;
    if (left > 0) {
      els.breatheCount.textContent = String(left);
      breathe.timer = setTimeout(tick, 1000);
      return;
    }
    const next = (i + 1) % BREATHE_PHASES.length;
    if (next === 0) {
      breathe.round++;
      breatheRenderRounds();
      if (breathe.round >= breathe.rounds) return breatheDone();
    }
    breathePhase(next);
  };
  breathe.timer = setTimeout(tick, 1000);
}

function breatheDone() {
  breathe.running = false;
  els.breathePhase.textContent = t("breathe.done");
  els.breatheCount.textContent = "✓";
  els.breatheBtnLabel.textContent = t("breathe.again");
  els.breatheBtnIcon.textContent = "↻";
  playSound("success");
  const { x, y } = centerOf(els.breatheCircle);
  fxBurst(x, y, { colors: ["#34d399", "#5eead4", "#a7f3d0", "#ffffff"], emojis: ["🌿", "🍃"], count: 36, power: 7 });
  toast(t("breathe.doneToast"), 2400);
  bump("breathe");
}

// ---------- Shake to roll ----------

let lastShakeAt = 0;
let lastAccel = null;

function initShake() {
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  els.btnShake.hidden = !("DeviceMotionEvent" in window && coarse);
}

function onMotion(e) {
  const acc = e.accelerationIncludingGravity || e.acceleration;
  if (!acc) return;
  const cur = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 };
  if (lastAccel) {
    const delta = Math.abs(cur.x - lastAccel.x) + Math.abs(cur.y - lastAccel.y) + Math.abs(cur.z - lastAccel.z);
    const now = Date.now();
    if (delta > 28 && now - lastShakeAt > 1500 && !state.rolling && !modalStack.length) {
      lastShakeAt = now;
      rollOnce({ source: t("source.shake") });
    }
  }
  lastAccel = cur;
}

async function toggleShake() {
  if (state.shake) {
    window.removeEventListener("devicemotion", onMotion);
    state.shake = false;
    els.btnShake.setAttribute("aria-pressed", "false");
    toast(t("toast.shakeOff"));
    return;
  }
  try {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
      const res = await DeviceMotionEvent.requestPermission();
      if (res !== "granted") return toast(t("toast.shakeDenied"));
    }
  } catch {
    return toast(t("toast.shakeDenied"));
  }
  lastAccel = null;
  window.addEventListener("devicemotion", onMotion);
  state.shake = true;
  els.btnShake.setAttribute("aria-pressed", "true");
  toast(t("toast.shakeOn"), 2400);
}

// ---------- Easter egg ----------

let orbTaps = [];

function onOrbTap() {
  const orb = els.moodBadge;
  orb.classList.remove("boing");
  void orb.offsetWidth;
  orb.classList.add("boing");
  playSound("pop");
  const { x, y } = centerOf(orb);
  const c = state.current ? moodColor(state.current) : "#7c3aed";
  fxBurst(x, y - 40, { colors: [c], emojis: state.current ? [moodEmoji(state.current)] : [], count: 8, power: 5, spread: Math.PI * 0.9 });

  const now = Date.now();
  orbTaps = orbTaps.filter((ts) => now - ts < 2500);
  orbTaps.push(now);
  if (orbTaps.length >= 7) {
    orbTaps = [];
    partyMode();
  }
}

function partyMode() {
  if (document.body.classList.contains("party")) return;
  document.body.classList.add("party");
  toast(t("toast.party"), 2400);
  playSound("success");
  haptic([80, 50, 80, 50, 160]);
  const emojis = Array.from(new Set(Array.from({ length: 16 }, () => moodEmoji(pickOne(MOODS)))));
  fxRain(emojis.concat(["🎉", "✨", "🎊"]), 70);
  bump("egg");
  setTimeout(() => document.body.classList.remove("party"), 6000);
}

// ---------- Touch gestures (mobile) ----------

function wireGestures() {
  // Swipe left/right on the side card to switch tabs
  let sx = 0, sy = 0, st = 0;
  els.sideCard.addEventListener("touchstart", (e) => {
    const p = e.touches[0];
    sx = p.clientX;
    sy = p.clientY;
    st = Date.now();
  }, { passive: true });
  els.sideCard.addEventListener("touchend", (e) => {
    if (e.target.closest("input, textarea, .tabs, canvas")) return;
    const p = e.changedTouches[0];
    const dx = p.clientX - sx;
    const dy = p.clientY - sy;
    if (Date.now() - st > 600 || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const i = TABS.indexOf(state.tab);
    const next = TABS[clamp(i + (dx < 0 ? 1 : -1), 0, TABS.length - 1)];
    if (next !== state.tab) {
      setTab(next);
      haptic(10);
    }
  }, { passive: true });

  // Drag a bottom sheet down by its header to close it
  for (const modal of $$(".modal")) {
    const card = modal.querySelector(".modalCard");
    let startY = null, dy = 0;
    card.addEventListener("touchstart", (e) => {
      const rect = card.getBoundingClientRect();
      const y = e.touches[0].clientY;
      const onHeader = y - rect.top < 64 || e.target.closest(".modalTop");
      if (!onHeader || card.scrollTop > 0 || !window.matchMedia("(max-width: 860px)").matches) return;
      startY = y;
      dy = 0;
      card.style.transition = "none";
    }, { passive: true });
    card.addEventListener("touchmove", (e) => {
      if (startY == null) return;
      dy = Math.max(0, e.touches[0].clientY - startY);
      card.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    const end = () => {
      if (startY == null) return;
      startY = null;
      card.style.transition = "transform 0.25s ease";
      card.style.transform = "";
      if (dy > 110) closeModal(modal.id);
      setTimeout(() => (card.style.transition = ""), 260);
    };
    card.addEventListener("touchend", end);
    card.addEventListener("touchcancel", end);
  }

  // Flick the wheel to spin it
  let flick = null;
  els.wheelCanvas.addEventListener("pointerdown", (e) => {
    flick = { x: e.clientX, y: e.clientY, t: Date.now() };
  });
  els.wheelCanvas.addEventListener("pointerup", (e) => {
    if (!flick) return;
    const dist = Math.hypot(e.clientX - flick.x, e.clientY - flick.y);
    const fast = Date.now() - flick.t < 500;
    flick = null;
    if (dist > 30 && fast) wheelSpin();
  });
}

// ---------- Help ----------

const SHORTCUTS = [
  ["Space / R", "help.roll"],
  ["B", "help.burst"],
  ["W", "help.wheel"],
  ["M", "help.mixer"],
  ["D", "help.daily"],
  ["K", "help.checkin"],
  ["H", "help.breathe"],
  ["S", "help.save"],
  ["C", "help.copy"],
  ["P", "help.share"],
  ["T", "help.theme"],
  ["L", "help.lang"],
  ["/", "help.search"],
  ["?", "help.help"],
  ["Esc", "help.close"],
];

function renderHelp() {
  els.helpList.innerHTML = "";
  for (const [keys, label] of SHORTCUTS) {
    const row = document.createElement("div");
    row.className = "helpRow";
    const l = document.createElement("span");
    l.textContent = t(label);
    const k = document.createElement("span");
    for (const part of keys.split(" / ")) {
      const kbd = document.createElement("kbd");
      kbd.textContent = part;
      k.append(kbd, " ");
    }
    row.append(l, k);
    els.helpList.appendChild(row);
  }
  els.helpTips.innerHTML = "";
  for (const tip of t("help.tips")) {
    const p = document.createElement("p");
    p.textContent = tip;
    els.helpTips.appendChild(p);
  }
}

// ---------- Keyboard ----------

function onKeyDown(e) {
  if (e.key === "Escape") {
    if (modalStack.length) {
      e.preventDefault();
      closeTopModal();
    }
    return;
  }
  if (modalStack.length) {
    if (e.key === "Tab") trapFocus(e);
    return;
  }

  const target = e.target;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
  if (typing) {
    if (e.key === "Enter" && target === els.search) {
      e.preventDefault();
      rollOnce();
    }
    return;
  }
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const onButton = target.closest?.("button, [role='button'], [role='tab'], [role='checkbox'], a");
  if (e.key === " " && onButton) return; // let buttons handle Space

  const k = e.key.toLowerCase();
  const actions = {
    " ": () => rollOnce(),
    r: () => rollOnce(),
    b: rollBurst,
    w: wheelOpen,
    m: mixerOpen,
    d: dailyOpen,
    k: checkinOpen,
    h: breatheOpen,
    s: toggleFavoriteCurrent,
    c: copyCurrent,
    p: shareCard,
    t: toggleTheme,
    l: toggleLanguage,
    "/": () => els.search.focus(),
    "?": () => openModal("helpModal"),
  };
  const fn = actions[e.key === "?" ? "?" : k];
  if (fn) {
    e.preventDefault();
    fn();
  }
}

// ---------- Wiring ----------

function redrawCanvases() {
  drawMoodMap();
  if (state.tab === "stats") drawTrend7d();
  if (isModalOpen("wheelModal")) wheelRender();
}

function wireEvents() {
  els.btnRoll.addEventListener("click", () => rollOnce());
  els.fabRoll.addEventListener("click", () => rollOnce());
  els.btnBurst.addEventListener("click", rollBurst);
  els.burstMinus.addEventListener("click", () => stepBurst(-1));
  els.burstPlus.addEventListener("click", () => stepBurst(1));
  els.burstCount.addEventListener("change", () => stepBurst(0));
  els.btnReset.addEventListener("click", () => {
    resetDiversity();
    els.search.value = "";
    updateSearchResults();
  });

  els.modeGroup.addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (b) setMode(b.dataset.mode);
  });
  els.modeGroup.addEventListener("keydown", (e) => {
    const i = MODES.indexOf(state.mode);
    let next = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = MODES[(i + 1) % MODES.length];
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = MODES[(i - 1 + MODES.length) % MODES.length];
    if (!next) return;
    e.preventDefault();
    setMode(next);
    els.modeGroup.querySelector(`[data-mode="${next}"]`).focus();
  });

  els.btnWheel.addEventListener("click", wheelOpen);
  els.btnMixer.addEventListener("click", mixerOpen);
  els.btnDaily.addEventListener("click", dailyOpen);
  els.btnCheckin.addEventListener("click", checkinOpen);
  els.btnBreathe.addEventListener("click", breatheOpen);
  els.btnShake.addEventListener("click", toggleShake);

  els.search.addEventListener("input", updateSearchResults);

  els.moodBadge.addEventListener("click", onOrbTap);
  els.btnSave.addEventListener("click", toggleFavoriteCurrent);
  els.btnCopy.addEventListener("click", copyCurrent);
  els.btnShare.addEventListener("click", shareCard);
  els.btnDiaryQuick.addEventListener("click", openDiary);
  els.btnBreatheQuick.addEventListener("click", breatheOpen);
  els.mapCanvas.addEventListener("click", onMapClick);

  for (const tab of $$(".tab")) {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
    tab.addEventListener("keydown", onTabKey);
  }

  els.btnDiarySave.addEventListener("click", saveDiaryEntry);
  els.diaryNote.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveDiaryEntry();
  });
  els.diaryFilter.addEventListener("input", renderDiary);

  els.btnLang.addEventListener("click", toggleLanguage);
  els.btnTheme.addEventListener("click", toggleTheme);
  els.btnSound.addEventListener("click", toggleSound);
  els.btnHelp.addEventListener("click", () => openModal("helpModal"));
  els.btnHelpFooter.addEventListener("click", () => openModal("helpModal"));

  // modals: backdrop / ✕ buttons
  for (const modal of $$(".modal")) {
    modal.addEventListener("click", (e) => {
      if (e.target.closest("[data-close]")) closeModal(modal.id);
    });
  }

  els.btnWheelSpin.addEventListener("click", wheelSpin);
  els.wheelHub.addEventListener("click", wheelSpin);

  els.mixRerollA.addEventListener("click", () => {
    mixer.a = randomPoolMood(mixer.b);
    mixer.result = null;
    playSound("click");
    renderMixer();
  });
  els.mixRerollB.addEventListener("click", () => {
    mixer.b = randomPoolMood(mixer.a);
    mixer.result = null;
    playSound("click");
    renderMixer();
  });
  els.btnMixGo.addEventListener("click", mixerGo);
  els.btnMixUse.addEventListener("click", mixerUse);

  els.dailyFlip.addEventListener("click", dailyFlip);
  els.btnDailyUse.addEventListener("click", dailyUse);

  for (const input of [els.ciEnergy, els.ciValence, els.ciArousal]) input.addEventListener("input", checkinUpdate);

  els.btnBreatheStart.addEventListener("click", breatheToggle);

  document.addEventListener("keydown", onKeyDown);

  let resizeT = 0;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        fxResize();
        redrawCanvases();
      }, 120);
    },
    { passive: true }
  );

  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", (e) => {
    if (loadJson(STORAGE_KEYS.theme, null)) return; // user picked a theme explicitly
    state.theme = e.matches ? "light" : "dark";
    applyTheme();
    redrawCanvases();
  });
}

// ---------- Init ----------

function hydrateFromStorage() {
  // Mixed moods are user-made; register them so saved references resolve
  state.custom = state.custom.filter((m) => m && typeof m.name === "string" && typeof m.category === "string");
  for (const m of state.custom) if (!keyIndex.has(moodKey(m))) keyIndex.set(moodKey(m), m);

  const known = (x) => x && typeof x.key === "string" && keyIndex.has(x.key);
  state.history = state.history.filter(known);
  state.favorites = state.favorites.filter(known);
  state.rollEvents = state.rollEvents.filter(known);
  state.diary = state.diary.filter((d) => d && typeof d.key === "string" && typeof d.id === "string");
}

function initialRender() {
  hydrateFromStorage();
  applyTheme();
  applySound();
  fxInit();
  initShake();

  // Show a sample mood first (not counted as history)
  const starter = weightedPick(MOODS, (m) => (m.weight ?? 1) * 0.8);
  showMood(starter, { source: t("source.sample"), announce: false });

  applyI18nToDom();
  setTab(state.tab);
  checkBadges({ silent: true });
  renderBadgeDot();
  els.statusText.textContent = t("status.ready");
  runLaunchAction();
}

// Home-screen shortcuts (manifest "shortcuts") open ?action=roll|daily|breathe
function runLaunchAction() {
  const action = new URLSearchParams(location.search).get("action");
  const run = { roll: () => rollOnce(), daily: dailyOpen, breathe: breatheOpen, wheel: wheelOpen, mixer: mixerOpen, checkin: checkinOpen }[action];
  if (!run) return;
  history.replaceState(null, "", location.pathname);
  setTimeout(run, 300);
}

wireEvents();
wireGestures();
initialRender();

// ---------- PWA / Offline Worker ----------

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.log("SW Registration failed: ", err);
    });
  });
}
