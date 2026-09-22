import { Globe } from "lucide-react";
import { useLang } from "./index.jsx";

// زر تبديل اللغة. النص داخله لا يُترجم (data-notr) حتى يبقى «العربية» عربيًّا و«English» إنجليزيًّا.
export function LangToggle({ className = "" }) {
  const { lang, setLang } = useLang();
  const next = lang === "en" ? "ar" : "en";
  return (
    <button
      type="button"
      className={`lang-toggle ${className}`}
      data-notr
      onClick={() => setLang(next)}
      aria-label={next === "en" ? "Switch to English" : "التبديل إلى العربية"}
      title={next === "en" ? "Switch to English" : "التبديل إلى العربية"}
    >
      <Globe size={16} />
      <span>{next === "en" ? "English" : "العربية"}</span>
    </button>
  );
}

// اختيار اللغة داخل الإعدادات.
export function LangSegmented() {
  const { lang, setLang } = useLang();
  return (
    <div className="segmented" role="radiogroup" data-notr>
      {[["ar", "العربية"], ["en", "English"]].map(([id, label]) => (
        <button key={id} role="radio" aria-checked={lang === id} className={lang === id ? "active" : ""} onClick={() => lang !== id && setLang(id)}>
          {label}
        </button>
      ))}
    </div>
  );
}
