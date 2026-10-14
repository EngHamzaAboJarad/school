import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { Badge, Btn, Card, DataTable, Empty, Modal, Page, SectionHeader, Segmented, Select } from "../../ui/Primitives";
import { HBars } from "../../ui/Charts";
import { FactLine, VentRow } from "../../ui/World";
import { useStore } from "../../store/StoreProvider";
import { fmtLongDate, fmtNum } from "../../lib/format";

const LIC_TONE = { "نشط": "success", "تجريبي": "info", "ينتهي قريبًا": "warn" };
const RISK_MASTERY = 72;

// مقياس من عشرة أشعّة: كل شعاع 10%، والشعاع الأخير نصفي عند الكسور
const gauge = (v, low) =>
  Array.from({ length: 10 }, (_, i) => {
    const filled = v / 10 - i;
    return { state: filled >= 1 ? (low ? "alert" : "on") : filled >= 0.5 ? "partial" : "off", title: `${v}%` };
  });

// لوحة الإشراف متعددة المدارس (F8.1): مدارس النطاق ومؤشراتها في جدول واحد يُرتَّب ويُصفّى، وما يستدعي المتابعة أولًا.
export default function SupervisorHome({ go }) {
  const { state, user } = useStore();
  const [stage, setStage] = useState("");
  const [sort, setSort] = useState("mastery");
  const [open, setOpen] = useState(null);
  const schools = useMemo(() => state.schools.filter((s) => !stage || s.stage.includes(stage)).sort((a, b) => b[sort] - a[sort]), [state.schools, stage, sort]);
  const students = schools.reduce((a, s) => a + s.students, 0);
  const avg = (k) => (students ? Math.round((schools.reduce((a, s) => a + s[k] * s.students, 0) / students) * 10) / 10 : null);
  const atRisk = schools.filter((s) => s.mastery < RISK_MASTERY || s.license === "ينتهي قريبًا");
  const sel = state.schools.find((s) => s.id === open);
  const scope = user.title?.split("—")[1]?.trim() || "نطاق الإشراف";

  return (
    <Page title="المدارس ضمن النطاق" desc={`${scope} • ${fmtLongDate()}`}>
      <FactLine
        items={[
          { label: "مدارس", value: schools.length, note: `${fmtNum(students)} طالبًا` },
          { label: "الإتقان (مرجّح بعدد الطلاب)", value: avg("mastery") != null ? `${avg("mastery")}%` : null, note: "المستهدف 80%", tone: avg("mastery") != null && avg("mastery") < 80 ? "warn" : undefined, onClick: () => go("kpis") },
          { label: "الحضور", value: avg("attendance") != null ? `${avg("attendance")}%` : null },
          { label: "تستدعي متابعة", value: atRisk.length, note: `إتقان دون ${RISK_MASTERY}% أو ترخيص ينتهي`, tone: atRisk.length ? "warn" : undefined, onClick: () => go("quality") },
        ]}
      />

      <div className="home-grid">
        {atRisk.length > 0 && (
          <Card className="span-12" aria-labelledby="sv-risk">
            <SectionHeader id="sv-risk" title="مدارس تستدعي متابعة" desc="مرتّبة حسب الإتقان" action={<Btn size="sm" variant="ghost" icon={ShieldCheck} onClick={() => go("quality")}>رقابة الجودة</Btn>} />
            <div className="sv-risk">
              {[...atRisk].sort((a, b) => a.mastery - b.mastery).map((s) => (
                <button key={s.id} className="sv-risk-item" onClick={() => setOpen(s.id)}>
                  <AlertTriangle size={16} aria-hidden="true" />
                  <span>
                    <strong>{s.name}</strong>
                    <small>{s.mastery < RISK_MASTERY ? `إتقان ${s.mastery}%` : ""}{s.mastery < RISK_MASTERY && s.license === "ينتهي قريبًا" ? " • " : ""}{s.license === "ينتهي قريبًا" ? "ترخيص ينتهي قريبًا" : ""}</small>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card flush className="span-12" aria-labelledby="sv-schools">
          <div className="pad" style={{ paddingBottom: 0 }}>
            <SectionHeader
              id="sv-schools"
              title="المدارس"
              desc="كل شعاع 10% من الإتقان • الأحمر دون حدّ المتابعة"
              action={
                <div className="filter-bar">
                  <Select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="المرحلة" style={{ width: "auto" }}>
                    <option value="">كل المراحل</option>
                    <option value="ابتدائي">ابتدائي</option>
                    <option value="متوسط">متوسط</option>
                    <option value="ثانوي">ثانوي</option>
                  </Select>
                  <Segmented options={[{ id: "mastery", label: "الإتقان" }, { id: "attendance", label: "الحضور" }, { id: "students", label: "الحجم" }]} value={sort} onChange={setSort} />
                </div>
              }
            />
          </div>
          <DataTable
            caption="مدارس النطاق"
            rows={schools}
            onRowClick={(s) => setOpen(s.id)}
            empty={<Empty compact title="لا مدارس مطابقة" desc="غيّر المرحلة المختارة." />}
            columns={[
              { key: "rank", label: "#", width: 44, render: (s) => <span className="num muted">{schools.indexOf(s) + 1}</span> },
              { key: "name", label: "المدرسة", primary: true, render: (s) => <div className="ov-cls-name"><strong>{s.name}</strong><small>{`${s.district} • ${s.stage}`}</small></div> },
              { key: "mastery", label: "الإتقان", render: (s) => (
                <div className="ov-mastery">
                  <VentRow size={11} items={gauge(s.mastery, s.mastery < RISK_MASTERY)} label={`إتقان ${s.name} ${s.mastery}%`} />
                  <span className="num">{s.mastery}%</span>
                </div>
              ) },
              { key: "attendance", label: "الحضور", num: true, render: (s) => <span className="num">{s.attendance}%</span> },
              { key: "active", label: "النشاط", num: true, render: (s) => <span className="num">{s.active}%</span> },
              { key: "students", label: "الطلاب", num: true, render: (s) => <span className="num">{fmtNum(s.students)}</span> },
              { key: "license", label: "الترخيص", render: (s) => <Badge tone={LIC_TONE[s.license]} icon={s.license === "ينتهي قريبًا" ? AlertTriangle : undefined}>{s.license}</Badge> },
            ]}
          />
        </Card>
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
              {avg("mastery") != null && (
                <div className="term"><strong>مقارنة بمتوسط النطاق</strong><span>{sel.mastery - avg("mastery") >= 0 ? "أعلى" : "أقل"} بـ {Math.abs(Math.round((sel.mastery - avg("mastery")) * 10) / 10)} نقطة في الإتقان</span></div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  );
}
