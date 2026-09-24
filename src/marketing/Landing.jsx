import { useEffect, useState } from "react";
import {
  Sparkles, BrainCircuit, BookOpenCheck, ClipboardCheck, LineChart,
  ShieldCheck, Users, GraduationCap, Cpu, Check, ChevronLeft,
  Bell, Smartphone, Lock, Award, Play, ArrowUpLeft, BookOpen,
  Calculator, Languages, FlaskConical, Atom, BarChart3, CalendarDays,
  MessageCircle, Zap, Target, WandSparkles
} from "lucide-react";
import { Wordmark, LogoMark } from "../ui/Brand";
import { LangToggle } from "../i18n/LangToggle";
import { useLang } from "../i18n/index.jsx";

const stageSubjects = {
  secondary: [
    { icon: Calculator, label: "الرياضيات" },
    { icon: Languages, label: "اللغة العربية" },
    { icon: BookOpen, label: "اللغة الإنجليزية" },
    { icon: Atom, label: "الفيزياء" },
    { icon: FlaskConical, label: "الكيمياء" },
  ],
  middle: [
    { icon: Calculator, label: "الرياضيات" },
    { icon: Languages, label: "اللغة العربية" },
    { icon: BookOpen, label: "اللغة الإنجليزية" },
    { icon: FlaskConical, label: "العلوم" },
    { icon: Cpu, label: "المهارات الرقمية" },
  ],
  primary: [
    { icon: Calculator, label: "الرياضيات" },
    { icon: Languages, label: "لغتي" },
    { icon: BookOpen, label: "اللغة الإنجليزية" },
    { icon: FlaskConical, label: "العلوم" },
    { icon: BookOpenCheck, label: "الدراسات الإسلامية" },
  ],
};

const stages = [
  { id: "secondary", label: "المرحلة الثانوية" },
  { id: "middle", label: "المرحلة المتوسطة" },
  { id: "primary", label: "المرحلة الابتدائية" },
];

const journey = [
  { icon: BrainCircuit, n: "01", title: "افهم الدرس", desc: "شرح ذكي يتكيّف مع مستوى الطالب ويبسّط الفكرة خطوة بخطوة." },
  { icon: BookOpenCheck, n: "02", title: "راجع بسرعة", desc: "ملخّص واضح لأهم الأفكار والمصطلحات قبل الانتقال للتطبيق." },
  { icon: ClipboardCheck, n: "03", title: "اختبر نفسك", desc: "أسئلة بعد الدرس مع تصحيح فوري وتغذية راجعة تساعد على الفهم." },
  { icon: Target, n: "04", title: "عالج نقاط الضعف", desc: "تحليل للأداء وخطة تعلّم تركّز على المهارات التي تحتاج تحسينًا." },
];

const roles = [
  { icon: GraduationCap, title: "الطالب", desc: "دروس، اختبارات، تقدّم وإنجازات في تجربة واحدة سهلة." },
  { icon: Users, title: "وليّ الأمر", desc: "متابعة واضحة لمستوى الأبناء والتقدّم والتنبيهات المهمة." },
  { icon: Award, title: "المعلّم", desc: "متابعة الطلاب واعتماد المحتوى والتقييمات من لوحة عملية." },
  { icon: Cpu, title: "مدير النظام", desc: "إدارة المستخدمين والصلاحيات والإعدادات من مكان واحد." },
];

const benefits = [
  { icon: WandSparkles, title: "تعليم شخصي بالذكاء الاصطناعي", desc: "تجربة تتفاعل مع مستوى الطالب بدل تقديم نفس المسار للجميع." },
  { icon: BarChart3, title: "تقدّم واضح وقابل للقياس", desc: "مؤشرات مرئية تساعد الطالب ووليّ الأمر على فهم التقدّم بسرعة." },
  { icon: CalendarDays, title: "كل شيء في مكان واحد", desc: "الدروس والاختبارات والمهام والتنبيهات ضمن لوحة موحّدة." },
  { icon: Bell, title: "تنبيهات في الوقت المناسب", desc: "تذكير بالمهام والمواعيد والتغيّرات المهمة دون تشتيت." },
  { icon: MessageCircle, title: "تواصل أسهل", desc: "حلقة وصل أوضح بين الطالب ووليّ الأمر والمعلّم." },
  { icon: ShieldCheck, title: "خصوصية وأمان", desc: "صلاحيات منفصلة لكل دور وتصميم يضع حماية البيانات في الأساس." },
];

