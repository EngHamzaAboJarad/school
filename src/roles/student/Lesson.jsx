import { useMemo, useRef, useState } from "react";
import { BookOpen, Bot, ClipboardCheck, Download, Layers, Lightbulb, Play, Pause, RotateCw, Send, Sparkles, Star, Bookmark, BookmarkCheck, Printer, User, ChevronLeft, CircleHelp, ShieldCheck, Lock, Check } from "lucide-react";
import { Btn, Badge, Card, Empty, Notice, Segmented, Tabs, Progress, Input, cx } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { lessonOf, unitOf, subjectOf, isApproved, lessonQuizQuestions, lessonsInUnit, unitProgress, objectiveOf, allObjectives } from "../../store/selectors";
import { shuffle } from "../../lib/rng";
import { shuffleOptions } from "../../lib/grading";
import { answerFromLesson } from "../../lib/assistant";
import { downloadText, printPage } from "../../lib/export";
import { QuizRunner, ResultView, buildAttempt } from "./Assess";

const LEVELS = [["simple", "مبسّط"], ["medium", "متوسّط"], ["deep", "متعمّق"]];

export default function LessonPage({ lessonId, go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const lesson = lessonOf(state, lessonId);
  const [tab, setTab] = useState("explain");
  if (!lesson) return <div className="page"><Empty title="الدرس غير موجود" action={<Btn variant="primary" onClick={() => go("learn")}>العودة للمسار</Btn>} /></div>;
  const unit = unitOf(state, lesson.unitId);
  const subject = subjectOf(unit.subjectId);
  const ls = state.lessonState[lesson.id] || {};
  const done = state.progress[user.id]?.[lesson.id];
  const quizOk = isApproved(state, "quiz", lesson.id);
  const summaryOk = isApproved(state, "summary", lesson.id);
  const objs = allObjectives(state).filter((o) => o.lessonId === lesson.id);

  if ((ls.status || "published") !== "published")
    return <div className="page"><Empty title="هذا الدرس غير منشور بعد" desc="يظهر الدرس بعد اعتماد المعلّم." action={<Btn variant="primary" onClick={() => go("learn")}>العودة للمسار</Btn>} /></div>;

  return (
    <div className="page">
      <nav className="crumb-trail" aria-label="مسار الدرس">
        <button onClick={() => go("learn")}>مساري الدراسي</button><ChevronLeft size={14} />
        <span>{subject.name}</span><ChevronLeft size={14} />
        <span>الوحدة {unit.no}: {unit.title}</span>
      </nav>
      <header className="lesson-hero">
        <div className="lesson-hero-copy">
          <span className={`subj-tag tone-${subject.tone}`}>{subject.glyph} {subject.name}</span>
          <h1>{lesson.title}</h1>
          <div className="row">
            <Badge tone="dark">الدرس {lesson.no}</Badge>
            <Badge tone="dark">{lesson.duration} دقيقة</Badge>
            {done ? <Badge tone="gold" icon={Check}>أنجزته — {done.score}%</Badge> : quizOk ? <Badge tone="emerald">الاختبار متاح</Badge> : <Badge tone="warn" dot>الاختبار بانتظار اعتماد المعلّم</Badge>}
          </div>
        </div>
        <div className="lesson-objectives">
          <span>أهداف التعلّم</span>
          {objs.map((o) => <div key={o.id}><Star size={14} /> {o.title}</div>)}
        </div>
      </header>

      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "explain", label: "الشرح", icon: BookOpen },
        { id: "summary", label: "الملخص", icon: Layers },
        { id: "ask", label: "اسأل عن الدرس", icon: Bot },
        { id: "cards", label: "بطاقات وخريطة", icon: Lightbulb },
        { id: "quiz", label: "اختبار الدرس", icon: ClipboardCheck },
      ]} />

      {tab === "explain" && <ExplainTab lesson={lesson} enabled={ls.explainEnabled !== false} />}
      {tab === "summary" && <SummaryTab lesson={lesson} approved={summaryOk} />}
      {tab === "ask" && <AskTab lesson={lesson} />}
      {tab === "cards" && <CardsTab lesson={lesson} />}
      {tab === "quiz" && <QuizTab lesson={lesson} unit={unit} go={go} onExplain={() => setTab("explain")} />}
    </div>
  );
}

