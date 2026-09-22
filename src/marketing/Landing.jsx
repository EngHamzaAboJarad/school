import {
  Sparkles,
  BrainCircuit,
  BookOpenCheck,
  ClipboardCheck,
  LineChart,
  ShieldCheck,
  Users,
  GraduationCap,
  Building2,
  Landmark,
  Cpu,
  Check,
  ChevronLeft,
  Bell,
  Smartphone,
  KeyRound,
  Lock,
  FileClock,
  Award,
  Quote,
  Map,
} from "lucide-react";
import { Wordmark, LogoMark } from "../ui/Brand";
import { LangToggle } from "../i18n/LangToggle";
import { ROLES, DEMO_ACCOUNTS } from "../data/people";

// ───── بيانات المحتوى (من FEATURE-COVERAGE.md ووثيقة Taqat-School-Competitive-Feature-Doc) ─────

const TRUST_POINTS = [
  "٦ أدوار متكاملة بلوحات مستقلة",
  "٥ أنواع أسئلة وتصحيح فوري",
  "تشخيص فجوات وخطة علاجية آلية",
  "عربية RTL كاملة وهوية أكاديمية",
];

const ROLE_ICONS = {
  student: GraduationCap,
  parent: Users,
  teacher: Award,
  school: Building2,
  supervisor: Landmark,
  system: Cpu,
};

const ROLE_ORDER = [
  "student",
  "parent",
  "teacher",
  "school",
  "supervisor",
  "system",
];

const HOW_STEPS = [
  {
    icon: BrainCircuit,
    title: "شرح تفاعلي بالذكاء الاصطناعي",
    desc: "شرح مبسّط لمحتوى الدرس بثلاثة مستويات، مع أمثلة إضافية عند الطلب.",
  },
  {
    icon: BookOpenCheck,
    title: "تلخيص ذكي",
    desc: "نقاط رئيسية ومصطلحات لكل درس ووحدة، جاهزة للمراجعة السريعة والحفظ.",
  },
  {
    icon: ClipboardCheck,
    title: "اختبار بعد كل درس",
    desc: "كويز مولَّد من محتوى الدرس ومرتبط بأهداف التعلّم، بعد اعتماد المعلّم.",
  },
  {
    icon: LineChart,
    title: "امتحان وحدة وتشخيص فجوات",
    desc: "امتحان موزون على دروس الوحدة، ثم تشخيص للفجوات وخطة علاجية حتى الإتقان.",
  },
];

const COMPARE_ROWS = [
  "شرح المناهج تفاعليًّا بالذكاء الاصطناعي",
  "تلخيص الدروس والوحدات آليًّا",
  "اختبار (كويز) تلقائي بعد كل درس",
  "امتحان لكل وحدة مولَّد من تحليل الدروس",
  "تصحيح آلي وتغذية راجعة فورية",
  "تشخيص الفجوات وخطط علاجية",
  "لوحة متابعة لوليّ الأمر",
  "إدارة مدرسية/مؤسسية كاملة",
  "إشراف تربوي (إدارة تعليمية/وزارة)",
  "الإتاحة ٢٤/٧ دون حجز حصّة",
];