export default function Landing({ onEnter }) {
  const { lang } = useLang();
  const [activeStage, setActiveStage] = useState("secondary");
  const subjects = stageSubjects[activeStage];

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll(".ld-reveal").forEach((el) => observer.observe(el));

    const art = document.querySelector(".ld-hero-visual");
    const move = (e) => {
      if (!art) return;
      const r = art.getBoundingClientRect();
      art.style.setProperty("--rx", `${((e.clientY-r.top)/r.height-.5)*-5}deg`);
      art.style.setProperty("--ry", `${((e.clientX-r.left)/r.width-.5)*7}deg`);
    };
    const reset = () => { if (art) { art.style.setProperty("--rx", "0deg"); art.style.setProperty("--ry", "0deg"); } };
    art?.addEventListener("pointermove", move);
    art?.addEventListener("pointerleave", reset);
    return () => { observer.disconnect(); art?.removeEventListener("pointermove", move); art?.removeEventListener("pointerleave", reset); };
  }, []);

  return (
    <div className="landing" dir={lang === "en" ? "ltr" : "rtl"}>
      <header className="ld-nav">
        <div className="ld-nav-inner">
          <Wordmark size="sm" />
          <nav className="ld-nav-links" aria-label="التنقل الرئيسي">
            <a href="#experience">التجربة</a>
            <a href="#journey">كيف تعمل</a>
            <a href="#roles">لمن المنصة؟</a>
            <a href="#features">المميزات</a>
          </nav>
          <div className="ld-nav-actions">
            <LangToggle />
            <button className="ld-login" onClick={onEnter}>تسجيل الدخول <ArrowUpLeft size={16}/></button>
          </div>
        </div>
      </header>

      <main>
        <section className="ld-hero">
          <div className="ld-hero-copy">
            <div className="ld-eyebrow"><span className="ld-pulse"/> تعلّم أذكى، خطوة بخطوة</div>
            <h1>كل درس يتحوّل إلى<br/><span>رحلة تعلّم ذكية.</span></h1>
            <p>طاقات سكول تجمع الشرح والتلخيص والاختبارات وتحليل التقدّم في تجربة عربية حديثة تساعد الطالب على الفهم، لا الحفظ فقط.</p>
            <div className="ld-hero-actions">
              <button className="ld-btn ld-btn-primary" onClick={onEnter}>ابدأ تجربتك <ChevronLeft size={18}/></button>
              <a className="ld-btn ld-btn-soft" href="#journey"><Play size={17} fill="currentColor"/> اكتشف كيف تعمل</a>
            </div>
            <div className="ld-proof-row">
              <span><Check size={15}/> تجربة عربية RTL</span>
              <span><Check size={15}/> تعمل على كل الأجهزة</span>
              <span><Check size={15}/> متاحة ٢٤/٧</span>
            </div>
          </div>

          <div className="ld-hero-visual" aria-hidden="true">
            <div className="ld-ambient ld-ambient-a"/><div className="ld-ambient ld-ambient-b"/>
            <div className="ld-app-shell">
              <div className="ld-app-top"><div className="ld-app-brand"><LogoMark size={28}/><b>لوحة الطالب</b></div><div className="ld-avatar">س</div></div>
              <div className="ld-app-content">
                <div className="ld-app-greeting"><div><small>مرحبًا 👋</small><h3>نكمل رحلتنا اليوم؟</h3></div><span className="ld-streak"><Zap size={14}/> ٧ أيام</span></div>
                <div className="ld-app-stats">
                  <div><small>نسبة الإتقان</small><strong>٨٧٪</strong><i><em style={{width:"87%"}}/></i></div>
                  <div><small>دروس مكتملة</small><strong>١٢</strong><span>هذا الشهر</span></div>
                  <div><small>اختبارات</small><strong>٩</strong><span>مكتملة</span></div>
                </div>
                <div className="ld-next-card">
                  <div className="ld-next-icon"><Calculator size={22}/></div>
                  <div><small>تابع من حيث توقفت</small><b>الرياضيات • المعادلات الخطية</b><span>الدرس ٤ من ٦</span></div>
                  <button><ChevronLeft size={17}/></button>
                </div>
                <div className="ld-app-bottom">
                  <div><span>تقدّم الأسبوع</span><b>ممتاز، استمر!</b></div>
                  <div className="ld-bars"><i/><i/><i/><i/><i/><i/><i/></div>
                </div>
              </div>
            </div>
            <div className="ld-float ld-float-ai"><span><BrainCircuit size={18}/></span><div><b>المساعد الذكي</b><small>جاهز لشرح الفكرة</small></div></div>
            <div className="ld-float ld-float-win"><span><Award size={18}/></span><div><b>إنجاز جديد</b><small>أكملت الوحدة بنجاح</small></div></div>
          </div>
        </section>

        <section className="ld-signal ld-reveal">
          <div><strong>٤</strong><span>أدوار مترابطة</span></div><i/>
          <div><strong>٢٤/٧</strong><span>تعلّم في أي وقت</span></div><i/>
          <div><strong>AI</strong><span>شرح وتقييم ذكي</span></div><i/>
          <div><strong>RTL</strong><span>تجربة عربية أصيلة</span></div>
        </section>

        <section id="experience" className="ld-section ld-reveal">
          <div className="ld-section-head ld-head-center">
            <span>تجربة مصممة للطالب</span>
            <h2>ابدأ من مرحلتك، ووصل للمعلومة أسرع</h2>
            <p>واجهة واضحة تنظّم المحتوى حسب المرحلة والمادة، وتبقي الخطوة التالية أمام الطالب دائمًا.</p>
          </div>
          <div className="ld-stage-switch" role="tablist" aria-label="اختر المرحلة الدراسية">
            {stages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                role="tab"
                aria-selected={activeStage === stage.id}
                className={activeStage === stage.id ? "active" : ""}
                onClick={() => setActiveStage(stage.id)}
              >
                {stage.label}
              </button>
            ))}
          </div>
          <div className="ld-subjects" key={activeStage}>
            {subjects.map(({icon:Icon,label}, i)=><div className="ld-subject ld-subject-enter" key={label} style={{"--delay":`${i*65}ms`}}><span><Icon size={22}/></span><b>{label}</b><small>شرح • مراجعة • اختبار</small><ChevronLeft size={16}/></div>)}
          </div>
        </section>

        <section id="journey" className="ld-section ld-journey ld-reveal">
          <div className="ld-section-head">
            <span>من الفهم إلى الإتقان</span>
            <h2>مسار واحد واضح.<br/>بدون تشتّت.</h2>
            <p>بدل التنقل بين مصادر متعددة، يعيش الطالب دورة التعلّم كاملة داخل طاقات سكول.</p>
          </div>
          <div className="ld-journey-grid">
            {journey.map(({icon:Icon,n,title,desc})=><article className="ld-journey-card" key={n}><div className="ld-journey-top"><span>{n}</span><Icon size={24}/></div><h3>{title}</h3><p>{desc}</p></article>)}
          </div>
        </section>

        <section className="ld-ai-showcase ld-reveal">
          <div className="ld-ai-copy"><span className="ld-kicker"><Sparkles size={15}/> ذكاء اصطناعي داخل رحلة التعلّم</span><h2>لا يكتفي بإخبار الطالب أنه أخطأ.</h2><p>يشرح الفكرة، يساعد على المراجعة، ثم يستخدم نتائج التقييم لإظهار ما يحتاج الطالب إلى تحسينه بعد ذلك.</p><ul><li><Check size={17}/> شرح مبسّط مرتبط بالدرس</li><li><Check size={17}/> تغذية راجعة بعد الاختبار</li><li><Check size={17}/> رؤية أوضح لنقاط القوة والاحتياج</li></ul></div>
          <div className="ld-ai-demo">
            <div className="ld-chat-head"><span><BrainCircuit size={19}/></span><div><b>مساعد طاقات الذكي</b><small><i/> متاح الآن</small></div></div>
            <div className="ld-chat-bubble user">ما الفرق بين المحيط والمساحة؟</div>
            <div className="ld-chat-bubble ai"><Sparkles size={15}/><p><b>فكّر فيها بهذه الطريقة:</b><br/>المحيط يقيس طول الحدود حول الشكل، بينما المساحة تقيس الجزء الموجود داخله.</p></div>
            <div className="ld-chat-actions"><span>شرح أبسط</span><span>أعطني مثالًا</span><span>اختبرني</span></div>
          </div>
        </section>

        <section id="roles" className="ld-section ld-reveal">
          <div className="ld-section-head ld-head-center"><span>منظومة واحدة</span><h2>أربعة أدوار، تجربة مترابطة</h2><p>كل مستخدم يرى ما يحتاجه فقط، مع تجربة مخصصة لطبيعة دوره.</p></div>
          <div className="ld-role-grid">{roles.map(({icon:Icon,title,desc},i)=><article className={`ld-role-card role-${i+1}`} key={title}><span><Icon size={23}/></span><h3>{title}</h3><p>{desc}</p><div>واجهة مخصصة <ChevronLeft size={15}/></div></article>)}</div>
        </section>

        <section id="features" className="ld-section ld-features ld-reveal">
          <div className="ld-section-head"><span>مصممة لتبقى بسيطة</span><h2>قوة المنصة تظهر في التفاصيل.</h2><p>أدوات متكاملة، لكن الواجهة تبقى واضحة وسهلة الاستخدام.</p></div>
          <div className="ld-benefit-grid">{benefits.map(({icon:Icon,title,desc},i)=><article className={i===0?"featured":""} key={title}><span><Icon size={22}/></span><h3>{title}</h3><p>{desc}</p>{i===0 && <div className="ld-feature-orbit"><Sparkles size={28}/></div>}</article>)}</div>
        </section>

        <section className="ld-trust-section ld-reveal">
          <div className="ld-trust-icon"><Lock size={28}/></div>
          <div><span>الثقة جزء من التصميم</span><h2>بيئة تعليمية تحترم الخصوصية.</h2><p>صلاحيات منفصلة لكل دور، إدارة جلسات، وسجل للإجراءات الحساسة ضمن تجربة مبنية لتكون آمنة وقابلة للإدارة.</p></div>
          <div className="ld-trust-checks"><span><Check size={16}/> صلاحيات حسب الدور</span><span><Check size={16}/> إدارة جلسات آمنة</span><span><Check size={16}/> حماية بيانات المستخدم</span></div>
        </section>

        <section className="ld-final ld-reveal">
          <div className="ld-final-glow"/><LogoMark size={42}/><span>جاهز تشوف طاقات سكول من الداخل؟</span><h2>التعليم أذكى عندما تكون<br/>كل خطوة واضحة.</h2><p>ادخل إلى المنصة واستكشف تجربة التعلّم ولوحات المستخدمين.</p><button className="ld-btn ld-btn-light" onClick={onEnter}>استكشف المنصة <ChevronLeft size={18}/></button>
        </section>
      </main>

      <footer className="ld-footer"><Wordmark size="sm"/><p>منصة تعليمية عربية لتجربة تعلّم أكثر وضوحًا وذكاءً.</p><div><a href="#experience">التجربة</a><a href="#features">المميزات</a><button onClick={onEnter}>تسجيل الدخول</button></div></footer>
    </div>
  );
}