// ───── الشرح التفاعلي بثلاثة مستويات (F1.3) + الوسائط (F1.7) ─────
function ExplainTab({ lesson, enabled }) {
  const toast = useToast();
  const [level, setLevel] = useState("medium");
  const [exampleIdx, setExampleIdx] = useState(-1);
  if (!enabled)
    return <Notice tone="warn" icon={ShieldCheck} title="الشرح الذكي معطَّل لهذا الدرس">عطّل المعلّم الشرح الآلي لهذا الدرس مؤقتًا. يمكنك الاطلاع على الملخص أو طرح سؤالك على معلّمك.</Notice>;
  const sections = level === "simple" ? lesson.explain.base : level === "medium" ? [...lesson.explain.base, ...lesson.explain.medium] : [...lesson.explain.base, ...lesson.explain.medium, ...lesson.explain.deep];
  const ex = exampleIdx >= 0 ? lesson.examples[exampleIdx % lesson.examples.length] : null;
  return (
    <div className="split">
      <div className="stack">
        <Card>
          <div className="row spread">
            <div className="row"><span className="bot-badge"><Bot size={18} /></span><div><strong>المُعلّم الذكي</strong><br /><span className="small muted">شرح مبنيّ على محتوى الدرس ومعتمد من معلّمك</span></div></div>
            <Segmented options={LEVELS.map(([id, label]) => ({ id, label }))} value={level} onChange={setLevel} />
          </div>
          <div className="divider" />
          <div className="explain-body">
            {sections.map((s, i) => (
              <section key={s.h} className="ex-section" style={{ animationDelay: `${i * 60}ms` }}>
                <h4><span className="num">{i + 1}</span>{s.h}</h4>
                <p>{s.p}</p>
              </section>
            ))}
          </div>
          <div className="row mt">
            {level !== "simple" && <Btn icon={Sparkles} onClick={() => { setLevel("simple"); toast("عُرض الشرح بمستوى أبسط"); }}>لم أفهم — اشرحه أبسط</Btn>}
            {lesson.examples.length > 0 && <Btn variant="ghost" icon={Lightbulb} onClick={() => setExampleIdx(exampleIdx + 1)}>مثال إضافي</Btn>}
          </div>
          {ex && <Notice tone="gold" icon={Lightbulb} title={ex.title}>{ex.body}</Notice>}
        </Card>
      </div>
      <div className="stack">
        <MediaPlayer media={lesson.media} />
        <Card title="نصيحة" kicker="قبل أن تنتقل">
          <p className="muted">بعد أن تفهم الفكرة، جرّب «اسأل عن الدرس» ثم ابدأ اختبار الدرس القصير لتتأكد من فهمك.</p>
        </Card>
      </div>
    </div>
  );
}

function MediaPlayer({ media }) {
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const timer = useRef(null);
  if (!media) return null;
  const toggle = () => {
    if (playing) { clearInterval(timer.current); setPlaying(false); return; }
    setPlaying(true);
    timer.current = setInterval(() => setPos((p) => { if (p >= 100) { clearInterval(timer.current); setPlaying(false); return 0; } return p + 2; }), 400);
  };
  return (
    <div className="media">
      <div className="media-stage" onClick={toggle} role="button" tabIndex={0} aria-label={playing ? "إيقاف" : "تشغيل"} onKeyDown={(e) => e.key === "Enter" && toggle()}>
        <span className="media-play">{playing ? <Pause size={26} /> : <Play size={26} />}</span>
        <span className="media-len num">{media.length}</span>
      </div>
      <div className="media-bar"><Progress value={pos} tone="gold" size="sm" label="تقدّم الفيديو" /><strong>{media.title}</strong><small className="muted">وسائط الدرس — تعمل على الويب والجوال</small></div>
    </div>
  );
}

