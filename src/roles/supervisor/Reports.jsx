import { useState } from "react";
import { CalendarClock, Download, FileText, Plus, Printer, Trash2 } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, ListRow, Notice, Page, Select, Split } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { downloadCSV, printPage } from "../../lib/export";
import { fmtLongDate, fmtNum } from "../../lib/format";

const TYPES = {
  region: ["ملخص أداء المنطقة", ["المدرسة", "الحي", "الطلاب", "الإتقان %", "الحضور %"], (s) => [s.name, s.district, s.students, s.mastery, s.attendance]],
  quality: ["جودة المحتوى والاختبارات", ["المدرسة", "نسبة اعتماد المحتوى %", "المعلّمون"], (s) => [s.name, s.approval, s.teachers]],
  engagement: ["المشاركة والاستخدام", ["المدرسة", "نشاط المستخدمين %", "الطلاب"], (s) => [s.name, s.active, s.students]],
  license: ["حالة التراخيص", ["المدرسة", "الترخيص", "المقاعد", "المستهلك"], (s) => [s.name, s.license, s.seats, s.students]],
};

// تقارير الإدارة/الوزارة (F8.4)
export default function SupervisorReports() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [type, setType] = useState("region");
  const [gen, setGen] = useState(null);
  const [freq, setFreq] = useState("أسبوعيًّا");
  const [title, head, row] = TYPES[type];
  const rows = gen ? state.schools.map((s, i) => ({ id: s.id, cells: row(s) })) : [];

  return (
    <Page kicker="تقارير استراتيجية" title="تقارير الإدارة والوزارة" desc="ولّد تقارير تجميعية على مستوى المنطقة وصدّرها للجهات العليا، أو جدولها لتصلك دوريًّا." icon={FileText}>
      <Split>
        <div className="stack">
          <Card title="توليد تقرير" kicker="اختر النوع">
            <div className="row">
              <Select value={type} onChange={(e) => { setType(e.target.value); setGen(null); }} aria-label="نوع التقرير" style={{ minWidth: 260 }}>{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v[0]}</option>)}</Select>
              <Btn variant="gold" onClick={() => { setGen(Date.now()); toast("وُلِّد التقرير"); }}>توليد</Btn>
            </div>
          </Card>
          {gen && (
            <Card title={title} kicker={`إدارة تعليم الرياض • ${fmtLongDate(gen)}`} action={<div className="row no-print"><Btn size="sm" variant="ghost" icon={Download} onClick={() => { downloadCSV(title, [head, ...rows.map((r) => r.cells)]); toast("صُدِّر التقرير (Excel/CSV)"); }}>Excel</Btn><Btn size="sm" variant="primary" icon={Printer} onClick={printPage}>PDF</Btn></div>}>
              <DataTable dense rows={rows} columns={head.map((h, i) => ({ key: String(i), label: h, render: (r) => (typeof r.cells[i] === "number" ? <span className="num">{fmtNum(r.cells[i])}</span> : r.cells[i]) }))} />
            </Card>
          )}
        </div>
        <Card title="التقارير المجدولة" kicker="تصلك تلقائيًّا">
          {state.reportSchedules.map((r) => <ListRow key={r.id} icon={CalendarClock} tone="gold" title={r.title} meta={`${r.frequency} • ${r.channel}`} end={<Btn size="sm" variant="danger" icon={Trash2} aria-label="حذف الجدولة" onClick={() => { dispatch({ type: "removeSchedule", id: r.id }); toast("حُذفت الجدولة", "warn"); }} />} />)}
          <div className="divider" />
          <div className="row"><Select value={freq} onChange={(e) => setFreq(e.target.value)} aria-label="التكرار"><option>أسبوعيًّا</option><option>شهريًّا</option><option>فصليًّا</option></Select>
            <Btn variant="ghost" icon={Plus} onClick={() => { dispatch({ type: "addSchedule", schedule: { title, frequency: freq, channel: "التطبيق + البريد" } }); toast("أُضيفت الجدولة"); }}>جدولة «{title}»</Btn></div>
        </Card>
      </Split>
    </Page>
  );
}
