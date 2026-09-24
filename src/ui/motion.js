import { useEffect, useRef, useState } from "react";

const isBrowser = typeof window !== "undefined";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

// يحترم إعداد «الحركات والانتقالات» في الإعدادات وتفضيل النظام لتقليل الحركة
export const motionOff = () => {
  if (!isBrowser) return true;
  if (document.documentElement.dataset.motion === "off") return true;
  return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
};

const NUMERIC = /^([^0-9٠-٩]*?)([0-9٠-٩][0-9٠-٩,٬]*(?:[.٫][0-9٠-٩]+)?)([^0-9٠-٩]*)$/;

// يقرأ عددًا من رقم أو نص مثل «87%» أو «1,250» أو «٨٧٪»، ويحفظ البادئة واللاحقة ونوع الأرقام
function parseValue(v) {
  if (typeof v === "number") return Number.isFinite(v) ? { pre: "", post: "", n: v, dec: (String(v).split(".")[1] || "").length, grouped: false, ar: false } : null;
  if (typeof v !== "string") return null;
  const m = v.match(NUMERIC);
  if (!m) return null;
  const raw = m[2];
  if (/^0[0-9٠-٩]/.test(raw)) return null;
  const latin = raw.replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).replace(/[,٬]/g, "").replace("٫", ".");
  const n = Number(latin);
  if (!Number.isFinite(n)) return null;
  return { pre: m[1], post: m[3], n, dec: (latin.split(".")[1] || "").length, grouped: /[,٬]/.test(raw), ar: /[٠-٩]/.test(raw) };
}

function format(n, p) {
  let s = p.grouped ? n.toLocaleString("en-US", { minimumFractionDigits: p.dec, maximumFractionDigits: p.dec }) : n.toFixed(p.dec);
  if (p.ar) s = s.replace(/\d/g, (d) => AR_DIGITS[d]).replace(".", "٫").replace(/,/g, "٬");
  return p.pre + s + p.post;
}

// عدّ تصاعدي سلس: يبدأ من الصفر عند الظهور، ثم ينتقل من القيمة الحالية إلى القيمة الجديدة عند تغيّرها
export function useCountUp(target, { duration = 900, enabled = true } = {}) {
  const skip = !enabled || motionOff();
  const [val, setVal] = useState(skip ? target : 0);
  const from = useRef(skip ? target : 0);
  useEffect(() => {
    if (!enabled || motionOff()) {
      from.current = target;
      setVal(target);
      return undefined;
    }
    const a = from.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const v = a + (target - a) * (1 - Math.pow(1 - p, 3));
      from.current = v;
      setVal(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, enabled, duration]);
  return val;
}

export function CountUp({ value, duration }) {
  const p = parseValue(value);
  const cur = useCountUp(p ? p.n : 0, { duration, enabled: !!p });
  return p ? format(cur, p) : value;
}

// احتفال بالقصاصات الملوّنة عند إنجاز مميّز
export function celebrate({ x, y, count = 48 } = {}) {
  if (motionOff()) return;
  const host = document.createElement("div");
  host.className = "confetti";
  host.setAttribute("aria-hidden", "true");
  const ox = x ?? window.innerWidth / 2;
  const oy = y ?? window.innerHeight * 0.34;
  const palette = ["#ddbe84", "#a9822f", "#2aa57a", "#3f6fa3", "#f4ead2", "#d9776a"];
  for (let i = 0; i < count; i++) {
    const p = document.createElement("i");
    const ang = Math.random() * Math.PI * 2;
    const dist = 110 + Math.random() * 280;
    const w = 6 + Math.random() * 6;
    p.style.cssText = `left:${ox}px;top:${oy}px;--x:${Math.cos(ang) * dist}px;--y:${Math.sin(ang) * dist - 130}px;--r:${Math.random() * 720 - 360}deg;--c:${palette[i % palette.length]};--d:${1000 + Math.random() * 800}ms;--w:${w}px`;
    host.appendChild(p);
  }
  document.body.appendChild(host);
  window.setTimeout(() => host.remove(), 2100);
}

const RIPPLE_HOSTS = ".btn, .nav-item, .tab, .segmented button, .icon-btn, button.chip, .list-row.clickable, .type-card, .qdot, .opt, .palette-item, .pop-item";
const SPOTLIGHT = ".stat, .card:not(.card-dark):not(.card-gold)";

// تفاعلات عامة بتفويض الأحداث: تموّج عند اللمس/النقر، وإضاءة تتبع المؤشر فوق البطاقات
export function initMotion() {
  if (!isBrowser) return () => {};

  const onDown = (e) => {
    if (motionOff() || e.button > 0) return;
    const host = e.target.closest?.(RIPPLE_HOSTS);
    if (!host || host.disabled || host.getAttribute("aria-disabled") === "true") return;
    let layer = host.querySelector(":scope > .rpl-layer");
    if (!layer) {
      if (getComputedStyle(host).position === "static") host.style.position = "relative";
      layer = document.createElement("span");
      layer.className = "rpl-layer";
      layer.setAttribute("aria-hidden", "true");
      host.appendChild(layer);
    }
    const r = host.getBoundingClientRect();
    const d = Math.max(r.width, r.height) * 2;
    const dot = document.createElement("span");
    dot.className = "rpl";
    dot.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    layer.appendChild(dot);
    dot.addEventListener("animationend", () => dot.remove(), { once: true });
  };

  let raf = 0;
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const el = e.target.closest?.(SPOTLIGHT);
    if (!el) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
    });
  };

  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointermove", onMove);
  };
}
