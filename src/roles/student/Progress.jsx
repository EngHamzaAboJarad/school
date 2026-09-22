import { useMemo, useState } from "react";
import { BarChart3, Check, CheckCircle2, ClipboardCheck, FileClock, Lock, Map as MapIcon, PlayCircle, Target, TrendingUp, BookOpen, Dumbbell, RefreshCw } from "lucide-react";
import { Btn, Badge, Card, Empty, ListRow, Modal, Notice, Page, Progress, Stat, Tabs, Split, cx } from "../../ui/Primitives";
import { HBars, LineChart, Ring, masteryTone } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { snapshot, remedialProgress, recommendation, subjectOf, lessonOf, unitOf, studentOf, allObjectives, objectiveOf, classStats } from "../../store/selectors";
import { subjects } from "../../data/curriculum";
import { shuffle } from "../../lib/rng";
import { shuffleOptions, CLOSE_THRESHOLD, GAP_THRESHOLD } from "../../lib/grading";
import { fmtDate, levelLabel, timeAgo } from "../../lib/format";
import { QuizRunner, ResultView, buildAttempt } from "./Assess";

// تقدّمي وخطتي: F3.1 تشخيص الفجوات • F3.2 الخطط العلاجية • F3.4 تتبّع الإتقان • F4.3 سجلّ الإنجاز
export default function ProgressPage({ param, go }) {
  const [tab, setTab] = useState(["overview", "map", "plan", "log"].includes(param) ? param : "overview");
  const { state, user } = useStore();
  const snap = snapshot(state, user.id);
  return (
    <Page kicker="تشخيص وتتبّع" title="تقدّمي وخطتي" desc="صورة واحدة لتقدّمك وفجواتك وخطّتك العلاجية وسجلّ إنجازك." icon={TrendingUp}>
      <Tabs value={tab} onChange={setTab} tabs={[
        { id: "overview", label: "نظرة عامة", icon: BarChart3 },
        { id: "map", label: "خريطة الإتقان", icon: MapIcon },
        { id: "plan", label: "خطتي العلاجية", icon: Target, count: snap.gaps.length },
        { id: "log", label: "سجلّ الإنجاز", icon: FileClock },
      ]} />
      {tab === "overview" && <Overview snap={snap} go={go} setTab={setTab} />}
      {tab === "map" && <MasteryMap snap={snap} />}
      {tab === "plan" && <Plan snap={snap} go={go} />}
      {tab === "log" && <Log />}
    </Page>
  );
}

function Overview({ snap, go, setTab }) {
  const { state, user } = useStore();
  const rec = recommendation(state, user.id);
  const labels = snap.history.map((_, i) => (i === snap.history.length - 1 ? "الآن" : `-${snap.history.length - 1 - i}`));
  const subs = subjects.filter((s) => snap.subjectAvg[s.id] !== undefined);
  return (
    <div className="stack">
      <div className="grid grid-3">
        <Card><div className="row"><Ring value={snap.avg} size={112} stroke={10} label="الإتقان العام" sub="إتقان عام" /><div><strong>{levelLabel(snap.avg)}</strong><p className="muted small">{snap.mastered} أهداف متقنة من {snap.entries.length} مُقيَّمة</p></div></div></Card>
        <Stat label="فجوات مفتوحة" value={snap.gaps.length} icon={Target} tone="rose" foot="مرتّبة بحسب الأولوية" />
        <Stat label="أهداف متقنة" value={snap.mastered} icon={CheckCircle2} foot={`الحدّ ${CLOSE_THRESHOLD}% فأكثر`} />
      </div>
      <Split>
        <Card title="تقدّمي عبر الأسابيع" kicker="مقارنة بالهدف المرجعي">
          <LineChart values={snap.history} labels={labels} target={CLOSE_THRESHOLD} min={40} max={100} />
        </Card>
        <div className="stack">
          <Card title="الإتقان حسب المادة" kicker="متوسط الأهداف">
            <HBars data={subs.map((s) => ({ label: s.name, value: snap.subjectAvg[s.id] }))} />
          </Card>
          <Card tone="gold" title={rec.title} kicker="ما التالي؟">
            <p className="muted small">{rec.why}</p>
            <Btn className="mt-sm" variant="primary" onClick={() => (rec.type === "remedial" ? setTab("plan") : rec.type === "lesson" ? go("learn", `lesson/${rec.lesson.id}`) : go("learn"))}>انتقل الآن</Btn>
          </Card>
        </div>
      </Split>
    </div>
  );
}

