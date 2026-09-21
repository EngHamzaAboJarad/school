import { useState } from "react";
import { Award, CalendarDays, CheckCircle2, ChevronLeft, Clock3, Flame, Sparkles, Target, ClipboardCheck, Zap, PlayCircle, Send } from "lucide-react";
import { Btn, Badge, Card, Empty, ListRow, Modal, Page, Stat, Split, Textarea, Field, Notice, cx } from "../../ui/Primitives";
import { Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { snapshot, recommendation, weekPlan, assignmentsForStudent, assignmentStatus, subjectOf, lessonOf, unitOf, userName } from "../../store/selectors";
import { fmtLongDate, relativeDay, timeAgo } from "../../lib/format";

const STATUS = {
  pending: ["warn", "مطلوب"], submitted: ["info", "سُلِّم"], late: ["danger", "سُلِّم متأخرًا"], graded: ["success", "صُحّح"], missing: ["danger", "لم يُسلَّم"],
};

// الرئيسية والتقويم الدراسي (F4.1): الدروس القادمة والاختبارات والمهام والتنبيهات، وانتقال واضح للخطوة التالية.
export default function StudentHome({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [task, setTask] = useState(null);
  const [text, setText] = useState("");
  const snap = snapshot(state, user.id);
  const rec = recommendation(state, user.id);
  const week = weekPlan(state, user.id);
  const today = week.find((d) => d.today) || week[0];
  const tasks = assignmentsForStudent(state, user.id);
  const open = tasks.filter((a) => ["pending", "missing"].includes(assignmentStatus(a, user.id)));
  const attempts = state.attempts.filter((a) => a.studentId === user.id).sort((a, b) => b.at - a.at);
  const first = user.name.split(" ")[0];
  const prev = snap.history.length > 1 ? snap.history[snap.history.length - 2] : snap.avg;

  const go2 = () => {
    if (rec.type === "remedial") go("progress", "plan");
    else if (rec.type === "lesson") go("learn", `lesson/${rec.lesson.id}`);
    else if (rec.type === "exam") go("learn", `exam/${rec.unit.id}`);
    else go("learn");
  };

  const submit = () => {
    dispatch({ type: "submitAssignment", assignmentId: task.id, studentId: user.id, text });
    toast("سُلِّم الواجب بنجاح");
    setTask(null);
    setText("");
  };

  return (
    <Page className="student-home">
      <section className="hero">
        <div>
          <span className="kicker"><CalendarDays size={14} /> {fmtLongDate()}</span>
          <h2>مرحبًا {first}، <em>{rec.type === "remedial" ? "خطوة صغيرة اليوم تصنع فرقًا" : "لنكمل رحلتك اليوم"}</em></h2>
          <p>{rec.why}</p>
          <div className="hero-actions">
            <Btn variant="gold" size="lg" icon={PlayCircle} onClick={go2}>{rec.type === "remedial" ? "ابدأ الخطة العلاجية" : rec.type === "exam" ? "ابدأ الامتحان" : "تابع التعلّم"}</Btn>
            <Btn variant="light" onClick={() => go("progress")}>تقدّمي وخطتي</Btn>
          </div>
          <div className="hero-next"><Sparkles size={15} /> ما التالي: <b>{rec.title}</b>{rec.minutes > 0 && <span> • {rec.minutes} دقيقة</span>}</div>
        </div>
        <div className="hero-side">
          <Ring value={snap.avg} size={150} stroke={12} label="نسبة الإتقان" sub="إتقانك العام" tone="gold" />
          <div className="streak"><Flame size={22} /><b className="num">{state.streaks[user.id] || 0}</b><span>أيام متواصلة</span></div>
        </div>
      </section>

      <div className="grid grid-4">
        <Stat label="نسبة الإتقان" value={snap.avg} unit="%" icon={Target} foot={<span className={snap.avg >= prev ? "up" : "down"}>{snap.avg >= prev ? "▲" : "▼"} {Math.abs(snap.avg - prev)}% عن الأسبوع الماضي</span>} />
        <Stat label="اختبارات مُنجزة" value={attempts.length} icon={ClipboardCheck} tone="blue" foot={attempts[0] ? `آخرها ${timeAgo(attempts[0].at)}` : "ابدأ أول اختبار"} />
        <Stat label="سلسلة التعلّم" value={state.streaks[user.id] || 0} unit="أيام" icon={Flame} tone="gold" foot="واصل يوميًّا لتحافظ عليها" />
        <Stat label="نقاطي" value={(state.points[user.id] || 0).toLocaleString("en-US")} icon={Award} tone="rose" foot={`${snap.gaps.length} فجوة قيد العلاج`} />
      </div>

      <Split className="mt">
        <div className="stack">
          <Card title="أسبوعي الدراسي" kicker="التقويم" action={<Badge tone="gold">الأحد – الخميس</Badge>}>
            <div className="week">
              {week.map((d) => (
                <div key={d.label} className={cx("week-day", d.today && "today")}>
                  <strong>{d.label}</strong>
                  <span className="num">{new Date(d.ts).getDate()}</span>
                  <small>{d.classes.length} حصص</small>
                  {d.due.length > 0 && <i className="due-dot" title={d.due.map((x) => x.title).join("، ")}>{d.due.length}</i>}
                </div>
              ))}
            </div>
            <div className="divider" />
            <h4 className="mini-title">{today.today ? "جدول اليوم" : `جدول ${today.label}`}</h4>
            <div className="periods">
              {today.classes.map((c, i) => (
                <div className="period" key={i}><span className="num">{c.time}</span><b>{c.subject}</b><small>{userName(state, c.teacherId)}</small></div>
              ))}
            </div>
          </Card>

          <Card title="مهامي وواجباتي" kicker="المطلوب مني" action={<Badge tone={open.length ? "warn" : "success"}>{open.length ? `${open.length} مفتوحة` : "لا مهام مفتوحة"}</Badge>}>
            {tasks.length === 0 && <Empty title="لا مهام حاليًّا" />}
            {tasks.map((a) => {
              const st = assignmentStatus(a, user.id);
              const [tone, label] = STATUS[st];
              const sub = a.submissions[user.id];
              return (
                <ListRow key={a.id} icon={ClipboardCheck} tone={subjectOf(a.subjectId)?.tone || "emerald"} title={a.title}
                  meta={`${subjectOf(a.subjectId)?.name} • ${st === "pending" || st === "missing" ? `التسليم ${relativeDay(a.due)}` : sub ? `سُلِّم ${timeAgo(sub.at)}` : ""}${sub?.grade != null ? ` • الدرجة ${sub.grade}/${a.points}` : ""}`}
                  end={<>
                    <Badge tone={tone}>{label}</Badge>
                    {(st === "pending" || st === "missing") && <Btn size="sm" variant="primary" onClick={() => setTask(a)}>تسليم</Btn>}
                  </>} />
              );
            })}
          </Card>
        </div>

        <div className="stack">
          <Card tone="gold" title="ما التالي؟" kicker="توصية مبنية على أدائك">
            <div className="rec">
              <span className="rec-icon"><Zap size={20} /></span>
              <div><strong>{rec.title}</strong><p className="muted small">{rec.why}</p></div>
            </div>
            <Btn variant="primary" className="btn-block mt-sm" iconEnd={ChevronLeft} onClick={go2}>انتقل الآن</Btn>
          </Card>
          <Card title="فجواتي" kicker="أولويات المعالجة" action={<button className="btn-link small" onClick={() => go("progress", "plan")}>الخطة كاملة</button>}>
            {snap.gaps.length === 0 && <Notice tone="success" icon={CheckCircle2}>لا فجوات حاليًّا. أحسنت!</Notice>}
            {snap.gaps.slice(0, 3).map((g) => (
              <ListRow key={g.id} icon={Target} tone="warn" title={g.title} meta={subjectOf(g.subjectId)?.name} end={<Badge tone={g.mastery < 55 ? "danger" : "warn"}>{g.mastery}%</Badge>} onClick={() => go("progress", "plan")} />
            ))}
          </Card>
          <Card title="آخر نتائجي" kicker="سجلّ التعلّم">
            {attempts.slice(0, 4).map((a) => (
              <ListRow key={a.id} icon={ClipboardCheck} tone={a.score >= 70 ? "success" : "warn"}
                title={a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : "إعادة اختبار علاجي"}
                meta={`${a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "علاجي" : "اختبار درس"} • ${timeAgo(a.at)}`}
                end={<b className="num">{a.score}%</b>} />
            ))}
            {attempts.length === 0 && <Empty title="لا نتائج بعد" desc="ابدأ أول درس ثم اختبره." />}
          </Card>
        </div>
      </Split>

      <Modal open={!!task} onClose={() => setTask(null)} title={task?.title} kicker={`تسليم واجب • ${task ? subjectOf(task.subjectId)?.name : ""}`}
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
