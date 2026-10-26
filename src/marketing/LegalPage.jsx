import { useEffect } from "react";
import { ChevronLeft, FileWarning } from "lucide-react";
import { Wordmark } from "../ui/Brand";
import { LangToggle } from "../i18n/LangToggle";
import { useLang } from "../i18n";
import { legalDoc } from "./legal";

// صفحة قانونية مستقلّة (الخصوصية / الشروط). النص يُختار حسب اللغة مباشرة، فلا يمرّ بالمترجم الحيّ.
export default function LegalPage({ kind }) {
  const { lang } = useLang();
  const en = lang === "en";
  const doc = legalDoc(kind, lang);

  useEffect(() => {
    document.title = `${doc.title} | ${en ? "Mushriq" : "مشرق"}`;
  }, [doc.title, en]);

  return (
    <div className="landing ld-legal" dir={en ? "ltr" : "rtl"} data-notr>
      <header className="ld-nav">
        <div className="ld-wrap ld-nav-inner">
          <a href="/" className="ld-brand" aria-label={en ? "Mushriq home" : "الصفحة الرئيسية لمشرق"}>
            <Wordmark size="sm" />
          </a>
          <div className="ld-nav-actions">
            <LangToggle />
          </div>
        </div>
      </header>
      <main className="ld-wrap ld-legal-body">
        <a href="/" className="ld-legal-back">
          <ChevronLeft size={16} className="ld-dir ld-back-icon" aria-hidden="true" />
          {en ? "Back to the home page" : "العودة إلى الصفحة الرئيسية"}
        </a>
        <h1>{doc.title}</h1>
        <p className="ld-legal-updated">{doc.updated}</p>
        {doc.draft && (
          <p className="ld-legal-draft" role="note">
            <FileWarning size={18} aria-hidden="true" />
            {doc.draft}
          </p>
        )}
        {doc.sections.map((sec) => (
          <section key={sec.h}>
            <h2>{sec.h}</h2>
            {sec.p?.map((t) => (
              <p key={t}>{t}</p>
            ))}
            {sec.list && (
              <ul>
                {sec.list.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <nav className="ld-legal-links" aria-label={en ? "Legal pages" : "الصفحات القانونية"}>
          <a href="/privacy/" aria-current={kind === "privacy" ? "page" : undefined}>
            {en ? "Privacy policy" : "سياسة الخصوصية"}
          </a>
          <a href="/terms/" aria-current={kind === "terms" ? "page" : undefined}>
            {en ? "Terms of use" : "شروط الاستخدام"}
          </a>
        </nav>
      </main>
    </div>
  );
}
