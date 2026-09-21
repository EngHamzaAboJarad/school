import { useState } from "react";
import { Bell, Download, FileBarChart, FileSpreadsheet, Printer } from "lucide-react";
import { Badge, Btn, Card, ListRow, Notice, Page, Segmented, Split, Toggle } from "../../ui/Primitives";
import { HBars } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { snapshot, attendanceRate, subjectOf, assignmentsForStudent, assignmentStatus, lessonOf, unitOf } from "../../store/selectors";
import { downloadCSV, printPage } from "../../lib/export";
import { fmtDate, fmtLongDate } from "../../lib/format";
import { ChildSwitcher, useChild } from "./shared";

// التقارير الدورية والتنبيهات (F5.2 / F3.6): تقرير أسبوعي/شهري قابل للتصدير وتفضيلات القنوات
export default function ParentReports() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const { kids, child, select } = useChild();
  const [period, setPeriod] = useState("week");
  const c = state.consents[user.id] || { channels: {}, weekly: true, monthly: true };
  const snap = snapshot(state, child.id);
  const att = attendanceRate(state, child.id, period === "week" ? 5 : 20);
  const since = Date.now() - (period === "week" ? 7 : 30) * 86400000;
  const attempts = state.attempts.filter((a) => a.studentId === child.id && a.at >= since).sort((a, b) => b.at - a.at);
  const tasks = assignmentsForStudent(state, child.id);
  const doneTasks = tasks.filter((a) => ["submitted", "graded", "late"].includes(assignmentStatus(a, child.id))).length;

  const exportCsv = () => {
    downloadCSV(`تقرير-${child.name}-${period === "week" ? "أسبوعي" : "شهري"}`, [
      ["التقرير", period === "week" ? "أسبوعي" : "شهري"], ["الطالب", child.name], ["الصف", child.grade], ["التاريخ", fmtLongDate()], [],
      ["الهدف", "المادة", "الإتقان %"], ...snap.entries.map((e) => [e.title, subjectOf(e.subjectId)?.name, e.mastery]), [],
      ["الحضور %", att.rate], ["أيام الغياب", att.absent], ["مهام مسلّمة", `${doneTasks}/${tasks.length}`],
    ]);
    toast("صُدِّر التقرير (Excel/CSV)");
  };
  const setChannel = (k, v) => dispatch({ type: "setConsent", parentId: user.id, patch: { channels: { ...c.channels, [k]: v } }, action: "تغيير قناة إشعارات", target: k });

  return (
    <Page kicker="التقارير والتنبيهات" title="التقارير" desc="تقرير دوري عن أداء ابنك قابل للتصدير، وتحكّم بقنوات التنبيهات الفورية." icon={FileBarChart}
      actions={<><Btn variant="ghost" icon={FileSpreadsheet} onClick={exportCsv}>تصدير Excel</Btn><Btn variant="primary" icon={Printer} onClick={printPage}>تصدير PDF / طباعة</Btn></>}>
      <div className="row spread no-print"><ChildSwitcher kids={kids} child={child} onSelect={select} /><Segmented options={[{ id: "week", label: "أسبوعي" }, { id: "month", label: "شهري" }]} value={period} onChange={setPeriod} /></div>
      <Split className="mt">
        <div className="stack">
          <Card className="report-sheet" title={`تقرير ${period === "week" ? "أسبوعي" : "شهري"} — ${child.name}`} kicker={`${child.grade} • ${fmtLongDate()}`}>
            <div className="grid grid-3 report-kpis">
              <div className="mini-stat"><span>الإتقان العام</span><b className="num">{snap.avg}%</b></div>
              <div className="mini-stat"><span>الحضور</span><b className="num">{att.rate}%</b></div>
              <div className="mini-stat"><span>المهام المسلّمة</span><b className="num">{doneTasks}/{tasks.length}</b></div>
            </div>
            <h4 className="mt">الإتقان حسب الهدف</h4>
            <div className="mt-sm"><HBars data={snap.entries.map((e) => ({ label: e.title, value: e.mastery, sub: subjectOf(e.subjectId)?.name }))} /></div>
            <h4 className="mt">الاختبارات في الفترة</h4>
            {attempts.length === 0 ? <p className="muted">لا اختبارات في هذه الفترة.</p> : attempts.map((a) => (
              <ListRow key={a.id} title={a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : "إعادة اختبار علاجي"} meta={fmtDate(a.at)} end={<b className="num">{a.score}%</b>} />
            ))}
            <h4 className="mt">الفجوات المفتوحة</h4>
            {snap.gaps.length === 0 ? <p className="muted">لا فجوات مفتوحة.</p> : snap.gaps.map((g) => <ListRow key={g.id} title={g.title} meta={subjectOf(g.subjectId)?.name} end={<Badge tone="warn">{g.mastery}%</Badge>} />)}
          </Card>
        </div>
        <div className="stack no-print">
          <Card title="الإرسال الدوري التلقائي" kicker="تقارير تصلك دون طلب">
            <Toggle label="تقرير أسبوعي" hint="كل أحد صباحًا" checked={c.weekly !== false} onChange={(v) => dispatch({ type: "setConsent", parentId: user.id, patch: { weekly: v }, action: "تعديل جدولة التقارير", target: "أسبوعي" })} />
            <Toggle label="تقرير شهري" hint="أول كل شهر" checked={c.monthly !== false} onChange={(v) => dispatch({ type: "setConsent", parentId: user.id, patch: { monthly: v }, action: "تعديل جدولة التقارير", target: "شهري" })} />
          </Card>
          <Card title="قنوات التنبيهات الفورية" kicker="نتيجة • غياب • ملاحظة">
            <Toggle label="داخل التطبيق" checked={c.channels?.app !== false} onChange={(v) => setChannel("app", v)} />
            <Toggle label="البريد الإلكتروني" checked={!!c.channels?.email} onChange={(v) => setChannel("email", v)} />
            <Toggle label="رسالة SMS" checked={!!c.channels?.sms} onChange={(v) => setChannel("sms", v)} />
            <Toggle label="واتساب" hint="حسب الإتاحة" checked={!!c.channels?.whatsapp} onChange={(v) => setChannel("whatsapp", v)} />
            <Notice tone="info" icon={Bell}>يصلك تنبيه فوري عند نتيجة جديدة أو غياب أو ملاحظة من المعلّم عبر القنوات المفعّلة.</Notice>
          </Card>
        </div>
      </Split>
    </Page>
  );
}
