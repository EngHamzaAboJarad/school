import { Suspense, lazy, useEffect } from "react";
import { StoreProvider, useStore } from "./store/StoreProvider";
import { ToastProvider } from "./ui/Brand";
import { ConfirmProvider } from "./ui/Confirm";
import AuthScreen from "./auth/AuthScreen";
import Landing from "./marketing/Landing";
import AppShell from "./shell/AppShell";
import { applyPrefs, loadPrefs } from "./shell/SettingsDialog";
import { useRoute } from "./lib/router";
import { initMotion } from "./ui/motion";
import { flatNav, pageLabel } from "./data/nav";
import { ROLES } from "./data/people";
import StudentPages from "./roles/student";
import ParentPages from "./roles/parent";
import TeacherPages from "./roles/teacher";
import SchoolPages from "./roles/school";
import SupervisorPages from "./roles/supervisor";
import SystemPages from "./roles/system";

// معرض المكوّنات: وضع التطوير فقط (يُحذف من نسخة الإنتاج)
const UiKit = import.meta.env.DEV ? lazy(() => import("./dev/UiKit")) : null;

const PAGES = {
  student: StudentPages,
  parent: ParentPages,
  teacher: TeacherPages,
  school: SchoolPages,
  supervisor: SupervisorPages,
  system: SystemPages,
};

function Routed() {
  const { dispatch, user } = useStore();
  const { page, param, go } = useRoute("home");
  const join = (flow) => go("login", flow);

  useEffect(() => {
    if (!user) return;
    const label = pageLabel(user.role, page);
    document.title = `${label ? `${label} — ` : ""}${ROLES[user.role].long} | طاقات سكول`;
  }, [user, page]);

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
      <Pages page={current} param={param} go={go} />
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
