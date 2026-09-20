import React, { useEffect, useState } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  Check,
  ChevronLeft,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import AuthScreen from "./components/AuthScreen";
import FilesSection from "./components/FilesSection";

const navItems = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "learning", label: "مساري التعليمي", icon: BookOpen },
  { id: "assessments", label: "التقييمات", icon: ClipboardCheck },
  { id: "files", label: "الملفات والموارد", icon: FileText },
  { id: "messages", label: "الرسائل", icon: MessageCircle },
];

const roleNavItems = {
  معلم: [
    { id: "overview", label: "لوحة المعلم", icon: LayoutDashboard },
    { id: "classes", label: "فصولي وطلابي", icon: Users },
    { id: "content-review", label: "مراجعة المحتوى", icon: ClipboardCheck },
    { id: "messages", label: "الرسائل", icon: MessageCircle },
  ],
  "ولي أمر": [
    { id: "overview", label: "لوحة المتابعة", icon: LayoutDashboard },
    { id: "children", label: "أبنائي", icon: Users },
    { id: "reports", label: "التقارير", icon: TrendingUp },
    { id: "messages", label: "الرسائل", icon: MessageCircle },
  ],
  إدارة: [
    { id: "overview", label: "لوحة الإدارة", icon: LayoutDashboard },
    { id: "users", label: "المستخدمون والأدوار", icon: Users },
    { id: "schools", label: "الفصول والجداول", icon: BookOpen },
    { id: "reports", label: "التقارير المؤسسية", icon: TrendingUp },
  ],
};

const activities = [
  {
    title: "اختبار الدوال الخطية",
    subject: "رياضيات",
    time: "اليوم، 09:30 ص",
    score: "92%",
    color: "mint",
  },
  {
    title: "ملخص قوانين نيوتن",
    subject: "فيزياء",
    time: "أمس، 07:15 م",
    score: "مكتمل",
    color: "orange",
  },
  {
    title: "واجب القراءة النقدية",
    subject: "لغتي",
    time: "الأحد، 04:20 م",
    score: "قيد المراجعة",
    color: "blue",
  },
];

const courses = [
  {
    title: "الرياضيات",
    subtitle: "المعادلات والدوال",
    progress: 78,
    lessons: "12 من 16 درس",
    color: "coral",
    icon: "∑",
  },
  {
    title: "العلوم",
    subtitle: "الطاقة والحركة",
    progress: 54,
    lessons: "8 من 15 درس",
    color: "teal",
    icon: "⚛",
  },
  {
    title: "لغتي الجميلة",
    subtitle: "القراءة والكتابة",
    progress: 36,
    lessons: "5 من 14 درس",
    color: "lilac",
    icon: "ع",
  },
];