// ───── الملخص الذكي (F1.4) ─────
function SummaryTab({ lesson, approved }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const saved = state.saved[user.id]?.summaries.includes(lesson.id);
  const unitLessons = lessonsInUnit(state, lesson.unitId).filter((l) => isApproved(state, "summary", l.id));
  const [scope, setScope] = useState("lesson");
  if (!approved)
    return <Empty icon={Lock} title="الملخص بانتظار اعتماد معلّمك" desc="لا يصل المحتوى المولَّد إليك قبل مراجعة المعلّم واعتماده، لضمان دقّته." />;
  const list = scope === "lesson" ? [lesson] : unitLessons;
  const text = list.map((l) => `${l.title}\n${l.summary.points.map((p) => `• ${p}`).join("\n")}\n${l.summary.terms.map(([t, d]) => `- ${t}: ${d}`).join("\n")}`).join("\n\n");
  return (
    <div className="stack">
      <div className="row spread">
        <Segmented options={[{ id: "lesson", label: "ملخص الدرس" }, { id: "unit", label: "ملخص الوحدة" }]} value={scope} onChange={setScope} />
        <div className="row no-print">
          <Btn variant={saved ? "primary" : "soft"} icon={saved ? BookmarkCheck : Bookmark} onClick={() => { dispatch({ type: "toggleSummary", sid: user.id, lessonId: lesson.id }); toast(saved ? "أُزيل من مراجعاتي" : "حُفظ في مراجعاتي"); }}>{saved ? "محفوظ في مراجعاتي" : "احفظ في مراجعاتي"}</Btn>
          <Btn variant="ghost" icon={Download} onClick={() => downloadText(`ملخص-${lesson.title}.txt`, text)}>تنزيل</Btn>
          <Btn variant="ghost" icon={Printer} onClick={printPage}>طباعة</Btn>
        </div>
      </div>
      {list.map((l) => (
        <div className="grid grid-2" key={l.id}>
          <Card title={scope === "unit" ? l.title : "النقاط الرئيسية"} kicker="ملخص مركّز">
            <ol className="points">{l.summary.points.map((p) => <li key={p}>{p}</li>)}</ol>
          </Card>
          <Card title="المصطلحات والمفاهيم" kicker="قاموس الدرس">
            <div className="stack-sm">{l.summary.terms.map(([t, d]) => <div className="term" key={t}><strong>{t}</strong><span>{d}</span></div>)}</div>
          </Card>
        </div>
      ))}
    </div>
  );
}