// خريطة الإتقان: لكل هدف مستوى الطالب مقابل متوسط الفصل والهدف المرجعي
function MasteryMap({ snap }) {
  const { state, user } = useStore();
  const stu = studentOf(state, user.id);
  const cls = state.classes.find((c) => c.id === stu.classId);
  const mine = subjects.filter((s) => s.grade === stu.grade);
  const classAvg = (oid) => {
    const vals = cls.studentIds.map((sid) => state.mastery[sid]?.[oid]).filter((v) => v !== undefined);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  };
  return (
    <div className="stack">
      {mine.map((s) => {
        const objs = allObjectives(state).filter((o) => o.subjectId === s.id);
        return (
          <Card key={s.id} title={s.name} kicker={`المتوسط ${snap.subjectAvg[s.id] ?? "—"}${snap.subjectAvg[s.id] != null ? "%" : ""}`}>
            <div className="mmap">
              {objs.map((o) => {
                const v = state.mastery[user.id]?.[o.id];
                const c = classAvg(o.id);
                return (
                  <div className="mmap-row" key={o.id}>
                    <div className="mmap-title"><strong>{o.title}</strong><span>{lessonOf(state, o.lessonId)?.title}</span></div>
                    <div className="mmap-bar">
                      <div className="progress"><i className={`fill-${masteryTone(v)}`} style={{ width: `${v ?? 0}%` }} /></div>
                      <span className="mmap-target" style={{ insetInlineStart: `${CLOSE_THRESHOLD}%` }} title={`الهدف ${CLOSE_THRESHOLD}%`} />
                      {c != null && <span className="mmap-class" style={{ insetInlineStart: `${c}%` }} title={`متوسط الفصل ${c}%`} />}
                    </div>
                    <div className="mmap-end">
                      {v == null ? <Badge>لم يُقيَّم</Badge> : <><b className="num">{v}%</b><Badge tone={v >= 85 ? "success" : v >= 70 ? "info" : v >= 55 ? "warn" : "danger"}>{levelLabel(v)}</Badge></>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
      <div className="legend"><span><i style={{ background: "var(--ok-500)" }} />الهدف المرجعي ({CLOSE_THRESHOLD}%)</span><span><i style={{ background: "var(--gold-500)" }} />متوسط الفصل</span></div>
    </div>
  );
}

// الخطة العلاجية: إعادة شرح ← تمارين ← إعادة اختبار، وتُغلق الفجوة عند بلوغ الإتقان (F3.2)
function Plan({ snap, go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [run, setRun] = useState(null); // {gap, kind}
  const [result, setResult] = useState(null);
  const closed = Object.entries(state.remedial[user.id] || {}).filter(([, p]) => p.closedAt);

  const pool = (oid) => state.questions.filter((q) => q.objective === oid && q.status === "approved" && q.type !== "essay");
  const start = (gap, kind) => {
    const qs = shuffle(pool(gap.id), `${user.id}:${gap.id}:${kind}:${Date.now() % 1000}`).slice(0, kind === "practice" ? 3 : 4).map((q) => (q.type === "mcq" ? shuffleOptions(q, `${user.id}:${kind}`) : q));
    if (!qs.length) return toast("لا توجد أسئلة معتمدة لهذا الهدف بعد", "warn");
    setRun({ gap, kind, qs });
    setResult(null);
  };

  const reexplain = (gap) => {
    dispatch({ type: "remedialStep", sid: user.id, objectiveId: gap.id, step: "reexplain" });
    go("learn", `lesson/${gap.lessonId}`);
  };

  return (
    <div className="stack">
      <Notice tone="gold" icon={Target} title="كيف تعمل الخطة؟">لكل فجوة ثلاث خطوات: أعد الشرح، تدرّب على تمارين قصيرة، ثم أعد الاختبار. تُغلق الفجوة تلقائيًّا عند وصول إتقانك إلى {CLOSE_THRESHOLD}%.</Notice>
      {snap.gaps.length === 0 && <Empty icon={CheckCircle2} title="لا توجد فجوات مفتوحة" desc="أحسنت! ستظهر هنا أي خطة علاجية جديدة عند اكتشاف فجوة." />}
      {snap.gaps.map((g) => {
        const plan = state.remedial[user.id]?.[g.id];
        const steps = plan?.steps || { reexplain: false, practice: false, retest: false };
        const done = remedialProgress(plan);
        return (
          <Card key={g.id} className="gap-card">
            <div className="row spread">
              <div><span className="kicker small">{subjectOf(g.subjectId)?.name} • أولوية {g.priority > 40 ? "عالية" : "متوسطة"}</span><h3>{g.title}</h3></div>
              <div className="row"><Ring value={g.mastery} size={64} stroke={7} label="الإتقان الحالي" /><div className="small muted">الهدف<br /><b className="num">{CLOSE_THRESHOLD}%</b></div></div>
            </div>
            <div className="steps">
              <Step n={1} icon={BookOpen} title="أعد الشرح" desc="راجع شرح الدرس بمستوى مبسّط" done={steps.reexplain} action={<Btn size="sm" variant={steps.reexplain ? "ghost" : "primary"} onClick={() => reexplain(g)}>{steps.reexplain ? "راجعه مجددًا" : "افتح الشرح"}</Btn>} />
              <Step n={2} icon={Dumbbell} title="تمارين قصيرة" desc="٣ أسئلة للتدرّب" done={steps.practice} locked={!steps.reexplain} action={<Btn size="sm" variant={steps.practice ? "ghost" : "primary"} disabled={!steps.reexplain} onClick={() => start(g, "practice")}>{steps.practice ? "تدرّب مجددًا" : "ابدأ التمارين"}</Btn>} />
              <Step n={3} icon={RefreshCw} title="إعادة الاختبار" desc="للتحقّق من التحسّن وإغلاق الفجوة" done={steps.retest} locked={!steps.practice} action={<Btn size="sm" variant="gold" disabled={!steps.practice} onClick={() => start(g, "retest")}>أعد الاختبار</Btn>} />
            </div>
            <div className="row spread"><Progress value={(done / 3) * 100} tone="gold" label="تقدّم الخطة" /><span className="small muted num">{done}/3</span></div>
          </Card>
        );
      })}
      {closed.length > 0 && (
        <Card title="فجوات أُغلقت" kicker="إنجازات">
          {closed.map(([oid, p]) => <ListRow key={oid} icon={CheckCircle2} tone="success" title={objectiveOf(state, oid)?.title} meta={`أُغلقت ${timeAgo(p.closedAt)}`} end={<Badge tone="success">{state.mastery[user.id]?.[oid]}%</Badge>} />)}
        </Card>
      )}

      <Modal open={!!run} wide onClose={() => setRun(null)} title={run?.kind === "practice" ? `تمارين: ${run?.gap.title}` : `إعادة اختبار: ${run?.gap.title}`} kicker={run?.kind === "practice" ? "تدرّب دون ضغط" : "يؤثر على إتقانك"}>
        {run && !result && (
          <QuizRunner title={run.gap.title} kicker={run.kind === "practice" ? "تمارين علاجية" : "إعادة اختبار"} questions={run.qs} onExit={() => setRun(null)}
            onSubmit={(answers, secs) => {
              const at = buildAttempt({ studentId: user.id, kind: run.kind === "retest" ? "retest" : "practice", refId: run.gap.id, questions: run.qs, answers, durationSec: secs });
              if (run.kind === "retest") dispatch({ type: "submitAttempt", attempt: at });
              else dispatch({ type: "remedialStep", sid: user.id, objectiveId: run.gap.id, step: "practice" });
              setResult(at);
              const m = at.score;
              toast(run.kind === "retest" ? (m >= CLOSE_THRESHOLD ? "أحسنت! اقتربت من إغلاق الفجوة" : "تحسّن — واصل التدرّب") : "أُنجزت التمارين");
            }} />
        )}
        {run && result && (
          <ResultView attempt={result} questions={run.qs} title={run.gap.title} objectives={{ [run.gap.id]: run.gap }} actions={<Btn variant="primary" onClick={() => { setRun(null); setResult(null); }}>إغلاق</Btn>} />
        )}
      </Modal>
    </div>
  );
}

function Step({ n, icon: Icon, title, desc, done, locked, action }) {
  return (
    <div className={cx("step", done && "done", locked && "locked")}>
      <span className="step-node">{done ? <Check size={16} /> : locked ? <Lock size={14} /> : <b className="num">{n}</b>}</span>
      <div><strong><Icon size={15} /> {title}</strong><span>{desc}</span></div>
      {action}
    </div>
  );
}

// سجلّ الإنجاز: كل المحاولات مع إمكانية إعادة فتح النتيجة
function Log() {
  const { state, user } = useStore();
  const [open, setOpen] = useState(null);
  const attempts = state.attempts.filter((a) => a.studentId === user.id).sort((a, b) => b.at - a.at);
  const objMap = Object.fromEntries(allObjectives(state).map((o) => [o.id, o]));
  const label = (a) => (a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : objMap[a.refId]?.title);
  const qs = (a) => a.questions || state.questions.filter((q) => a.items[q.id]);
  return (
    <Card title="سجلّ الإنجاز" kicker="كل اختباراتي" flush>
      <div className="pad">
        {attempts.length === 0 && <Empty title="لا محاولات بعد" />}
        {attempts.map((a) => (
          <ListRow key={a.id} icon={ClipboardCheck} tone={a.score >= 70 ? "success" : "warn"} title={label(a)}
            meta={`${a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "إعادة اختبار علاجي" : "اختبار درس"} • ${fmtDate(a.at)} • ${timeAgo(a.at)}`}
            end={<><b className="num">{a.score}%</b><Badge tone={a.score >= 85 ? "success" : a.score >= 70 ? "info" : "warn"}>{levelLabel(a.score)}</Badge></>} onClick={() => setOpen(a)} />
        ))}
      </div>
      <Modal open={!!open} wide onClose={() => setOpen(null)} title={open ? label(open) : ""} kicker="تفاصيل المحاولة">
        {open && <ResultView attempt={open} questions={qs(open)} title={label(open)} objectives={objMap} />}
      </Modal>
    </Card>
  );
}
