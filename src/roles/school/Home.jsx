import { AlertTriangle, BarChart3, CalendarCheck, FileBarChart, KeyRound, ShieldCheck, Users, Target, GraduationCap } from "lucide-react";
import { Badge, Btn, Card, ListRow, Page, Split, Stat } from "../../ui/Primitives";
import { Bars, HBars, Ring } from "../../ui/Charts";
import { useStore } from "../../store/StoreProvider";
import { classAttendanceOn, classStats } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { fmtLongDate, timeAgo, fmtNum } from "../../lib/format";

export default function SchoolHome({ go }) {
  const { state, user } = useStore();
  const school = state.schools.find((s) => s.id === "sch-1");
  const pendingUsers = state.directory.filter((d) => d.status === "بانتظار الاعتماد");
  const days = Object.keys(state.attendance).sort().slice(-5);
  const dayRate = (d) => {
    const marks = Object.values(state.attendance[d] || {});
    return marks.length ? Math.round((marks.filter((m) => m !== "absent").length / marks.length) * 1000) / 10 : 0;
  };
  const today = dateKey(Date.now());
  const unmarked = state.classes.filter((c) => c.subjects.some((s) => s.startsWith("S-")) && classAttendanceOn(state, c, today).unmarked === c.studentIds.length);
  const classPerf = state.classes.map((c) => ({ label: c.name, value: classStats(state, c).avg }));
  const seatPct = Math.round((school.students / school.seats) * 100);
  const activity = state.audit.filter((a) => ["adm-school", "tch-khaled", "par-noura", "sys-1"].includes(a.actor)).slice(0, 5);

  return (
    <Page>
      <section className="hero">
        <div>
          <span className="kicker"><GraduationCap size={14} /> {fmtLongDate()}</span>
          <h2>{school.name}، <em>لوحة الإدارة</em></h2>
          <p>مؤشرات موحّدة للمدرسة: المستخدمون والحضور والإتقان والترخيص — وطلبات تنتظر قرارك.</p>
          <div className="hero-actions">
            <Btn variant="gold" size="lg" icon={Users} onClick={() => go("users")}>المستخدمون {pendingUsers.length > 0 && `(${pendingUsers.length} بانتظار الاعتماد)`}</Btn>
            <Btn variant="light" icon={FileBarChart} onClick={() => go("reports")}>التقارير المؤسسية</Btn>
          </div>
        </div>
        <div className="hero-side"><Ring value={school.mastery} size={150} stroke={12} tone="gold" label="متوسط الإتقان" sub="على مستوى المدرسة" /></div>
      </section>

      <div className="grid grid-4">
        <Stat label="الطلاب" value={fmtNum(school.students)} icon={GraduationCap} foot={`${school.teachers} معلّمًا`} />
        <Stat label="الحضور" value={school.attendance} unit="%" icon={CalendarCheck} tone="blue" foot="متوسط الشهر" />
        <Stat label="اعتماد المحتوى" value={school.approval} unit="%" icon={ShieldCheck} tone="gold" foot="بعد المراجعة البشرية" />
        <Stat label="مقاعد الترخيص" value={seatPct} unit="%" icon={KeyRound} tone="rose" foot={`${fmtNum(school.students)} من ${fmtNum(school.seats)} مقعدًا`} />
      </div>

      <Split className="mt">
        <div className="stack">
          <Card title="حضور آخر خمسة أيام" kicker="على مستوى المدرسة"><Bars data={days.map((d, i) => ({ label: d.slice(5), value: dayRate(d), active: i === days.length - 1 }))} max={100} unit="%" height={150} /></Card>
          <Card title="إتقان الفصول" kicker="متوسط الأهداف المُقيَّمة"><HBars data={classPerf} /></Card>
        </div>
        <div className="stack">
          <Card title="طلبات بانتظار قرارك" kicker="اعتماد الحسابات" action={<button className="btn-link small" onClick={() => go("users")}>إدارة</button>}>
            {pendingUsers.length === 0 && <p className="muted">لا طلبات.</p>}
            {pendingUsers.map((u) => <ListRow key={u.id} avatar={u.name} title={u.name} meta={`طلب انضمام معلّم • ${u.joined}`} end={<Badge tone="warn" dot>بانتظار</Badge>} onClick={() => go("users")} />)}
          </Card>
          {unmarked.length > 0 && (
            <Card title="حضور اليوم لم يُسجَّل" kicker="تنبيه">
              {unmarked.map((c) => <ListRow key={c.id} icon={AlertTriangle} tone="warn" title={c.name} meta="لم يسجّل المعلّم الحضور بعد" end={<Btn size="sm" variant="ghost" onClick={() => go("attendance")}>متابعة</Btn>} />)}
            </Card>
          )}
          <Card title="آخر العمليات" kicker="حوكمة">
            {activity.map((a) => <ListRow key={a.id} icon={ShieldCheck} tone="emerald" title={a.action} meta={`${a.actorName} — ${a.target} • ${timeAgo(a.at)}`} />)}
          </Card>
        </div>
      </Split>
    </Page>
  );
}
