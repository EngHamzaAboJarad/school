import { AlertTriangle, BarChart3, Bell, CalendarCheck, CheckCircle2, ChevronLeft, ClipboardCheck, GraduationCap, MessageCircle, Target } from "lucide-react";
import { Badge, Btn, Card, Empty, ListRow, Notice, Page, Split, Stat } from "../../ui/Primitives";
import { Ring, HBars } from "../../ui/Charts";
import { useStore } from "../../store/StoreProvider";
import { snapshot, attendanceRate, smartAlerts, assignmentsForStudent, assignmentStatus, subjectOf, userName, unreadThreads, lessonOf, unitOf } from "../../store/selectors";
import { fmtLongDate, relativeDay, timeAgo } from "../../lib/format";
import { ChildSwitcher, useChild } from "./shared";

// الرئيسية: متابعة الأبناء المتعدّدين والتنبيهات الذكية (F5.1 / F9.3)
export default function ParentHome({ go }) {
  const { state, user } = useStore();
  const { kids, child, select } = useChild();
  const snap = snapshot(state, child.id);
  const att = attendanceRate(state, child.id, 20);
  const alerts = smartAlerts(state, child.id);
  const tasks = assignmentsForStudent(state, child.id);
  const open = tasks.filter((a) => ["pending", "missing"].includes(assignmentStatus(a, child.id)));
  const attempts = state.attempts.filter((a) => a.studentId === child.id).sort((a, b) => b.at - a.at);
  const subs = Object.entries(snap.subjectAvg);
  const first = user.name.split(" ")[0];

  return (
    <Page>
      <section className="hero">
        <div>
          <span className="kicker"><GraduationCap size={14} /> {fmtLongDate()}</span>
          <h2>أهلًا {first}، <em>هذه صورة أبنائك اليوم</em></h2>
          <p>{alerts.length ? `لديك ${alerts.length} تنبيهات ذكية بشأن ${child.name.split(" ")[0]} تستحق الانتباه.` : `أداء ${child.name.split(" ")[0]} مستقر ولا تنبيهات حاليًّا.`}</p>
          <div className="hero-actions">
            <Btn variant="gold" size="lg" icon={BarChart3} onClick={() => go("child")}>تفاصيل أداء {child.name.split(" ")[0]}</Btn>
            <Btn variant="light" icon={MessageCircle} onClick={() => go("messages")}>تواصل مع المعلّم {unreadThreads(state, user.id) > 0 && `(${unreadThreads(state, user.id)})`}</Btn>
          </div>
        </div>
        <div className="hero-side"><Ring value={snap.avg} size={150} stroke={12} tone="gold" label="متوسط الإتقان" sub={child.name.split(" ")[0]} /></div>
      </section>

      <ChildSwitcher kids={kids} child={child} onSelect={select} />

      <div className="grid grid-4 mt">
        <Stat label="متوسط الإتقان" value={snap.avg} unit="%" icon={Target} foot={`${snap.mastered} أهداف متقنة`} />
        <Stat label="الحضور (٢٠ يومًا)" value={att.rate} unit="%" icon={CalendarCheck} tone="blue" foot={`${att.absent} غياب • ${att.late} تأخر`} />
        <Stat label="مهام مفتوحة" value={open.length} icon={ClipboardCheck} tone="gold" foot={`من ${tasks.length} مهام`} />
        <Stat label="تنبيهات ذكية" value={alerts.length} icon={Bell} tone="rose" foot="أداء • مواعيد • حضور" />
      </div>

      <Split className="mt">
        <div className="stack">
          <Card title="تنبيهات تحتاج انتباهك" kicker="تنبيهات ذكية">
            {alerts.length === 0 && <Notice tone="success" icon={CheckCircle2}>لا تنبيهات — كل شيء على ما يرام.</Notice>}
            {alerts.map((a) => <ListRow key={a.id} icon={AlertTriangle} tone={a.tone === "danger" ? "danger" : a.tone === "info" ? "info" : "warn"} title={a.title} meta={a.body} end={<Btn size="sm" variant="ghost" onClick={() => go("child")}>التفاصيل</Btn>} />)}
          </Card>
          <Card title="آخر نتائج الاختبارات" kicker={child.name}>
            {attempts.length === 0 && <Empty title="لا نتائج بعد" />}
            {attempts.slice(0, 4).map((a) => (
              <ListRow key={a.id} icon={ClipboardCheck} tone={a.score >= 70 ? "success" : "warn"}
                title={a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : "إعادة اختبار علاجي"}
                meta={`${a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "علاجي" : "اختبار درس"} • ${timeAgo(a.at)}`} end={<b className="num">{a.score}%</b>} />
            ))}
          </Card>
        </div>
        <div className="stack">
          <Card title="الإتقان حسب المادة" kicker={child.grade}>
            <HBars data={subs.map(([id, v]) => ({ label: subjectOf(id)?.name, value: v }))} />
            {subs.length === 0 && <Empty title="لا بيانات بعد" />}
          </Card>
          <Card title="المهام القادمة" kicker="الواجبات">
            {open.length === 0 && <p className="muted">لا مهام مفتوحة.</p>}
            {open.map((a) => <ListRow key={a.id} icon={ClipboardCheck} tone={subjectOf(a.subjectId)?.tone} title={a.title} meta={`${subjectOf(a.subjectId)?.name} • ${relativeDay(a.due)}`} end={<Badge tone={a.due < Date.now() ? "danger" : "warn"}>{a.due < Date.now() ? "متأخر" : "مطلوب"}</Badge>} />)}
          </Card>
        </div>
      </Split>
    </Page>
  );
}
