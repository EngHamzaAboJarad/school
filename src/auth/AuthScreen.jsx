import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileUp,
  GraduationCap,
  Users,
  Presentation,
  Timer,
  ShieldCheck,
  Sparkles,
  BrainCircuit,
  LineChart as LineIcon,
  Plus,
  X,
  KeyRound,
} from "lucide-react";
import { Wordmark } from "../ui/Brand";
import { Btn, Field, Input, Select, Notice, Badge } from "../ui/Primitives";
import { DEMO_ACCOUNTS, ROLES } from "../data/people";
import { LangToggle } from "../i18n/LangToggle";
import { useStore } from "../store/StoreProvider";

const DEMO_PASSWORD = "password";
const DEMO_CODE = "123456";
const GRADES = [
  "الأول الابتدائي",
  "الثاني الابتدائي",
  "الثالث الابتدائي",
  "الرابع الابتدائي",
  "الخامس الابتدائي",
  "السادس الابتدائي",
  "الأول المتوسط",
  "الثاني المتوسط",
  "الثالث المتوسط",
  "الأول الثانوي",
  "الثاني الثانوي",
  "الثالث الثانوي",
];

const pwRules = [
  ["٨ أحرف على الأقل", (p) => p.length >= 8],
  ["حرف لاتيني كبير وصغير", (p) => /[a-z]/.test(p) && /[A-Z]/.test(p)],
  ["رقم واحد على الأقل", (p) => /\d/.test(p)],
  ["رمز خاص (مثل ! @ #)", (p) => /[^A-Za-z0-9]/.test(p)],
];

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// ───── تعريف خطوات التسجيل لكل نوع حساب (F11.2 / F11.4) ─────
const FLOWS = {
  student: {
    title: "تسجيل طالب",
    steps: [
      {
        title: "بيانات إضافية",
        desc: "التسجيل الفردي متاح دون الانتماء لمدرسة؛ إن كان لديك رمز دعوة من مدرسة يمكنك إدخاله.",
        fields: [
          {
            k: "school",
            label: "رمز الدعوة (اختياري)",
            req: false,
            ph: "مثال: AFAQ-2026",
          },
          {
            k: "grade",
            label: "الصف الدراسي",
            req: true,
            type: "select",
            options: GRADES,
          },
          {
            k: "parent",
            label: "وليّ الأمر (بريد أو جوال)",
            req: true,
            ph: "parent@example.com أو 05XXXXXXXX",
          },
        ],
      },
      {
        title: "بيانات الطالب",
        desc: "اسم الدخول يُتحقَّق من تفرّده لدى نظام المدرسة.",
        fields: [
          { k: "name", label: "اسم الطالب", req: true },
          {
            k: "login",
            label: "اسم الدخول",
            req: true,
            ph: "student.login",
            hint: "أحرف لاتينية وأرقام",
          },
          {
            k: "password",
            label: "كلمة المرور",
            req: true,
            type: "password",
            rules: true,
          },
        ],
      },
      {
        title: "المراجعة والموافقة",
        review: true,
        consents: [["terms", "أوافق على شروط الاستخدام وسياسة الخصوصية."]],
      },
    ],
    done: {
      title: "وصل طلب التسجيل",
      body: "أُنشئ ملف الطالب وهو بانتظار موافقة وليّ الأمر (واعتماد المدرسة إن وُجد رمز دعوة) قبل تفعيل الدخول.",
      tone: "success",
    },
  },
  parent: {
    title: "تسجيل وليّ أمر",
    steps: [
      {
        title: "بيانات وليّ الأمر",
        desc: "نُنشئ حساب وليّ الأمر أولًا ثم نربط به الأبناء.",
        fields: [
          { k: "name", label: "الاسم الكامل", req: true },
          {
            k: "email",
            label: "البريد الإلكتروني",
            req: true,
            type: "email",
            ph: "name@example.com",
          },
          { k: "phone", label: "رقم الجوال", req: true, ph: "05XXXXXXXX" },
          {
            k: "password",
            label: "كلمة المرور",
            req: true,
            type: "password",
            rules: true,
          },
        ],
      },
      {
        title: "الأبناء",
        desc: "أضف ابنًا أو أكثر — يمكنك متابعتهم جميعًا من حساب واحد.",
        kids: true,
      },
      {
        title: "المراجعة والموافقات",
        review: true,
        consents: [
          ["terms", "أوافق على شروط الاستخدام وسياسة الخصوصية."],
          [
            "data",
            "أوافق على معالجة بيانات أبنائي التعليمية داخل المنصّة — علمًا أنها لا تُستخدم لتدريب نماذج الذكاء الاصطناعي.",
          ],
        ],
      },
    ],
    done: {
      title: "أُنشئ حسابك بنجاح",
      body: "أُنشئت علاقة وليّ الأمر بالطلاب. يمكنك تسجيل الدخول الآن.",
      tone: "success",
    },
  },
  teacher: {
    title: "طلب انضمام معلّم",
    steps: [
      {
        title: "البيانات الشخصية",
        fields: [
          { k: "name", label: "الاسم الكامل", req: true },
          { k: "dob", label: "تاريخ الميلاد", req: true, type: "date" },
          { k: "phone", label: "رقم الجوال", req: true, ph: "05XXXXXXXX" },
          { k: "email", label: "البريد الإلكتروني", req: true, type: "email" },
          {
            k: "password",
            label: "كلمة المرور",
            req: true,
            type: "password",
            rules: true,
            span: true,
          },
        ],
      },
      {
        title: "المؤهلات والخبرة",
        fields: [
          {
            k: "qual",
            label: "المؤهل العلمي",
            req: true,
            ph: "بكالوريوس رياضيات",
          },
          {
            k: "spec",
            label: "التخصص",
            req: true,
            type: "select",
            options: [
              "الرياضيات",
              "العلوم",
              "اللغة العربية",
              "اللغة الإنجليزية",
              "الدراسات الإسلامية",
              "أخرى",
            ],
          },
          {
            k: "years",
            label: "سنوات الخبرة",
            req: true,
            type: "number",
            ph: "5",
          },
          { k: "org", label: "آخر جهة عمل", ph: "اسم المدرسة أو المنصّة" },
        ],
      },
      {
        title: "الوثائق",
        desc: "الهوية والشهادة العلمية مطلوبتان؛ شهادة الخبرة والصورة عند الاقتضاء.",
        uploads: [
          ["identity", "صورة الهوية الوطنية / الإقامة", true],
          ["academic", "الشهادة العلمية", true],
          ["experience", "شهادة الخبرة (إن وُجدت)", false],
          ["photo", "صورة شخصية (اختياري)", false],
        ],
      },
      {
        title: "المراجعة والإرسال",
        review: true,
        consents: [
          [
            "terms",
            "أُقرّ بصحة البيانات وأوافق على ميثاق المعلّمين وسياسة المحتوى.",
          ],
        ],
      },
    ],
    done: {
      title: "طلبك قيد المراجعة",
      body: "لا يُفعَّل حساب المعلّم قبل اعتماد الطلب. سنُشعرك عبر البريد والجوال بالنتيجة.",
      tone: "pending",
    },
  },
};

