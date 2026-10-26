import { Suspense, lazy, useEffect } from "react";
import { StoreProvider, useStore } from "./store/StoreProvider";
import { ToastProvider } from "./ui/Brand";
import { ConfirmProvider } from "./ui/Confirm";
import AuthScreen from "./auth/AuthScreen";
import Landing from "./marketing/Landing";
import LegalPage from "./marketing/LegalPage";
import AppShell from "./shell/AppShell";
import { applyPrefs, loadPrefs } from "./shell/SettingsDialog";
import { useRoute } from "./lib/router";
import { initMotion } from "./ui/motion";
import { flatNav, pageLabel } from "./data/nav";
import { ROLES, DEMO_ACCOUNTS } from "./data/people";
// أنماط التطبيق الداخلي: تُحمَّل مع هذه الحزمة فقط، لا مع الصفحة الرئيسية
import "./styles/components.css";
import "./styles/auth.css";
import "./styles/pages.css";
import "./styles/roles.css";
import "./styles/admin.css";
import "./styles/homes.css";
import "./styles/screens.css";
import "./styles/motion.css";

// معرض المكوّنات: وضع التطوير فقط (يُحذف من نسخة الإنتاج)
const UiKit = import.meta.env.DEV ? lazy(() => import("./dev/UiKit")) : null;

// صفحات كل دور في حزمة مستقلّة: الطالب لا ينزّل شاشات الإدارة، والعكس
const PAGES = {
  student: lazy(() => import("./roles/student")),
  parent: lazy(() => import("./roles/parent")),
  teacher: lazy(() => import("./roles/teacher")),
  school: lazy(() => import("./roles/school")),
  supervisor: lazy(() => import("./roles/supervisor")),
  system: lazy(() => import("./roles/system")),
};

function Routed() {
  const { dispatch, user } = useStore();
  const { page, param, go } = useRoute("home");
  const join = (flow) => go("login", flow);

  useEffect(() => {
    if (!user) return;
    const label = pageLabel(user.role, page);
    document.title = `${label ? `${label} — ` : ""}${ROLES[user.role].long} | مشرق`;
  }, [user, page]);

  // #/demo/<role>: دخول مباشر إلى بيئة العرض من الصفحة الرئيسية (بيانات وهمية، بلا كلمة مرور منشورة)
  useEffect(() => {
    if (page !== "demo") return;
    const acc = DEMO_ACCOUNTS.find((a) => a.role === param);
    if (acc) dispatch({ type: "login", userId: acc.userId, role: acc.role });
    window.location.replace(acc ? "#/home" : "#/");
  }, [page, param, dispatch]);
  if (page === "demo") return null;

  if (page === "privacy" || page === "terms") return <LegalPage kind={page} />;

  if (UiKit && page === "ui-kit") return <Suspense fallback={null}><UiKit /></Suspense>;

  if (!user)
    return page === "login" ? (
      <AuthScreen
        initialFlow={param}
        onBack={() => go("")}
        onLogin={(acc) => {
          window.location.hash = "#/home";
          dispatch({ type: "login", userId: acc.userId, role: acc.role });
        }}
      />
    ) : (
      <Landing onEnter={() => go("login")} onJoin={join} />
    );

  const current = flatNav(user.role).some((i) => i.id === page) ? page : "home";
  const Pages = PAGES[user.role];
  return (
    <AppShell page={current} go={go} focus={user.role === "student" && current === "learn" && /^(lesson|exam)\//.test(param || "")}>
      <Suspense fallback={<div className="page-loading" role="status" aria-label="جارٍ التحميل" />}>
        <Pages page={current} param={param} go={go} />
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  useEffect(() => applyPrefs(loadPrefs()), []);
  useEffect(() => initMotion(), []);
  return (
    <StoreProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routed />
        </ConfirmProvider>
      </ToastProvider>
    </StoreProvider>
  );
}
