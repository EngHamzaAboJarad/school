import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock3, Flag, XCircle, Sparkles, BookOpen, Award } from "lucide-react";
import { Btn, Badge, Card, Progress, Notice, Textarea, cx } from "../../ui/Primitives";
import { Ring, HBars } from "../../ui/Charts";
import { shuffle } from "../../lib/rng";
import { QUESTION_TYPES } from "../../data/curriculum";
import { scoreAttempt, aiGradeEssay } from "../../lib/grading";
import { levelLabel } from "../../lib/format";
import { celebrate } from "../../ui/motion";

const LETTERS = ["أ", "ب", "ج", "د", "هـ"];

export const correctText = (q) =>
  q.type === "mcq" ? q.options[q.answer] : q.type === "tf" ? (q.answer ? "صح" : "خطأ") : q.type === "fill" ? q.answers[0] : q.type === "match" ? q.pairs.map(([l, r]) => `${l} ← ${r}`).join(" • ") : q.model;

export const answerText = (q, a) => {
  if (a === null || a === undefined || a === "") return "لم تُجب";
  if (q.type === "mcq") return q.options[a] ?? "—";
  if (q.type === "tf") return a ? "صح" : "خطأ";
  if (q.type === "match") return q.pairs.map(([l], i) => `${l} ← ${a[i] || "—"}`).join(" • ");
  return String(a);
};

