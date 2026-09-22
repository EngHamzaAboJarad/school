import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, LogOut, Menu, Search, Settings, X, Repeat, ArrowLeft } from "lucide-react";
import { NAV, flatNav, pageLabel } from "../data/nav";
import { ROLES, DEMO_ACCOUNTS } from "../data/people";
import { Wordmark } from "../ui/Brand";
import { Avatar, cx } from "../ui/Primitives";
import { useStore } from "../store/StoreProvider";
import { myNotifications, unreadThreads, pendingReviews, essayQueue, allLessons, allStudents } from "../store/selectors";
import { timeAgo } from "../lib/format";
import { normalizeAr } from "../lib/rng";
import SettingsDialog from "./SettingsDialog";
import { LangToggle } from "../i18n/LangToggle";
import { useToast } from "../ui/Brand";

export default function AppShell({ page, go, children }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const role = user.role;
  const groups = NAV[role];

  // شارات العدّ في التنقّل
  const badges = useMemo(() => {
    const b = { messages: unreadThreads(state, user.id) };
    if (role === "teacher") {
      b.review = pendingReviews(state, user.id).filter((r) => r.status === "pending").length;
      b.grading = essayQueue(state, user.id).filter((e) => !e.essay.final).length;
    }
    if (role === "school") b.users = state.directory.filter((d) => d.status === "بانتظار الاعتماد").length;
    return b;
  }, [state, user.id, role]);

  const notifs = myNotifications(state, user);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => setDrawer(false), [page]);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const switchRole = (r) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === r);
    dispatch({ type: "login", userId: acc.userId, role: r });
    setProfileOpen(false);
    go("home");
    toast(`عرض تجريبي: واجهة ${ROLES[r].long}`, "info");
  };

  const openNotif = (n) => {
    dispatch({ type: "readNotif", id: n.id });
    setNotifOpen(false);
    go(flatNav(role).some((i) => i.id === n.link) ? n.link : "home");
  };

  return (
    <div className="app">
      <aside className={cx("sidebar", drawer && "open")} aria-label="القائمة الرئيسية">
        <div className="sidebar-brand">
          <Wordmark light />
          <button className="icon-btn sidebar-close" onClick={() => setDrawer(false)} aria-label="إغلاق القائمة">
            <X size={18} />
          </button>
        </div>
        <div className="role-card">
          <span className="role-chip">{ROLES[role].long}</span>
          <strong>{user.title || (user.grade ? `الصف ${user.grade}` : ROLES[role].desc)}</strong>
          <small>{role === "supervisor" || role === "system" ? "منصّة طاقات" : "مدرسة الأفق الأهلية"}</small>
        </div>
        <nav>
          {groups.map((g) => (
            <div className="nav-group" key={g.group}>
              <span className="nav-label">{g.group}</span>
              {g.items.map(({ id, label, icon: Icon }) => (
                <button key={id} className={cx("nav-item", page === id && "active")} onClick={() => go(id)} aria-current={page === id ? "page" : undefined}>
                  <Icon size={19} />
                  <span>{label}</span>
                  {badges[id] > 0 && <b className="nav-count">{badges[id]}</b>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="sync"><i /> متصل • آخر مزامنة الآن</div>
          <div className="row spread">
            <button className="nav-item small" onClick={() => setSettingsOpen(true)}><Settings size={17} /><span>الإعدادات</span></button>
            <button className="nav-item small" onClick={() => dispatch({ type: "logout" })}><LogOut size={17} /><span>خروج</span></button>
          </div>
        </div>
      </aside>
      {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}

      <div className="main">
        <header className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="فتح القائمة"><Menu size={21} /></button>
          <div className="crumbs">
            <span>{ROLES[role].long}</span>
            <ArrowLeft size={14} />
            <b>{pageLabel(role, page) || "الرئيسية"}</b>
          </div>
          <button className="search-trigger" onClick={() => setSearchOpen(true)}>
            <Search size={17} />
            <span>ابحث في الدروس والصفحات…</span>
            <kbd className="kbd">Ctrl K</kbd>
          </button>
          <div className="top-actions">
            <button className="icon-btn search-icon" onClick={() => setSearchOpen(true)} aria-label="بحث"><Search size={19} /></button>
            <LangToggle />
            <div className="popwrap">
              <button className="icon-btn" onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} aria-label={`الإشعارات (${unread} غير مقروء)`} aria-expanded={notifOpen}>
                <Bell size={20} />
                {unread > 0 && <i className="dot num">{unread}</i>}
              </button>
              {notifOpen && (
                <div className="popover notif-pop">
                  <div className="pop-head">
                    <strong>الإشعارات</strong>
                    <button className="btn-link small" onClick={() => dispatch({ type: "readAllNotifs", user })}>تعليم الكل كمقروء</button>
                  </div>
                  <div className="pop-list">
                    {notifs.length === 0 && <p className="muted pop-empty">لا توجد إشعارات.</p>}
                    {notifs.slice(0, 8).map((n) => (
                      <button key={n.id} className={cx("notif", !n.read && "unread")} onClick={() => openNotif(n)}>
                        <i className={`nt-${n.tone}`} />
                        <div>
                          <strong>{n.title}</strong>
                          <span>{n.body}</span>
                          <small>{timeAgo(n.at)}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="popwrap">
              <button className="profile" onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} aria-expanded={profileOpen}>
                <Avatar name={user.name} size={38} tone="gold" />
                <div>
                  <strong>{user.name}</strong>
                  <small>{ROLES[role].long}</small>
                </div>
                <ChevronDown size={16} />
              </button>
              {profileOpen && (
                <div className="popover profile-pop">
                  <div className="pop-head"><strong>{user.name}</strong><small className="muted">{user.email}</small></div>
                  <button className="pop-item" onClick={() => { setSettingsOpen(true); setProfileOpen(false); }}><Settings size={16} /> الإعدادات والأمان</button>
                  <div className="pop-sep">تبديل الدور <em>(عرض تجريبي)</em></div>
                  {Object.values(ROLES).map((r) => (
                    <button key={r.id} className={cx("pop-item", r.id === role && "current")} onClick={() => switchRole(r.id)}>
                      <Repeat size={15} /> {r.long} {r.id === role && <Check size={15} />}
                    </button>
                  ))}
                  <div className="pop-sep" />
                  <button className="pop-item danger" onClick={() => dispatch({ type: "logout" })}><LogOut size={16} /> تسجيل الخروج</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="content">{children}</main>
      </div>

      {searchOpen && <CommandPalette onClose={() => setSearchOpen(false)} go={go} role={role} state={state} />}
      {settingsOpen && <SettingsDialog onClose={() => setSettingsOpen(false)} />}
      {(notifOpen || profileOpen) && <div className="pop-scrim" onClick={() => { setNotifOpen(false); setProfileOpen(false); }} />}
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
    return [...pages, ...extra];
  }, [role, state, go]);
  const results = useMemo(() => {
    // نُسقط «ال» التعريف من كلمات البحث ليطابق «الطلاب» عبارة «فصولي وطلابي»
    const tokens = normalizeAr(q).split(" ").filter(Boolean).map((t) => t.replace(/^ال(?=.{2})/, ""));
    const hit = (label) => tokens.every((t) => normalizeAr(label).includes(t));
    return (tokens.length ? items.filter((i) => hit(i.label)) : items.slice(0, 8)).slice(0, 9);
  }, [q, items]);
  const pick = (r) => { r.run(); onClose(); };
  return (
    <div className="overlay palette-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="بحث">
        <div className="palette-input">
          <Search size={19} />
          <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن صفحة أو درس أو طالب…"
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && results[0]) pick(results[0]); }} />
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