const FEATURE_ENGINES = [
  {
    icon: BrainCircuit,
    tag: "E1",
    title: "محرّك المحتوى والمناهج",
    points: [
      "هيكلة منهج: مرحلة ← صف ← مادة ← وحدة ← درس",
      "شرح تفاعلي بثلاثة مستويات",
      "تلخيص نقطي ومصطلحات لكل درس ووحدة",
      "مساعد ذكي مقيَّد بسياق الدرس",
      "بطاقات مراجعة وخرائط ذهنية",
    ],
  },
  {
    icon: ClipboardCheck,
    tag: "E2",
    title: "محرّك التقييم بالذكاء الاصطناعي",
    points: [
      "توليد كويز بعد كل درس وامتحان لكل وحدة",
      "خمسة أنواع أسئلة موسومة بالهدف والصعوبة",
      "تصحيح فوري وتفسير لكل سؤال",
      "تصحيح المقالي بمعايير (Rubric) مع تدخّل المعلّم",
      "بنك أسئلة قابل لإعادة الاستخدام",
    ],
  },
  {
    icon: LineChart,
    tag: "E3",
    title: "التعلّم الشخصي والتحليلات",
    points: [
      "تشخيص فجوات دقيق لكل هدف تعلّم",
      "خطط علاجية (شرح ← تمارين ← إعادة اختبار)",
      "توصية «ما التالي؟» بحسب الأداء",
      "تتبّع إتقان وتقدّم عبر الزمن",
      "تلعيب: نقاط وشارات وسلاسل",
    ],
  },
  {
    icon: Users,
    tag: "E4–E6",
    title: "لوحات الطالب ووليّ الأمر والمعلّم",
    points: [
      "رئيسية وتقويم دراسي يومي للطالب",
      "متابعة أبناء متعدّدين من حساب واحد",
      "تقارير دورية وتنبيهات فورية لوليّ الأمر",
      "اعتماد المعلّم لكل محتوى واختبار مولَّد",
      "متابعة أداء الفصل والتصحيح اليدوي",
    ],
  },
  {
    icon: Building2,
    tag: "E7–E8",
    title: "الإدارة المدرسية والإشراف التربوي",
    points: [
      "مستخدمون وأدوار وصفوف وجداول",
      "حضور وغياب مرتبط بتنبيه وليّ الأمر",
      "تقارير مؤسسية قابلة للتصدير",
      "لوحة إشراف متعددة المدارس",
      "مؤشّرات أداء تجميعية ورقابة جودة",
    ],
  },
  {
    icon: Bell,
    tag: "E9",
    title: "التواصل والإشعارات",
    points: [
      "إشعارات متعددة القنوات داخل التطبيق",
      "مراسلة وإعلانات بتتبّع القراءة",
      "تنبيهات ذكية عند تدنّي الأداء",
    ],
  },
  {
    icon: ShieldCheck,
    tag: "E10–E11",
    title: "النظام والأمان والامتثال",
    points: [
      "تعدّد مستأجرين وصلاحيات RBAC دقيقة",
      "مصادقة بخطوتين وإدارة جلسات آمنة",
      "سجلّ تدقيق لكل إجراء حسّاس",
      "حماية بيانات القُصّر (PDPL) وموافقات صريحة",
    ],
  },
  {
    icon: Smartphone,
    tag: "E12–E13",
    title: "الجوّال والتوطين والتكاملات",
    points: [
      "تصميم متجاوب كامل وعربية RTL أصيلة",
      "إتاحة: حجم خط وتباين وتقليل حركة",
      "واجهات API وتصدير CSV/PDF",
      "بوّابات دفع محلية (مدى / Apple Pay / STC Pay)",
    ],
  },
];

const ROADMAP = [
  {
    phase: "المرحلة ٠",
    title: "التأسيس",
    desc: "البنية التقنية، الهوية، الأدوار والصلاحيات (RBAC)، المصادقة، ودعم RTL.",
  },
  {
    phase: "المرحلة ١",
    title: "MVP — منتج أفراد",
    desc: "شرح + تلخيص + كويز بعد الدرس + لوحات أساسية. منتج B2C قابل للإطلاق.",
  },
  {
    phase: "المرحلة ٢",
    title: "الباقة المدرسية",
    desc: "امتحان الوحدة، تشخيص وخطط علاجية، إدارة مدرسية كاملة، تواصل وإشعارات.",
  },
  {
    phase: "المرحلة ٣",
    title: "الإشراف والتوسّع",
    desc: "لوحة الإشراف التربوي، تعدّد المستأجرين، الفوترة والدفع، التكاملات.",
  },
  {
    phase: "المرحلة ٤",
    title: "النضج الإقليمي",
    desc: "جوّال متقدّم، تلعيب أعمق، اختبارات تكيّفية، وتوسّع خليجي.",
  },
];

const PRICING = [
  {
    icon: GraduationCap,
    tag: "B2C",
    title: "اشتراك أفراد",
    price: "٢٩–٤٩",
    unit: "ريال / شهر",
    desc: "خطط شهرية وسنوية للطالب ووليّ الأمر، مع خطة مجانية محدودة.",
  },
  {
    icon: Users,
    tag: "B2C",
    title: "الباقة العائلية",
    price: "٦٩",
    unit: "ريال / شهر",
    desc: "متابعة عدّة أبناء من اشتراك واحد بخصم عائلي.",
  },
  {
    icon: Building2,
    tag: "B2B",
    title: "ترخيص مدرسي",
    price: "لكل مقعد",
    unit: "/ سنويًّا",
    desc: "ترخيص لكل مقعد مع لوحات إدارة ومعلّم كاملة.",
  },
  {
    icon: Landmark,
    tag: "B2G",
    title: "ترخيص مؤسسي / حكومي",
    price: "عرض",
    unit: "مخصّص",
    desc: "لإدارات التعليم والإشراف على مستوى المنطقة أو الوزارة.",
  },
];

const DEMO_LABELS = {
  student: "طالب",
  parent: "وليّ أمر",
  teacher: "معلّم",
  school: "إدارة المدرسة",
  supervisor: "إشراف تربوي",
  system: "مدير النظام",
};

