import { createContext, useCallback, useContext, useId, useState } from "react";
import { Check, AlertTriangle, AlertOctagon, Info } from "lucide-react";
import { useLang } from "../i18n";

// شعار مشرق: شمس تشرق فوق الأفق — نصف قرص ذهبي، أشعّة بتدرّج الفجر (برتقالي ← ذهبي ← فيروزي)
// وقوس أفق من الأزرق الكحلي إلى الفيروزي. أُعيد رسمه متّجهيًّا عن بطاقة الهوية (docs/brand/).
// تحت ٢٨px تُستخدم نسخة مبسّطة بأربعة أشعّة حتى يبقى الرمز مقروءًا.
const RAYS = [
  // [x1, y1, x2, y2, from, to]
  [25, 43.1, 17, 42.8, "#0AA3C7", "#13B5D0"],
  [29.2, 32, 15.4, 24, "#FFA43A", "#FF8A2A"],
  [38, 23.2, 29.5, 8.5, "#FEC443", "#FDB52E"],
  [50, 20, 50, 2, "#FEC443", "#FDBA30"],
  [62, 23.2, 70.5, 8.5, "#9CCB5E", "#1EC2A8"],
  [70.8, 32, 84.6, 24, "#1EC2A8", "#0AC5BA"],
  [75, 43.1, 83, 42.8, "#0AC5BA", "#2ACDC6"],
];
const RAYS_COMPACT = [
  [27.3, 33.4, 13.7, 27.1, "#FFA43A", "#FF8A2A"],
  [39.4, 21.3, 32.3, 5.9, "#FEC443", "#FDB52E"],
  [60.6, 21.3, 67.7, 5.9, "#9CCB5E", "#1EC2A8"],
  [72.7, 33.4, 86.3, 27.1, "#1EC2A8", "#0AC5BA"],
];

export function LogoMark({ size = 40, mono = false, title = "مشرق" }) {
  const id = useId().replace(/:/g, "");
  const compact = size < 28;
  const rays = compact ? RAYS_COMPACT : RAYS;
  const w = Math.round(size * (88 / 66));
  return (
    <svg className="logo-mark" viewBox="6 -3 88 66" width={w} height={size} role="img" aria-label={title}>
      {!mono && (
        <defs>
          <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFCB4F" />
            <stop offset="1" stopColor="#FDB430" />
          </linearGradient>
          <linearGradient id={`${id}-hz`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#004F87" />
            <stop offset=".48" stopColor="#0A9CC4" />
            <stop offset="1" stopColor="#40D1CD" />
          </linearGradient>
          {rays.map(([x1, y1, x2, y2, a, b], i) => (
            <linearGradient key={i} id={`${id}-r${i}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
              <stop offset="0" stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          ))}
        </defs>
      )}
      <g strokeLinecap="round" fill="none" strokeWidth={compact ? 8.5 : 7}>
        {rays.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={mono ? "currentColor" : `url(#${id}-r${i})`} />
        ))}
      </g>
      <path d="M33 44A17 17 0 0 1 67 44Z" fill={mono ? "currentColor" : `url(#${id}-sun)`} />
      <path d="M12 58Q50 30 88 58" fill="none" stroke={mono ? "currentColor" : `url(#${id}-hz)`} strokeWidth={compact ? 10 : 8.5} strokeLinecap="round" />
    </svg>
  );
}

// الكلمة: «مشرق» أوّلًا و Mushriq تحتها؛ وفي الإنجليزية العكس. light = على خلفية داكنة.
export function Wordmark({ light, size = "md", markOnly = false }) {
  const { lang } = useLang();
  const en = lang === "en";
  const mark = size === "lg" ? 52 : size === "sm" ? 34 : 38;
  return (
    <div className={`wordmark wordmark-${size} ${light ? "light" : ""}`} data-notr>
      <LogoMark size={mark} />
      {!markOnly && (
        <div>
          <strong lang={en ? "en" : "ar"}>{en ? "Mushriq" : "مشرق"}</strong>
          <span lang={en ? "ar" : "en"}>{en ? "مشرق" : "Mushriq"}</span>
        </div>
      )}
    </div>
  );
}

// ───── الإشعارات المنبثقة ─────
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message, tone = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x, { id, message, tone }]);
    window.setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="toast-host" aria-live="polite" role="status">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === "success" ? <Check size={17} aria-hidden="true" /> : t.tone === "warn" ? <AlertTriangle size={17} aria-hidden="true" /> : t.tone === "danger" ? <AlertOctagon size={17} aria-hidden="true" /> : <Info size={17} aria-hidden="true" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
