// مولّد عشوائي مستقر (mulberry32) — يعطي نفس الترتيب لنفس البذرة.
export function seeded(seed) {
  let t = typeof seed === "number" ? seed : hash(String(seed));
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffle(list, seed) {
  const rnd = seeded(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const clamp = (v, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));

// تطبيع النص العربي للمطابقة: إزالة التشكيل وتوحيد الألف والياء والتاء المربوطة
export const normalizeAr = (s = "") =>
  s
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[؟?!.,،؛:"'()«»]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