export default function Landing({ onEnter }) {
  return (
    <div className="landing" dir="rtl">
      <header className="ld-nav">
        <div className="ld-nav-inner">
          <Wordmark size="sm" />
          <nav className="ld-nav-links">
            <a href="#ld-how">كيف تعمل</a>
            <a href="#ld-roles">الأدوار</a>
            <a href="#ld-features">المميزات</a>
            <a href="#ld-compare">لماذا نحن</a>
            <a href="#ld-pricing">الأسعار</a>
          </nav>
          <div className="ld-nav-actions">
            <LangToggle />
            <button className="btn btn-primary" onClick={onEnter}>
              تسجيل الدخول
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="ld-hero">
          <div className="ld-hero-inner">
            <span className="ld-kicker">
              <Sparkles size={14} /> منصّة تعليمية عربية مبنيّة على الذكاء
              الاصطناعي — للسوق السعودي والخليجي
            </span>
            <h1>
              مدرستك الذكية التي <em>تشرح</em>، وتُلخّص، وتختبر بعد كل درس
            </h1>
            <p className="ld-hero-sub">
              طاقات سكول تحوّل كل درس إلى رحلة تعلّم كاملة: شرح تفاعلي، تلخيص
              ذكي، اختبار فوري بعد الدرس، وامتحان لكل وحدة — ثم تشخيص دقيق
              للفجوات وخطة تفوّق شخصية، وتُدار بالبيانات عبر ستة أدوار من الطالب
              حتى الإشراف التربوي والوزارة.
            </p>
            <div className="ld-hero-cta">
              <button className="btn btn-primary btn-lg" onClick={onEnter}>
                جرّب الحسابات التجريبية
                <ChevronLeft size={18} />
              </button>
              <a href="#ld-how" className="btn btn-ghost btn-lg">
                شاهد كيف تعمل المنصّة
              </a>
            </div>
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
            <LogoMark size={120} />
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="ld-section ld-problem">
          <div className="ld-grid-2">
            <div className="ld-card ld-card-muted">
              <span className="ld-card-kicker">المشكلة</span>
              <h3>المنافسون يبيعون ساعات معلّم</h3>
              <p>
                منصّات مثل «معلمي» و«تدريس أون لاين» تعمل بنموذج سوق حصص خصوصية:
                مكلفة، محكومة بعدد ساعات المعلمين، بلا متابعة مستمرة ولا تقييم
                آلي ذكي ولا منظومة مؤسسية للمدارس والجهات.
              </p>
            </div>
            <div className="ld-card ld-card-brand">
              <span className="ld-card-kicker">الحلّ</span>
              <h3>منتج رقمي ذكي يعمل ٢٤/٧</h3>
              <p>
                شرح وتلخيص وتقييم آلي لكل درس ووحدة بتكلفة حدّية منخفضة وقابلية
                توسّع عالية، مع لوحات لكل دور تحوّل البيانات إلى قرار تربوي —
                تعليم شخصي عالي الجودة في متناول كل طالب.
              </p>
            </div>
          </div>
          <blockquote className="ld-quote">
            <Quote size={22} />
            المنافس يبيع ساعات معلّم؛ نحن نبني مدرسة رقمية ذكية تعلّم وتقيّم
            وتُدار بالبيانات.
          </blockquote>
        </section>

        {/* How it works */}
        <section id="ld-how" className="ld-section">
          <SectionHead
            kicker="رحلة الدرس"
            title="من الشرح إلى الإتقان في أربع خطوات"
            desc="التدفّق التعليمي الذي يميّز طاقات سكول عن أي سوق حصص خصوصية."
          />
          <div className="ld-steps">
            {HOW_STEPS.map((s, i) => (
              <div className="ld-step" key={s.title}>
                <span className="ld-step-num">{i + 1}</span>
                <s.icon size={22} />
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section id="ld-roles" className="ld-section ld-alt">
          <SectionHead
            kicker="القسم ٥ — الأدوار"
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
        </section>

        {/* Feature engines */}
        <section id="ld-features" className="ld-section">
          <SectionHead
            kicker="القسم ٦ — الميزات"
            title="محرّكات المنصّة الأساسية"
            desc="ملاحم الميزات (Epics) من E1 إلى E13، جاهزة كخارطة مايلستون."
          />
          <div className="ld-engine-grid">
            {FEATURE_ENGINES.map((e) => (
              <div className="ld-engine-card" key={e.title}>
                <div className="ld-engine-head">
                  <span className="ld-engine-icon">
                    <e.icon size={20} />
                  </span>
                  <span className="ld-tag">{e.tag}</span>
                </div>
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
        </section>

        {/* Competitive comparison */}
        <section id="ld-compare" className="ld-section ld-alt">
          <SectionHead
            kicker="لماذا طاقات سكول"
            title="مدرسة رقمية ذكية، لا سوق حصص"
            desc="مقارنة مباشرة مع نموذج «الحصة الخصوصية» السائد في السوق."
          />
          <div className="ld-compare-table-wrap">
            <table className="ld-compare-table">
              <thead>
                <tr>
                  <th>القدرة / الميزة</th>
                  <th className="brand">طاقات سكول</th>
                  <th>منصّات الحصص الخصوصية</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((row) => (
                  <tr key={row}>
                    <td>{row}</td>
                    <td className="brand">
                      <Check size={16} />
                    </td>
                    <td className="muted">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Security */}
        <section className="ld-section">
          <SectionHead
            kicker="الثقة أولًا"
            title="الأمان والخصوصية والامتثال"
            desc="حماية بيانات القُصّر والامتثال شرط أساسي للثقة والتوسّع المؤسسي."
          />
          <div className="ld-security-grid">
            <SecurityItem
              icon={KeyRound}
              title="مصادقة بخطوتين"
              desc="تسجيل دخول آمن مع تحقّق 2FA وحدّ خمس محاولات."
            />
            <SecurityItem
              icon={Lock}
              title="RBAC دقيق"
              desc="صلاحيات مقيّدة لكل وظيفة بحسب دور المستخدم."
            />
            <SecurityItem
              icon={ShieldCheck}
              title="حماية بيانات القُصّر"
              desc="امتثال لنظام حماية البيانات، ولا استخدام لبيانات الطلاب في تدريب النماذج."
            />
            <SecurityItem
              icon={FileClock}
              title="سجلّ تدقيق كامل"
              desc="كل إجراء حسّاس يُسجَّل تلقائيًّا ويُتاح للمراجعة."
            />
          </div>
        </section>

        {/* Roadmap */}
        <section className="ld-section ld-alt">
          <SectionHead
            kicker="القسم ٧"
            title="خارطة الطريق"
            desc="مراحل واضحة تتحوّل مباشرة إلى مايلستون قابلة للإطلاق."
          />
          <div className="ld-roadmap">
            {ROADMAP.map((r) => (
              <div className="ld-roadmap-item" key={r.phase}>
                <span className="ld-roadmap-dot">
                  <Map size={14} />
                </span>
                <div>
                  <span className="ld-roadmap-phase">{r.phase}</span>
                  <h4>{r.title}</h4>
                  <p>{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="ld-pricing" className="ld-section">
          <SectionHead
            kicker="القسم ٩"
            title="نموذج العمل والتسعير"
            desc="منتج رقمي قابل للتوسّع بتكلفة حدّية منخفضة — أرقام إرشادية مبدئية."
          />
          <div className="ld-pricing-grid">
            {PRICING.map((p) => (
              <div className="ld-price-card" key={p.title}>
                <span className="ld-tag">{p.tag}</span>
                <span className="ld-price-icon">
                  <p.icon size={22} />
                </span>
                <h4>{p.title}</h4>
                <div className="ld-price-value">
                  {p.price} <small>{p.unit}</small>
                </div>
                <p>{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo accounts */}
        <section className="ld-section ld-alt">
          <SectionHead
            kicker="جرّبها الآن"
            title="ستّة حسابات تجريبية جاهزة"
            desc="كلمة المرور password ورمز التحقق 123456 — بنطاق taqat.test"
          />
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
            <button className="btn btn-primary btn-lg" onClick={onEnter}>
              تسجيل الدخول بحساب تجريبي
              <ChevronLeft size={18} />
            </button>
          </div>
        </section>

        {/* Final CTA */}
        <section className="ld-cta">
          <Sparkles size={22} />
          <h2>مدرستك الذكية التي تشرح، وتلخّص، وتختبر بعد كل درس</h2>
          <p>
            ثم تبني لكل طالب خطة تفوّق — وتُدار ببيانات تصل إلى الإدارة المدرسية
            والإشراف التربوي.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onEnter}>
            ابدأ الآن
            <ChevronLeft size={18} />
          </button>
        </section>
      </main>

      <footer className="ld-footer">
        <Wordmark size="sm" />
        <p>
          طاقات سكول — منصّة تعليمية ذكية عربية. الإصدار 1.0 • أغسطس 2026. إعداد
          فريق طاقات.
        </p>
        <div className="ld-footer-links">
          <a href="#ld-features">المميزات</a>
          <a href="#ld-roles">الأدوار</a>
          <a href="#ld-pricing">الأسعار</a>
        </div>
      </footer>
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

function SecurityItem({ icon: Icon, title, desc }) {
  return (
    <div className="ld-security-item">
      <span className="ld-role-icon">
        <Icon size={20} />
      </span>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
