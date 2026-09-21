import { createContext, useCallback, useContext, useState } from "react";
import { Check, AlertTriangle, Info } from "lucide-react";

// شعار طاقات: نجمة ثمانية (مربّعان متداخلان) تحيط ببرقٍ يرمز للطاقة
export function LogoMark({ size = 40 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label="شعار طاقات">
      <defs>
        <linearGradient id="tq-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1e2b8" />
          <stop offset=".5" stopColor="#d8b45e" />
          <stop offset="1" stopColor="#a9822f" />
        </linearGradient>
        <linearGradient id="tq-em" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#125347" />
          <stop offset="1" stopColor="#04201b" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="url(#tq-em)" />
      <rect x="1.75" y="1.75" width="44.5" height="44.5" rx="13.25" fill="none" stroke="url(#tq-gold)" strokeWidth="1.5" />
      <g fill="none" stroke="url(#tq-gold)" strokeWidth="1.2" opacity=".9">
        <rect x="12" y="12" width="24" height="24" />
        <rect x="12" y="12" width="24" height="24" transform="rotate(45 24 24)" />
      </g>
      <path d="M26.6 11.5 17 25.8h6.1l-1.9 10.7 9.8-14.6h-6.2z" fill="url(#tq-gold)" />
    </svg>
  );
}

export function Wordmark({ light, size = "md" }) {
  return (
    <div className={`wordmark wordmark-${size} ${light ? "light" : ""}`}>
      <LogoMark size={size === "lg" ? 52 : 40} />
      <div>
        <strong>طاقات</strong>
        <span>TAQAT SCHOOL</span>
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