function App() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("taqat-authenticated") === "true",
  );
  const [active, setActive] = useState("overview");
  const [role, setRole] = useState(
    () => localStorage.getItem("taqat-role") || "طالب",
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [toast, setToast] = useState("");
  const currentNavItems = role === "طالب" ? navItems : roleNavItems[role];

  useEffect(() => {
    if (authenticated) localStorage.setItem("taqat-authenticated", "true");
    else localStorage.removeItem("taqat-authenticated");
    localStorage.setItem("taqat-role", role);
  }, [authenticated, role]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  if (!authenticated)
    return (
      <AuthScreen
        onLogin={(nextRole = "طالب") => {
          setRole(nextRole);
          setActive("overview");
          setAuthenticated(true);
        }}
      />
    );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Zap size={19} fill="currentColor" />
          </div>
          <div>
            <strong>طاقات</strong>
            <span>TAQAT SCHOOL</span>
          </div>
        </div>
        <div className="workspace-label">مساحة التعلم</div>
        <nav>
          {currentNavItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={active === id ? "nav-item active" : "nav-item"}
              onClick={() => setActive(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === "messages" && <b className="nav-count">3</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="workspace-label">أدواتي</div>
        <button
          className="nav-item"
          onClick={() => notify("تم فتح مكتبة المراجعة")}
        >
          <Sparkles size={18} />
          <span>مكتبة المراجعة</span>
        </button>
        <button
          className="nav-item"
          onClick={() => notify("جاري تجهيز التقرير...")}
        >
          <TrendingUp size={18} />
          <span>تقاريري</span>
        </button>
        <div className="sidebar-bottom">
          <div className="offline-dot" />
          <div>
            <strong>وضع متصل</strong>
            <small>آخر مزامنة منذ دقيقتين</small>
          </div>
          <Settings size={17} />
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button
            className="mobile-menu"
            onClick={() => notify("القائمة متاحة من الشريط الجانبي")}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumbs">
            <Home size={15} />
            <ChevronLeft size={14} />
            <span>
              {active === "overview"
                ? "الرئيسية"
                : currentNavItems.find((item) => item.id === active)?.label}
            </span>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              aria-label="بحث"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={19} />
            </button>
            <button
              className="icon-button notification-button"
              aria-label="الإشعارات"
              onClick={() => setNoticeOpen(!noticeOpen)}
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="profile">
              <div className="avatar">س</div>
              <div>
                <strong>
                  {role === "معلم"
                    ? "أ. خالد العتيبي"
                    : role === "ولي أمر"
                      ? "نورة أحمد"
                      : role === "إدارة"
                        ? "مدير النظام"
                        : "سارة أحمد"}
                </strong>
                <small>
                  {role === "طالب"
                    ? "الصف الثالث المتوسط"
                    : role === "معلم"
                      ? "معلم رياضيات"
                      : role === "ولي أمر"
                        ? "ولي أمر • ابنتان"
                        : "مدرسة الأفق"}
                </small>
              </div>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setActive("overview");
                  notify(`تم التبديل إلى وضع ${e.target.value}`);
                }}
                aria-label="الدور"
              >
                <option>طالب</option>
                <option>معلم</option>
                <option>ولي أمر</option>
                <option>إدارة</option>
              </select>
            </div>
          </div>
          {noticeOpen && (
            <div className="notice-popover">
              <strong>الإشعارات</strong>
              <p>لديك اختبار علوم غدًا الساعة 10:00 ص</p>
              <p>تم اعتماد ملخص الرياضيات من المعلم</p>
            </div>
          )}
        </header>

        {role === "طالب" && active === "overview" && (
          <Overview notify={notify} />
        )}
        {role === "طالب" && active === "learning" && (
          <Learning notify={notify} />
        )}
        {role === "طالب" && active === "assessments" && (
          <Assessments notify={notify} />
        )}
        {role === "طالب" && active === "files" && (
          <FilesSection notify={notify} />
        )}
        {active === "messages" && <Messages notify={notify} />}
        {role === "معلم" && active === "overview" && (
          <TeacherDashboard notify={notify} />
        )}
        {role === "معلم" && active !== "overview" && active !== "messages" && (
          <TeacherSection section={active} notify={notify} />
        )}
        {role === "ولي أمر" && active === "overview" && (
          <ParentDashboard notify={notify} />
        )}
        {role === "ولي أمر" &&
          active !== "overview" &&
          active !== "messages" && (
            <ParentSection section={active} notify={notify} />
          )}
        {role === "إدارة" && active === "overview" && (
          <AdminDashboard notify={notify} />
        )}
        {role === "إدارة" && active !== "overview" && (
          <AdminSection section={active} notify={notify} />
        )}
      </main>

      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-button"
              onClick={() => setSearchOpen(false)}
            >
              <X size={18} />
            </button>
            <Search size={22} />
            <h3>ما الذي تبحث عنه؟</h3>
            <input
              autoFocus
              placeholder="ابحث في الدروس، الملخصات، والاختبارات..."
            />
            <div className="search-suggestions">
              <span>الدوال الخطية</span>
              <span>ملخص العلوم</span>
              <span>واجباتي</span>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}

function RoleHeader({ eyebrow, title, description, action, notify }) {
  return (
    <section className="page-heading">
      <div>
        <span className="eyebrow">
          <Sparkles size={15} /> {eyebrow}
        </span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <button className="primary-button" onClick={() => notify(action)}>
        <Zap size={17} /> {action}
      </button>
    </section>
  );
}

function RoleStat({ label, value, detail, tone = "coral" }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <TrendingUp size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-delta">{detail}</div>
    </div>
  );
}

function TeacherDashboard({ notify }) {
  return (
    <div className="page">
      <RoleHeader
        eyebrow="مساحة المعلم"
        title="لوحة المعلم"
        description="تابع تقدم طلابك وراجع مخرجات المساعد الذكي قبل نشرها."
        action="إنشاء واجب"
        notify={notify}
      />
      <section className="stats-grid">
        <RoleStat
          label="عدد الطلاب"
          value="126"
          detail="في 4 فصول"
          tone="blue"
        />
        <RoleStat
          label="محتوى بانتظار المراجعة"
          value="12"
          detail="يحتاج اعتمادك"
          tone="orange"
        />
        <RoleStat
          label="متوسط الإتقان"
          value="81%"
          detail="+8% هذا الشهر"
          tone="teal"
        />
        <RoleStat
          label="واجبات متأخرة"
          value="7"
          detail="تحتاج متابعة"
          tone="coral"
        />
      </section>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">مراجعة بشرية داخل الحلقة</span>
              <h3>محتوى مولّد ينتظر اعتمادك</h3>
            </div>
            <button
              className="text-button"
              onClick={() => notify("تم عرض كل المحتوى")}
            >
              عرض الكل <ChevronLeft size={15} />
            </button>
          </div>
          {[
            ["اختبار الوحدة الثالثة", "رياضيات • 10 أسئلة", "جديد"],
            ["ملخص الطاقة والحركة", "علوم • مسودة", "مراجعة"],
            ["واجب القراءة النقدية", "لغتي • 6 أسئلة", "مراجعة"],
          ].map(([title, meta, status]) => (
            <button
              className="review-row"
              key={title}
              onClick={() => notify(`تم فتح ${title}`)}
            >
              <div className="activity-icon mint">
                <Bot size={17} />
              </div>
              <div>
                <strong>{title}</strong>
                <span>{meta}</span>
              </div>
              <b>{status}</b>
              <ChevronLeft size={17} />
            </button>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">أداء الفصول</span>
              <h3>طلاب يحتاجون دعمًا</h3>
            </div>
            <Users size={19} color="#8fa09a" />
          </div>
          {[
            ["ليان محمد", "الرياضيات", "62%"],
            ["عمر خالد", "العلوم", "68%"],
            ["ريم علي", "لغتي", "71%"],
          ].map(([name, subject, score]) => (
            <div className="student-row" key={name}>
              <div className="avatar small-avatar">{name[0]}</div>
              <div>
                <strong>{name}</strong>
                <span>{subject}</span>
              </div>
              <b>{score}</b>
              <button
                className="mini-button"
                onClick={() => notify(`تم فتح خطة ${name}`)}
              >
                الخطة
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function TeacherSection({ section, notify }) {
  const title = section === "classes" ? "فصولي وطلابي" : "مراجعة المحتوى";
  const description =
    section === "classes"
      ? "إدارة الفصول، ربط المواد، ومتابعة مستوى كل طالب."
      : "اعتمد مخرجات الذكاء الاصطناعي أو عدّلها قبل وصولها للطلاب.";
  return (
    <div className="page">
      <RoleHeader
        eyebrow="أدوات المعلم"
        title={title}
        description={description}
        action={section === "classes" ? "إضافة طالب" : "توليد اختبار"}
        notify={notify}
      />
      <section className="panel wide-list">
        <div className="panel-heading">
          <h3>
            {section === "classes"
              ? "الفصل الثالث متوسط / أ"
              : "قائمة المراجعة اليوم"}
          </h3>
          <span className="status-badge success">محدّث الآن</span>
        </div>
        {["رياضيات", "علوم", "لغتي الجميلة"].map((item, index) => (
          <div className="review-row" key={item}>
            <div className={`course-icon ${["coral", "teal", "lilac"][index]}`}>
              {index + 1}
            </div>
            <div>
              <strong>{item}</strong>
              <span>
                {section === "classes"
                  ? `${[34, 31, 29][index]} طالبًا • آخر نشاط منذ ساعة`
                  : "محتوى مولّد • يحتاج مراجعة بشرية"}
              </span>
            </div>
            <button
              className="mini-button"
              onClick={() => notify(`تم فتح ${item}`)}
            >
              فتح
            </button>
            <ChevronLeft size={17} />
          </div>
        ))}
      </section>
    </div>
  );
}

function ParentDashboard({ notify }) {
  return (
    <div className="page">
      <RoleHeader
        eyebrow="متابعة الأسرة"
        title="لوحة المتابعة"
        description="صورة واضحة عن تقدم أبنائك، حضورهم، واحتياجاتهم التعليمية."
        action="تنزيل التقرير"
        notify={notify}
      />
      <section className="stats-grid">
        <RoleStat
          label="متوسط الإتقان"
          value="84%"
          detail="لدى الأبناء"
          tone="teal"
        />
        <RoleStat
          label="الحضور هذا الشهر"
          value="96%"
          detail="ممتاز"
          tone="blue"
        />
        <RoleStat
          label="مهام مكتملة"
          value="38"
          detail="من أصل 42"
          tone="orange"
        />
        <RoleStat
          label="تنبيهات ذكية"
          value="2"
          detail="تحتاج انتباهًا"
          tone="coral"
        />
      </section>
      <section className="panel children-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">أبنائي</span>
            <h3>ملخص الأداء الأسبوعي</h3>
          </div>
          <button
            className="text-button"
            onClick={() => notify("تم تحديث التقارير")}
          >
            تحديث <TrendingUp size={15} />
          </button>
        </div>
        {[
          ["سارة أحمد", "الثالث المتوسط", "92%", "متقدمة بشكل ممتاز"],
          ["ليان أحمد", "السادس الابتدائي", "76%", "تحتاج مراجعة العلوم"],
        ].map(([name, grade, score, note]) => (
          <div className="child-row" key={name}>
            <div className="avatar child-avatar">{name[0]}</div>
            <div>
              <strong>{name}</strong>
              <span>{grade}</span>
            </div>
            <div className="child-progress">
              <div className="progress-track">
                <div className="progress-fill teal" style={{ width: score }} />
              </div>
              <small>{note}</small>
            </div>
            <b>{score}</b>
            <ChevronLeft size={17} />
          </div>
        ))}
      </section>
    </div>
  );
}

function ParentSection({ section, notify }) {
  return (
    <div className="page">
      <RoleHeader
        eyebrow="بوابة ولي الأمر"
        title={section === "children" ? "أبنائي" : "التقارير"}
        description="تابع التفاصيل اليومية والاقتراحات العلاجية بشكل بسيط."
        action="تصدير PDF"
        notify={notify}
      />
      <section className="panel wide-list">
        {["التقدم في الرياضيات", "الحضور والغياب", "خطة المراجعة القادمة"].map(
          (item, index) => (
            <div className="review-row" key={item}>
              <div className="activity-icon teal">
                <TrendingUp size={17} />
              </div>
              <div>
                <strong>{item}</strong>
                <span>
                  {index === 0
                    ? "تحسن 12% خلال آخر 30 يومًا"
                    : index === 1
                      ? "لا توجد حالات غياب غير مبررة"
                      : "جلسة علوم يوم الخميس"}
                </span>
              </div>
              <button
                className="mini-button"
                onClick={() => notify(`تم فتح ${item}`)}
              >
                التفاصيل
              </button>
              <ChevronLeft size={17} />
            </div>
          ),
        )}
      </section>
    </div>
  );
}

function AdminDashboard({ notify }) {
  return (
    <div className="page">
      <RoleHeader
        eyebrow="الإدارة المؤسسية"
        title="لوحة الإدارة"
        description="مؤشرات موحّدة للمدرسة، جودة المحتوى، ونشاط المستخدمين."
        action="تصدير تقرير"
        notify={notify}
      />
      <section className="stats-grid">
        <RoleStat
          label="المدارس النشطة"
          value="8"
          detail="ضمن نطاق الإشراف"
          tone="blue"
        />
        <RoleStat
          label="المستخدمون"
          value="4,820"
          detail="+14% هذا الشهر"
          tone="teal"
        />
        <RoleStat
          label="جودة المحتوى"
          value="94%"
          detail="بعد المراجعة البشرية"
          tone="orange"
        />
        <RoleStat
          label="نسبة الحضور"
          value="97.2%"
          detail="على مستوى النظام"
          tone="coral"
        />
      </section>
      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">مؤشرات المدارس</span>
              <h3>النشاط حسب المدرسة</h3>
            </div>
            <TrendingUp size={19} color="#8fa09a" />
          </div>
          {[
            ["مدرسة الأفق الأهلية", "98%", "1,240 طالب"],
            ["مدارس الريادة", "94%", "860 طالب"],
            ["مدرسة النور", "91%", "730 طالب"],
          ].map(([name, score, students]) => (
            <div className="student-row" key={name}>
              <div className="activity-icon blue">
                <BookOpen size={17} />
              </div>
              <div>
                <strong>{name}</strong>
                <span>{students}</span>
              </div>
              <b>{score}</b>
              <ChevronLeft size={17} />
            </div>
          ))}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">حوكمة النظام</span>
              <h3>آخر العمليات</h3>
            </div>
            <Settings size={19} color="#8fa09a" />
          </div>
          {[
            "اعتماد محتوى من أ. خالد",
            "إضافة 24 طالبًا جديدًا",
            "تحديث سياسة الخصوصية",
          ].map((item) => (
            <div className="activity" key={item}>
              <div className="activity-icon mint">
                <Check size={17} />
              </div>
              <div className="activity-copy">
                <strong>{item}</strong>
                <span>تمت العملية بنجاح • منذ ساعة</span>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function AdminSection({ section, notify }) {
  const titles = {
    users: "المستخدمون والأدوار",
    schools: "الفصول والجداول",
    reports: "التقارير المؤسسية",
  };
  return (
    <div className="page">
      <RoleHeader
        eyebrow="إدارة المنصة"
        title={titles[section]}
        description="إدارة الصلاحيات والبيانات المؤسسية من مساحة واحدة."
        action="إضافة جديد"
        notify={notify}
      />
      <section className="panel wide-list">
        <div className="panel-heading">
          <h3>العناصر المحدثة</h3>
          <span className="status-badge success">كل الأنظمة تعمل</span>
        </div>
        {[
          "إدارة الحسابات والصلاحيات",
          "مؤشرات الأداء المدرسي",
          "التراخيص والاشتراكات",
        ].map((item) => (
          <div className="review-row" key={item}>
            <div className="activity-icon blue">
              <Users size={17} />
            </div>
            <div>
              <strong>{item}</strong>
              <span>بيانات محدثة وقابلة للتصدير</span>
            </div>
            <button
              className="mini-button"
              onClick={() => notify(`تم فتح ${item}`)}
            >
              إدارة
            </button>
            <ChevronLeft size={17} />
          </div>
        ))}
      </section>
    </div>
  );
}

function Overview({ notify }) {
  return (
    <div className="page">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" /> الثلاثاء، 20 سبتمبر 2026
          </div>
          <h1>
            صباح الخير، سارة <span>👋</span>
          </h1>
          <p>رحلتك مستمرة بشكل رائع. إليك ملخص تقدمك لهذا الأسبوع.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => notify("تم فتح الدرس التالي")}
        >
          <BookOpen size={17} /> متابعة التعلم
        </button>
      </section>
      <section className="hero-banner">
        <div className="hero-copy">
          <div className="hero-kicker">
            <Bot size={17} /> مساعد طاقات الذكي
          </div>
          <h2>
            جاهزة لتتقدمي خطوة
            <br />
            <em>جديدة اليوم؟</em>
          </h2>
          <p>حلّلي نقاط قوتك واكتشفي توصية التعلم التالية المصممة خصيصًا لك.</p>
          <button
            className="light-button"
            onClick={() => notify("جاري تحليل مسارك التعليمي")}
          >
            <Sparkles size={16} /> تحليل مساري
          </button>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="hero-number">
            78<small>%</small>
          </div>
          <span className="floating-pill pill-one">+12% هذا الأسبوع</span>
          <span className="floating-pill pill-two">مستوى متقدم</span>
        </div>
      </section>
      <section className="stats-grid">
        <Stat
          icon={Target}
          label="نسبة الإتقان"
          value="78%"
          delta="+6.4%"
          tone="coral"
        />
        <Stat
          icon={Clock3}
          label="وقت التعلم"
          value="4.5"
          unit="ساعة"
          delta="هذا الأسبوع"
          tone="teal"
        />
        <Stat
          icon={ClipboardCheck}
          label="الاختبارات المكتملة"
          value="18"
          unit="اختبار"
          delta="من أصل 22"
          tone="blue"
        />
        <Stat
          icon={Zap}
          label="سلسلة التعلم"
          value="7"
          unit="أيام"
          delta="استمري!"
          tone="orange"
        />
      </section>
      <div className="content-grid">
        <section className="panel course-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">خطة التعلم</span>
              <h3>تابعي تقدمك</h3>
            </div>
            <button
              className="text-button"
              onClick={() => notify("عرض كل المواد")}
            >
              عرض الكل <ChevronLeft size={15} />
            </button>
          </div>
          {courses.map((course) => (
            <Course key={course.title} course={course} onClick={notify} />
          ))}
        </section>
        <section className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">آخر النشاطات</span>
              <h3>سجل التعلم</h3>
            </div>
            <button
              className="round-button"
              onClick={() => notify("تم تحديث السجل")}
            >
              <TrendingUp size={16} />
            </button>
          </div>
          {activities.map((item) => (
            <div className="activity" key={item.title}>
              <div className={`activity-icon ${item.color}`}>
                <FileText size={17} />
              </div>
              <div className="activity-copy">
                <strong>{item.title}</strong>
                <span>
                  {item.subject} <i /> {item.time}
                </span>
              </div>
              <b className={item.score.includes("%") ? "score good" : "score"}>
                {item.score}
              </b>
            </div>
          ))}
          <button
            className="activity-footer"
            onClick={() => notify("لا توجد نشاطات إضافية")}
          >
            مشاهدة كل النشاطات <ChevronLeft size={15} />
          </button>
        </section>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit, delta, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value} <small>{unit}</small>
      </div>
      <div className="stat-delta">{delta}</div>
    </div>
  );
}
function Course({ course, onClick }) {
  return (
    <button
      className="course-row"
      onClick={() => onClick(`تم فتح مادة ${course.title}`)}
    >
      <div className={`course-icon ${course.color}`}>{course.icon}</div>
      <div className="course-main">
        <div className="course-title">
          <strong>{course.title}</strong>
          <span>{course.subtitle}</span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${course.color}`}
            style={{ width: `${course.progress}%` }}
          />
        </div>
        <small>{course.lessons}</small>
      </div>
      <b className="course-percent">{course.progress}%</b>
      <ChevronLeft size={17} className="course-arrow" />
    </button>
  );
}

function Learning({ notify }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <BookOpen size={15} /> مسار شخصي بالذكاء الاصطناعي
          </span>
          <h1>مساري التعليمي</h1>
          <p>دروسك مرتبة حسب أهدافك ومستوى إتقانك الحالي.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => notify("تمت إضافة جلسة تعلم جديدة")}
        >
          <Sparkles size={17} /> خطة ذكية جديدة
        </button>
      </section>
      <div className="learning-layout">
        <section className="panel roadmap">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">المسار الحالي</span>
              <h3>الوحدة 3: المعادلات والدوال</h3>
            </div>
            <span className="status-badge success">78% مكتمل</span>
          </div>
          <div className="roadmap-line" />
          {[
            "مقدمة في العلاقات الرياضية",
            "الدوال الخطية وتمثيلها",
            "التدريب الموجّه والتقييم",
          ].map((item, index) => (
            <div
              className={`roadmap-item ${index < 2 ? "done" : "current"}`}
              key={item}
            >
              <div className="roadmap-node">
                {index < 2 ? <Check size={14} /> : index + 1}
              </div>
              <div>
                <strong>{item}</strong>
                <span>
                  {index < 2
                    ? "تم الإتقان • 15 دقيقة"
                    : "الخطوة التالية • 20 دقيقة"}
                </span>
              </div>
              {index === 2 && (
                <button
                  className="mini-button"
                  onClick={() => notify("تم فتح الدرس")}
                >
                  ابدئي الآن
                </button>
              )}
            </div>
          ))}
        </section>
        <section className="panel ai-card">
          <div className="ai-glow">
            <Bot size={24} />
          </div>
          <span className="section-kicker">توصية المساعد الذكي</span>
          <h3>راجعي مفهوم الميل قبل الانتقال</h3>
          <p>
            بناءً على إجاباتك الأخيرة، مراجعة قصيرة الآن سترفع إتقانك المتوقع
            إلى 86%.
          </p>
          <button
            className="dark-button"
            onClick={() => notify("تم إنشاء جلسة مراجعة")}
          >
            ابدأ مراجعة 8 دقائق <ChevronLeft size={15} />
          </button>
        </section>
      </div>
    </div>
  );
}
function Assessments({ notify }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <ClipboardCheck size={15} /> تقييم مستمر ومخصص
          </span>
          <h1>التقييمات</h1>
          <p>نتائجك الفورية وخطط التحسين في مكان واحد.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => notify("تم فتح اختبار الوحدة")}
        >
          <Target size={17} /> ابدأ اختبارًا
        </button>
      </section>
      <div className="assessment-summary">
        <div className="assessment-score">
          <span>متوسط الدرجات</span>
          <strong>
            88.4<small>%</small>
          </strong>
          <em>+4.2% عن الشهر الماضي</em>
        </div>
        <div className="chart">
          <div className="chart-bars">
            {[38, 55, 47, 72, 61, 78, 88].map((height, index) => (
              <div className="bar-wrap" key={height}>
                <div
                  className={`bar ${index === 6 ? "active" : ""}`}
                  style={{ height: `${height}%` }}
                />
                <small>{["س", "ح", "ن", "ث", "ر", "خ", "ج"][index]}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
      <section className="panel assessment-table">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">النتائج الأخيرة</span>
            <h3>اختباراتك</h3>
          </div>
          <button
            className="text-button"
            onClick={() => notify("تم تنزيل التقرير")}
          >
            <Download size={15} /> تنزيل التقرير
          </button>
        </div>
        {["الدوال الخطية", "قوانين نيوتن للحركة", "القراءة النقدية"].map(
          (name, index) => (
            <div className="assessment-row" key={name}>
              <div className={`assessment-subject subject-${index}`}>
                <BookOpen size={17} />
              </div>
              <div>
                <strong>{name}</strong>
                <span>
                  {index === 0
                    ? "رياضيات • الوحدة 3"
                    : index === 1
                      ? "علوم • الوحدة 2"
                      : "لغتي • الوحدة 1"}
                </span>
              </div>
              <b>{[92, 86, 88][index]}%</b>
              <span className="status-badge success">مكتمل</span>
              <ChevronLeft size={17} />
            </div>
          ),
        )}
      </section>
    </div>
  );
}
function Messages({ notify }) {
  return (
    <div className="page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <MessageCircle size={15} /> تواصل آمن
          </span>
          <h1>الرسائل والإعلانات</h1>
          <p>كل ما يهمك من فريقك التعليمي في مكان واحد.</p>
        </div>
        <button
          className="primary-button"
          onClick={() => notify("تم فتح رسالة جديدة")}
        >
          <MessageCircle size={17} /> رسالة جديدة
        </button>
      </section>
      <section className="panel messages-panel">
        {[
          [
            "أ. خالد العتيبي",
            "اعتماد ملخص الدوال الخطية",
            "تم اعتماد الملخص الخاص بك. أحسنتِ، يمكنك الآن الانتقال إلى الاختبار القصير.",
            "منذ 18 دقيقة",
            "teacher",
          ],
          [
            "إدارة المدرسة",
            "تذكير: اختبار العلوم غدًا",
            "سيبدأ اختبار قوانين نيوتن غدًا الساعة 10:00 صباحًا. تأكدي من مراجعة الملخص.",
            "منذ ساعتين",
            "school",
          ],
          [
            "والدتك",
            "كيف كان يومك الدراسي؟",
            "فخورة بتقدمك هذا الأسبوع. لا تنسي جلسة المراجعة المسائية.",
            "أمس",
            "parent",
          ],
        ].map(([name, subject, body, time, type]) => (
          <button
            className="message-row"
            key={subject}
            onClick={() => notify(`تم فتح رسالة ${name}`)}
          >
            <div className={`message-avatar ${type}`}>
              {type === "teacher" ? "خ" : type === "school" ? "م" : "و"}
            </div>
            <div className="message-body">
              <div>
                <strong>{name}</strong>
                <span>{time}</span>
              </div>
              <b>{subject}</b>
              <p>{body}</p>
            </div>
            <ChevronLeft size={18} />
          </button>
        ))}
      </section>
    </div>
  );
}

export default App;
