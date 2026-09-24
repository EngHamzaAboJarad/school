import { useEffect, useState } from "react";
import {
  Award,
  Bell,
  BrainCircuit,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  Cpu,
  GraduationCap,
  Landmark,
  Menu,
  MessageCircle,
  Minus,
  Quote,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "../ui/Brand";
import { LangToggle } from "../i18n/LangToggle";
import { useLang } from "../i18n";
import { ROLES, DEMO_ACCOUNTS } from "../data/people";
import TryQuiz from "./TryQuiz";
import ContactSection from "./ContactSection";
import { CountUp } from "../ui/motion";
import {
  ABOUT,
  COMPARE_ROWS,
  CONTACT,
  COST_BARS,
  DEMO_LABELS,
  FAQ,
  FEATURES,
  HOW_STEPS,
  NAV_LINKS,
  PAIN_POINTS,
  PRICING,
  ROLE_ORDER,
  SECURITY,
  STATS,
  TRUST_POINTS,
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

export default function Landing({ onEnter, onJoin }) {
  const { lang } = useLang();
  const [menu, setMenu] = useState(false);
  const closeMenu = () => setMenu(false);
  const toTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      { threshold: 0.08, rootMargin: "0px 0px -5% 0px" },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="landing" dir={lang === "en" ? "ltr" : "rtl"}>
      <header className="ld-nav">
        <div className="ld-wrap ld-nav-inner">
          <a href="#/" className="ld-brand" onClick={toTop} aria-label="طاقات سكول">
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
                احجز عرضًا تجريبيًّا
              </a>
            </div>
          </nav>
          <div className="ld-nav-actions">
            <LangToggle />
            <button type="button" className="btn btn-ghost ld-nav-login" onClick={onEnter}>
              تسجيل الدخول
            </button>
            <a href="#ld-contact" className="btn btn-gold ld-nav-cta">
              احجز عرضًا تجريبيًّا
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
        {/* Hero */}
        <section className="ld-hero">
          <div className="ld-wrap ld-hero-grid">
            <div className="ld-hero-inner">
              <span className="ld-kicker">
                <Sparkles size={14} /> منصّة تعليمية عربية مبنيّة على الذكاء الاصطناعي — للسوق السعودي والخليجي
              </span>
              <h1>
                مدرستك الذكية التي <em>تشرح</em> وتُلخّص وتختبر بعد كل درس
              </h1>
              <p className="ld-hero-sub">
                طاقات سكول تحوّل كل درس إلى رحلة تعلّم كاملة: شرح تفاعلي، تلخيص ذكي، اختبار فوري بعد الدرس، وامتحان لكل وحدة — ثم تشخيص دقيق للفجوات وخطة تفوّق شخصية،
                وتُدار بالبيانات عبر ستة أدوار من الطالب حتى الإشراف التربوي والوزارة.
              </p>
              <div className="ld-hero-cta">
                <button type="button" className="btn btn-primary btn-lg" onClick={onEnter}>
                  جرّب الحسابات التجريبية
                  <ChevronLeft size={18} />
                </button>
                <a href="#ld-contact" className="btn btn-ghost btn-lg">
                  احجز عرضًا لمدرستك
                </a>
              </div>
              <p className="ld-hero-note">حسابات تجريبية جاهزة للدخول فورًا، دون تسجيل.</p>
              <ul className="ld-trust">
                {TRUST_POINTS.map((t) => (
                  <li key={t}>
                    <Check size={16} /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="ld-hero-art" aria-hidden="true">
              <div className="ld-hero-glow" />
              <div className="ld-app">
                <div className="ld-app-bar">
                  <i />
                  <i />
                  <i />
                  <span>الدرس ٣ — الكسور المتكافئة</span>
                  <b className="ld-ai-tag">
                    <Sparkles size={11} /> AI
                  </b>
                </div>
                <div className="ld-bubble">
                  <BrainCircuit size={18} />
                  <p>المعلّم الذكي: نقسم البسط والمقام على العدد نفسه فنحصل على كسر مكافئ.</p>
                </div>
                <div className="ld-q">
                  <strong>أيّ الكسور يساوي ٦/٩؟</strong>
                  <ul>
                    <li className="ok">
                      <span>٢/٣</span>
                      <Check size={14} />
                    </li>
                    <li>
                      <span>١/٣</span>
                    </li>
                    <li>
                      <span>٣/٤</span>
                    </li>
                  </ul>
                </div>
                <div className="ld-mastery">
                  <div>
                    <span>إتقان: الكسور المتكافئة</span>
                    <b className="num">82%</b>
                  </div>
                  <div className="ld-meter">
                    <i className="ok" style={{ width: "82%" }} />
                  </div>
                </div>
              </div>
              <div className="ld-chip ld-chip-a">
                <Bell size={15} /> تنبيه لوليّ الأمر: أنهت سارة اختبار الدرس
              </div>
              <div className="ld-chip ld-chip-b">
                <Target size={15} /> فجوة مُشخَّصة ← خطة علاجية جاهزة
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="ld-stats" aria-label="طاقات سكول بالأرقام">
          <div className="ld-wrap ld-stats-grid">
            {STATS.map(([n, label]) => (
              <div key={label}>
                <b>
                  <CountUp value={n} duration={1400} />
                </b>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="ld-band" data-rv>
          <div className="ld-wrap">
            <SectionHead
              kicker="المشكلة والحلّ"
              title="الدروس الخصوصية وحدها لا تكفي"
              desc="تبيع ساعات معلّم مجدولة، ثم تترك الطالب دون متابعة بين حصّة وأخرى."
            />
            <div className="ld-pains">
              {PAIN_POINTS.map((p) => (
                <div className="ld-pain" key={p.title}>
                  <span className="ld-role-icon">
                    <p.icon size={20} />
                  </span>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              ))}
            </div>
            <div className="ld-solution">
              <div>
                <span className="ld-card-kicker">الحلّ</span>
                <h3>منتج رقمي ذكي يعمل ٢٤/٧</h3>
                <p>
                  شرح وتلخيص وتقييم آلي لكل درس ووحدة بتكلفة حدّية منخفضة وقابلية توسّع عالية، مع لوحات لكل دور تحوّل البيانات إلى قرار تربوي — تعليم شخصي عالي الجودة في
                  متناول كل طالب.
                </p>
              </div>
              <blockquote className="ld-quote">
                <Quote size={22} />
                الدروس الخصوصية تبيع ساعات معلّم؛ نحن نبني مدرسة رقمية ذكية تعلّم وتقيّم وتُدار بالبيانات.
              </blockquote>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="ld-how" className="ld-band ld-alt" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="رحلة الدرس" title="من الشرح إلى الإتقان في أربع خطوات" desc="التدفّق التعليمي الذي يميّز طاقات سكول عن أي سوق حصص خصوصية." />
            <div className="ld-how">
              <ol className="ld-steps">
                {HOW_STEPS.map((s, i) => (
                  <li className="ld-step" key={s.title}>
                    <span className="ld-step-num num">{i + 1}</span>
                    <span className="ld-role-icon">
                      <s.icon size={20} />
                    </span>
                    <div>
                      <h4>{s.title}</h4>
                      <p>{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <TryQuiz />
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="ld-roles" className="ld-band" data-rv>
          <div className="ld-wrap">
            <SectionHead
              kicker="الأدوار"
              title="ستّة أدوار، لكل منها لوحته الخاصة"
              desc="منظومة أدوار متكاملة تخدم الطالب ووليّ الأمر والمعلّم والإدارة والإشراف التربوي ومدير النظام."
            />
            <div className="ld-roles-grid">
              {ROLE_ORDER.map((id) => {
                const r = ROLES[id];
                const Icon = ROLE_ICONS[id];
                return (
                  <div className="ld-role-card" key={id}>
                    <span className="ld-role-icon">
                      <Icon size={20} />
                    </span>
                    <h4>{r.long}</h4>
                    <p>{r.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="ld-features" className="ld-band ld-alt" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="المميزات" title="محرّكات المنصّة الأساسية" desc="كل ما يحتاجه الطالب والمعلّم والمدرسة في منظومة واحدة." />
            <div className="ld-engine-grid">
              {FEATURES.map((e) => (
                <div className="ld-engine-card" key={e.title}>
                  <span className="ld-engine-icon">
                    <e.icon size={20} />
                  </span>
                  <h4>{e.title}</h4>
                  <ul>
                    {e.points.map((p) => (
                      <li key={p}>
                        <Check size={14} /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section id="ld-compare" className="ld-band" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="لماذا طاقات سكول" title="مدرسة رقمية ذكية، لا سوق حصص" desc="مقارنة مباشرة مع نموذج «الحصة الخصوصية» السائد في السوق." />
            <div className="ld-compare-table-wrap">
              <table className="ld-compare-table">
                <caption className="sr-only">مقارنة بين طاقات سكول ومنصّات الحصص الخصوصية</caption>
                <thead>
                  <tr>
                    <th scope="col">القدرة / الميزة</th>
                    <th scope="col" className="brand">
                      طاقات سكول
                    </th>
                    <th scope="col">منصّات الحصص الخصوصية</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map(([label, ours, theirs]) => (
                    <tr key={label}>
                      <th scope="row">{label}</th>
                      <td className="brand">
                        <Mark v={ours} />
                      </td>
                      <td>
                        <Mark v={theirs} />
                      </td>
                    </tr>
                  ))}
                  <tr className="ld-compare-sum">
                    <th scope="row">النموذج</th>
                    <td className="brand">منصّة ذكية + مدرسة رقمية</td>
                    <td>سوق حصص خصوصية</td>
                  </tr>
                  <tr className="ld-compare-sum">
                    <th scope="row">التسعير</th>
                    <td className="brand">اشتراك أو ترخيص مؤسسي</td>
                    <td>بالحصة (من ٢٠ ريالًا)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="ld-cost">
              <h3>كم يكلّف الطالب شهريًّا؟</h3>
              {COST_BARS.items.map((it) => (
                <div className="ld-cost-row" key={it.label}>
                  <div className="ld-cost-label">
                    <span>{it.label}</span>
                    <b className={it.brand ? "brand" : ""}>{it.text}</b>
                  </div>
                  <div className="ld-cost-track" aria-hidden="true">
                    <i className={it.brand ? "brand" : ""} style={{ width: `${(it.range[1] / COST_BARS.max) * 100}%` }}>
                      <b style={{ width: `${(it.range[0] / it.range[1]) * 100}%` }} />
                    </i>
                  </div>
                </div>
              ))}
              <small>تقدير مبدئي لثماني حصص في الشهر بحسب الأسعار المنشورة (٢٠–٥٦ ريالًا للحصة). أسعار طاقات سكول إرشادية وقد تتغيّر عند الإطلاق.</small>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="ld-band ld-alt" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="الثقة أولًا" title="الأمان والخصوصية والامتثال" desc="حماية بيانات القُصّر والامتثال شرط أساسي للثقة والتوسّع المؤسسي." />
            <div className="ld-security-grid">
              {SECURITY.map((s) => (
                <div className="ld-security-item" key={s.title}>
                  <span className="ld-role-icon">
                    <s.icon size={20} />
                  </span>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="ld-about" className="ld-band ld-dark" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="من نحن" title="مدرسة رقمية صنعها معلّمون ومهندسون من غزّة" desc="فريق تربوي وتقني بخبرة ميدانية في التعليم وبناء المنصّات." />
            <div className="ld-about">
              <div className="ld-about-story">
                {ABOUT.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                <div className="ld-vm">
                  {[ABOUT.vision, ABOUT.mission].map((b) => (
                    <div key={b.title}>
                      <h4>{b.title}</h4>
                      <p>{b.text}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ld-about-side">
                <div className="ld-values">
                  {ABOUT.values.map((v) => (
                    <div className="ld-value" key={v.title}>
                      <span className="ld-value-icon">
                        <v.icon size={18} />
                      </span>
                      <div>
                        <h4>{v.title}</h4>
                        <p>{v.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="ld-why">
                  <h4>
                    <ABOUT.whyIcon size={17} /> {ABOUT.whyTitle}
                  </h4>
                  <ul>
                    {ABOUT.why.map((w) => (
                      <li key={w}>
                        <Check size={14} /> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="ld-pricing" className="ld-band" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="الأسعار" title="نموذج العمل والتسعير" desc="منتج رقمي قابل للتوسّع بتكلفة حدّية منخفضة — أرقام إرشادية مبدئية." />
            <div className="ld-pricing-grid">
              {PRICING.map((p) => (
                <div className={`ld-price-card ${p.featured ? "featured" : ""}`} key={p.title}>
                  {p.featured && <span className="ld-ribbon">خطة مجانية متاحة</span>}
                  <span className="ld-price-icon">
                    <p.icon size={22} />
                  </span>
                  <h4>{p.title}</h4>
                  <div className="ld-price-value">
                    {p.price} <small>{p.unit}</small>
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

        {/* Demo accounts */}
        <section className="ld-band ld-alt" data-rv>
          <div className="ld-wrap">
            <SectionHead kicker="جرّبها الآن" title="ستّة حسابات تجريبية جاهزة" desc="كلمة المرور password ورمز التحقق 123456 — بنطاق taqat.test" />
            <div className="ld-demo-grid">
              {DEMO_ACCOUNTS.map((a) => {
                const Icon = ROLE_ICONS[a.role] || GraduationCap;
                return (
                  <div className="ld-demo-card" key={a.email}>
                    <span className="ld-role-icon">
                      <Icon size={18} />
                    </span>
                    <b>{DEMO_LABELS[a.role]}</b>
                    <code dir="ltr">{a.email}</code>
                  </div>
                );
              })}
            </div>
            <div className="ld-demo-cta">
              <button type="button" className="btn btn-primary btn-lg" onClick={onEnter}>
                تسجيل الدخول بحساب تجريبي
                <ChevronLeft size={18} />
              </button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="ld-faq" className="ld-band" data-rv>
          <div className="ld-wrap ld-narrow">
            <SectionHead kicker="الأسئلة الشائعة" title="إجابات سريعة قبل أن تبدأ" />
            <div className="ld-faq">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>
                    <span>{q}</span>
                    <ChevronDown size={18} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact / Join */}
        <section id="ld-contact" className="ld-band ld-alt" data-rv>
          <div className="ld-wrap">
            <SectionHead
              kicker="تواصل معنا أو انضم إلينا"
              title="لنبنِ مدرسة أذكى معًا"
              desc="مدرسة تبحث عن عرض تجريبي، أو معلّم يريد الانضمام، أو وليّ أمر يبدأ رحلة ابنه — نحن هنا."
            />
            <ContactSection onJoin={onJoin} />
          </div>
        </section>

        {/* Final CTA */}
        <section className="ld-cta">
          <div className="ld-wrap ld-cta-inner">
            <Sparkles size={22} />
            <h2>مدرستك الذكية التي تشرح، وتلخّص، وتختبر بعد كل درس</h2>
            <p>ثم تبني لكل طالب خطة تفوّق — وتُدار ببيانات تصل إلى الإدارة المدرسية والإشراف التربوي.</p>
            <div className="ld-hero-cta">
              <button type="button" className="btn btn-gold btn-lg" onClick={() => onJoin("signup")}>
                أنشئ حسابك
                <ChevronLeft size={18} />
              </button>
              <a href="#ld-contact" className="btn btn-light btn-lg">
                احجز عرضًا تجريبيًّا
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
        </div>
        <div className="ld-wrap">
          <div className="ld-footer-base">
            <span>© ٢٠٢٦ طاقات سكول. جميع الحقوق محفوظة.</span>
            <span>صُنعت بأيدي معلّمين ومهندسين فلسطينيين من غزّة.</span>
          </div>
        </div>
      </footer>

      {CONTACT.whatsapp && (
        <a
          className="ld-wa"
          href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("مرحبًا، أودّ الاستفسار عن طاقات سكول")}`}
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

function SectionHead({ kicker, title, desc }) {
  return (
    <div className="ld-section-head">
      <span className="ld-kicker">{kicker}</span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

function Mark({ v }) {
  const [Icon, label] = MARKS[v];
  return (
    <span className={`ld-mark ${v}`} title={label}>
      <Icon size={15} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