// عرض سؤال واحد بأي نوع (اختيار/صح-خطأ/إكمال/مطابقة/مقالي) — يُستخدم في الاختبار والمعاينة.
export function QuestionView({ q, value, onChange, result, disabled }) {
  const rights = useMemo(() => (q.type === "match" ? shuffle(q.pairs.map((p) => p[1]), q.id) : []), [q]);
  const locked = disabled || !!result;
  const state = (ok) => (result ? (ok ? "right" : "wrong") : "");

  return (
    <div className="qv">
      <div className="qv-meta">
        <Badge tone="emerald">{QUESTION_TYPES[q.type]}</Badge>
        <Badge tone={q.difficulty === "صعب" ? "danger" : q.difficulty === "متوسط" ? "warn" : "success"}>{q.difficulty}</Badge>
      </div>
      {q.type !== "fill" && <h2 className="qv-text">{q.text}</h2>}

      {q.type === "mcq" && (
        <div className="opts" role="radiogroup" aria-label={q.text}>
          {q.options.map((o, i) => (
            <button key={i} role="radio" aria-checked={value === i} disabled={locked}
              className={cx("opt", value === i && "chosen", result && i === q.answer && "right", result && value === i && i !== q.answer && "wrong")}
              onClick={() => onChange(i)}>
              <span className="opt-key">{LETTERS[i]}</span>
              <span>{o}</span>
              {result && i === q.answer && <Check size={18} />}
            </button>
          ))}
        </div>
      )}

      {q.type === "tf" && (
        <div className="tf" role="radiogroup">
          {[[true, "صح", Check], [false, "خطأ", XCircle]].map(([v, label, Icon]) => (
            <button key={label} role="radio" aria-checked={value === v} disabled={locked}
              className={cx("opt tf-opt", value === v && "chosen", result && v === q.answer && "right", result && value === v && v !== q.answer && "wrong")}
              onClick={() => onChange(v)}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>
      )}

      {q.type === "fill" && (
        <div className="fill">
          <h2 className="qv-text">
            {q.text.split("___").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <input className={cx("fill-input", state(result && result.got === 1))} value={value || ""} disabled={locked} dir="auto" aria-label="اكتب الإجابة" placeholder="…" onChange={(e) => onChange(e.target.value)} />
                )}
              </span>
            ))}
          </h2>
        </div>
      )}

      {q.type === "match" && (
        <div className="match">
          {q.pairs.map(([left, right], i) => (
            <div className="match-row" key={i}>
              <span className="match-left">{left}</span>
              <span className="match-arrow">←</span>
              <select className={cx("input select", result && state(value?.[i] === right))} disabled={locked} value={value?.[i] || ""} onChange={(e) => onChange({ ...(value || {}), [i]: e.target.value })} aria-label={`مطابقة ${left}`}>
                <option value="">اختر…</option>
                {rights.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}

      {q.type === "essay" && (
        <div className="stack-sm">
          <Textarea value={value || ""} disabled={locked} onChange={(e) => onChange(e.target.value)} placeholder="اكتب إجابتك هنا بأسلوبك…" rows={6} />
          <div className="row spread small muted">
            <span>سيُقيَّم مقالك وفق المعايير التالية ثم يراجعه معلّمك:</span>
            <span className="num">{(value || "").trim() ? (value || "").trim().split(/\s+/).length : 0} كلمة</span>
          </div>
          <div className="chips">{q.rubric.map((r) => <span className="chip" key={r.c}>{r.c} <b className="num">({r.w})</b></span>)}</div>
        </div>
      )}

      {result && q.type !== "essay" && (
        <div className={cx("explain", result.got >= 1 ? "right" : result.got > 0 ? "part" : "wrong")}>
          <div className="explain-head">
            {result.got >= 1 ? <CheckCircle2 size={19} /> : <XCircle size={19} />}
            <strong>{result.preview ? "التفسير الذي سيراه الطالب" : result.got >= 1 ? "إجابة صحيحة" : result.got > 0 ? "إجابة جزئية" : "إجابة غير صحيحة"}</strong>
          </div>
          {result.got < 1 && <p>الإجابة الصحيحة: <b>{correctText(q)}</b></p>}
          <p>{q.why}</p>
        </div>
      )}
    </div>
  );
}

const fmtClock = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// مُشغّل الاختبار: سؤال بسؤال، مؤقّت اختياري، تنقّل وتعليم للمراجعة، وإرسال.
export function QuizRunner({ title, kicker, questions, durationSec, onSubmit, onExit }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [left, setLeft] = useState(durationSec || null);
  const started = useRef(Date.now());
  const submitted = useRef(false);
  const q = questions[i];

  const submit = (auto = false) => {
    if (submitted.current) return;
    submitted.current = true;
    onSubmit(answers, Math.round((Date.now() - started.current) / 1000), auto);
  };

  useEffect(() => {
    if (left === null) return;
    if (left <= 0) return submit(true);
    const t = setTimeout(() => setLeft((x) => x - 1), 1000);
    return () => clearTimeout(t);
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const answered = (id) => answers[id] !== undefined && answers[id] !== "" && !(typeof answers[id] === "object" && Object.keys(answers[id]).length === 0);
  const doneCount = questions.filter((x) => answered(x.id)).length;
  const last = i === questions.length - 1;
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="runner">
      <div className="runner-top">
        <div>
          {kicker && <span className="kicker small">{kicker}</span>}
          <h3>{title}</h3>
        </div>
        <div className="row">
          {left !== null && <span className={cx("timer num", left < 60 && "urgent")}><Clock3 size={16} /> {fmtClock(left)}</span>}
          <Btn size="sm" variant="ghost" onClick={onExit}>خروج</Btn>
        </div>
      </div>
      <div className="runner-progress">
        <Progress value={(doneCount / questions.length) * 100} tone="gold" label="التقدم في الاختبار" />
        <span className="small muted">أجبت عن <b className="num">{doneCount}</b> من <b className="num">{questions.length}</b></span>
      </div>
      <div className="runner-nav">
        {questions.map((x, k) => (
          <button key={x.id} className={cx("qdot num", k === i && "current", answered(x.id) && "done", flags[x.id] && "flag")} onClick={() => setI(k)} aria-label={`السؤال ${k + 1}`}>{k + 1}</button>
        ))}
      </div>
      <Card className="runner-card">
        <div className="row spread small muted"><span>السؤال <b className="num">{i + 1}</b> من <b className="num">{questions.length}</b></span>
          <button className={cx("flagbtn", flags[q.id] && "on")} onClick={() => setFlags({ ...flags, [q.id]: !flags[q.id] })}><Flag size={15} /> {flags[q.id] ? "معلَّم للمراجعة" : "علّم للمراجعة"}</button>
        </div>
        <QuestionView key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswers({ ...answers, [q.id]: v })} />
      </Card>
      <div className="row spread">
        <Btn variant="ghost" icon={ArrowRight} disabled={i === 0} onClick={() => setI(i - 1)}>السابق</Btn>
        {last ? (
          <Btn variant="gold" icon={Check} onClick={() => (doneCount < questions.length ? setConfirm(true) : submit())}>إرسال الاختبار</Btn>
        ) : (
          <Btn variant="primary" iconEnd={ArrowLeft} onClick={() => setI(i + 1)}>التالي</Btn>
        )}
      </div>
      {confirm && (
        <Notice tone="warn" title={`لديك ${questions.length - doneCount} أسئلة بلا إجابة`}
          action={<div className="row"><Btn size="sm" variant="ghost" onClick={() => setConfirm(false)}>العودة</Btn><Btn size="sm" variant="primary" onClick={() => submit()}>إرسال على أي حال</Btn></div>}>
          الأسئلة بلا إجابة تُحتسب خطأً.
        </Notice>
      )}
    </div>
  );
}

// بناء المحاولة من الإجابات — الأسئلة الموضوعية تُصحَّح آليًّا، والمقالي بمعايير مبدئية بانتظار المعلّم.
export function buildAttempt({ studentId, kind, refId, questions, answers, durationSec }) {
  const objective = questions.filter((q) => q.type !== "essay");
  const { items, byObjective, score } = scoreAttempt(objective, answers);
  const essays = {};
  questions.filter((q) => q.type === "essay").forEach((q) => {
    essays[q.id] = { text: answers[q.id] || "", ai: aiGradeEssay(q, answers[q.id] || ""), final: null };
  });
  return { id: `AT-${Math.random().toString(36).slice(2, 8)}`, studentId, kind, refId, at: Date.now(), durationSec, items, byObjective, score, essays, questions };
}

// ───── النتيجة الفورية والتغذية الراجعة (F2.4) ─────
export function ResultView({ attempt, questions, title, objectives, onRetry, onReviewLesson, actions, hideReview }) {
  const total = Object.keys(attempt.items).length;
  const correct = Object.values(attempt.items).filter((x) => x.got >= 1).length;
  const essayList = Object.entries(attempt.essays || {});
  const byObj = Object.entries(attempt.byObjective).map(([oid, v]) => ({ oid, pct: Math.round((v.got / v.total) * 100), title: objectives?.[oid]?.title || oid, v }));
  const weak = byObj.filter((o) => o.pct < 70);
  const answeredQs = questions.filter((q) => q.type !== "essay" && attempt.items[q.id]);
  const tone = attempt.score >= 85 ? "success" : attempt.score >= 70 ? "info" : "warn";
  const message = attempt.score >= 85 ? "أداء ممتاز! أتقنت هذا الجزء." : attempt.score >= 70 ? "أداء جيد — راجع الأخطاء لترفع إتقانك." : "لا بأس — خطة علاجية قصيرة ستساعدك على التقدّم.";

  useEffect(() => {
    if (attempt.score < 85) return undefined;
    const t = window.setTimeout(() => celebrate(), 500);
    return () => window.clearTimeout(t);
  }, [attempt.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="result stack">
      <Card tone="dark" className="card-dark result-hero">
        <div className="result-ring"><Ring value={attempt.score} size={132} stroke={11} label="النتيجة" sub={levelLabel(attempt.score)} /></div>
        <div className="grow">
          <span className="kicker small" style={{ color: "var(--gold-300)" }}>نتيجتك الفورية</span>
          <h2 style={{ color: "var(--ivory)", fontSize: 30 }}>{title}</h2>
          <p style={{ color: "rgba(251,248,241,.8)", margin: "6px 0 14px" }}>{message}</p>
          <div className="row">
            <Badge tone="gold">{correct} من {total} صحيحة</Badge>
            {attempt.durationSec > 0 && <Badge tone="dark">{Math.max(1, Math.round(attempt.durationSec / 60))} دقيقة</Badge>}
            <Badge tone="dark"><Award size={12} /> +{Math.round(20 + attempt.score / 2)} نقطة</Badge>
          </div>
        </div>
      </Card>

      {byObj.length > 0 && (
        <Card title="أداؤك حسب هدف التعلّم" kicker="ربط الأخطاء بالمفاهيم">
          <HBars data={byObj.map((o) => ({ label: o.title, value: o.pct, sub: `${Math.round(o.v.got * 10) / 10} من ${o.v.total} سؤال` }))} />
          {weak.length > 0 && (
            <Notice tone="warn" icon={Sparkles} title="اقتراح مراجعة">
              يحتاج «{weak.map((w) => w.title).join("، ")}» إلى مراجعة. أُضيفت خطة علاجية قصيرة في «تقدّمي وخطتي».
              {onReviewLesson && <> <button className="btn-link" onClick={onReviewLesson}>راجع الشرح الآن</button></>}
            </Notice>
          )}
        </Card>
      )}

      {essayList.map(([qid, e]) => {
        const q = questions.find((x) => x.id === qid);
        return (
          <Card key={qid} title="السؤال المقالي" kicker="تقييم مبدئي بالمعايير">
            <p className="qv-text small-text">{q?.text}</p>
            <blockquote className="essay-quote">{e.text || "لم تُجب"}</blockquote>
            <div className="rubric">
              {e.ai.byCriterion.map((c) => (
                <div className="rubric-row" key={c.c}>
                  {c.hit ? <CheckCircle2 size={18} className="ok" /> : <XCircle size={18} className="no" />}
                  <span>{c.c}</span>
                  <b className="num">{c.got} / {c.w}</b>
                </div>
              ))}
            </div>
            <div className="row spread mt-sm">
              <strong>الدرجة المبدئية: <span className="num">{e.ai.score} / {e.ai.max}</span></strong>
              {e.final ? <Badge tone="success" icon={Check}>اعتمدها المعلّم: {e.final.score} / {e.ai.max}</Badge> : <Badge tone="warn" dot>بانتظار مراجعة المعلّم</Badge>}
            </div>
            {e.final?.note && <Notice tone="success">{e.final.note}</Notice>}
          </Card>
        );
      })}

      {!hideReview && answeredQs.length > 0 && (
        <Card title="مراجعة الإجابات" kicker="تفسير لكل سؤال">
          <div className="stack">
            {answeredQs.map((q, i) => (
              <div className="review-q" key={q.id}>
                <div className="row spread"><span className="small muted">السؤال <b className="num">{i + 1}</b></span>
                  {attempt.items[q.id].got >= 1 ? <Badge tone="success" icon={Check}>صحيحة</Badge> : attempt.items[q.id].got > 0 ? <Badge tone="warn">جزئية</Badge> : <Badge tone="danger" icon={XCircle}>خاطئة</Badge>}
                </div>
                {attempt.items[q.id].answer !== null ? (
                  <QuestionView q={q} value={attempt.items[q.id].answer} result={{ got: attempt.items[q.id].got }} />
                ) : (
                  <p className="muted small">{q.text} — التفصيل غير محفوظ لهذه المحاولة. الإجابة الصحيحة: <b>{correctText(q)}</b></p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="row">
        {actions}
        {onRetry && <Btn variant="ghost" icon={BookOpen} onClick={onRetry}>أعد المحاولة</Btn>}
      </div>
    </div>
  );
}