export default function AuthScreen({ onLogin, onBack, initialFlow }) {
  const { dispatch } = useStore();
  const startFlow = FLOWS[initialFlow] ? initialFlow : null;
  const [screen, setScreen] = useState(startFlow ? "wizard" : initialFlow === "signup" ? "type" : "signin");
  const [flow, setFlow] = useState(startFlow);
  const [pending, setPending] = useState(null); // الحساب بانتظار 2FA

  return (
    <div className="auth">
      <section className="auth-art" aria-hidden={false}>
        <div className="auth-art-inner">
          <Wordmark light size="lg" />
          <div className="auth-copy">
            <span className="auth-kicker">
              <Sparkles size={14} /> منصّة تعليمية مبنيّة على الذكاء الاصطناعي
            </span>
            <h1>
              مدرستك الذكية التي <em>تشرح</em> وتُلخّص
              <br />
              وتختبر بعد كل درس
            </h1>
            <p>
              ثم تبني لكل طالب خطة تفوّق — وتُدار ببيانات تصل إلى الإدارة
              المدرسية والإشراف التربوي.
            </p>
            <ul className="auth-points">
              <li>
                <BrainCircuit size={20} />
                <div>
                  <strong>مُعلّم ذكي على مدار الساعة</strong>
                  <span>شرح مبسّط بثلاثة مستويات وأمثلة عند الطلب.</span>
                </div>
              </li>
              <li>
                <Check size={20} />
                <div>
                  <strong>اختبار بعد كل درس وامتحان لكل وحدة</strong>
                  <span>مولَّد من محتوى الدرس ومُعتمَد من معلّمك.</span>
                </div>
              </li>
              <li>
                <LineIcon size={20} />
                <div>
                  <strong>تشخيص الفجوات وخطط علاجية</strong>
                  <span>
                    ولوحات لكل دور: طالب، وليّ أمر، معلّم، إدارة، إشراف.
                  </span>
                </div>
              </li>
            </ul>
          </div>
          <div className="auth-foot">
            <ShieldCheck size={16} /> بيانات القُصّر محميّة ومشفّرة • ولا
            تُستخدم لتدريب النماذج
          </div>
        </div>
      </section>
      <section className="auth-panel">
        <LangToggle className="auth-lang" />
        {onBack && (
          <button type="button" className="btn-link auth-back" onClick={onBack}>
            <ArrowRight size={16} /> الرئيسية
          </button>
        )}
        <div className="auth-card">
          {screen === "signin" && (
            <SignIn
              onOk={(acc) => {
                setPending(acc);
                setScreen("2fa");
              }}
              onForgot={() => setScreen("forgot")}
              onCreate={() => setScreen("type")}
            />
          )}
          {screen === "2fa" && (
            <TwoFactor
              account={pending}
              onBack={() => setScreen("signin")}
              onVerified={() => onLogin(pending)}
            />
          )}
          {screen === "forgot" && (
            <Forgot
              onBack={() => setScreen("signin")}
              onSent={() => setScreen("sent")}
            />
          )}
          {screen === "sent" && (
            <Status
              icon={Check}
              title="تحقّق من قناة الاسترداد"
              body="إذا كان الحساب موجودًا ومؤهَّلًا فستصلك تعليمات الاستعادة. الرمز صالح ١٥ دقيقة ويُستخدم مرة واحدة."
              action="معاينة شاشة كلمة المرور الجديدة"
              onAction={() => setScreen("reset")}
            />
          )}
          {screen === "reset" && <Reset onSave={() => setScreen("updated")} />}
          {screen === "updated" && (
            <Status
              icon={Check}
              title="تم تحديث كلمة المرور"
              body="أُنهيت الجلسات النشطة الأخرى. سجّل الدخول بكلمة المرور الجديدة."
              action="تسجيل الدخول"
              onAction={() => setScreen("signin")}
            />
          )}
          {screen === "type" && (
            <AccountType
              onBack={() => setScreen("signin")}
              onPick={(f) => {
                setFlow(f);
                setScreen("wizard");
              }}
            />
          )}
          {screen === "wizard" && (
            <Wizard
              flowId={flow}
              onBack={() => setScreen("type")}
              onDone={(vals) => {
                if (flow === "teacher") {
                  dispatch({ type: "addUser", user: { name: vals.name, email: vals.email, role: "teacher", status: "بانتظار الاعتماد" }, actor: "self-signup" });
                }
                setScreen("done");
              }}
            />
          )}
          {screen === "done" && (
            <Status
              icon={FLOWS[flow].done.tone === "pending" ? Timer : Check}
              tone={FLOWS[flow].done.tone}
              title={FLOWS[flow].done.title}
              body={FLOWS[flow].done.body}
              action="العودة لتسجيل الدخول"
              onAction={() => setScreen("signin")}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function PasswordInput({ value, onChange, name, ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        name={name}
        autoComplete="current-password"
        {...rest}
      />
      <button
        type="button"
        className="pw-toggle"
        onClick={() => setShow(!show)}
        aria-label={show ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function PwRules({ value }) {
  return (
    <ul className="pw-rules">
      {pwRules.map(([label, test]) => (
        <li key={label} className={test(value) ? "ok" : ""}>
          <Check size={13} />
          {label}
        </li>
      ))}
    </ul>
  );
}

function SignIn({ onOk, onForgot, onCreate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const acc = DEMO_ACCOUNTS.find(
      (a) => a.email === email.trim().toLowerCase(),
    );
    if (!acc || password !== DEMO_PASSWORD)
      return setError("بيانات الدخول غير صحيحة. تحقّق من البريد وكلمة المرور.");
    setError("");
    onOk(acc);
  };
  return (
    <div className="auth-flow">
      <span className="kicker">أهلًا بعودتك</span>
      <h2>تسجيل الدخول</h2>
      <p className="muted">أدخل بيانات حسابك للوصول إلى لوحتك.</p>
      <div className="demo-box">
        <div className="demo-head">
          <KeyRound size={15} /> حسابات تجريبية{" "}
          <small>— اضغط لتعبئة البريد</small>
        </div>
        <div className="chips">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.email}
              type="button"
              className={`chip ${email === a.email ? "active" : ""}`}
              onClick={() => {
                setEmail(a.email);
                setPassword(DEMO_PASSWORD);
                setError("");
              }}
            >
              {ROLES[a.role].long}
            </button>
          ))}
        </div>
        <small>
          كلمة المرور: <b className="num">password</b> • رمز التحقق:{" "}
          <b className="num">123456</b>
        </small>
      </div>
      <form className="stack" onSubmit={submit} noValidate>
        <Field label="البريد الإلكتروني أو اسم الدخول">
          <Input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="username"
            required
          />
        </Field>
        <Field label="كلمة المرور">
          <PasswordInput
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="row spread">
          <label className="check">
            <input type="checkbox" defaultChecked /> تذكّرني على هذا الجهاز
          </label>
          <button type="button" className="btn-link small" onClick={onForgot}>
            نسيت كلمة المرور؟
          </button>
        </div>
        <Btn type="submit" variant="primary" className="btn-block btn-lg">
          تسجيل الدخول
        </Btn>
      </form>
      <div className="auth-or">
        <span>أو</span>
      </div>
      <Btn variant="ghost" className="btn-block" disabled>
        الدخول الموحّد (SSO) — قريبًا
      </Btn>
      <p className="auth-switch">
        ليس لديك حساب؟{" "}
        <button className="btn-link" onClick={onCreate}>
          أنشئ حسابًا
        </button>
      </p>
    </div>
  );
}

function TwoFactor({ account, onBack, onVerified }) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [tries, setTries] = useState(0);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(60);
  const refs = useRef([]);
  useEffect(() => refs.current[0]?.focus(), []);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);
  const locked = tries >= 5;
  const setDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
  };
  const paste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("");
    const next = ["", "", "", "", "", ""];
    digits.forEach((d, i) => (next[i] = d));
    setCode(next);
    refs.current[Math.min(digits.length, 6) - 1]?.focus();
  };
  const verify = () => {
    if (locked) return;
    if (code.join("") === DEMO_CODE) return onVerified();
    const t = tries + 1;
    setTries(t);
    setError(
      t >= 5
        ? "استُنفدت المحاولات. أعد تسجيل الدخول لطلب رمز جديد."
        : `الرمز غير صحيح. المحاولات المتبقية: ${5 - t}`,
    );
    setCode(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
  };
  return (
    <div className="auth-flow">
      <button className="back" onClick={onBack}>
        <ArrowRight size={16} /> رجوع
      </button>
      <span className="kicker">التحقق بخطوتين</span>
      <h2>أدخل رمز التحقق</h2>
      <p className="muted">
        أرسلنا رمزًا من ٦ أرقام إلى جهازك المسجَّل لحساب{" "}
        <b>{ROLES[account.role].long}</b>. صالح ٥ دقائق ويُستخدم مرة واحدة.
      </p>
      <div className="otp" dir="ltr" onPaste={paste}>
        {code.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={d}
            inputMode="numeric"
            maxLength={1}
            aria-label={`الرقم ${i + 1}`}
            disabled={locked}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !code[i] && i > 0)
                refs.current[i - 1]?.focus();
              if (e.key === "Enter") verify();
            }}
          />
        ))}
      </div>
      {error && <Notice tone="danger">{error}</Notice>}
      <Btn
        variant="primary"
        className="btn-block btn-lg"
        onClick={verify}
        disabled={locked || code.some((d) => !d)}
      >
        تحقّق وتابع
      </Btn>
      <p className="muted small center">
        {wait > 0 ? (
          <>
            إعادة الإرسال بعد <b className="num">{wait}</b> ثانية
          </>
        ) : (
          <button className="btn-link" onClick={() => setWait(60)}>
            إعادة إرسال الرمز
          </button>
        )}{" "}
        • بحدّ أقصى ٥ محاولات
      </p>
    </div>
  );
}

