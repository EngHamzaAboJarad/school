import { useMemo } from "react";
import {
  AlertTriangle, BellRing, CalendarCheck, CheckCircle2, ChevronLeft, ClipboardList, FileBarChart, FileCheck2, KeyRound, MessageCircle, ShieldCheck,
  UserCheck, UserPlus, Users, Wallet,
} from "lucide-react";
import { Badge, Btn, Card, DataTable, Empty, Page, SectionHeader, cx } from "../../ui/Primitives";
import { FactLine, SubjectMark, VentRow, VentWall } from "../../ui/World";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { attendanceRate, classAttendanceOn, classStats, unreadThreads, userName } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { users } from "../../data/people";
import { GAP_THRESHOLD } from "../../lib/grading";
import { fmtDate, fmtLongDate, fmtNum, timeAgo } from "../../lib/format";

const PRESENT = ["present", "late", "excused"];
const SEAT_WARN = 85;

// لوحة إدارة المدرسة — كل رقم مشتقّ من سجلات المخزن، وما لا بيانات له يظهر كحالة فارغة.
export default function SchoolHome({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const school = state.schools.find((s) => s.id === user.school);
  const today = dateKey(Date.now());
  const weekday = new Date().getDay();
  const schoolDay = weekday !== 5 && weekday !== 6;

  const d = useMemo(() => {
    const tracked = state.classes.filter((c) => c.subjects.some((s) => s.startsWith("S-")));
    const studentIds = [...new Set(state.classes.flatMap((c) => c.studentIds))];
    const teacherIds = new Set(state.classes.map((c) => c.teacherId));

    const dayRate = (k, ids) => {
      const marks = (ids || Object.keys(state.attendance[k] || {})).map((sid) => state.attendance[k]?.[sid]).filter(Boolean);
      return marks.length ? Math.round((marks.filter((m) => PRESENT.includes(m)).length / marks.length) * 1000) / 10 : null;
    };
    const days = Object.keys(state.attendance).sort().filter((k) => dayRate(k) !== null);
    const last10 = days.slice(-10);
    const latest = days[days.length - 1];
    const prev = days[days.length - 2];
    const latestRate = latest ? dayRate(latest) : null;
    const deltaRate = latest && prev ? Math.round((dayRate(latest) - dayRate(prev)) * 10) / 10 : null;

    // جدار الحضور: كوّة لكل يوم في كل فصل
    const wall = state.classes.map((c) => {
      const items = last10.map((k) => {
        const marks = c.studentIds.map((sid) => state.attendance[k]?.[sid]).filter(Boolean);
        const label = fmtDate(new Date(k), { weekday: "long", day: "numeric", month: "long" });
        if (!marks.length) return { state: "empty", title: `${label}: لم يُسجَّل` };
        const absent = marks.filter((m) => m === "absent").length;
        const rate = Math.round(((marks.length - absent) / marks.length) * 1000) / 10;
        const st = absent === 0 ? "on" : absent / marks.length <= 0.1 ? "partial" : "alert";
        return { state: st, title: `${label}: ${rate}% حاضرون${absent ? ` • ${absent} غياب` : ""}` };
      });
      const rates = last10.map((k) => dayRate(k, c.studentIds)).filter((v) => v !== null);
      return {
        id: c.id,
        label: c.name,
        sub: userName(state, c.teacherId),
        items,
        value: rates.length ? `${Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 10) / 10}%` : null,
      };
    });

    const stats = state.classes.map((c) => ({ cls: c, ...classStats(state, c) }));
    const rated = stats.flatMap((s) => s.rows.filter((r) => r.assessed));
    const mastery = rated.length ? Math.round(rated.reduce((a, r) => a + r.avg, 0) / rated.length) : null;
    const struggling = stats.reduce((n, s) => n + s.struggling.length, 0);

    const classRows = stats.map(({ cls, avg, rows, struggling: st }) => {
      const assessed = rows.filter((r) => r.assessed).length;
      const att = cls.studentIds.map((sid) => attendanceRate(state, sid, 14)).filter((a) => a.days > 0);
      return {
        id: cls.id,
        cls,
        teacher: userName(state, cls.teacherId),
        students: cls.studentIds.length,
        assessed,
        avg: assessed ? avg : null,
        struggling: st.length,
        vents: rows.map((r) => ({
          state: !r.assessed ? "empty" : r.avg >= GAP_THRESHOLD ? "on" : "alert",
          title: `${r.name}: ${r.assessed ? `${r.avg}%` : "لم يُقيَّم بعد"}`,
        })),
        att: att.length ? Math.round((att.reduce((a, x) => a + x.rate, 0) / att.length) * 10) / 10 : null,
      };
    });

    const unmarked = schoolDay ? tracked.filter((c) => classAttendanceOn(state, c, today).unmarked === c.studentIds.length) : [];
    const frequent = studentIds.filter((sid) => attendanceRate(state, sid, 14).absent >= 2);
    const pendingAdmin = state.directory.filter((x) => x.status === "بانتظار الاعتماد" && x.role !== "teacher");
    const pendingTeachers = state.directory.filter((x) => x.status === "بانتظار الاعتماد" && x.role === "teacher");
    const feesDue = state.teacherPayments.filter((p) => p.status === "مستحق");
    const reviewPending = state.reviewItems.filter((r) => r.status === "pending").length;
    const unread = unreadThreads(state, user.id);
    const schoolActors = new Set(users.filter((u) => u.school === user.school).map((u) => u.id));
    const activity = state.audit.filter((a) => schoolActors.has(a.actor)).slice(0, 6);

    return { tracked, studentIds, teacherIds, last10, latest, latestRate, deltaRate, wall, mastery, struggling, classRows, unmarked, frequent, pendingAdmin, pendingTeachers, feesDue, reviewPending, unread, activity };
  }, [state, user.id, user.school, today, schoolDay]);

  const seatPct = school && school.seats ? Math.round((school.students / school.seats) * 100) : null;
  const licenseOk = school?.license === "نشط";
  const feesTotal = d.feesDue.reduce((a, p) => a + p.amount, 0);

  const remind = (c) => {
    dispatch({ type: "newThread", from: user.id, to: c.teacherId, subject: "تذكير بتسجيل الحضور", text: `يرجى تسجيل حضور فصل ${c.name} لليوم.` });
    toast(`أُرسل تذكير إلى ${userName(state, c.teacherId)}`);
  };

  const actions = [
    d.pendingAdmin.length > 0 && {
      key: "approve", icon: UserCheck, tone: "warn", title: `${d.pendingAdmin.length} حسابات بانتظار اعتمادك`,
      meta: d.pendingAdmin.slice(0, 3).map((x) => x.name).join(" • "), cta: "مراجعة", run: () => go("users"),
    },
    d.unmarked.length > 0 && {
      key: "att", icon: CalendarCheck, tone: "warn", title: `حضور اليوم لم يُسجَّل في ${d.unmarked.length} ${d.unmarked.length === 1 ? "فصل" : "فصول"}`,
      meta: d.unmarked.map((c) => `${c.name} — ${userName(state, c.teacherId)}`).join(" • "),
      cta: d.unmarked.length === 1 ? "ذكّر المعلّم" : "متابعة الحضور", ctaIcon: d.unmarked.length === 1 ? BellRing : undefined,
      run: () => (d.unmarked.length === 1 ? remind(d.unmarked[0]) : go("attendance")),
    },
    seatPct !== null && (seatPct >= SEAT_WARN || !licenseOk) && {
      key: "seats", icon: KeyRound, tone: seatPct >= 95 || !licenseOk ? "danger" : "warn",
      title: !licenseOk ? `حالة الترخيص: ${school.license}` : `استُهلك ${seatPct}% من مقاعد الترخيص`,
      meta: `${fmtNum(school.students)} من ${fmtNum(school.seats)} مقعدًا`, cta: "الترخيص", run: () => go("licenses"),
    },
    d.frequent.length > 0 && {
      key: "abs", icon: AlertTriangle, tone: "danger", title: `${d.frequent.length} ${d.frequent.length === 1 ? "طالب لديه" : "طلاب لديهم"} غياب متكرّر`,
      meta: "غياب يومين فأكثر خلال آخر 14 يومًا مسجّلًا", cta: "عرض", run: () => go("attendance"),
    },
    d.feesDue.length > 0 && {
      key: "fees", icon: Wallet, tone: "info", title: `${d.feesDue.length} دفعات مستحقّة للمعلّمين`,
      meta: `الإجمالي ${fmtNum(feesTotal)} ريال`, cta: "الدفع", run: () => go("finance"),
    },
    d.unread > 0 && {
      key: "msg", icon: MessageCircle, tone: "info", title: `${d.unread} ${d.unread === 1 ? "محادثة غير مقروءة" : "محادثات غير مقروءة"}`,
      meta: "الإعلانات والرسائل", cta: "فتح", run: () => go("messages"),
    },
    d.pendingTeachers.length > 0 && {
      key: "tch", icon: UserPlus, tone: "neutral", title: `${d.pendingTeachers.length} طلبات انضمام معلّمين`,
      meta: "تُعتمَد من مدير النظام — لا إجراء مطلوب منك", info: true,
    },
    d.reviewPending > 0 && {
      key: "rev", icon: FileCheck2, tone: "neutral", title: `${d.reviewPending} عناصر محتوى بانتظار مراجعة المعلّمين`,
      meta: "لا يصل المحتوى للطلاب قبل اعتماده", info: true,
    },
  ].filter(Boolean);
  const needsYou = actions.filter((a) => !a.info).length;
  const latestLabel = d.latest ? fmtDate(new Date(d.latest), { weekday: "long", day: "numeric", month: "long" }) : null;
  const dayCols = d.last10.map((k) => fmtDate(new Date(k), { day: "numeric" }));

  return (
    <Page
      className="admin-overview"
      title="لوحة الإدارة"
      desc={`${school?.name || ""} • ${fmtLongDate()}`}
      actions={
        <>
          <Btn variant="ghost" icon={FileBarChart} onClick={() => go("reports")}>التقارير المؤسسية</Btn>
          <Btn variant="primary" icon={Users} onClick={() => go("users")}>إدارة المستخدمين</Btn>
        </>
      }
    >
      <FactLine
        items={[
          { label: "الطلاب في الفصول", value: fmtNum(d.studentIds.length), note: `${state.classes.length} فصول • ${d.teacherIds.size} معلّمين`, onClick: () => go("structure") },
          {
            label: latestLabel ? `الحضور • ${latestLabel}` : "الحضور",
            value: d.latestRate != null ? `${d.latestRate}%` : null,
            note: d.deltaRate != null ? `${d.deltaRate > 0 ? "+" : ""}${d.deltaRate}% عن اليوم السابق` : "لم يُسجَّل بعد",
            onClick: () => go("attendance"),
          },
          {
            label: "متوسط الإتقان",
            value: d.mastery != null ? `${d.mastery}%` : null,
            note: d.mastery != null ? (d.struggling ? `${d.struggling} دون ${GAP_THRESHOLD}%` : "لا متعثّرون") : "لا تقييمات بعد",
            tone: d.mastery != null && d.mastery < GAP_THRESHOLD ? "warn" : undefined,
            onClick: () => go("reports"),
          },
          {
            label: "مقاعد الترخيص",
            value: seatPct != null ? `${seatPct}%` : null,
            note: school ? `${fmtNum(school.students)} من ${fmtNum(school.seats)} • ${school.license}` : "لا بيانات ترخيص",
            tone: seatPct != null && (seatPct >= SEAT_WARN || !licenseOk) ? "warn" : undefined,
            onClick: () => go("licenses"),
          },
        ]}
      />

      <div className="ov-grid">
        <Card className="ov-actions" aria-labelledby="ov-actions-h">
          <SectionHeader
            id="ov-actions-h"
            title="قرارات اليوم"
            desc={needsYou ? `${needsYou} ${needsYou === 1 ? "بند ينتظر" : "بنود تنتظر"} قرارك أو متابعتك` : "لا بنود تنتظر قرارك"}
          />
          {actions.length === 0 ? (
            <Empty compact icon={CheckCircle2} title="لا شيء معلّق" desc="كل الطلبات معالجة والحضور مسجّل." />
          ) : (
            <ul className="ov-action-list">
              {actions.map((a) => (
                <li key={a.key} className={cx("ov-action", a.info && "is-info")}>
                  <span className={cx("row-icon", `tone-${a.tone}`)} aria-hidden="true"><a.icon size={17} /></span>
                  <div className="ov-action-copy">
                    <strong>{a.title}</strong>
                    {a.meta && <span>{a.meta}</span>}
                  </div>
                  {a.run ? (
                    <Btn size="sm" variant="ghost" icon={a.ctaIcon} iconEnd={a.ctaIcon ? undefined : ChevronLeft} onClick={a.run}>{a.cta}</Btn>
                  ) : (
                    <Badge tone="neutral">للعلم</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="ov-attendance" aria-labelledby="ov-att-h">
          <SectionHeader
            id="ov-att-h"
            title="جدار الحضور"
            desc={d.last10.length ? `كل كوّة يوم دراسي • آخر ${d.last10.length} أيام مسجّلة` : undefined}
            action={<Btn size="sm" variant="ghost" onClick={() => go("attendance")}>التفاصيل</Btn>}
          />
          {d.last10.length === 0 ? (
            <Empty compact icon={CalendarCheck} title="لا سجلات حضور بعد" desc="ستظهر الأيام هنا بعد أن يسجّل المعلّمون الحضور." />
          ) : (
            <VentWall
              caption="حضور كل فصل في آخر الأيام الدراسية المسجّلة"
              columns={dayCols}
              valueLabel="المعدّل"
              rows={d.wall}
              size={15}
              legend={[
                { state: "on", label: "حضور كامل" },
                { state: "partial", label: "غياب حتى 10%" },
                { state: "alert", label: "غياب أكثر من 10%" },
                { state: "empty", label: "لم يُسجَّل" },
              ]}
            />
          )}
          {d.last10.length > 0 && (
            <p className="ov-chart-note">
              {schoolDay
                ? d.unmarked.length
                  ? `اليوم: ${d.unmarked.length} من ${d.tracked.length} فصول لم تسجّل الحضور بعد.`
                  : "اليوم: سُجّل الحضور في كل الفصول."
                : "اليوم عطلة نهاية الأسبوع."}
            </p>
          )}
        </Card>

        <Card flush className="ov-classes" aria-labelledby="ov-cls-h">
          <div className="pad" style={{ paddingBottom: 0 }}>
            <SectionHeader
              id="ov-cls-h"
              title="الفصول"
              desc={`كل كوّة طالب: ممتلئة متقِن (${GAP_THRESHOLD}% فأكثر) • حمراء دون ذلك • منقّطة لم يُقيَّم`}
              action={<Btn size="sm" variant="ghost" onClick={() => go("structure")}>إدارة الفصول</Btn>}
            />
          </div>
          <DataTable
            caption="ملخّص الفصول"
            rows={d.classRows}
            empty={<Empty compact icon={ClipboardList} title="لا فصول بعد" desc="أنشئ الفصول من «الصفوف والجداول»." />}
            columns={[
              { key: "cls", label: "الفصل", primary: true, render: (r) => (
                <div className="ov-cls-name">
                  <strong>{r.cls.name}</strong>
                  <small>{r.teacher}</small>
                </div>
              ) },
              { key: "subjects", label: "المواد", render: (r) => (
                <div className="ov-subjects">{r.cls.subjects.map((s) => <SubjectMark key={s} subject={s} />)}</div>
              ) },
              { key: "mastery", label: "الإتقان", render: (r) => (
                <div className="ov-mastery">
                  <VentRow items={r.vents} size={12} label={`إتقان طلاب ${r.cls.name}`} />
                  <span className="num">{r.avg == null ? "—" : `${r.avg}%`}</span>
                </div>
              ) },
              { key: "struggling", label: "متعثّرون", render: (r) => r.avg == null ? <span className="muted small">لا تقييمات</span> : r.struggling
                ? <Badge tone="warn" icon={AlertTriangle}>{`${r.struggling} ${r.struggling === 1 ? "طالب" : "طلاب"}`}</Badge>
                : <Badge tone="success" icon={CheckCircle2}>لا أحد</Badge> },
              { key: "att", label: "الحضور (14 يومًا)", num: true, render: (r) => r.att == null ? <span className="muted small">لا سجلات</span> : <span className="num">{r.att}%</span> },
            ]}
          />
        </Card>

        <Card className="ov-activity" aria-labelledby="ov-act-h">
          <SectionHeader id="ov-act-h" title="آخر العمليات" desc="من سجلّ التدقيق، لحسابات المدرسة" />
          {d.activity.length === 0 ? (
            <Empty compact icon={ShieldCheck} title="لا عمليات مسجّلة" />
          ) : (
            <ol className="ov-timeline">
              {d.activity.map((a) => (
                <li key={a.id} className={cx(a.severity === "warn" && "is-warn")}>
                  <span className="ov-dot" aria-hidden="true" />
                  <div>
                    <strong>{a.action}</strong>
                    {a.severity === "warn" && <span className="sr-only"> (إجراء حسّاس)</span>}
                    <span>{a.target}</span>
                    <small>{a.actorName} • {timeAgo(a.at)}</small>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </Page>
  );
}
