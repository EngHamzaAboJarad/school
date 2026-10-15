import { Suspense, lazy, useEffect, useState } from "react";
import Landing from "./marketing/Landing";
import LegalPage from "./marketing/LegalPage";
import { LogoMark } from "./ui/Brand";
import { useRoute } from "./lib/router";

// الصفحة الرئيسية والصفحات القانونية خفيفة وتُرسم وحدها. التطبيق الكامل (الأدوار والبيانات
// التجريبية والمنهج) يُحمَّل فقط عند الحاجة: تسجيل الدخول، أو دور، أو جلسة محفوظة.
const App = lazy(() => import("./App"));
const LIGHT_PAGES = new Set(["", "privacy", "terms"]);

// هل في المتصفح جلسة دخول محفوظة؟ قراءة نصّية سريعة دون تحميل المخزن.
function hasSavedSession() {
  if (typeof window === "undefined") return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && /^mushriq-state-v\d+$/.test(k)) return /"session":\{/.test(localStorage.getItem(k) || "");
    }
  } catch {
    /* التخزين غير متاح */
  }
  return false;
}

export function needsApp(page) {
  return !LIGHT_PAGES.has(page) || hasSavedSession();
}

function Splash() {
  return (
    <div className="app-splash" role="status" aria-label="جارٍ التحميل">
      <LogoMark size={56} />
    </div>
  );
}

export default function Root() {
  const { page, go } = useRoute("");
  // بعد تحميل التطبيق مرّة يبقى هو المسؤول عن كل المسارات (ومنها الرئيسية بعد الخروج)
  const [appLoaded, setAppLoaded] = useState(() => needsApp(page));
  const wantApp = appLoaded || !LIGHT_PAGES.has(page);
  useEffect(() => {
    if (wantApp && !appLoaded) setAppLoaded(true);
  }, [wantApp, appLoaded]);

  if (wantApp)
    return (
      <Suspense fallback={<Splash />}>
        <App />
      </Suspense>
    );
  if (page === "privacy" || page === "terms") return <LegalPage kind={page} />;
  return <Landing onEnter={() => go("login")} onJoin={(flow) => go("login", flow)} />;
}