// ───── المساعد الذكي المقيَّد بسياق الدرس (F1.5) ─────
function AskTab({ lesson }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [thread, setThread] = useState([{ role: "bot", text: `أهلًا! اسألني عن درس «${lesson.title}». أجيب من محتوى الدرس فقط وأذكر لك المصدر.` }]);
  const end = useRef(null);
  const frequent = state.asked.filter((a) => a.lessonId === lesson.id).reduce((m, a) => ({ ...m, [a.q]: (m[a.q] || 0) + 1 }), {});
  const suggestions = [...lesson.cards.map((c) => c[0]), ...Object.keys(frequent)].filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);

  const ask = (text) => {
    const question = text.trim();
    if (!question) return;
    const r = answerFromLesson(lesson, question);
    dispatch({ type: "askLog", studentId: user.id, lessonId: lesson.id, q: question, answered: r.answered });
    setThread((t) => [...t, { role: "me", text: question }, { role: "bot", ...r, question }]);
    setQ("");
    setTimeout(() => { const box = end.current?.parentElement; if (box) box.scrollTop = box.scrollHeight; }, 50);
  };

  return (
    <div className="split">
      <Card className="chat-card">
        <div className="chat" aria-live="polite">
          {thread.map((m, i) => (
            <div key={i} className={cx("bubble", m.role)}>
              <span className="bubble-avatar">{m.role === "bot" ? <Bot size={16} /> : <User size={16} />}</span>
              <div>
                <p>{m.text}</p>
                {m.ref && <small className="src"><BookOpen size={12} /> المصدر: {m.ref}</small>}
                {m.role === "bot" && m.question && (
                  <button className="btn-link small" onClick={() => { dispatch({ type: "escalate", studentId: user.id, lessonId: lesson.id, q: m.question }); toast("حُوِّل سؤالك إلى معلّمك"); }}>حوّل السؤال إلى المعلّم</button>
                )}
              </div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="اكتب سؤالك عن الدرس…" aria-label="سؤالك" />
          <Btn type="submit" variant="primary" icon={Send} disabled={!q.trim()}>إرسال</Btn>
        </form>
      </Card>
      <div className="stack">
        <Card title="أسئلة مقترحة" kicker="ابدأ من هنا">
          <div className="stack-sm">
            {suggestions.map((s) => <button key={s} className="suggest" onClick={() => ask(s)}><CircleHelp size={16} /> {s}</button>)}
          </div>
        </Card>
        <Notice tone="info" icon={ShieldCheck} title="حدود المساعد">يجيب من محتوى الدرس فقط، ويعتذر عن الأسئلة خارج النطاق التعليمي. تُسجَّل الأسئلة الشائعة ليحسّن معلّمك الشرح.</Notice>
      </div>
    </div>
  );
}

// ───── البطاقات والخريطة الذهنية (F1.6) ─────
export function Flashcards({ lesson }) {
  const { state, dispatch, user } = useStore();
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const cards = lesson.cards;
  const rated = state.saved[user.id]?.cards || {};
  const known = cards.filter((_, k) => rated[`${lesson.id}:${k}`] === "known").length;
  const rate = (level) => {
    dispatch({ type: "rateCard", sid: user.id, key: `${lesson.id}:${i}`, level });
    setFlip(false);
    setI((i + 1) % cards.length);
  };
  if (!cards.length) return <Empty title="لا توجد بطاقات لهذا الدرس بعد" />;
  const c = cards[i];
  const lvl = rated[`${lesson.id}:${i}`];
  return (
    <div className="stack">
      <div className="row spread"><span className="small muted">البطاقة <b className="num">{i + 1}</b> من <b className="num">{cards.length}</b></span><Badge tone="emerald">أتقنت <span className="num">{known}</span> من <span className="num">{cards.length}</span></Badge></div>
      <button className={cx("flash", flip && "flipped", lvl)} onClick={() => setFlip(!flip)} aria-label="اقلب البطاقة">
        <span className="flash-face front"><small>سؤال</small><b>{c[0]}</b><em>اضغط لقلب البطاقة</em></span>
        <span className="flash-face back"><small>الإجابة</small><b>{c[1]}</b></span>
      </button>
      <div className="row center-row">
        <Btn variant="danger" icon={RotateCw} onClick={() => rate("again")}>أحتاج مراجعة</Btn>
        <Btn variant="primary" icon={Check} onClick={() => rate("known")}>أعرفها</Btn>
      </div>
    </div>
  );
}

function MindMap({ lesson }) {
  const nodes = [
    ...lesson.summary.terms.map(([t]) => t),
    ...lesson.summary.points.slice(0, 4).map((p) => p.split(" ").slice(0, 3).join(" ") + "…"),
  ].slice(0, 6);
  const W = 640, H = 340, cx0 = W / 2, cy0 = H / 2;
  return (
    <svg className="mindmap" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`خريطة ذهنية لدرس ${lesson.title}`}>
      {nodes.map((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx0 + Math.cos(a) * 235, y = cy0 + Math.sin(a) * 118;
        return (
          <g key={i}>
            <path d={`M${cx0},${cy0} Q${(cx0 + x) / 2},${(cy0 + y) / 2 - 18} ${x},${y}`} className="mm-link" fill="none" />
            <rect x={x - 76} y={y - 19} width="152" height="38" rx="19" className="mm-node" />
            <text x={x} y={y + 5} textAnchor="middle" className="mm-text">{n}</text>
          </g>
        );
      })}
      <rect x={cx0 - 92} y={cy0 - 28} width="184" height="56" rx="28" className="mm-center" />
      <text x={cx0} y={cy0 + 6} textAnchor="middle" className="mm-center-text">{lesson.title.length > 22 ? lesson.title.slice(0, 22) + "…" : lesson.title}</text>
    </svg>
  );
}

function CardsTab({ lesson }) {
  const [mode, setMode] = useState("cards");
  return (
    <div className="stack">
      <Segmented options={[{ id: "cards", label: "بطاقات المراجعة" }, { id: "map", label: "الخريطة الذهنية" }]} value={mode} onChange={setMode} />
      <Card>{mode === "cards" ? <Flashcards lesson={lesson} /> : <MindMap lesson={lesson} />}</Card>
    </div>
  );
}

// ───── اختبار بعد كل درس (F2.1) ─────
function QuizTab({ lesson, unit, go, onExplain }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [phase, setPhase] = useState("intro");
  const [attempt, setAttempt] = useState(null);
  const approved = isApproved(state, "quiz", lesson.id);
  const pool = lessonQuizQuestions(state, lesson.id);
  const tries = state.attempts.filter((a) => a.studentId === user.id && a.kind === "lesson" && a.refId === lesson.id);
  const questions = useMemo(
    () => shuffle(pool, `${user.id}:${lesson.id}:${tries.length}`).slice(0, 6).map((q) => (q.type === "mcq" ? shuffleOptions(q, `${user.id}:${tries.length}`) : q)),
    [pool.length, tries.length], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const last = tries[tries.length - 1];
  const objMap = Object.fromEntries(allObjectives(state).map((o) => [o.id, o]));
  const nextLesson = lessonsInUnit(state, unit.id).find((l) => l.no > lesson.no);
  const up = unitProgress(state, user.id, unit);

  if (!approved || pool.length === 0)
    return <Empty icon={Lock} title="اختبار هذا الدرس بانتظار اعتماد المعلّم" desc="ولّد المحرّك الأسئلة من محتوى الدرس، وسيصلك الاختبار فور مراجعة معلّمك له واعتماده." action={<Btn variant="ghost" onClick={onExplain}>ارجع إلى الشرح</Btn>} />;

  if (phase === "running")
    return (
      <QuizRunner title={`اختبار «${lesson.title}»`} kicker="اختبار الدرس" questions={questions} onExit={() => setPhase("intro")}
        onSubmit={(answers, secs) => {
          const at = buildAttempt({ studentId: user.id, kind: "lesson", refId: lesson.id, questions, answers, durationSec: secs });
          dispatch({ type: "submitAttempt", attempt: at });
          setAttempt(at);
          setPhase("result");
          toast(`نتيجتك ${at.score}% — حُفظت في سجلّ إنجازك`);
        }} />
    );

  if (phase === "result" && attempt)
    return (
      <ResultView attempt={attempt} questions={questions} title={lesson.title} objectives={objMap} onRetry={() => setPhase("intro")} onReviewLesson={onExplain}
        actions={<>
          {nextLesson ? <Btn variant="gold" iconEnd={ChevronLeft} onClick={() => go("learn", `lesson/${nextLesson.id}`)}>الدرس التالي: {nextLesson.title}</Btn>
            : !up.lock ? <Btn variant="gold" iconEnd={ChevronLeft} onClick={() => go("learn", `exam/${unit.id}`)}>ابدأ امتحان الوحدة</Btn> : null}
          <Btn variant="primary" onClick={() => go("progress")}>تقدّمي وخطتي</Btn>
        </>} />
    );

  return (
    <div className="split">
      <Card title="جاهز لاختبار قصير؟" kicker="بعد كل درس">
        <p className="muted">اختبار من <b className="num">{questions.length}</b> أسئلة مولَّدة من محتوى الدرس ومربوطة بأهداف تعلّمه، ومعتمدة من معلّمك. تظهر نتيجتك فورًا مع تفسير كل إجابة.</p>
        <div className="chips mt-sm"><span className="chip">اختيار من متعدد</span><span className="chip">صح / خطأ</span><span className="chip">إكمال</span><span className="chip">مطابقة</span></div>
        <div className="row mt"><Btn variant="gold" size="lg" icon={ClipboardCheck} onClick={() => setPhase("running")}>{last ? "أعد الاختبار" : "ابدأ الاختبار"}</Btn></div>
      </Card>
      <Card title="آخر نتيجة" kicker="سجلّ المحاولات">
        {last ? (
          <div className="stack-sm">
            <div className="row spread"><strong className="big-num num">{last.score}%</strong><Badge tone={last.score >= 70 ? "success" : "warn"}>{last.score >= 70 ? "اجتزت" : "تحتاج مراجعة"}</Badge></div>
            <Progress value={last.score} tone={last.score >= 70 ? "emerald" : "gold"} />
            <small className="muted">عدد المحاولات: <b className="num">{tries.length}</b></small>
          </div>
        ) : <p className="muted">لم تخض هذا الاختبار بعد.</p>}
      </Card>
    </div>
  );
}
