import { useState } from "react";
import { Gauge, Download } from "lucide-react";
import { Badge, Btn, Card, DataTable, Page, Segmented, Select, Stat } from "../../ui/Primitives";
import { Bars, HBars, LineChart } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { downloadCSV } from "../../lib/export";
import { fmtNum } from "../../lib/format";

const TARGET = { mastery: 80, attendance: 95, active: 85, approval: 92 };
const LABEL = { mastery: "الإتقان", attendance: "الحضور", active: "المشاركة", approval: "جودة المحتوى" };

// مؤشرات الأداء التجميعية (F8.2): إتقان ونتائج ومشاركة على مستوى المدرسة/المنطقة، قابلة للتصفية
export default function KpisPage() {
  const { state } = useStore();
  const toast = useToast();
  const [stage, setStage] = useState("");
  const [metric, setMetric] = useState("mastery");
  const schools = state.schools.filter((s) => !stage || s.stage.includes(stage));
  const total = schools.reduce((a, s) => a + s.students, 0) || 1;
  const weighted = (k) => Math.round((schools.reduce((a, s) => a + s[k] * s.students, 0) / total) * 10) / 10;
  const trend = [72, 74, 75, 77, 78, weighted("mastery")];
  const sorted = [...schools].sort((a, b) => b[metric] - a[metric]);

  return (
    <Page kicker="مؤشرات تجميعية" title="مؤشّرات الأداء" desc="مؤشرات مرجّحة بعدد الطلاب، قابلة للتصفية بحسب المرحلة، ومقارنة بالمستهدفات." icon={Gauge}
      actions={<><Select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="المرحلة"><option value="">كل المراحل</option><option value="ابتدائي">ابتدائي</option><option value="متوسط">متوسط</option><option value="ثانوي">ثانوي</option></Select>
        <Btn variant="ghost" icon={Download} onClick={() => { downloadCSV("مؤشرات-الأداء", [["المدرسة", "الإتقان", "الحضور", "المشاركة", "جودة المحتوى", "الطلاب"], ...schools.map((s) => [s.name, s.mastery, s.attendance, s.active, s.approval, s.students])]); toast("صُدِّرت المؤشرات"); }}>تصدير</Btn></>}>
      <div className="grid grid-4">
        {Object.keys(TARGET).map((k) => {
          const v = weighted(k);
          return <Stat key={k} label={LABEL[k]} value={v} unit="%" tone={v >= TARGET[k] ? "emerald" : "rose"} icon={Gauge} foot={<span className={v >= TARGET[k] ? "up" : "down"}>{v >= TARGET[k] ? "▲ يحقق" : "▼ دون"} المستهدف {TARGET[k]}%</span>} />;
        })}
      </div>
      <div className="grid grid-2 mt">
        <Card title="اتجاه إتقان المنطقة" kicker="آخر ٦ أشهر (مرجّح)"><LineChart values={trend} labels={["-5", "-4", "-3", "-2", "-1", "الآن"]} target={TARGET.mastery} min={60} max={90} /></Card>
        <Card title="مقارنة المدارس" kicker="اختر المؤشر" action={<Segmented options={Object.entries(LABEL).map(([id, label]) => ({ id, label }))} value={metric} onChange={setMetric} />}>
          <HBars data={sorted.map((s) => ({ label: s.name, value: s[metric] }))} />
        </Card>
      </div>
      <Card className="mt" title="جدول المؤشرات" kicker="التفاصيل" flush><div className="pad">
        <DataTable dense rows={sorted} columns={[
          { key: "name", label: "المدرسة", render: (s) => <strong>{s.name}</strong> },
          ...Object.keys(TARGET).map((k) => ({ key: k, label: LABEL[k], render: (s) => <Badge tone={s[k] >= TARGET[k] ? "success" : s[k] >= TARGET[k] - 6 ? "warn" : "danger"}>{s[k]}%</Badge> })),
          { key: "students", label: "الطلاب", render: (s) => <span className="num">{fmtNum(s.students)}</span> },
        ]} /></div></Card>
    </Page>
  );
}
