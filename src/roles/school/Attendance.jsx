import { AlertTriangle, BellRing, CalendarCheck, Download } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Page, Stat } from "../../ui/Primitives";
import { Bars } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { classAttendanceOn, studentOf, attendanceRate } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { downloadCSV } from "../../lib/export";
import { fmtLongDate } from "../../lib/format";
import { ATT } from "../teacher/Attendance";

// الحضور والغياب على مستوى المدرسة (F7.3): يرتبط بتنبيهات أولياء الأمور
export default function SchoolAttendance() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const today = dateKey(Date.now());
  const classes = state.classes.filter((c) => c.subjects.some((s) => s.startsWith("S-")));
  const days = Object.keys(state.attendance).sort().slice(-10);
  const rate = (d) => { const m = Object.values(state.attendance[d] || {}); return m.length ? Math.round((m.filter((x) => x !== "absent").length / m.length) * 1000) / 10 : 0; };
  const rows = classes.map((c) => ({ id: c.id, cls: c, ...classAttendanceOn(state, c, today) }));
  const absentToday = classes.flatMap((c) => c.studentIds.filter((s) => state.attendance[today]?.[s] === "absent").map((s) => ({ id: s, name: studentOf(state, s)?.name, cls: c.name })));
  const frequent = state.classes.flatMap((c) => c.studentIds).map((s) => ({ id: s, name: studentOf(state, s)?.name, ...attendanceRate(state, s, 14) })).filter((r) => r.absent >= 2);

  return (
    <Page kicker="متابعة يومية" title="الحضور والغياب" desc={`${fmtLongDate()} — حضور اليوم وغيابات متكرّرة، وسجلّ التنبيهات المرسلة لأولياء الأمور.`} icon={CalendarCheck}
      actions={<Btn variant="ghost" icon={Download} onClick={() => { downloadCSV("حضور-المدرسة", [["اليوم", "نسبة الحضور %"], ...days.map((d) => [d, rate(d)])]); toast("صُدِّر تقرير الحضور"); }}>تصدير Excel</Btn>}>
      <div className="grid grid-4">
        <Stat label="حاضرون اليوم" value={rows.reduce((a, r) => a + r.present, 0)} icon={CalendarCheck} />
        <Stat label="غائبون اليوم" value={absentToday.length} tone="rose" icon={AlertTriangle} foot="أُنبّه أولياء أمورهم" />
        <Stat label="متأخرون / بعذر" value={rows.reduce((a, r) => a + r.late + r.excused, 0)} tone="gold" icon={CalendarCheck} />
        <Stat label="غيابات متكرّرة" value={frequent.length} tone="blue" icon={AlertTriangle} foot="٢ فأكثر في أسبوعين" />
      </div>
      <div className="grid grid-2 mt">
        <Card title="حضور آخر ١٠ أيام" kicker="نسبة الحضور"><Bars data={days.map((d, i) => ({ label: d.slice(8), value: rate(d), active: i === days.length - 1 }))} max={100} unit="" height={150} /></Card>
        <Card title="حضور اليوم حسب الفصل" kicker="حالة التسجيل">
          <DataTable dense rows={rows} columns={[
            { key: "cls", label: "الفصل", render: (r) => <strong>{r.cls.name}</strong> },
            { key: "present", label: "حاضر", render: (r) => <span className="num">{r.present}</span> },
            { key: "absent", label: "غائب", render: (r) => <Badge tone={r.absent ? "danger" : "success"}>{r.absent}</Badge> },
            { key: "st", label: "التسجيل", render: (r) => r.unmarked === r.cls.studentIds.length ? <Btn size="sm" variant="ghost" icon={BellRing} onClick={() => { dispatch({ type: "newThread", from: user.id, to: r.cls.teacherId, subject: "تذكير بتسجيل الحضور", text: `يرجى تسجيل حضور فصل ${r.cls.name} لليوم.` }); toast("أُرسل التذكير للمعلّم"); }}>ذكّر المعلّم</Btn> : <Badge tone="success">مُسجَّل</Badge> },
          ]} />
        </Card>
      </div>
      <Card className="mt" title="غيابات متكرّرة" kicker="تستدعي متابعة">
        <DataTable dense empty="لا غيابات متكرّرة" rows={frequent} columns={[
          { key: "name", label: "الطالب", render: (r) => <div className="cell-user"><Avatar name={r.name} size={32} /><strong>{r.name}</strong></div> },
          { key: "absent", label: "أيام الغياب", render: (r) => <Badge tone="danger">{r.absent}</Badge> },
          { key: "rate", label: "نسبة الحضور", render: (r) => <span className="num">{r.rate}%</span> },
        ]} />
      </Card>
    </Page>
  );
}
