import { AlertTriangle, BarChart3, CalendarCheck, CheckCircle2, ClipboardCheck, FileBarChart, Info, MessageCircle } from "lucide-react";
import { Badge, Btn, Card, Empty, Page, SectionHeader } from "../../ui/Primitives";
import { FactLine, Seal, SubjectMark, VentLegend, VentRow } from "../../ui/World";
import { useStore } from "../../store/StoreProvider";
import { assignmentStatus, assignmentsForStudent, attendanceRate, lessonOf, smartAlerts, snapshot, unitOf, unreadThreads } from "../../store/selectors";
import { GAP_THRESHOLD } from "../../lib/grading";
import { fmtLongDate, relativeDay, timeAgo } from "../../lib/format";
import { ChildSwitcher, useChild } from "./shared";
import { MASTERY_KEY, SubjectMasteryWall, attendanceVents, schoolDays, subjectMastery } from "../shared/walls";

const ALERT_ICON = { danger: AlertTriangle, warn: AlertTriangle, info: Info };

// رئيسية وليّ الأمر: الابن أولًا (اختيار واضح بحالته)، ثم ما يحتاج انتباهك، ثم الحضور والإتقان والنتائج — من البيانات الفعلية فقط.
export default function ParentHome({ go }) {
  const { state, user } = useStore();
  const { kids, child, select } = useChild();
  const snap = snapshot(state, child.id);
  const att = attendanceRate(state, child.id, 20);
  const alerts = smartAlerts(state, child.id);
  const tasks = assignmentsForStudent(state, child.id);
  const open = tasks.filter((a) => ["pending", "missing"].includes(assignmentStatus(a, child.id)));
  const attempts = state.attempts.filter((a) => a.studentId === child.id).sort((a, b) => b.at - a.at);
  const unread = unreadThreads(state, user.id);
  const name = child.name.split(" ")[0];
  const days = schoolDays(10);
  const attRow = attendanceVents(state, child.id, days);
  const mastery = subjectMastery(state, child.id);

  const resultTitle = (a) => (a.kind === "lesson" ? lessonOf(state, a.refId)?.title : a.kind === "unit" ? unitOf(state, a.refId)?.title : "إعادة اختبار علاجي");
  const essayState = (a) => {
    const es = Object.values(a.essays || {});
    if (!es.length) return null;
    return es.every((e) => e.final) ? "approved" : "pending";
  };

  return (
    <Page
      title={`أهلًا ${user.name.split(" ")[0]}`}
      desc={`${fmtLongDate()} • ${kids.length} ${kids.length === 1 ? "ابن" : "أبناء"} في المنصّة`}
      actions={
        <>
          <Btn variant="ghost" icon={MessageCircle} onClick={() => go("messages")}>تواصل مع المعلّم{unread ? ` (${unread})` : ""}</Btn>
          <Btn variant="primary" icon={FileBarChart} onClick={() => go("reports")}>تقرير {name}</Btn>
        </>
      }
    >
      <ChildSwitcher kids={kids} child={child} onSelect={select} />

      <FactLine
        items={[
          { label: `إتقان ${name}`, value: snap.entries.length ? `${snap.avg}%` : null, note: `${snap.mastered} أهداف متقَنة`, tone: snap.entries.length && snap.avg < GAP_THRESHOLD ? "warn" : undefined, onClick: () => go("child") },
          { label: "الحضور (20 يومًا)", value: att.days ? `${att.rate}%` : null, note: att.days ? `${att.absent} غياب • ${att.late} تأخّر` : "لا سجلات", tone: att.absent >= 2 ? "warn" : undefined, onClick: () => go("attendance") },
          { label: "مهام مفتوحة", value: open.length, note: `من ${tasks.length} مهام`, tone: open.some((a) => assignmentStatus(a, child.id) === "missing") ? "danger" : undefined },
          { label: "تنبيهات", value: alerts.length, note: "أداء • مواعيد • حضور", tone: alerts.length ? "warn" : undefined },
        ]}
      />

      <div className="home-grid" style={{ marginTop: "var(--sp-6)" }}>
        <div className="span-7 home-col">
          <Card aria-labelledby="p-alerts">
            <SectionHeader id="p-alerts" title={`ما يحتاج انتباهك بشأن ${name}`} desc="تنبيهات محسوبة من نتائجه ومهامه وحضوره" />
            {alerts.length === 0 ? (
              <Empty compact icon={CheckCircle2} title="لا تنبيهات" desc={`أداء ${name} مستقر حاليًّا.`} />
            ) : (
              <ul className="hl">
                {alerts.map((a) => {
                  const I = ALERT_ICON[a.tone] || AlertTriangle;
                  return (
                    <li key={a.id}>
                      <span className={`row-icon tone-${a.tone === "danger" ? "danger" : a.tone === "info" ? "info" : "warn"}`} aria-hidden="true"><I size={17} /></span>
                      <div className="hl-main">
                        <strong>{a.title}</strong>
                        <span>{a.body}</span>
                      </div>
                      <div className="hl-end"><Btn size="sm" variant="ghost" onClick={() => go("child")}>التفاصيل</Btn></div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card aria-labelledby="p-results">
            <SectionHeader id="p-results" title="آخر النتائج" desc="درجات المقالي لا تُعتبر نهائية قبل اعتماد المعلّم" action={<Btn size="sm" variant="ghost" icon={BarChart3} onClick={() => go("child")}>أداء {name}</Btn>} />
            {attempts.length === 0 ? (
              <Empty compact icon={ClipboardCheck} title="لا نتائج بعد" desc="ستظهر هنا نتائج الاختبارات فور أدائها." />
            ) : (
              <ul className="hl">
                {attempts.slice(0, 5).map((a) => {
                  const es = essayState(a);
                  return (
                    <li key={a.id} className="no-icon">
                      <div className="hl-main">
                        <strong>{resultTitle(a)}</strong>
                        <span>{`${a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "علاجي" : "اختبار درس"} • ${timeAgo(a.at)}`}</span>
                      </div>
                      <div className="hl-end">
                        {es && <Seal approved={es === "approved"} compact />}
                        <span className="hl-num" style={{ color: a.score >= GAP_THRESHOLD ? "var(--c-success)" : "var(--c-warn)" }}>{a.score}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="span-5 home-col">
          <Card aria-labelledby="p-att">
            <SectionHeader id="p-att" title="حضور آخر 10 أيام دراسية" action={<Btn size="sm" variant="ghost" icon={CalendarCheck} onClick={() => go("attendance")}>السجلّ</Btn>} />
            <VentRow size={18} items={attRow} label={`حضور ${name} في آخر 10 أيام دراسية`} />
            <VentLegend items={[{ state: "on", label: "حاضر" }, { state: "partial", label: "متأخّر" }, { state: "off", label: "بعذر" }, { state: "alert", label: "غائب" }, { state: "empty", label: "لم يُسجَّل" }]} />
          </Card>

          <Card aria-labelledby="p-mastery">
            <SectionHeader id="p-mastery" title="الإتقان حسب المادة" desc={MASTERY_KEY} />
            {mastery.length ? <SubjectMasteryWall rows={mastery} /> : <Empty compact title="لا بيانات بعد" />}
          </Card>

          <Card aria-labelledby="p-tasks">
            <SectionHeader id="p-tasks" title="المهام القادمة" desc={open.length ? `${open.length} مفتوحة` : "لا مهام مفتوحة"} />
            {open.length === 0 ? (
              <Empty compact icon={CheckCircle2} title="لا مهام مفتوحة" />
            ) : (
              <ul className="hl">
                {open.map((a) => (
                  <li key={a.id} className="no-icon">
                    <div className="hl-main">
                      <strong>{a.title}</strong>
                      <span><SubjectMark subject={a.subjectId} /> • {relativeDay(a.due)}</span>
                    </div>
                    <div className="hl-end"><Badge tone={a.due < Date.now() ? "danger" : "warn"}>{a.due < Date.now() ? "متأخّر" : "مطلوب"}</Badge></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
