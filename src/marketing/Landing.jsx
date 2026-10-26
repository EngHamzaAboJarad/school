import { useEffect, useId, useRef, useState } from "react";
import {
  Award,
  BookOpenCheck,
  BrainCircuit,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  Cpu,
  FlaskConical,
  GraduationCap,
  Landmark,
  Layers,
  LineChart,
  Menu,
  MessageCircle,
  Minus,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "../ui/Brand";
import { Seal, VentRow, VentWall, ATTENDANCE_VENT } from "../ui/rays";
import { LangToggle } from "../i18n/LangToggle";
import { useLang } from "../i18n";
import { ROLES, DEMO_ACCOUNTS } from "../data/people";
import TryQuiz from "./TryQuiz";
import ContactSection from "./ContactSection";
import {
  ABOUT,
  COMPARE_ROWS,
  CONTACT,
  COST_TILES,
  FAQ,
  HERO_FACTS,
  HOW_STEPS,
  NAV_LINKS,
  PRICING,
  ROLE_ORDER,
  ROLE_SHOWCASE,
  SECURITY,
} from "./content";

const ROLE_ICONS = {
  student: GraduationCap,
  parent: Users,
  teacher: Award,
  school: Building2,
  supervisor: Landmark,
  system: Cpu,
};

const MARKS = {
  yes: [Check, "نعم"],
  part: [Minus, "جزئي"],
  no: [X, "لا"],
};

// لقطات حقيقية من المنصّة (public/landing) — نسخة عربية وأخرى إنجليزية
const shot = (name, lang) => `/landing/${name}-${lang === "en" ? "en" : "ar"}.jpg`;

export default function Landing({ onEnter, onJoin }) {
  const { lang } = useLang();
  const [menu, setMenu] = useState(false);
  const closeMenu = () => setMenu(false);
  const toTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ظهور الأقسام عند الوصول إليها (مرّة واحدة)؛ يُلغى مع تقليل الحركة عبر CSS
  useEffect(() => {
    const items = document.querySelectorAll(".landing [data-rv]");
    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing" dir={lang === "en" ? "ltr" : "rtl"}>
      <header className="ld-nav">
        <div className="ld-wrap ld-nav-inner">
          <a href="#/" className="ld-brand" onClick={toTop} aria-label="مشرق">
            <Wordmark size="sm" />
          </a>
          <nav id="ld-menu" className={`ld-nav-links ${menu ? "open" : ""}`} aria-label="التنقّل الرئيسي">
            {NAV_LINKS.map(([href, label]) => (
              <a key={href} href={href} onClick={closeMenu}>
                {label}
              </a>
            ))}
            <div className="ld-panel-actions">
              <button type="button" className="btn btn-ghost btn-block" onClick={onEnter}>
                تسجيل الدخول
              </button>
              <a href="#ld-contact" className="btn btn-gold btn-block" onClick={closeMenu}>
                اطلب عرضًا لمدرستك
              </a>
            </div>
          </nav>
          <div className="ld-nav-actions">
            <LangToggle />
            <button type="button" className="btn btn-ghost ld-nav-login" onClick={onEnter}>
              تسجيل الدخول
            </button>
            <a href="#ld-contact" className="btn btn-gold ld-nav-cta">
              اطلب عرضًا لمدرستك
            </a>
            <button
              type="button"
              className="ld-burger"
              aria-expanded={menu}
              aria-controls="ld-menu"
              aria-label={menu ? "إغلاق القائمة" : "فتح القائمة"}
              onClick={() => setMenu((m) => !m)}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* ───── البطل: نصّ في البداية، ولقطة المنصّة تشرق خلفها شمس الهوية ───── */}
        <section className="ld-hero">
          <div className="ld-wrap ld-hero-grid">
            <div className="ld-hero-copy">
              <span className="ld-pill">مدرسة رقمية عربية بالذكاء الاصطناعي</span>
              {/* العنوان يُبنى لكل لغة حتى تقع الكلمة المُبرزة في مكانها الصحيح */}
              {lang === "en" ? (
                <h1>
                  With every lesson, a new understanding <em>rises</em>
                </h1>
              ) : (
                <h1>
                  مع كل درس، <em>يُشرق</em> فهمٌ جديد
                </h1>
              )}
              <p className="ld-hero-sub">يشرح مشرق كل درس ويلخّصه ويختبره، ثم يبني لكل طالب خطة حتى الإتقان، والمعلّم يعتمد كل خطوة.</p>
              <div className="ld-hero-cta">
                <a href="#ld-roles" className="btn btn-primary btn-lg">
                  جرّب المنصّة
                  <ChevronLeft size={18} className="ld-dir" />
                </a>
                <a href="#ld-contact" className="btn btn-ghost btn-lg">
                  اطلب عرضًا لمدرستك
                </a>
              </div>
            </div>

            <div className="ld-hero-visual">
              <Sunrise className="ld-hero-sun" />
              <figure className="ld-frame ld-frame-desk">
                <span className="ld-frame-bar" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <img src={shot("student", lang)} width="1600" height="1000" alt="لوحة الطالب في مشرق: الخطوة التالية والإتقان واليوم الدراسي" fetchPriority="high" />
              </figure>
              <figure className="ld-frame ld-frame-phone">
                <img src={shot("phone", lang)} width="780" height="1560" alt="مشرق على الجوال: الصفحة الرئيسية للطالب" />
              </figure>
            </div>
          </div>

          <div className="ld-wrap">
            <dl className="ld-facts">
              {HERO_FACTS.map(([n, label]) => (
                <div key={label}>
                  <dt className="num">{n}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ───── رحلة الدرس على قوس الأفق + جرّب بنفسك ───── */}
        <section id="ld-how" className="ld-section ld-tint" data-rv>
          <div className="ld-wrap">
            <SectionHead title="من الشرح إلى الإتقان في أربع خطوات" desc="رحلة واحدة لكل درس، والمعلّم يعتمد كل محتوى واختبار قبل أن يصل للطالب." />
            <Journey />
            <div className="ld-try-split">
              <div className="ld-try-copy">
                <h3>جرّب التصحيح الفوري بنفسك</h3>
                <p>أجب عن سؤال واحد وشاهد ما يراه الطالب بعد كل إجابة: تصحيح فوري، وتفسير، وتحديث لإتقان الهدف.</p>
                <ul className="ld-ticks">
                  <li>
                    <Check size={16} /> تفسير لكل سؤال
                  </li>
                  <li>
                    <Check size={16} /> إتقان يُقاس لكل هدف تعلّم
                  </li>
                  <li>
                    <Check size={16} /> خطة علاجية عند الفجوة
                  </li>
                </ul>
              </div>
              <TryQuiz />
            </div>
          </div>
        </section>

        {/* ───── الأدوار: تبويبات بلقطات حقيقية ───── */}
        <RolesShowcase lang={lang} />

        {/* ───── المميزات: شبكة بنتو بعناصر المنصّة الحقيقية ───── */}
        <section id="ld-features" className="ld-section ld-tint" data-rv>
          <div className="ld-wrap">
            <SectionHead title="محرّكات تعمل معًا في منظومة واحدة" desc="المحتوى والتقييم والتشخيص والمتابعة، مبنيّة على البيانات نفسها." />
            <Bento lang={lang} />
          </div>
        </section>

        {/* ───── المقارنة والتكلفة ───── */}
        <section id="ld-compare" className="ld-section" data-rv>
          <div className="ld-wrap ld-compare">
            <div className="ld-compare-copy">
              <h2 className="ld-statement">
                الحصّة الخصوصية تنتهي بانتهاء الساعة. <span>مشرق يرافق الطالب بعدها.</span>
              </h2>
              <p>المدرّس الخصوصي يتفوّق في الحصّة المباشرة واختيار الموعد. مشرق لا ينافسه فيها، بل يكمّله: يشرح ويختبر ويتابع كل درس، ويضع البيانات أمام المعلّم ووليّ الأمر والمدرسة.</p>
              <div className="ld-cost">
                <h3>كم يكلّف الطالب شهريًّا؟</h3>
                <div className="ld-cost-tiles">
                  {COST_TILES.map((c) => (
                    <div className={`ld-cost-tile ${c.brand ? "brand" : ""}`} key={c.label}>
                      <span>{c.label}</span>
                      <b className="num">{c.value}</b>
                      <small>ريال</small>
                    </div>
                  ))}
                </div>
                <small className="ld-note">تقدير لثماني حصص في الشهر بحسب الأسعار المنشورة لأبرز منصّات الحصص الخصوصية في السعودية وقت إعداد الصفحة (أكتوبر ٢٠٢٦): من نحو ٢٠ إلى ٧٦ ريالًا للحصة. أسعار مشرق إرشادية حتى الإطلاق.</small>
              </div>
            </div>
            <div className="ld-compare-table-wrap">
              <table className="ld-compare-table">
                <caption className="sr-only">مقارنة بين مشرق ومنصّات الحصص الخصوصية</caption>
                <thead>
                  <tr>
                    <th scope="col">القدرة</th>
                    <th scope="col" className="brand">
                      مشرق
                    </th>
                    <th scope="col">منصّات الحصص</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map(([label, ours, theirs]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td className="brand">
                        <Mark v={ours} who="مشرق" />
                      </td>
                      <td>
                        <Mark v={theirs} who="منصّات الحصص" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ───── الأمان: صفّ أفقي هادئ ───── */}
        <section className="ld-security" data-rv aria-labelledby="ld-sec-title">
          <div className="ld-wrap">
            <h2 id="ld-sec-title">بيانات أبنائكم محميّة أولًا</h2>
            <ul>
              {SECURITY.map((s) => (
                <li key={s.title}>
                  <s.icon size={22} aria-hidden="true" />
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───── من نحن ───── */}
        <section id="ld-about" className="ld-section" data-rv>
          <div className="ld-wrap ld-about">
            <div className="ld-about-story">
              <span className="ld-pill">من نحن</span>
              <h2>صنعه معلّمون ومهندسون من غزّة</h2>
              {ABOUT.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <div className="ld-vm">
                {[ABOUT.vision, ABOUT.mission].map((b) => (
                  <div key={b.title}>
                    <h3>{b.title}</h3>
                    <p>{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <ul className="ld-values">
              {ABOUT.values.map((v) => (
                <li key={v.title}>
                  <span className="ld-icon">
                    <v.icon size={20} aria-hidden="true" />
                  </span>
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ───── التسعير ───── */}
        <section id="ld-pricing" className="ld-section ld-tint" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="الأسعار" title="خطة لكل طالب، وترخيص لكل مدرسة" desc="أسعار إرشادية مبدئية، مع خطة مجانية محدودة للأفراد." />
            <div className="ld-pricing-grid">
              {PRICING.map((p) => (
                <div className={`ld-price-card ${p.featured ? "featured" : ""}`} key={p.title}>
                  <span className="ld-icon">
                    <p.icon size={22} aria-hidden="true" />
                  </span>
                  <h3>{p.title}</h3>
                  <div className="ld-price-value">
                    <b>{p.price}</b> <small>{p.unit}</small>
                  </div>
                  <p>{p.desc}</p>
                  {p.action === "school" ? (
                    <a href="#ld-contact" className="btn btn-ghost btn-block">
                      {p.cta}
                    </a>
                  ) : (
                    <button type="button" className={`btn btn-block ${p.featured ? "btn-gold" : "btn-ghost"}`} onClick={() => onJoin(p.action)}>
                      {p.cta}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── الأسئلة الشائعة: عنوان ثابت + أكورديون ───── */}
        <section id="ld-faq" className="ld-section" data-rv>
          <div className="ld-wrap ld-faq-grid">
            <div className="ld-faq-head">
              <h2>إجابات سريعة قبل أن تبدأ</h2>
              <p>لم تجد سؤالك؟ اكتب لنا وسنردّ عليك.</p>
              <a href="#ld-contact" className="btn btn-ghost">
                تواصل معنا
              </a>
            </div>
            <div className="ld-faq">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    <span>{q}</span>
                    <ChevronDown size={18} aria-hidden="true" />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───── تواصل / انضم ───── */}
        <section id="ld-contact" className="ld-section ld-tint" data-rv>
          <div className="ld-wrap">
            <SectionHead title="لنبنِ مدرسة أذكى معًا" desc="مدرسة تريد عرضًا تجريبيًّا، أو معلّم يريد الانضمام، أو وليّ أمر يبدأ رحلة ابنه." />
            <ContactSection onJoin={onJoin} />
          </div>
        </section>

        {/* ───── الدعوة الأخيرة: الشمس تشرق من أسفل القسم ───── */}
        <section className="ld-final">
          <Sunrise className="ld-final-sun" />
          <div className="ld-wrap ld-final-inner" data-rv>
            <h2>ابدأ يومك الدراسي الأول مع مشرق</h2>
            <p>أنشئ حسابك مجانًا، أو اطلب عرضًا لمدرستك.</p>
            <div className="ld-hero-cta">
              <button type="button" className="btn btn-gold btn-lg" onClick={() => onJoin("signup")}>
                أنشئ حسابك
                <ChevronLeft size={18} className="ld-dir" />
              </button>
              <a href="#ld-contact" className="btn btn-light btn-lg">
                اطلب عرضًا لمدرستك
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="ld-footer">
        <div className="ld-wrap ld-footer-grid">
          <div className="ld-footer-brand">
            <Wordmark light size="sm" />
            <p>منصّة تعليمية ذكية عربية: مدرسة رقمية تشرح وتقيّم وتُدار بالبيانات.</p>
          </div>
          <div>
            <h5>المنصّة</h5>
            <a href="#ld-how">كيف تعمل</a>
            <a href="#ld-features">المميزات</a>
            <a href="#ld-compare">لماذا نحن</a>
            <a href="#ld-pricing">الأسعار</a>
          </div>
          <div>
            <h5>الشركة</h5>
            <a href="#ld-about">من نحن</a>
            <a href="#ld-faq">الأسئلة الشائعة</a>
            <a href="#ld-contact">تواصل معنا</a>
          </div>
          <div>
            <h5>انضم إلينا</h5>
            <button type="button" onClick={() => onJoin("teacher")}>
              انضم كمعلّم
            </button>
            <button type="button" onClick={() => onJoin("signup")}>
              أنشئ حسابًا
            </button>
            <button type="button" onClick={onEnter}>
              تسجيل الدخول
            </button>
          </div>
          <div>
            <h5>قانوني</h5>
            <a href="/privacy/">سياسة الخصوصية</a>
            <a href="/terms/">شروط الاستخدام</a>
          </div>
        </div>
        <div className="ld-wrap">
          <div className="ld-footer-base">
            <span>© ٢٠٢٦ مشرق. جميع الحقوق محفوظة.</span>
            <span>صُنعت بأيدي معلّمين ومهندسين فلسطينيين من غزّة.</span>
          </div>
        </div>
      </footer>

      {CONTACT.whatsapp && (
        <a
          className="ld-wa"
          href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("مرحبًا، أودّ الاستفسار عن مشرق")}`}
          target="_blank"
          rel="noreferrer"
          aria-label="تواصل عبر واتساب"
        >
          <MessageCircle size={26} />
        </a>
      )}
    </div>
  );
}

// ───── شمس الهوية بحجم كبير: نصف قرص وسبعة أشعّة بتدرّج الفجر (زخرفة فقط) ─────
const SUN_RAYS = [
  [178, "#0AA3C7", "#13B5D0"],
  [150, "#FFA43A", "#FF8A2A"],
  [120, "#FEC443", "#FDB52E"],
  [90, "#FEC443", "#FDBA30"],
  [60, "#9CCB5E", "#1EC2A8"],
  [30, "#1EC2A8", "#0AC5BA"],
  [2, "#0AC5BA", "#2ACDC6"],
];

function Sunrise({ className }) {
  const id = useId().replace(/:/g, "");
  const cx = 300;
  const cy = 300;
  const rays = SUN_RAYS.map(([a, c1, c2], i) => {
    const t = (a * Math.PI) / 180;
    const side = a < 10 || a > 170;
    const r1 = side ? 168 : 160;
    const r2 = side ? 230 : 280;
    const p = (r) => [cx + Math.cos(t) * r, cy - Math.sin(t) * r];
    return { i, c1, c2, a: p(r1), b: p(r2) };
  });
  return (
    <svg className={`ld-sunrise ${className || ""}`} viewBox="0 0 600 316" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-sun`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFCB4F" />
          <stop offset="1" stopColor="#FDB430" />
        </linearGradient>
        {rays.map((r) => (
          <linearGradient key={r.i} id={`${id}-r${r.i}`} gradientUnits="userSpaceOnUse" x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]}>
            <stop offset="0" stopColor={r.c1} />
            <stop offset="1" stopColor={r.c2} />
          </linearGradient>
        ))}
      </defs>
      <g className="ld-sun-rays" strokeLinecap="round" strokeWidth="30">
        {rays.map((r) => (
          <line key={r.i} className="ld-sun-ray" style={{ "--i": r.i }} x1={r.a[0]} y1={r.a[1]} x2={r.b[0]} y2={r.b[1]} stroke={`url(#${id}-r${r.i})`} />
        ))}
      </g>
      <path className="ld-sun-disc" d={`M${cx - 130} ${cy + 16}A130 130 0 0 1 ${cx + 130} ${cy + 16}Z`} fill={`url(#${id}-sun)`} />
    </svg>
  );
}

// ───── رحلة الدرس: أربع محطّات على قوس الأفق ─────
function Journey() {
  return (
    <div className="ld-journey">
      <svg className="ld-journey-arc" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="ld-journey-g" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#004F87" />
            <stop offset=".52" stopColor="#0A9CC4" />
            <stop offset="1" stopColor="#40D1CD" />
          </linearGradient>
        </defs>
        <path d="M10 110 Q500 -40 990 110" fill="none" stroke="url(#ld-journey-g)" strokeWidth="6" strokeLinecap="round" pathLength="1" />
      </svg>
      <ol className="ld-journey-steps">
        {HOW_STEPS.map((s, i) => (
          <li key={s.title} style={{ "--i": i }}>
            <span className="ld-journey-node">
              <s.icon size={22} aria-hidden="true" />
            </span>
            <h3>{s.title}</h3>
            <p>{s.desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ───── الأدوار الستّة: تبويبات يمكن التنقّل بينها بالأسهم ─────
function RolesShowcase({ lang }) {
  const [active, setActive] = useState("student");
  const tabs = useRef({});
  const role = ROLES[active];
  const info = ROLE_SHOWCASE[active];
  const account = DEMO_ACCOUNTS.find((a) => a.role === active);

  const onKey = (e) => {
    const i = ROLE_ORDER.indexOf(active);
    const rtl = document.documentElement.dir === "rtl";
    const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[e.key];
    let next = null;
    if (step) next = ROLE_ORDER[(i + step + ROLE_ORDER.length) % ROLE_ORDER.length];
    if (e.key === "Home") next = ROLE_ORDER[0];
    if (e.key === "End") next = ROLE_ORDER[ROLE_ORDER.length - 1];
    if (!next) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="ld-roles" className="ld-section ld-roles" data-rv>
      <div className="ld-wrap">
        <SectionHead kicker="ستّة أدوار" title="لكل دور لوحته، والبيانات واحدة" desc="هذه لقطات حقيقية من المنصّة. اختر دورًا لترى ما يراه." />
        <div className="ld-role-tabs" role="tablist" aria-label="أدوار المنصّة" onKeyDown={onKey}>
          {ROLE_ORDER.map((id) => {
            const Icon = ROLE_ICONS[id];
            const on = id === active;
            return (
              <button
                key={id}
                ref={(el) => (tabs.current[id] = el)}
                type="button"
                role="tab"
                id={`ld-tab-${id}`}
                aria-selected={on}
                aria-controls="ld-role-panel"
                tabIndex={on ? 0 : -1}
                className={`ld-role-tab ${on ? "on" : ""}`}
                onClick={() => setActive(id)}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{ROLES[id].long}</span>
              </button>
            );
          })}
        </div>
        <div className="ld-role-panel" id="ld-role-panel" role="tabpanel" aria-labelledby={`ld-tab-${active}`}>
          <figure className="ld-frame ld-frame-role" key={active}>
            <span className="ld-frame-bar" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <img src={shot(active, lang)} width="1600" height="1000" loading="lazy" alt={`لوحة ${role.long} في مشرق`} />
          </figure>
          <div className="ld-role-copy" key={`${active}-copy`}>
            <span className="ld-role-name">{role.long}</span>
            <h3>{info.title}</h3>
            <ul className="ld-ticks">
              {info.points.map((p) => (
                <li key={p}>
                  <Check size={16} /> {p}
                </li>
              ))}
            </ul>
            {/* دخول مباشر إلى بيئة العرض: لا كلمة مرور منشورة في الصفحة */}
            {account && (
              <a href={`#/demo/${active}`} className="btn btn-primary">
                {`ادخل كـ${role.label}`}
                <ChevronLeft size={17} className="ld-dir" />
              </a>
            )}
            <span className="ld-demo-badge">
              <FlaskConical size={15} aria-hidden="true" /> بيئة عرض ببيانات وهمية
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───── شبكة المميزات: ستّ خلايا، كل واحدة بعنصر حقيقي من واجهة المنصّة ─────
const MASTERY_DEMO = [
  { label: "تمثيل الدالة الخطية", value: 9 },
  { label: "ميل المستقيم", value: 6 },
  { label: "المعادلات", value: 3 },
];

const ATT_DEMO = [
  ["الثالث / أ", "pppppplppp"],
  ["الثالث / ب", "ppappppppp"],
];
const ATT_CODE = { p: "present", l: "late", a: "absent" };

function Bento({ lang }) {
  return (
    <div className="ld-bento">
      <article className="ld-cell ld-cell-assess">
        <ClipboardCheck size={22} className="ld-cell-icon" aria-hidden="true" />
        <h3>الذكاء الاصطناعي يقترح، والمعلّم يعتمد</h3>
        <p>يقيّم «النجمة» الإجابات مبدئيًّا، ولا تصل الدرجة إلى الطالب قبل اعتماد المعلّم.</p>
        <div className="ld-demo-list" aria-label="مثال توضيحي">
          <div className="ld-demo-row">
            <span>
              <b>مقال: قانون نيوتن الثالث</b>
              <small>لجين محمد</small>
            </span>
            <b className="num">4/5</b>
            <Seal />
          </div>
          <div className="ld-demo-row">
            <span>
              <b>اختبار درس: معادلة المستقيم</b>
              <small>الثالث المتوسط / أ</small>
            </span>
            <b className="num">10/10</b>
            <Seal approved compact />
          </div>
        </div>
      </article>

      <article className="ld-cell ld-cell-gap">
        <LineChart size={22} className="ld-cell-icon" aria-hidden="true" />
        <h3>تشخيص الفجوة حتى الإتقان</h3>
        <p>كل هدف تعلّم يُقاس بعد كل اختبار، وأيّ فجوة تفتح خطة علاجية.</p>
        <div className="ld-gap-demo" aria-label="مثال توضيحي لإتقان ثلاثة أهداف">
          {MASTERY_DEMO.map((m) => (
            <div key={m.label}>
              <span>{m.label}</span>
              <VentRow
                size={11}
                items={Array.from({ length: 10 }, (_, i) => ({ state: i < m.value ? (m.value < 5 ? "alert" : "on") : "off" }))}
                label={`${m.label}: ${m.value * 10}%`}
              />
              <b className="num">{m.value * 10}%</b>
            </div>
          ))}
        </div>
        <ol className="ld-plan" aria-label="عند الفجوة تُفتح خطة علاجية:">
          <li>شرح</li>
          <li>تمارين</li>
          <li>إعادة اختبار</li>
        </ol>
      </article>

      <article className="ld-cell ld-cell-levels">
        <BrainCircuit size={22} className="ld-cell-icon" aria-hidden="true" />
        <h3>شرح بثلاثة مستويات</h3>
        <p>يختار الطالب العمق المناسب، ويطلب أمثلة إضافية متى احتاج.</p>
        <div className="ld-levels" aria-hidden="true">
          <span>مبسّط</span>
          <span className="on">متوسّط</span>
          <span>متعمّق</span>
        </div>
      </article>

      <article className="ld-cell ld-cell-att">
        <BookOpenCheck size={22} className="ld-cell-icon" aria-hidden="true" />
        <h3>حضور يصل لوليّ الأمر فورًا</h3>
        <p>يسجّل المعلّم الحضور، ويُنبَّه وليّ الأمر عند الغياب.</p>
        <VentWall
          size={12}
          caption="مثال توضيحي لحضور فصلين في عشرة أيام"
          rows={ATT_DEMO.map(([label, days]) => ({
            id: label,
            label,
            items: days.split("").map((c) => ({ state: ATTENDANCE_VENT[ATT_CODE[c]].state, title: ATTENDANCE_VENT[ATT_CODE[c]].label })),
            value: `${Math.round((days.split("").filter((c) => c !== "a").length / days.length) * 100)}%`,
          }))}
        />
      </article>

      <article className="ld-cell ld-cell-curr">
        <Layers size={22} className="ld-cell-icon" aria-hidden="true" />
        <h3>محتوى مهيكل حسب المنهج</h3>
        <p>ملخّص ومصطلحات وبطاقات مراجعة لكل درس، يضيف إليها المعلّم والمدرسة.</p>
        <ol className="ld-path" aria-label="هيكل المنهج">
          <li>مرحلة</li>
          <li>صف</li>
          <li>مادة</li>
          <li>وحدة</li>
          <li>درس</li>
        </ol>
      </article>

      <article className="ld-cell ld-cell-mobile">
        <div>
          <Smartphone size={22} className="ld-cell-icon" aria-hidden="true" />
          <h3>على الجوال كما على الحاسوب</h3>
          <p>عربية أصيلة من اليمين لليسار، وإنجليزية كاملة، وحجم خط وتباين وتقليل حركة لمن يحتاجها.</p>
        </div>
        <img src={shot("phone", lang)} width="780" height="1560" loading="lazy" alt="الصفحة الرئيسية للطالب على شاشة الجوال" />
      </article>
    </div>
  );
}

function SectionHead({ kicker, title, desc }) {
  return (
    <div className="ld-section-head">
      {kicker && <span className="ld-pill">{kicker}</span>}
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

// علامة المقارنة. على الحاسوب أيقونة داخل خليّة الجدول؛ على الجوال تصير شارة تحمل اسم الطرف
// («مشرق» / «منصّات الحصص») لأن رؤوس الأعمدة تختفي حين يتحوّل كل صفّ إلى بطاقة.
function Mark({ v, who }) {
  const [Icon, label] = MARKS[v];
  return (
    <span className={`ld-mark ${v}`} title={label}>
      <Icon size={15} aria-hidden="true" />
      <span className="ld-mark-who" aria-hidden="true">
        {who}
        {v === "part" && " (جزئيًّا)"}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
