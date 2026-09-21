import { useMemo, useState } from "react";
import { Check, ChevronLeft, ClipboardCheck, Clock3, Lock, PlayCircle, ShieldCheck, Shuffle, Trophy, Repeat } from "lucide-react";
import { Btn, Badge, Card, Empty, Notice, Page, Progress, Tabs } from "../../ui/Primitives";
import { HBars } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { subjects } from "../../data/curriculum";
import { allObjectives, lessonOf, lessonStateFor, unitOf, unitProgress, unitsInSubject, studentOf, subjectOf, lessonsInUnit } from "../../store/selectors";
import { buildUnitExam } from "../../lib/grading";
import { fmtDate } from "../../lib/format";
import { QuizRunner, ResultView, buildAttempt } from "./Assess";
import LessonPage from "./Lesson";

export default function LearnPage({ param, go }) {
  if (param?.startsWith("lesson/")) return <LessonPage lessonId={param.split("/")[1]} go={go} />;
  if (param?.startsWith("exam/")) return <ExamPage unitId={param.split("/")[1]} go={go} />;
  return <Path go={go} />;
}

// ───── المسار الدراسي: شجرة المنهج كمسار مرتّب (F1.1) ─────
function Path({ go }) {
  const { state, user } = useStore();
  const stu = studentOf(state, user.id);
  const mine = subjects.filter((s) => s.grade === stu.grade);
  const [sid, setSid] = useState(mine[0]?.id);
  const subject = subjectOf(sid);
  const units = unitsInSubject(state, sid);
  return (
    <Page kicker={`المرحلة المتوسطة ← ${stu.grade}`} title="مساري الدراسي" desc="دروس كل مادة مرتّبة كمسار: اشرح، لخّص، ثم اختبر بعد كل درس، وأنهِ الوحدة بامتحان شامل." icon={PlayCircle}>
      <Tabs value={sid} onChange={setSid} tabs={mine.map((s) => ({ id: s.id, label: s.name }))} />
      <div className="stack">
        {units.length === 0 && <Empty title="لا توجد وحدات منشورة لهذه المادة بعد" />}
        {units.map((u) => {
          const up = unitProgress(state, user.id, u);
          return (
            <Card key={u.id} className="unit-card" flush>
              <div className="unit-head">
                <div>
                  <span className={`subj-tag tone-${subject.tone}`}>{subject.glyph} الوحدة {u.no}</span>
                  <h3>{u.title}</h3>
                  <span className="muted small">{up.done} من {up.total} دروس مكتملة</span>
                </div>
                <div className="unit-pct"><b className="num">{up.pct}%</b><Progress value={up.pct} tone="gold" size="lg" label={`تقدم وحدة ${u.title}`} /></div>
              </div>
              <ol className="path">
                {lessonsInUnit(state, u.id).map((l) => {
                  const st = lessonStateFor(state, user.id, l);
                  const isCurrent = up.currentId === l.id;
                  const status = !st.published ? "draft" : st.done ? "done" : isCurrent ? "current" : "open";
                  return (
                    <li key={l.id} className={`path-item ${status}`}>
                      <span className="path-node">{status === "done" ? <Check size={16} /> : status === "draft" ? <Lock size={14} /> : <b className="num">{l.no}</b>}</span>
                      <button className="path-body" disabled={!st.published} onClick={() => go("learn", `lesson/${l.id}`)}>
                        <strong>{l.title}</strong>
                        <span>{l.duration} دقيقة{st.done ? ` • نتيجة الاختبار ${st.score}%` : ""}</span>
                        {st.published && !st.quizReady && !st.done && <Badge tone="warn" dot>الاختبار بانتظار اعتماد المعلّم</Badge>}
                      </button>
                      <div className="path-end">
                        {status === "current" && <Btn size="sm" variant="gold" onClick={() => go("learn", `lesson/${l.id}`)}>ابدأ الآن</Btn>}
                        {status === "done" && <Badge tone="success">مكتمل</Badge>}
                        {status === "open" && <Btn size="sm" variant="ghost" onClick={() => go("learn", `lesson/${l.id}`)}>فتح</Btn>}
                        {status === "draft" && <Badge>غير منشور</Badge>}
                      </div>
                    </li>
                  );
                })}
                <li className={`path-item exam ${up.lock ? "locked" : "ready"}`}>
                  <span className="path-node">{up.lock ? <Lock size={14} /> : <Trophy size={16} />}</span>
                  <div className="path-body static">
                    <strong>امتحان الوحدة</strong>
                    <span>{up.lock || `متاح الآن • ${up.bp.count} أسئلة${up.bp.essayIds?.length ? " + مقالي" : ""} • ${up.bp.durationMin} دقيقة • محاولات متبقية ${up.bp.attempts - up.attempts.length}`}</span>
                  </div>
                  <div className="path-end">{up.attempts.length > 0 && <Badge tone="gold">آخر نتيجة {up.attempts[up.attempts.length - 1].score}%</Badge>}
                    <Btn size="sm" variant={up.lock ? "soft" : "primary"} disabled={!!up.lock} onClick={() => go("learn", `exam/${u.id}`)}>{up.lock ? "مغلق" : "ابدأ الامتحان"}</Btn>
                  </div>
                </li>
              </ol>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}

// ───── امتحان الوحدة: مخطّط موزون + مؤقّت + خلط + حدّ محاولات (F2.2 / F2.8) ─────
function ExamPage({ unitId, go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const unit = unitOf(state, unitId);
  const [phase, setPhase] = useState("intro");
  const [attempt, setAttempt] = useState(null);
  const up = unit ? unitProgress(state, user.id, unit) : null;
  const seed = `${user.id}:${unitId}:${up?.attempts.length}`;
  const questions = useMemo(() => (phase === "running" && up?.bp ? buildUnitExam({ blueprint: up.bp, questions: state.questions, seed }) : []), [phase]); // eslint-disable-line react-hooks/exhaustive-deps
  const objMap = Object.fromEntries(allObjectives(state).map((o) => [o.id, o]));

  if (!unit) return <div className="page"><Empty title="الوحدة غير موجودة" /></div>;

  if (phase === "running")
    return (
      <div className="page">
        <QuizRunner title={`امتحان وحدة «${unit.title}»`} kicker="امتحان الوحدة" questions={questions} durationSec={up.bp.durationMin * 60} onExit={() => { if (window.confirm("الخروج يُحتسب محاولة ولا تُحفظ إجاباتك. هل تريد الخروج؟")) setPhase("intro"); }}
          onSubmit={(answers, secs, auto) => {
            const at = buildAttempt({ studentId: user.id, kind: "unit", refId: unitId, questions, answers, durationSec: secs });
            dispatch({ type: "submitAttempt", attempt: at });
            setAttempt(at);
            setPhase("result");
            toast(auto ? "انتهى الوقت — سُلِّم امتحانك تلقائيًّا" : `سُلِّم الامتحان — نتيجتك الموضوعية ${at.score}%`, auto ? "warn" : "success");
          }} />
      </div>
    );

  if (phase === "result" && attempt) {
    // النتيجة مفصّلة حسب الدرس/الهدف
    const byLesson = {};
    questions.filter((q) => q.type !== "essay").forEach((q) => {
      const l = lessonOf(state, q.lessonId);
      const b = (byLesson[l.id] ||= { label: l.title, got: 0, total: 0 });
      b.got += attempt.items[q.id]?.got || 0;
      b.total += 1;
    });
    return (
      <Page kicker="نتيجة الامتحان" title={unit.title} desc="نتيجتك مفصّلة حسب الدروس والأهداف.">
        <div className="stack">
          <Card title="النتيجة حسب الدرس" kicker="توزيع الأداء">
            <HBars data={Object.values(byLesson).map((b) => ({ label: b.label, value: Math.round((b.got / b.total) * 100), sub: `${Math.round(b.got * 10) / 10} من ${b.total}` }))} />
          </Card>
          <ResultView attempt={attempt} questions={questions} title={`امتحان ${unit.title}`} objectives={objMap}
            actions={<Btn variant="primary" onClick={() => go("progress")}>تقدّمي وخطتي</Btn>} />
        </div>
      </Page>
    );
  }

  const lessonWeights = up.bp ? Object.entries(up.bp.weights) : [];
  return (
    <Page kicker="امتحان الوحدة" title={unit.title} desc="امتحان شامل يغطّي دروس الوحدة بأوزان عادلة، ويُصحَّح فورًا." icon={Trophy}
      actions={<Btn variant="ghost" onClick={() => go("learn")}>العودة للمسار</Btn>}>
      {up.lock ? (
        <Empty icon={Lock} title="امتحان الوحدة غير متاح" desc={up.lock} action={<Btn variant="primary" onClick={() => go("learn")}>العودة للمسار</Btn>} />
      ) : (
        <div className="split">
          <div className="stack">
            <Card title="مخطّط الامتحان (Blueprint)" kicker="كيف بُني الامتحان؟">
              <p className="muted small">حلّل المحرّك دروس الوحدة وأهدافها، ووزّع الأسئلة عليها بحسب الأوزان التالية:</p>
              <div className="mt"><HBars data={lessonWeights.map(([id, w]) => ({ label: lessonOf(state, id)?.title, value: w, tone: "gold" }))} /></div>
            </Card>
            <Notice tone="gold" icon={ShieldCheck} title="نزاهة الامتحان">
              يختلف ترتيب الأسئلة وخيارات الإجابة من طالب لآخر، ويعمل مؤقّت تلقائي، وتُسجَّل كل المحاولات للمراجعة.
            </Notice>
          </div>
          <Card title="جاهز للبدء؟" kicker="تفاصيل الامتحان">
            <div className="facts">
              <div><ClipboardCheck size={18} /><span>عدد الأسئلة</span><b className="num">{up.bp.count}{up.bp.essayIds?.length ? ` + ${up.bp.essayIds.length} مقالي` : ""}</b></div>
              <div><Clock3 size={18} /><span>المدة</span><b className="num">{up.bp.durationMin} دقيقة</b></div>
              <div><Repeat size={18} /><span>المحاولات المتبقية</span><b className="num">{up.bp.attempts - up.attempts.length} من {up.bp.attempts}</b></div>
              <div><Shuffle size={18} /><span>ترتيب الأسئلة</span><b>مخلوط لكل طالب</b></div>
            </div>
            {up.attempts.length > 0 && (
              <div className="mt-sm small muted">محاولاتك السابقة: {up.attempts.map((a) => `${a.score}% (${fmtDate(a.at)})`).join("، ")}</div>
            )}
            <Btn variant="gold" size="lg" className="btn-block mt" icon={PlayCircle} onClick={() => setPhase("running")}>ابدأ الامتحان الآن</Btn>
          </Card>
        </div>
      )}
    </Page>
  );
}
