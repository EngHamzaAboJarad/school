import { createContext, useCallback, useContext, useState } from "react";
import { Check, AlertTriangle, Info } from "lucide-react";
import { useLang } from "../i18n";

// شعار طاقات: حرف «ط» هندسي بخط وحيد السماكة — حلقة وساق وذيل — تعلو ساقه شرارة (الطاقة).
export function LogoMark({ size = 40 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label="شعار طاقات">
      <defs>
        <linearGradient id="tq-brass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4ead0" />
          <stop offset=".55" stopColor="#ddbe84" />
          <stop offset="1" stopColor="#b4862e" />
        </linearGradient>
        <linearGradient id="tq-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e4180" />
          <stop offset="1" stopColor="#0a1830" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="url(#tq-navy)" />
      <rect x="1.75" y="1.75" width="44.5" height="44.5" rx="13.25" fill="none" stroke="url(#tq-brass)" strokeWidth="1.2" opacity=".85" />
      <g fill="none" stroke="url(#tq-brass)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20.5" cy="28" rx="8.5" ry="5.5" />
        <path d="M29 15.5V31c0 4.5-3 7-8 7H10.5" />
      </g>
      <path d="M29 3.8l1.9 4.2 4.2 1.9-4.2 1.9L29 16l-1.9-4.2-4.2-1.9L27.1 8z" fill="url(#tq-brass)" />
    </svg>
  );
}

export function Wordmark({ light, size = "md" }) {
  const { lang } = useLang();
  const en = lang === "en";
  return (
    <div className={`wordmark wordmark-${size} ${light ? "light" : ""}`} data-notr>
      <LogoMark size={size === "lg" ? 52 : 40} />
      <div>
        <strong>{en ? "Taqat" : "طاقات"}</strong>
        <span>{en ? "SCHOOL" : "TAQAT SCHOOL"}</span>
      </div>
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
      <div className="toast-host" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === "success" ? <Check size={17} /> : t.tone === "warn" ? <AlertTriangle size={17} /> : <Info size={17} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
