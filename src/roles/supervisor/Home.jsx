import { useMemo, useState } from "react";
import { AlertTriangle, ArrowUpDown, Building2, Eye, GraduationCap, School as SchoolIcon, ShieldCheck } from "lucide-react";
import { Badge, Btn, Card, Empty, Modal, Page, Progress, Segmented, Select, Stat } from "../../ui/Primitives";
import { Ring, HBars, Bars } from "../../ui/Charts";
import { useStore } from "../../store/StoreProvider";
import { fmtNum, fmtLongDate } from "../../lib/format";

const LIC_TONE = { "نشط": "success", "تجريبي": "info", "ينتهي قريبًا": "warn" };

// لوحة الإشراف متعددة المدارس (F8.1): يرى المشرف مدارس نطاقه ومؤشراتها في لوحة واحدة
export default function SupervisorHome({ go }) {
  const { state, user } = useStore();
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState("mastery");
  const [open, setOpen] = useState(null);
  const schools = useMemo(() => state.schools.filter((s) => !stage || s.stage.includes(stage)).sort((a, b) => b[sort] - a[sort]), [state.schools, stage, sort]);
  const students = schools.reduce((a, s) => a + s.students, 0);
  const avg = (k) => (schools.length ? Math.round((schools.reduce((a, s) => a + s[k] * s.students, 0) / students) * 10) / 10 : 0);
  const atRisk = schools.filter((s) => s.mastery < 72 || s.license === "ينتهي قريبًا");
  const sel = state.schools.find((s) => s.id === open);

  return (
    <Page kicker="إدارة تعليم الرياض" title="المدارس ضمن النطاق" desc={`${fmtLongDate()} — عرض موحّد لمدارس نطاق إشرافك ومؤشراتها الرئيسية.`} icon={SchoolIcon}
      actions={<><Select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="المرحلة"><option value="">كل المراحل</option><option value="ابتدائي">ابتدائي</option><option value="متوسط">متوسط</option><option value="ثانوي">ثانوي</option></Select>
        <Segmented options={[{ id: "mastery", label: "الإتقان" }, { id: "attendance", label: "الحضور" }, { id: "students", label: "الحجم" }]} value={sort} onChange={setSort} /></>}>
      <div className="grid grid-4">
        <Stat label="مدارس ضمن النطاق" value={schools.length} icon={Building2} foot={`${fmtNum(students)} طالبًا`} />
        <Stat label="متوسط الإتقان (مرجّح)" value={avg("mastery")} unit="%" icon={GraduationCap} tone="gold" foot="المستهدف 80%" />
        <Stat label="متوسط الحضور" value={avg("attendance")} unit="%" icon={Eye} tone="blue" />
        <Stat label="مدارس تستدعي متابعة" value={atRisk.length} icon={AlertTriangle} tone="rose" foot="إتقان منخفض أو ترخيص قريب الانتهاء" />
      </div>

      <div className="school-grid mt">
        {schools.length === 0 && <Empty title="لا مدارس مطابقة" />}
        {schools.map((s, i) => (
          <button key={s.id} className="school-card" onClick={() => setOpen(s.id)}>
            <div className="row spread"><div><span className="rank num">{i + 1}</span></div><Badge tone={LIC_TONE[s.license]} dot>{s.license}</Badge></div>
            <strong>{s.name}</strong>
            <span className="muted small">{s.district} • {s.stage}</span>
            <div className="school-metrics">
              <div><Ring value={s.mastery} size={64} stroke={7} label={`إتقان ${s.name}`} /><small>الإتقان</small></div>
              <div><b className="num">{s.attendance}%</b><small>الحضور</small></div>
              <div><b className="num">{s.active}%</b><small>نشاط</small></div>
              <div><b className="num">{fmtNum(s.students)}</b><small>طالبًا</small></div>
            </div>
          </button>
        ))}
      </div>

      <Modal open={!!sel} wide onClose={() => setOpen(null)} title={sel?.name} kicker={sel?.district}
        footer={<><Btn variant="ghost" onClick={() => setOpen(null)}>إغلاق</Btn><Btn variant="primary" icon={ShieldCheck} onClick={() => { setOpen(null); go("quality"); }}>رقابة جودة هذه المدرسة</Btn></>}>
        {sel && (
          <div className="grid grid-2">
            <div className="stack-sm">
              <HBars data={[{ label: "الإتقان", value: sel.mastery }, { label: "الحضور", value: sel.attendance }, { label: "نشاط المستخدمين", value: sel.active }, { label: "اعتماد المحتوى", value: sel.approval }]} />
            </div>
            <div className="stack-sm">
              <div className="term"><strong>الحجم</strong><span>{fmtNum(sel.students)} طالبًا • {sel.teachers} معلّمًا</span></div>
              <div className="term"><strong>الترخيص</strong><span>{sel.license} • {fmtNum(sel.seats)} مقعدًا</span></div>
              <div className="term"><strong>مقارنة بمتوسط النطاق</strong><span>{sel.mastery - avg("mastery") >= 0 ? "أعلى" : "أقل"} بـ {Math.abs(Math.round((sel.mastery - avg("mastery")) * 10) / 10)} نقطة في الإتقان</span></div>
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