function Forgot({ onBack, onSent }) {
  const [v, setV] = useState("");
  return (
    <div className="auth-flow">
      <button className="back" onClick={onBack}>
        <ArrowRight size={16} /> رجوع
      </button>
      <span className="kicker">استعادة الوصول</span>
      <h2>نسيت كلمة المرور؟</h2>
      <p className="muted">
        أدخل بريدك أو اسم الدخول. نُظهر ردًّا عامًّا دائمًا لحماية خصوصية
        الحسابات.
      </p>
      <Field label="البريد الإلكتروني أو اسم الدخول">
        <Input value={v} onChange={(e) => setV(e.target.value)} />
      </Field>
      <Btn
        variant="primary"
        className="btn-block btn-lg"
        disabled={!v.trim()}
        onClick={onSent}
      >
        إرسال تعليمات الاستعادة
      </Btn>
    </div>
  );
}

function Reset({ onSave }) {
  const [p, setP] = useState("");
  const [c, setC] = useState("");
  const ok = pwRules.every(([, t]) => t(p)) && p === c;
  return (
    <div className="auth-flow">
      <span className="kicker">كلمة مرور جديدة</span>
      <h2>إعادة تعيين كلمة المرور</h2>
      <Field label="كلمة المرور الجديدة">
        <PasswordInput
          value={p}
          onChange={(e) => setP(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <PwRules value={p} />
      <Field label="تأكيد كلمة المرور" error={c && p !== c ? "غير مطابقة" : ""}>
        <PasswordInput
          value={c}
          onChange={(e) => setC(e.target.value)}
          autoComplete="new-password"
        />
      </Field>
      <Btn
        variant="primary"
        className="btn-block btn-lg"
        disabled={!ok}
        onClick={onSave}
      >
        حفظ كلمة المرور
      </Btn>
    </div>
  );
}

function Status({
  icon: Icon,
  title,
  body,
  action,
  onAction,
  tone = "success",
}) {
  return (
    <div className="auth-flow center">
      <div className={`status-badge status-${tone}`}>
        <Icon size={30} />
      </div>
      <h2>{title}</h2>
      <p className="muted">{body}</p>
      <Btn variant="primary" className="btn-block btn-lg" onClick={onAction}>
        {action}
      </Btn>
    </div>
  );
}

function AccountType({ onBack, onPick }) {
  const types = [
    ["student", "طالب", "ضمن مدرسة معتمدة وبعلاقة وليّ أمر.", GraduationCap],
    ["parent", "وليّ أمر", "أنشئ حسابك أولًا ثم اربط أبناءك.", Users],
    ["teacher", "معلّم", "طلب انضمام يخضع للمراجعة والاعتماد.", Presentation],
  ];
  return (
    <div className="auth-flow">
      <button className="back" onClick={onBack}>
        <ArrowRight size={16} /> رجوع
      </button>
      <span className="kicker">إنشاء حساب</span>
      <h2>اختر نوع الحساب</h2>
      <p className="muted">لكل نوع مسار تسجيل مناسب له.</p>
      <div className="type-list">
        {types.map(([id, title, body, Icon]) => (
          <button key={id} className="type-card" onClick={() => onPick(id)}>
            <span className="type-icon">
              <Icon size={22} />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{body}</span>
            </div>
          </button>
        ))}
      </div>
      <Notice tone="gold" icon={ShieldCheck}>
        حسابات الإدارة المدرسية والإشراف التربوي ومدير النظام لا تُنشأ بالتسجيل
        الذاتي، بل تُسند من الجهة المسؤولة.
      </Notice>
    </div>
  );
}

function Wizard({ flowId, onBack, onDone }) {
  const flow = FLOWS[flowId];
  const [step, setStep] = useState(0);
  const [vals, setVals] = useState({});
  const [kids, setKids] = useState([{ name: "", login: "", grade: "" }]);
  const [files, setFiles] = useState({});
  const [consents, setConsents] = useState({});
  const [errors, setErrors] = useState({});
  const s = flow.steps[step];
  const set = (k, v) => setVals((x) => ({ ...x, [k]: v }));

  const validate = () => {
    const e = {};
    (s.fields || []).forEach((f) => {
      const v = (vals[f.k] || "").toString().trim();
      if (f.req && !v) e[f.k] = "هذا الحقل مطلوب";
      else if (f.type === "email" && v && !emailOk(v))
        e[f.k] = "صيغة البريد غير صحيحة";
      else if (f.rules && !pwRules.every(([, t]) => t(v)))
        e[f.k] = "كلمة المرور لا تستوفي الشروط";
    });
    if (
      s.kids &&
      kids.some((k) => !k.name.trim() || !k.login.trim() || !k.grade)
    )
      e.kids = "أكمل بيانات كل ابن (الاسم واسم الدخول والصف).";
    (s.uploads || []).forEach(
      ([k, , req]) => req && !files[k] && (e[k] = "الملف مطلوب"),
    );
    if (s.consents && s.consents.some(([k]) => !consents[k]))
      e.consent = "الموافقة مطلوبة للمتابعة.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const next = () => {
    if (!validate()) return;
    if (step === flow.steps.length - 1) onDone(vals);
    else setStep(step + 1);
  };
  const prev = () => (step === 0 ? onBack() : setStep(step - 1));

  return (
    <div className="auth-flow">
      <button className="back" onClick={prev}>
        <ArrowRight size={16} /> رجوع
      </button>
      <div
        className="wiz-progress"
        aria-label={`الخطوة ${step + 1} من ${flow.steps.length}`}
      >
        <div className="row spread small muted">
          <span>
            الخطوة <b className="num">{step + 1}</b> من{" "}
            <b className="num">{flow.steps.length}</b>
          </span>
          <span className="num">
            {Math.round(((step + 1) / flow.steps.length) * 100)}%
          </span>
        </div>
        <div className="wiz-bar">
          {flow.steps.map((_, i) => (
            <i key={i} className={i <= step ? "on" : ""} />
          ))}
        </div>
      </div>
      <span className="kicker">{flow.title}</span>
      <h2>{s.title}</h2>
      {s.desc && <p className="muted">{s.desc}</p>}

      {s.fields && (
        <div className="form-grid">
          {s.fields.map((f) => (
            <Field
              key={f.k}
              label={f.label}
              hint={f.hint}
              error={errors[f.k]}
              className={
                f.span ||
                (s.fields.length === 3 && f === s.fields[s.fields.length - 1])
                  ? "span-2"
                  : ""
              }
            >
              {f.type === "select" ? (
                <Select
                  value={vals[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                >
                  <option value="">اختر…</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              ) : f.type === "password" ? (
                <PasswordInput
                  value={vals[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  autoComplete="new-password"
                />
              ) : (
                <Input
                  type={f.type || "text"}
                  value={vals[f.k] || ""}
                  onChange={(e) => set(f.k, e.target.value)}
                  placeholder={f.ph}
                />
              )}
            </Field>
          ))}
          {s.fields.some((f) => f.rules) && (
            <div className="span-2">
              <PwRules value={vals.password || ""} />
            </div>
          )}
        </div>
      )}

      {s.kids && (
        <div className="stack-sm">
          {kids.map((k, i) => (
            <div className="kid" key={i}>
              <div className="row spread">
                <strong>
                  الابن <span className="num">{i + 1}</span>
                </strong>
                {kids.length > 1 && (
                  <button
                    className="btn-link small"
                    onClick={() => setKids(kids.filter((_, j) => j !== i))}
                  >
                    <X size={14} /> إزالة
                  </button>
                )}
              </div>
              <div className="form-grid">
                <Field label="اسم الابن">
                  <Input
                    value={k.name}
                    onChange={(e) =>
                      setKids(
                        kids.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="اسم الدخول">
                  <Input
                    dir="ltr"
                    value={k.login}
                    placeholder="student.login"
                    onChange={(e) =>
                      setKids(
                        kids.map((x, j) =>
                          j === i ? { ...x, login: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="الصف" className="span-2">
                  <Select
                    value={k.grade}
                    onChange={(e) =>
                      setKids(
                        kids.map((x, j) =>
                          j === i ? { ...x, grade: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="">اختر…</option>
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
          ))}
          <Btn
            variant="ghost"
            icon={Plus}
            onClick={() =>
              setKids([...kids, { name: "", login: "", grade: "" }])
            }
          >
            إضافة ابن آخر
          </Btn>
          {errors.kids && <span className="field-error">{errors.kids}</span>}
        </div>
      )}

      {s.uploads && (
        <div className="stack-sm">
          {s.uploads.map(([k, label, req]) => (
            <div key={k}>
              <label className={`upload ${files[k] ? "has" : ""}`}>
                <FileUp size={19} />
                <span>{files[k] || label}</span>
                {req ? (
                  <Badge tone="warn">مطلوب</Badge>
                ) : (
                  <Badge>اختياري</Badge>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setFiles({ ...files, [k]: e.target.files?.[0]?.name || "" })
                  }
                />
              </label>
              {errors[k] && <span className="field-error">{errors[k]}</span>}
            </div>
          ))}
          <small className="muted">الصيغ المقبولة: PDF أو JPG أو PNG.</small>
        </div>
      )}

      {s.review && (
        <div className="stack-sm">
          <div className="review-box">
            <strong>{vals.name || kids[0]?.name || "—"}</strong>
            <span>
              {[vals.email, vals.phone, vals.grade, vals.school]
                .filter(Boolean)
                .join(" • ") || "بيانات محفوظة وجاهزة للإرسال"}
            </span>
            {flowId === "parent" && (
              <span>
                الأبناء:{" "}
                {kids
                  .map((k) => k.name)
                  .filter(Boolean)
                  .join("، ")}
              </span>
            )}
            {flowId === "teacher" && (
              <span>
                الوثائق المرفقة:{" "}
                <b className="num">
                  {Object.values(files).filter(Boolean).length}
                </b>
              </span>
            )}
          </div>
          {s.consents.map(([k, label]) => (
            <label className="check consent" key={k}>
              <input
                type="checkbox"
                checked={!!consents[k]}
                onChange={(e) =>
                  setConsents({ ...consents, [k]: e.target.checked })
                }
              />{" "}
              <span>{label}</span>
            </label>
          ))}
          {errors.consent && (
            <span className="field-error">{errors.consent}</span>
          )}
          {flowId === "teacher" && (
            <Notice tone="info" icon={Timer}>
              الإرسال لا يُفعّل حساب المعلّم؛ ينتقل الطلب إلى المراجعة
              والاعتماد.
            </Notice>
          )}
        </div>
      )}

      <Btn variant="primary" className="btn-block btn-lg" onClick={next}>
        {step === flow.steps.length - 1 ? "إرسال الطلب" : "التالي"}
      </Btn>
    </div>
  );
}
