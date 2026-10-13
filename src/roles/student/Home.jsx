import { useState } from "react";
import { CheckCircle2, ClipboardCheck, Clock3, PlayCircle, Send, Target, TrendingUp } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Modal, Notice, Page, SectionHeader, Textarea } from "../../ui/Primitives";
import { FactLine, Seal, SubjectMark, VentRow } from "../../ui/World";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { assignmentStatus, assignmentsForStudent, lessonOf, recommendation, snapshot, studentOf, subjectOf, unitOf, userName, weekPlan } from "../../store/selectors";
import { MASTERY_KEY, SubjectMasteryWall, schoolDays, subjectMastery } from "../shared/walls";
import { dateKey } from "../../data/seed";
import { GAP_THRESHOLD } from "../../lib/grading";
import { fmtDate, fmtLongDate, relativeDay, timeAgo } from "../../lib/format";

const STATUS = {
  pending: ["warn", "مطلوب"], submitted: ["info", "سُلِّم"], late: ["danger", "سُلِّم متأخرًا"], graded: ["success", "صُحّح"], missing: ["danger", "لم يُسلَّم"],
};

// رئيسية الطالب: «ما الذي أفعله الآن؟» أولًا — الباب إلى الخطوة التالية، ثم يوم الدراسة والمهام، ثم الإتقان والنتائج.
export default function StudentHome({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [text, setText] = useState("");
  const snap = snapshot(state, user.id);
  const rec = recommendation(state, user.id);
  const week = weekPlan(state, user.id);
  const today = week.find((d) => d.today);
  const tasks = assignmentsForStudent(state, user.id);
  const open = tasks.filter((a) => ["pending", "missing"].includes(assignmentStatus(a, user.id)));
  const attempts = state.attempts.filter((a) => a.studentId === user.id).sort((a, b) => b.at - a.at);
  const first = user.name.split(" ")[0];
  const stu = studentOf(state, user.id);
  const cls = state.classes.find((c) => c.id === (stu?.classId || user.classId));

  const bySubject = subjectMastery(state, user.id);

  // نشاطي: يوم فيه اختبار أو درس منجز = كوّة ممتلئة
  const activeDays = new Set([
    ...attempts.map((a) => dateKey(a.at)),
    ...Object.values(state.progress[user.id] || {}).filter((p) => p.done && p.at).map((p) => dateKey(p.at)),
  ]);
  const days = schoolDays(10);
  const activity = days.map((t) => ({
    state: activeDays.has(dateKey(t)) ? "on" : "off",
    title: `${fmtDate(t, { weekday: "long", day: "numeric", month: "long" })}: ${activeDays.has(dateKey(t)) ? "تعلّمت" : "لا نشاط"}`,
  }));

  const go2 = () => {
    if (rec.type === "remedial") go("progress", "plan");
    else if (rec.type === "lesson") go("learn", `lesson/${rec.lesson.id}`);
    else if (rec.type === "exam") go("learn", `exam/${rec.unit.id}`);
    else go("learn");
  };
  const cta = rec.type === "remedial" ? "ابدأ المراجعة" : rec.type === "exam" ? "ابدأ الامتحان" : rec.type === "lesson" ? "تابع الدرس" : "مساري الدراسي";

  const submit = () => {
    dispatch({ type: "submitAssignment", assignmentId: task.id, studentId: user.id, text });
    toast("سُلِّم الواجب بنجاح");
    setTask(null);
    setText("");
  };

  const resultTitle = (a) => (a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : "إعادة اختبار علاجي");
  const essayState = (a) => {
    const es = Object.values(a.essays || {});
    if (!es.length) return null;
    return es.every((e) => e.final) ? "approved" : "pending";
  };

  return (
    <Page title={`مرحبًا ${first}`} desc={`${fmtLongDate()} • ${cls?.name || user.grade || ""}`}>
      <section className="door" aria-labelledby="s-next">
        <div>
          <span className="door-label">{rec.type === "remedial" ? "خطوتك التالية • مراجعة علاجية" : rec.type === "exam" ? "خطوتك التالية • امتحان وحدة" : "خطوتك التالية"}</span>
          <h2 id="s-next">{rec.title}</h2>
          <p>{rec.why}</p>
          <div className="door-meta">
            {rec.minutes > 0 && <span><Clock3 size={14} aria-hidden="true" /> {`${rec.minutes} دقيقة تقريبًا`}</span>}
            {rec.objective && <span><Target size={14} aria-hidden="true" /> {subjectOf(rec.objective.subjectId)?.name}</span>}
            {rec.lesson && <span><Target size={14} aria-hidden="true" /> {rec.unit?.title}</span>}
          </div>
        </div>
        <div className="door-actions">
          <Btn variant="gold" icon={PlayCircle} onClick={go2}>{cta}</Btn>
          <Btn variant="light" icon={TrendingUp} onClick={() => go("progress")}>تقدّمي وخطتي</Btn>
        </div>
      </section>

      <FactLine
        items={[
          { label: "إتقاني العام", value: snap.entries.length ? `${snap.avg}%` : null, note: `${snap.mastered} أهداف متقَنة`, onClick: () => go("progress") },
          { label: "سلسلة التعلّم", value: state.streaks[user.id] || 0, note: "أيام متواصلة", onClick: () => go("rewards") },
          { label: "اختبارات أنجزتها", value: attempts.length, note: attempts[0] ? `آخرها ${timeAgo(attempts[0].at)}` : "ابدأ أول اختبار" },
          { label: "مهام مفتوحة", value: open.length, note: open.length ? "تحتاج تسليمًا" : "لا شيء مطلوب", tone: open.some((a) => assignmentStatus(a, user.id) === "missing") ? "danger" : open.length ? "warn" : undefined },
          { label: "نقاطي", value: (state.points[user.id] || 0).toLocaleString("en-US"), onClick: () => go("rewards") },
        ]}
      />

      <div className="home-grid" style={{ marginTop: "var(--sp-6)" }}>
        <div className="span-7 home-col">
          <Card aria-labelledby="s-today">
            <SectionHeader
              id="s-today"
              title={today ? "يومي الدراسي" : "الأسبوع القادم"}
              desc={today ? `${today.label} • ${today.classes.length} حصص` : "لا دوام اليوم"}
              action={<Btn size="sm" variant="ghost" onClick={() => go("schedule")}>الجدول الأسبوعي</Btn>}
            />
            {today && today.classes.length ? (
              <div className="tt-strip">
                {today.classes.map((c, i) => (
                  <div className="tt-slot is-mine" key={i}>
                    <time>{c.time}</time>
                    <b><SubjectMark name={c.subject} /></b>
                    <small>{userName(state, c.teacherId)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <Empty compact title="لا حصص اليوم" desc="استغلّ اليوم في مراجعة خطّتك." />
            )}
          </Card>

          <Card aria-labelledby="s-tasks">
            <SectionHeader id="s-tasks" title="مهامي وواجباتي" desc={open.length ? `${open.length} مفتوحة` : "لا مهام مفتوحة"} />
            {tasks.length === 0 ? (
              <Empty compact icon={ClipboardCheck} title="لا مهام حاليًّا" />
            ) : (
              <ul className="hl">
                {tasks.map((a) => {
                  const st = assignmentStatus(a, user.id);
                  const [tone, label] = STATUS[st];
                  const sub = a.submissions[user.id];
                  const due = st === "pending" || st === "missing";
                  return (
                    <li key={a.id} className="no-icon">
                      <div className="hl-main">
                        <strong>{a.title}</strong>
                        <span>
                          <SubjectMark subject={a.subjectId} /> {" • "}
                          {due ? `التسليم ${relativeDay(a.due)}` : sub ? `سُلِّم ${timeAgo(sub.at)}` : ""}
                          {sub?.grade != null ? ` • الدرجة ${sub.grade}/${a.points}` : ""}
                        </span>
                      </div>
                      <div className="hl-end">
                        <Badge tone={tone}>{label}</Badge>
                        {due && <Btn size="sm" variant="primary" onClick={() => setTask(a)}>تسليم</Btn>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="span-5 home-col">
          <Card aria-labelledby="s-mastery">
            <SectionHeader
              id="s-mastery"
              title="إتقاني"
              desc={MASTERY_KEY}
              action={<Btn size="sm" variant="ghost" onClick={() => go("progress", "plan")}>خطّتي</Btn>}
            />
            {bySubject.length === 0 ? (
              <Empty compact icon={Target} title="لا أهداف بعد" />
            ) : (
              <SubjectMasteryWall rows={bySubject} />
            )}
            <div className="vent-legend" aria-label="نشاطي في آخر 10 أيام دراسية">
              <span style={{ color: "var(--c-text-2)", fontWeight: 600 }}>نشاطي في آخر 10 أيام دراسية</span>
              <VentRow size={12} items={activity} label={`أيام النشاط: ${activity.filter((a) => a.state === "on").length} من 10`} />
            </div>
          </Card>

          <Card aria-labelledby="s-results">
            <SectionHeader id="s-results" title="آخر نتائجي" desc="المقالي تُعتمد درجته من المعلّم" />
            {attempts.length === 0 ? (
              <Empty compact title="لا نتائج بعد" desc="ابدأ أول درس ثم اختبره." />
            ) : (
              <ul className="hl">
                {attempts.slice(0, 5).map((a) => {
                  const es = essayState(a);
                  return (
                    <li key={a.id} className="no-icon">
                      <div className="hl-main">
                        <strong>{resultTitle(a)}</strong>
                        <span>{`${a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "علاجي" : "اختبار درس"} • ${timeAgo(a.at)}`}</span>
                      </div>
                      <div className="hl-end">
                        {es && <Seal approved={es === "approved"} compact />}
                        <span className="hl-num" style={{ color: a.score >= GAP_THRESHOLD ? "var(--c-success)" : "var(--c-warn)" }}>{a.score}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {snap.gaps.length === 0 && attempts.length > 0 && (
              <Notice tone="success" icon={CheckCircle2}>لا فجوات مفتوحة. أحسنت!</Notice>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!task} onClose={() => setTask(null)} title={task?.title} kicker={task ? `تسليم واجب • ${subjectOf(task.subjectId)?.name}` : ""}
        footer={<><Btn variant="ghost" onClick={() => setTask(null)}>إلغاء</Btn><Btn variant="primary" icon={Send} disabled={!text.trim()} onClick={submit}>تسليم الواجب</Btn></>}>
        {task && <div className="stack">
          <Notice tone="info" title="المطلوب">{task.desc}</Notice>
          <p className="small muted">موعد التسليم {relativeDay(task.due)} • الدرجة الكاملة <b className="num">{task.points}</b>{task.due < Date.now() && " • سيُسجَّل متأخرًا"}</p>
          <Field label="إجابتك أو ملاحظاتك"><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب حلّك أو أرفق وصف عملك…" /></Field>
        </div>}
      </Modal>
    </Page>
  );
}

