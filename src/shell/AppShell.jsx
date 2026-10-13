import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, ChevronLeft, LogOut, Menu, MoreHorizontal, PanelRightClose, PanelRightOpen, Search, Settings, X } from "lucide-react";
import { NAV, flatNav, pageLabel } from "../data/nav";
import { ROLES } from "../data/people";
import { Wordmark } from "../ui/Brand";
import { Avatar, cx } from "../ui/Primitives";
import { useStore } from "../store/StoreProvider";
import { myNotifications, unreadThreads, pendingReviews, essayQueue, allLessons, allStudents, pendingEnrollmentsForTeacher, avatarOf } from "../store/selectors";
import { timeAgo } from "../lib/format";
import { normalizeAr } from "../lib/rng";
import SettingsDialog from "./SettingsDialog";
import { LangToggle } from "../i18n/LangToggle";
import { useLang } from "../i18n";

const RAIL_KEY = "taqat-sidebar";
const readRail = () => {
  try {
    return localStorage.getItem(RAIL_KEY) === "collapsed";
  } catch {
    return false;
  }
};

// focus: وضع الدرس/الاختبار — تُطوى القائمة الجانبية مؤقتًا دون تغيير تفضيل المستخدم
export default function AppShell({ page, go, children, focus }) {
  const { state, dispatch, user } = useStore();
  const { lang, setLang } = useLang();
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(readRail);
  const [pop, setPop] = useState(null); // "notif" | "profile" | null
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const role = user.role;
  const groups = NAV[role];
  const items = flatNav(role);
  const group = groups.find((g) => g.items.some((i) => i.id === page));
  const org = state.schools.find((s) => s.id === user.school)?.name || "منصّة طاقات";

  // أنماط نظام التصميم الجديد تُطبَّق داخل التطبيق فقط (والنوافذ المرسومة على <body>)
  useLayoutEffect(() => {
    document.body.classList.add("in-app");
    return () => document.body.classList.remove("in-app");
  }, []);

  // شارات العدّ في التنقّل — من الحالة الفعلية فقط
  const badges = useMemo(() => {
    const b = { messages: unreadThreads(state, user.id) };
    if (role === "teacher") {
      b.review = pendingReviews(state, user.id).filter((r) => r.status === "pending").length;
      b.grading = essayQueue(state, user.id).filter((e) => !e.essay.final).length;
      b.enrollments = pendingEnrollmentsForTeacher(state, user.id).length;
    }
    if (role === "school") b.users = state.directory.filter((d) => d.status === "بانتظار الاعتماد" && d.role !== "teacher").length;
    if (role === "system") {
      b.teacherRequests = state.directory.filter((d) => d.status === "بانتظار الاعتماد" && d.role === "teacher").length;
      b.leads = (state.leads || []).filter((l) => l.status === "جديد").length;
    }
    return b;
  }, [state, user.id, role]);

  const notifs = myNotifications(state, user);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    setDrawer(false);
    setPop(null);
  }, [page]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setPop(null);
        setDrawer(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleRail = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(RAIL_KEY, c ? "expanded" : "collapsed");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  const openNotif = (n) => {
    dispatch({ type: "readNotif", id: n.id });
    setPop(null);
    go(items.some((i) => i.id === n.link) ? n.link : "home");
  };

  // أوّل أربع وجهات في الشريط السفلي على الجوال + «المزيد» لفتح القائمة الكاملة
  const bottom = items.slice(0, 4);

  return (
    <div className={cx("shell app", (collapsed || focus) && "collapsed", focus && "focus")}>
      <aside className={cx("sb", drawer && "open")} aria-label="القائمة الرئيسية">
        <div className="sb-head">
          <Wordmark light />
          <button className="icon-btn sb-close" onClick={() => setDrawer(false)} aria-label="إغلاق القائمة">
            <X size={18} />
          </button>
        </div>
        <div className="sb-org">
          <strong>{org}</strong>
          <small>{ROLES[role].long}</small>
        </div>
        <nav className="sb-nav" aria-label="أقسام الدور">
          {groups.map((g) => (
            <div className="sb-group" key={g.group} role="group" aria-label={g.group}>
              <span className="sb-label" aria-hidden="true">{g.group}</span>
              {g.items.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={cx("sb-item", page === id && "active")}
                  onClick={() => go(id)}
                  aria-current={page === id ? "page" : undefined}
                  title={collapsed ? label : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                  {badges[id] > 0 && (
                    <b className="sb-count" aria-label={`${badges[id]} جديد`}>
                      {badges[id]}
                    </b>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sb-foot">
          <button className="sb-item" onClick={() => setSettingsOpen(true)} title={collapsed ? "الإعدادات" : undefined}>
            <Settings size={18} aria-hidden="true" />
            <span>الإعدادات</span>
          </button>
          <button className="sb-item sb-collapse" onClick={toggleRail} aria-expanded={!collapsed} title={collapsed ? "توسيع القائمة" : undefined}>
            {collapsed ? <PanelRightOpen size={18} aria-hidden="true" /> : <PanelRightClose size={18} aria-hidden="true" />}
            <span>طيّ القائمة</span>
          </button>
          <button className="sb-item" onClick={() => dispatch({ type: "logout" })} title={collapsed ? "تسجيل الخروج" : undefined}>
            <LogOut size={18} aria-hidden="true" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <div className="shell-main">
        <header className="tb">
          <button className="icon-btn tb-menu" onClick={() => setDrawer(true)} aria-label="فتح القائمة" aria-expanded={drawer}>
            <Menu size={20} />
          </button>
          <nav className="crumbs" aria-label="مسار التنقّل">
            <ol>
              <li>
                <button onClick={() => go("home")}>{ROLES[role].long}</button>
                <ChevronLeft size={14} aria-hidden="true" />
              </li>
              {group && page !== "home" && groups.length > 1 && (
                <li>
                  <span>{group.group}</span>
                  <ChevronLeft size={14} aria-hidden="true" />
                </li>
              )}
              <li>
                <span aria-current="page">{pageLabel(role, page) || "الرئيسية"}</span>
              </li>
            </ol>
          </nav>
          <button className="tb-search" onClick={() => setSearchOpen(true)}>
            <Search size={16} aria-hidden="true" />
            <span>ابحث في الصفحات…</span>
            <kbd className="kbd">Ctrl K</kbd>
          </button>
          <div className="tb-actions">
            <button className="icon-btn tb-search-icon" onClick={() => setSearchOpen(true)} aria-label="بحث">
              <Search size={19} />
            </button>
            <LangToggle />
            <div className="popwrap">
              <button className="icon-btn" onClick={() => setPop(pop === "notif" ? null : "notif")} aria-label={`الإشعارات (${unread} غير مقروء)`} aria-expanded={pop === "notif"} aria-haspopup="dialog">
                <Bell size={19} />
                {unread > 0 && <i className="tb-badge num">{unread > 9 ? "9+" : unread}</i>}
              </button>
              {pop === "notif" && (
                <div className="popover notif-pop" role="dialog" aria-label="الإشعارات">
                  <div className="pop-head">
                    <strong>الإشعارات</strong>
                    <button className="btn-link small" disabled={unread === 0} onClick={() => dispatch({ type: "readAllNotifs", user })}>
                      تعليم الكل كمقروء
                    </button>
                  </div>
                  <div className="pop-list">
                    {notifs.length === 0 && <p className="muted pop-empty">لا توجد إشعارات.</p>}
                    {notifs.slice(0, 8).map((n) => (
                      <div key={n.id} className={cx("notif", !n.read && "unread")}>
                        <button className="notif-open" onClick={() => openNotif(n)}>
                          <i className={`nt-${n.tone}`} aria-hidden="true" />
                          <div>
                            <strong>{n.title}</strong>
                            <span>{n.body}</span>
                            <small>
                              {timeAgo(n.at)}
                              {!n.read && <span className="sr-only"> — غير مقروء</span>}
                            </small>
                          </div>
                        </button>
                        {!n.read && (
                          <button className="notif-mark" aria-label="تعليم كمقروء" title="تعليم كمقروء" onClick={() => dispatch({ type: "readNotif", id: n.id })}>
                            <Check size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="popwrap">
              <button className="tb-profile" onClick={() => setPop(pop === "profile" ? null : "profile")} aria-expanded={pop === "profile"} aria-haspopup="menu" aria-label={`حسابي: ${user.name}`}>
                <Avatar name={user.name} src={avatarOf(state, user.id)} size={32} tone="gold" />
                <div>
                  <strong>{user.name}</strong>
                  <small>{ROLES[role].long}</small>
                </div>
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              {pop === "profile" && (
                <div className="popover" role="menu" aria-label="حسابي">
                  <div className="pop-head">
                    <div style={{ minWidth: 0 }}>
                      <strong>{user.name}</strong>
                      <small dir="ltr" style={{ textAlign: "start" }}>{user.email}</small>
                    </div>
                  </div>
                  <div style={{ padding: "4px 0" }}>
                    <button role="menuitem" className="pop-item" onClick={() => { setSettingsOpen(true); setPop(null); }}>
                      <Settings size={16} aria-hidden="true" /> الإعدادات والأمان
                    </button>
                    <button role="menuitem" className="pop-item pop-lang" data-notr onClick={() => { setLang(lang === "en" ? "ar" : "en"); setPop(null); }}>
                      <span aria-hidden="true" style={{ width: 16, textAlign: "center", fontWeight: 700 }}>{lang === "en" ? "ع" : "A"}</span>
                      {lang === "en" ? "العربية" : "English"}
                    </button>
                    <div className="pop-sep" />
                    <button role="menuitem" className="pop-item danger" onClick={() => dispatch({ type: "logout" })}>
                      <LogOut size={16} aria-hidden="true" /> تسجيل الخروج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="content" className="shell-content">{children}</main>
      </div>

      <nav className="bn" aria-label="التنقّل السريع" style={{ "--bn-cols": bottom.length + 1 }}>
        {bottom.map(({ id, label, short, icon: Icon }) => (
          <button key={id} className={cx("bn-item", page === id && "active")} onClick={() => go(id)} aria-current={page === id ? "page" : undefined} aria-label={short && short !== label ? label : undefined}>
            <Icon size={20} aria-hidden="true" />
            <span>{short || label}</span>
            {badges[id] > 0 && <i className="bn-dot num" aria-label={`${badges[id]} جديد`}>{badges[id]}</i>}
          </button>
        ))}
        <button className={cx("bn-item", !bottom.some((b) => b.id === page) && "active")} onClick={() => setDrawer(true)} aria-expanded={drawer}>
          <MoreHorizontal size={20} aria-hidden="true" />
          <span>المزيد</span>
        </button>
      </nav>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} go={go} role={role} state={state} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {pop && <div className="pop-scrim" onClick={() => setPop(null)} />}
    </div>
  );
}

function CommandPalette({ onClose, go, role, state }) {
  const [q, setQ] = useState("");
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  const items = useMemo(() => {
    const pages = flatNav(role).map((i) => ({ key: `p-${i.id}`, label: i.label, kind: "صفحة", run: () => go(i.id) }));
    const extra = [];
    if (role === "student") allLessons(state).forEach((l) => extra.push({ key: l.id, label: l.title, kind: "درس", run: () => go("learn", `lesson/${l.id}`) }));
    if (role === "teacher") allStudents(state).forEach((s) => extra.push({ key: s.id, label: s.name, kind: "طالب", run: () => go("classes") }));
    if (role === "teacher") allLessons(state).forEach((l) => extra.push({ key: l.id, label: l.title, kind: "درس", run: () => go("curriculum") }));
    if (role === "school") state.directory.forEach((d) => extra.push({ key: `u-${d.id}`, label: d.name, kind: "مستخدم", run: () => go("users") }));
    if (role === "school") state.classes.forEach((c) => extra.push({ key: `c-${c.id}`, label: c.name, kind: "فصل", run: () => go("structure") }));
    return [...pages, ...extra];
  }, [role, state, go]);
  const results = useMemo(() => {
    // نُسقط «ال» التعريف من كلمات البحث ليطابق «الطلاب» عبارة «فصولي وطلابي»
    const tokens = normalizeAr(q).split(" ").filter(Boolean).map((t) => t.replace(/^ال(?=.{2})/, ""));
    const hit = (label) => tokens.every((t) => normalizeAr(label).includes(t));
    return (tokens.length ? items.filter((i) => hit(i.label)) : items.slice(0, 8)).slice(0, 9);
  }, [q, items]);
  const pick = (r) => {
    r.run();
    onClose();
  };
  return (
    <div className="overlay palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="بحث">
        <div className="palette-input">
          <Search size={18} aria-hidden="true" />
          <input
            ref={ref}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن صفحة أو مستخدم أو فصل…"
            aria-label="بحث"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "Enter" && results[0]) pick(results[0]);
            }}
          />
          <kbd className="kbd">Esc</kbd>
        </div>
        <div className="palette-list">
          {results.length === 0 && <p className="muted pop-empty">لا نتائج مطابقة لـ «{q}».</p>}
          {results.map((r) => (
            <button key={r.key} className="palette-item" onClick={() => pick(r)}>
              <span>{r.label}</span>
              <em>{r.kind}</em>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
