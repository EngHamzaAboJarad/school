import { AlertTriangle, BarChart3, CalendarCheck, ChevronLeft, ClipboardCheck, FileCheck2, PenLine, Users, MessagesSquare, Target } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, ListRow, Page, Split, Stat, Notice } from "../../ui/Primitives";
import { Ring } from "../../ui/Charts";
import { useStore } from "../../store/StoreProvider";
import { classStats, essayQueue, pendingReviews, lessonOf, weekPlan, userName, assignmentStatus } from "../../store/selectors";
import { fmtLongDate, timeAgo, relativeDay } from "../../lib/format";

export default function TeacherHome({ go }) {
  const { state, user } = useStore();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const stats = classes.map((c) => ({ cls: c, ...classStats(state, c) }));
  const total = stats.reduce((a, s) => a + s.rows.length, 0);
  const rated = stats.filter((s) => s.avg);
  const avg = rated.length ? Math.round(rated.reduce((a, s) => a + s.avg, 0) / rated.length) : 0;
  const pending = pendingReviews(state, user.id).filter((r) => r.status === "pending");
  const essays = essayQueue(state, user.id).filter((e) => !e.essay.final);
  const struggling = stats.flatMap((s) => s.struggling.map((r) => ({ ...r, cls: s.cls }))).sort((a, b) => a.avg - b.avg);
  const mine = state.assignments.filter((a) => a.teacherId === user.id);
  const toGrade = mine.reduce((n, a) => n + Object.values(a.submissions).filter((s) => s.status === "submitted" || s.status === "late").length, 0);
  const late = mine.reduce((n, a) => n + Object.values(a.submissions).filter((s) => s.status === "late").length, 0);
  const today = weekPlan(state, "stu-sara").find((d) => d.today);
  const mineToday = today?.classes.filter((c) => c.teacherId === user.id) || [];
  const asked = Object.entries(state.asked.reduce((m, a) => ({ ...m, [a.q]: { n: (m[a.q]?.n || 0) + 1, l: a.lessonId } }), {})).sort((a, b) => b[1].n - a[1].n).slice(0, 3);

  return (
    <Page>
      <section className="hero">
        <div>
          <span className="kicker"><CalendarCheck size={14} /> {fmtLongDate()}</span>
          <h2>أهلًا {user.name.replace("أ. ", "أستاذ ")}، <em>{pending.length + essays.length > 0 ? "لديك مهام بانتظارك" : "كل شيء مُنجز"}</em></h2>
          <p>راجع ما ولّده الذكاء الاصطناعي قبل وصوله لطلابك، وتابع من يحتاج دعمًا في فصولك.</p>
          <div className="hero-actions">
            <Btn variant="gold" size="lg" icon={FileCheck2} onClick={() => go("review")}>اعتماد المحتوى {pending.length > 0 && `(${pending.length})`}</Btn>
            <Btn variant="light" icon={PenLine} onClick={() => go("grading")}>التصحيح {essays.length > 0 && `(${essays.length})`}</Btn>
          </div>
        </div>
        <div className="hero-side"><Ring value={avg} size={150} stroke={12} tone="gold" label="متوسط الإتقان" sub="متوسط الفصول" /></div>
      </section>

      <div className="grid grid-4">
        <Stat label="عدد الطلاب" value={total} icon={Users} tone="blue" foot={`في ${classes.length} فصول`} />
        <Stat label="بانتظار اعتمادك" value={pending.length} icon={FileCheck2} tone="gold" foot="محتوى مولَّد" />
        <Stat label="مقالي للتصحيح" value={essays.length} icon={PenLine} tone="rose" foot="مراجعة درجات الذكاء الاصطناعي" />
        <Stat label="واجبات للتصحيح" value={toGrade} icon={ClipboardCheck} foot={late ? `${late} متأخر` : "لا متأخرات"} />
      </div>

      <Split className="mt">
        <div className="stack">
          <Card title="محتوى مولَّد ينتظر اعتمادك" kicker="الإنسان في الحلقة" action={<button className="btn-link small" onClick={() => go("review")}>عرض الكل</button>}>
            {pending.length === 0 && <Empty icon={FileCheck2} title="لا شيء بانتظار الاعتماد" />}
            {pending.slice(0, 4).map((r) => <ListRow key={r.id} icon={FileCheck2} tone="gold" title={r.title} meta={timeAgo(r.createdAt)} end={<><Badge tone="warn" dot>بانتظارك</Badge><ChevronLeft size={16} /></>} onClick={() => go("review")} />)}
          </Card>
          <Card title="الفجوات الأكثر تكرارًا بين الطلاب" kicker="ما يسأل عنه طلابك" action={<button className="btn-link small" onClick={() => go("performance")}>أداء الفصل</button>}>
            {asked.length === 0 && <Empty title="لا أسئلة بعد" />}
            {asked.map(([q, v]) => <ListRow key={q} icon={MessagesSquare} tone="blue" title={q} meta={`درس «${lessonOf(state, v.l)?.title}»`} end={<Badge tone="info">{v.n} مرات</Badge>} />)}
          </Card>
        </div>
        <div className="stack">
          <Card title="طلاب يحتاجون دعمًا" kicker="أداء الفصول" action={<Users size={18} color="var(--gold-600)" />}>
            {struggling.length === 0 && <Notice tone="success">لا طلاب دون الحدّ حاليًّا.</Notice>}
            {struggling.slice(0, 4).map((s) => (
              <ListRow key={s.id} avatar={s.name} tone="rose" title={s.name} meta={`${s.cls.name} • ${s.gaps} فجوات`} end={<Badge tone="danger">{s.avg}%</Badge>} onClick={() => go("performance")} />
            ))}
          </Card>
          <Card title="حصصي اليوم" kicker={today?.label || "الأسبوع"}>
            {mineToday.length === 0 && <p className="muted">لا حصص اليوم.</p>}
            {mineToday.map((c, i) => <ListRow key={i} icon={CalendarCheck} tone="emerald" title={c.subject} meta={`${c.time} • الثالث المتوسط`} />)}
            <Btn variant="ghost" className="btn-block mt-sm" icon={CalendarCheck} onClick={() => go("attendance")}>تسجيل الحضور</Btn>
          </Card>
        </div>
      </Split>
    </Page>
  );
}
