import { AlertTriangle, CalendarCheck, CheckCircle2, ChevronLeft, FileCheck2, MessagesSquare, PenLine, Users } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, Page, SectionHeader } from "../../ui/Primitives";
import { FactLine, Seal, SubjectMark, VentRow } from "../../ui/World";
import { useStore } from "../../store/StoreProvider";
import { classAttendanceOn, classStats, essayQueue, lessonOf, pendingReviews } from "../../store/selectors";
import { PERIODS } from "../../data/people";
import { dateKey } from "../../data/seed";
import { GAP_THRESHOLD } from "../../lib/grading";
import { fmtLongDate, timeAgo } from "../../lib/format";

const KIND = { quiz: "اختبار درس", summary: "ملخّص درس", exam: "امتحان وحدة", explain: "شرح مُعاد توليده" };

// رئيسية المعلّم: طابور «النجمة» أولًا (ما ولّده الذكاء الاصطناعي ولم يصل للطلاب بعد)، ثم حصص اليوم، ثم جدار إتقان الفصول.
export default function TeacherHome({ go }) {
  const { state, user } = useStore();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const stats = classes.map((c) => ({ cls: c, ...classStats(state, c) }));
  const total = stats.reduce((a, s) => a + s.rows.length, 0);
  const rated = stats.flatMap((s) => s.rows.filter((r) => r.assessed));
  const avg = rated.length ? Math.round(rated.reduce((a, r) => a + r.avg, 0) / rated.length) : null;
  const pending = pendingReviews(state, user.id).filter((r) => r.status === "pending");
  const essays = essayQueue(state, user.id).filter((e) => !e.essay.final);
  const struggling = stats.flatMap((s) => s.struggling.map((r) => ({ ...r, cls: s.cls }))).sort((a, b) => a.avg - b.avg);
  const mine = state.assignments.filter((a) => a.teacherId === user.id);
  const toGrade = mine.reduce((n, a) => n + Object.values(a.submissions).filter((s) => s.status === "submitted" || s.status === "late").length, 0);
  const late = mine.reduce((n, a) => n + Object.values(a.submissions).filter((s) => s.status === "late").length, 0);
  const asked = Object.entries(state.asked.reduce((m, a) => ({ ...m, [a.q]: { n: (m[a.q]?.n || 0) + 1, l: a.lessonId } }), {})).sort((a, b) => b[1].n - a[1].n).slice(0, 3);

  // حصص اليوم من الجدول الفعلي لفصول المعلّم (الأحد = 0 … الخميس = 4)
  const dow = new Date().getDay();
  const today = dateKey(Date.now());
  const periods = PERIODS.map((time, p) => {
    const hit = classes.map((c) => ({ c, cell: state.timetable[c.id]?.[dow]?.[p] })).find((x) => x.cell && x.cell[1] === user.id);
    return { time, subject: hit?.cell[0], cls: hit?.c };
  });
  const teachingToday = dow <= 4 && periods.some((p) => p.subject);
  const unmarked = dow <= 4 ? classes.filter((c) => classAttendanceOn(state, c, today).unmarked === c.studentIds.length) : [];
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const nowIdx = periods.findIndex((p, i) => toMin(p.time) <= nowMin && (i === periods.length - 1 || toMin(periods[i + 1].time) > nowMin));

  const queue = [
    ...essays.slice(0, 3).map((e) => ({
      key: `${e.attempt.id}:${e.qid}`, kind: "essay", title: `مقالي ${e.student?.name}`, meta: `${lessonOf(state, e.question.lessonId)?.title || "امتحان وحدة"} • ${timeAgo(e.attempt.at)}`,
      score: `${e.essay.ai.score}/${e.essay.ai.max}`, run: () => go("grading"),
    })),
    ...pending.slice(0, 4).map((r) => ({ key: r.id, kind: r.kind, title: r.title, meta: `${KIND[r.kind] || "محتوى"} • ${timeAgo(r.createdAt)}`, run: () => go("review") })),
  ];

  return (
    <Page
      title={`أهلًا ${user.name}`}
      desc={`${fmtLongDate()} • ${user.title || ""}`}
      actions={
        <>
          <Btn variant="ghost" icon={PenLine} onClick={() => go("grading")}>التصحيح{essays.length > 0 ? ` (${essays.length})` : ""}</Btn>
          <Btn variant="primary" icon={FileCheck2} onClick={() => go("review")}>اعتماد المحتوى{pending.length > 0 ? ` (${pending.length})` : ""}</Btn>
        </>
      }
    >
      <FactLine
        items={[
          { label: "طلابي", value: total, note: `في ${classes.length} فصول`, onClick: () => go("classes") },
          { label: "بانتظار اعتمادك", value: pending.length, note: "محتوى ولّدته «النجمة»", tone: pending.length ? "warn" : undefined, onClick: () => go("review") },
          { label: "مقالي للتأكيد", value: essays.length, note: "درجات مقترحة آليًّا", tone: essays.length ? "warn" : undefined, onClick: () => go("grading") },
          { label: "واجبات للتصحيح", value: toGrade, note: late ? `${late} متأخّر` : "لا متأخرات", onClick: () => go("assignments") },
          { label: "متوسط الإتقان", value: avg != null ? `${avg}%` : null, note: avg != null ? `${struggling.length} دون ${GAP_THRESHOLD}%` : "لا تقييمات بعد", onClick: () => go("performance") },
        ]}
      />

      <div className="home-grid">
        <Card className="span-7" aria-labelledby="t-queue">
          <SectionHeader
            id="t-queue"
            title="طابور «النجمة»"
            desc="لا يصل شيء من هذا للطلاب قبل أن تعتمده"
            action={<Btn size="sm" variant="ghost" onClick={() => go("review")}>كل المحتوى</Btn>}
          />
          {queue.length === 0 ? (
            <Empty compact icon={CheckCircle2} title="لا شيء ينتظرك" desc="اعتمدت كل ما ولّدته «النجمة» وصحّحت كل المقالي." />
          ) : (
            <ul className="hl">
              {queue.map((q) => (
                <li key={q.key}>
                  <span className={`row-icon ${q.kind === "essay" ? "tone-info" : "tone-gold"}`} aria-hidden="true">
                    {q.kind === "essay" ? <PenLine size={17} /> : <FileCheck2 size={17} />}
                  </span>
                  <div className="hl-main">
                    <strong>{q.title}</strong>
                    <span>{q.meta}</span>
                  </div>
                  <div className="hl-end">
                    {q.score && <span className="hl-num">{q.score}</span>}
                    <Seal approved={false} compact />
                    <Btn size="sm" variant="ghost" iconEnd={ChevronLeft} onClick={q.run}>{q.kind === "essay" ? "راجع" : "اعتمد"}</Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="span-5 home-col">
          <Card aria-labelledby="t-today">
            <SectionHeader
              id="t-today"
              title="حصصي اليوم"
              desc={teachingToday ? `${periods.filter((p) => p.subject).length} حصص` : "لا حصص اليوم"}
              action={<Btn size="sm" variant={unmarked.length ? "primary" : "ghost"} icon={CalendarCheck} onClick={() => go("attendance")}>تسجيل الحضور</Btn>}
            />
            {teachingToday ? (
              <div className="tt-strip">
                {periods.map((p, i) => (
                  <div key={p.time} className={`tt-slot ${p.subject ? "is-mine" : "is-free"} ${i === nowIdx ? "is-now" : ""}`}>
                    <time>{p.time}</time>
                    <b>{p.subject ? <SubjectMark name={p.subject} /> : "فراغ"}</b>
                    {p.cls && <small>{p.cls.name}</small>}
                  </div>
                ))}
              </div>
            ) : (
              <Empty compact icon={CalendarCheck} title="لا حصص في جدولك اليوم" />
            )}
            {unmarked.length > 0 && (
              <p className="ov-chart-note" role="status">
                <AlertTriangle size={14} style={{ verticalAlign: "-2px", color: "var(--c-warn)" }} /> لم تسجّل حضور اليوم بعد في: {unmarked.map((c) => c.name).join(" • ")}
              </p>
            )}
          </Card>

          <Card aria-labelledby="t-asked">
            <SectionHeader id="t-asked" title="أكثر ما يسأل عنه طلابك" desc="من مساعد الدرس" action={<Btn size="sm" variant="ghost" onClick={() => go("performance")}>أداء الفصل</Btn>} />
            {asked.length === 0 ? (
              <Empty compact icon={MessagesSquare} title="لا أسئلة بعد" />
            ) : (
              <ul className="hl">
                {asked.map(([q, v]) => (
                  <li key={q} className="no-icon">
                    <div className="hl-main">
                      <strong>{q}</strong>
                      <span>{`درس «${lessonOf(state, v.l)?.title}»`}</span>
                    </div>
                    <div className="hl-end"><Badge tone="info">{`${v.n} ${v.n === 1 ? "مرة" : "مرات"}`}</Badge></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="span-7" aria-labelledby="t-wall">
          <SectionHeader
            id="t-wall"
            title="إتقان فصولي"
            desc={`كوّة لكل طالب: ممتلئة متقِن • حمراء دون ${GAP_THRESHOLD}% • منقّطة لم يُقيَّم`}
            action={<Btn size="sm" variant="ghost" onClick={() => go("classes")}>فصولي وطلابي</Btn>}
          />
          {stats.length === 0 ? (
            <Empty compact icon={Users} title="لا فصول مسندة إليك" />
          ) : (
            <div className="class-wall">
              {stats.map(({ cls, rows, avg: a, struggling: st }) => (
                <div className="class-wall-row" key={cls.id}>
                  <div className="ov-cls-name">
                    <strong>{cls.name}</strong>
                    <small>{`${rows.length} طالبًا • ${cls.room}`}</small>
                  </div>
                  <VentRow
                    size={14}
                    label={`إتقان طلاب ${cls.name}`}
                    items={rows.map((r) => ({ state: !r.assessed ? "empty" : r.avg >= GAP_THRESHOLD ? "on" : "alert", title: `${r.name}: ${r.assessed ? `${r.avg}%` : "لم يُقيَّم بعد"}` }))}
                  />
                  <div className="hl-end">
                    <span className="hl-num">{rows.some((r) => r.assessed) ? `${a}%` : "—"}</span>
                    {st.length > 0 && <Badge tone="warn" icon={AlertTriangle}>{`${st.length} متعثّرون`}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="span-5" aria-labelledby="t-support">
          <SectionHeader id="t-support" title="يحتاجون دعمًا" desc={`أدنى متوسطات الإتقان (دون ${GAP_THRESHOLD}%)`} />
          {struggling.length === 0 ? (
            <Empty compact icon={CheckCircle2} title="لا طلاب دون الحدّ" />
          ) : (
            <ul className="hl">
              {struggling.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Avatar name={s.name} size={32} />
                  <div className="hl-main">
                    <strong>{s.name}</strong>
                    <span>{`${s.cls.name} • ${s.gaps} فجوات`}</span>
                  </div>
                  <div className="hl-end">
                    <span className="hl-num" style={{ color: "var(--c-danger)" }}>{s.avg}%</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {struggling.length > 0 && <Btn variant="ghost" className="btn-block mt" onClick={() => go("performance")}>خريطة أداء الفصل</Btn>}
        </Card>
      </div>
    </Page>
  );
}

