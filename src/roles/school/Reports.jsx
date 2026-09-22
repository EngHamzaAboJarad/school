import { useMemo, useState } from "react";
import { Download, FileBarChart, Printer } from "lucide-react";
import { Badge, Btn, Card, DataTable, Page, Segmented, Select, Stat } from "../../ui/Primitives";
import { HBars, Bars } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allObjectives, classStats, assignmentStatus, attendanceRate, subjectOf } from "../../store/selectors";
import { subjects } from "../../data/curriculum";
import { downloadCSV, printPage } from "../../lib/export";
import { fmtLongDate } from "../../lib/format";

// التقارير المؤسسية (F7.4): على مستوى الصف/المادة/المدرسة، قابلة للتصدير
export default function SchoolReports() {
  const { state } = useStore();
  const toast = useToast();
  const [by, setBy] = useState("class");
  const [grade, setGrade] = useState("");
  const school = state.schools.find((s) => s.id === "sch-1");
  const classes = state.classes.filter((c) => !grade || c.grade === grade);
  const classRows = useMemo(() => classes.map((c) => {
    const st = classStats(state, c);
    const att = c.studentIds.length ? Math.round(c.studentIds.reduce((a, s) => a + attendanceRate(state, s).rate, 0) / c.studentIds.length * 10) / 10 : 0;
    const tasks = state.assignments.filter((a) => a.classId === c.id);
    const done = tasks.reduce((n, a) => n + c.studentIds.filter((s) => ["submitted", "graded", "late"].includes(assignmentStatus(a, s))).length, 0);
    const total = tasks.length * c.studentIds.length;
    return { id: c.id, name: c.name, grade: c.grade, students: c.studentIds.length, avg: st.avg, struggling: st.struggling.length, att, tasks: total ? Math.round((done / total) * 100) : 0 };
  }), [state, grade]); // eslint-disable-line react-hooks/exhaustive-deps
  const subjectRows = subjects.map((s) => {
    const objs = allObjectives(state).filter((o) => o.subjectId === s.id);
    const vals = classes.flatMap((c) => c.studentIds).flatMap((sid) => objs.map((o) => state.mastery[sid]?.[o.id]).filter((v) => v !== undefined));
    return { id: s.id, name: `${s.name} (${s.grade})`, avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null, n: vals.length };
  }).filter((r) => r.avg !== null);
  const grades = [...new Set(state.classes.map((c) => c.grade))];

  const exportCsv = () => {
    downloadCSV("تقرير-مؤسسي", by === "class"
      ? [["الفصل", "الصف", "الطلاب", "متوسط الإتقان %", "متعثّرون", "الحضور %", "إنجاز المهام %"], ...classRows.map((r) => [r.name, r.grade, r.students, r.avg, r.struggling, r.att, r.tasks])]
      : [["المادة", "متوسط الإتقان %", "عدد القياسات"], ...subjectRows.map((r) => [r.name, r.avg, r.n])]);
    toast("صُدِّر التقرير (Excel/CSV)");
  };

  return (
    <Page kicker="تقارير تجميعية" title="التقارير المؤسسية" desc={`أداء المدرسة على مستوى الصف والمادة — ${fmtLongDate()}`} icon={FileBarChart}
      actions={<><Btn variant="ghost" icon={Download} onClick={exportCsv}>تصدير Excel</Btn><Btn variant="primary" icon={Printer} onClick={printPage}>PDF / طباعة</Btn></>}>
      <div className="row spread no-print"><Segmented options={[{ id: "class", label: "حسب الفصل" }, { id: "subject", label: "حسب المادة" }]} value={by} onChange={setBy} />
        <Select value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="الصف" style={{ minWidth: 200 }}><option value="">كل الصفوف</option>{grades.map((g) => <option key={g} value={g}>{g}</option>)}</Select></div>
      <div className="grid grid-4 mt">
        <Stat label="متوسط الإتقان" value={school.mastery} unit="%" icon={FileBarChart} />
        <Stat label="الحضور" value={school.attendance} unit="%" tone="blue" icon={FileBarChart} />
        <Stat label="نسبة اعتماد المحتوى" value={school.approval} unit="%" tone="gold" icon={FileBarChart} />
        <Stat label="المستخدمون النشطون" value={school.active} unit="%" tone="rose" icon={FileBarChart} foot="خلال ٣٠ يومًا" />
      </div>
      {by === "class" ? (
        <div className="grid grid-2 mt">
          <Card title="إتقان الفصول" kicker="متوسط الأهداف"><HBars data={classRows.map((r) => ({ label: r.name, value: r.avg }))} /></Card>
          <Card title="التفاصيل" kicker="جدول تجميعي" flush><div className="pad">
            <DataTable dense rows={classRows} columns={[
              { key: "name", label: "الفصل", render: (r) => <strong>{r.name}</strong> },
              { key: "avg", label: "الإتقان", render: (r) => <span className="num">{r.avg}%</span> },
              { key: "att", label: "الحضور", render: (r) => <span className="num">{r.att}%</span> },
              { key: "tasks", label: "المهام", render: (r) => <span className="num">{r.tasks}%</span> },
              { key: "struggling", label: "متعثّرون", render: (r) => <Badge tone={r.struggling ? "warn" : "success"}>{r.struggling}</Badge> },
            ]} /></div></Card>
        </div>
      ) : (
        <Card className="mt" title="الإتقان حسب المادة" kicker="متوسط القياسات"><Bars data={subjectRows.map((r) => ({ label: r.name.split(" (")[0], value: r.avg }))} height={170} unit="%" /></Card>
      )}
    </Page>
  );
}
