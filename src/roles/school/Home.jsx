import { useMemo } from "react";
import {
  AlertTriangle, BellRing, CalendarCheck, ChevronLeft, ClipboardList, FileBarChart, GraduationCap, KeyRound, MessageCircle, ShieldCheck,
  Target, UserCheck, UserPlus, Users, Wallet, CheckCircle2, FileCheck2,
} from "lucide-react";
import { Badge, Btn, Card, DataTable, Empty, MetricCard, Page, Progress, SectionHeader, StatusBadge, cx } from "../../ui/Primitives";
import { Bars, masteryTone } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { attendanceRate, classAttendanceOn, classStats, unreadThreads, userName } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { users } from "../../data/people";
import { GAP_THRESHOLD } from "../../lib/grading";
import { fmtDate, fmtLongDate, fmtNum, timeAgo } from "../../lib/format";

// الحالات التي تُحتسب حضورًا (نفس تعريف attendanceRate)
const PRESENT = ["present", "late", "excused"];
const SEAT_WARN = 85;

// لوحة إدارة المدرسة: كل رقم هنا مشتقّ من سجلات المخزن (الحضور، قوائم الفصول، الإتقان، الطلبات، السجلّ)،
// ولا يُعرض رقم ثابت. ما لا تتوفّر له بيانات يظهر كحالة فارغة.
export default function SchoolHome({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const school = state.schools.find((s) => s.id === user.school);
  const today = dateKey(Date.now());
  const weekday = new Date().getDay(); // 5 الجمعة، 6 السبت
  const schoolDay = weekday !== 5 && weekday !== 6;

  const d = useMemo(() => {
    // الفصول التي يُسجَّل لها الحضور يوميًّا (نفس ما تعتمده صفحة الحضور)
    const tracked = state.classes.filter((c) => c.subjects.some((s) => s.startsWith("S-")));
    const studentIds = [...new Set(state.classes.flatMap((c) => c.studentIds))];
    const teacherIds = new Set(state.classes.map((c) => c.teacherId));

    // الحضور حسب الأيام المسجّلة
    const dayRate = (k) => {
      const marks = Object.values(state.attendance[k] || {});
      return marks.length ? Math.round((marks.filter((m) => PRESENT.includes(m)).length / marks.length) * 1000) / 10 : null;
    };
    const days = Object.keys(state.attendance).sort().filter((k) => dayRate(k) !== null);
    const last10 = days.slice(-10);
    const latest = days[days.length - 1];
    const prev = days[days.length - 2];
    const latestRate = latest ? dayRate(latest) : null;
    const deltaRate = latest && prev ? Math.round((dayRate(latest) - dayRate(prev)) * 10) / 10 : null;

    // الإتقان: متوسط الطلاب المُقيَّمين في كل الفصول
    const stats = state.classes.map((c) => ({ cls: c, ...classStats(state, c) }));
    const rated = stats.flatMap((s) => s.rows.filter((r) => r.assessed));
    const mastery = rated.length ? Math.round(rated.reduce((a, r) => a + r.avg, 0) / rated.length) : null;
    const struggling = stats.reduce((n, s) => n + s.struggling.length, 0);

    // جدول الفصول
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
        att: att.length ? Math.round((att.reduce((a, x) => a + x.rate, 0) / att.length) * 10) / 10 : null,
      };
    });

    // حضور اليوم
    const unmarked = schoolDay ? tracked.filter((c) => classAttendanceOn(state, c, today).unmarked === c.studentIds.length) : [];
    const frequent = studentIds.filter((sid) => attendanceRate(state, sid, 14).absent >= 2);

    // الطلبات والمستحقّات
    const pendingAdmin = state.directory.filter((x) => x.status === "بانتظار الاعتماد" && x.role !== "teacher");
    const pendingTeachers = state.directory.filter((x) => x.status === "بانتظار الاعتماد" && x.role === "teacher");
    const feesDue = state.teacherPayments.filter((p) => p.status === "مستحق");
    const reviewPending = state.reviewItems.filter((r) => r.status === "pending").length;
    const unread = unreadThreads(state, user.id);

    // سجلّ العمليات: من حسابات هذه المدرسة فقط
    const schoolActors = new Set(users.filter((u) => u.school === user.school).map((u) => u.id));
    const activity = state.audit.filter((a) => schoolActors.has(a.actor)).slice(0, 6);

    return { tracked, studentIds, teacherIds, last10, dayRate, latest, latestRate, deltaRate, mastery, struggling, classRows, unmarked, frequent, pendingAdmin, pendingTeachers, feesDue, reviewPending, unread, activity };
  }, [state, user.id, user.school, today, schoolDay]);

  const seatPct = school && school.seats ? Math.round((school.students / school.seats) * 100) : null;
  const licenseOk = school?.license === "نشط";
  const feesTotal = d.feesDue.reduce((a, p) => a + p.amount, 0);

  const remind = (c) => {
    dispatch({ type: "newThread", from: user.id, to: c.teacherId, subject: "تذكير بتسجيل الحضور", text: `يرجى تسجيل حضور فصل ${c.name} لليوم.` });
    toast(`أُرسل تذكير إلى ${userName(state, c.teacherId)}`);
  };

  // قائمة «يحتاج إلى إجراء» — مرتّبة: ما يتطلّب قرارك أولًا ثم المتابعة ثم المعلومات
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

  return (
    <Page
      className="admin-overview"
      title="لوحة الإدارة"
      desc={`${school?.name || ""} — ${fmtLongDate()}`}
      actions={
        <>
          <Btn variant="ghost" icon={FileBarChart} onClick={() => go("reports")}>التقارير المؤسسية</Btn>
          <Btn variant="primary" icon={Users} onClick={() => go("users")}>إدارة المستخدمين</Btn>
        </>
      }
    >
      <section className="ov-metrics" aria-label="المؤشّرات الرئيسية">
        <MetricCard
          label="الطلاب في الفصول"
          value={fmtNum(d.studentIds.length)}
          icon={GraduationCap}
          foot={`${state.classes.length} فصول • ${d.teacherIds.size} معلّمين مسؤولين`}
          onClick={() => go("structure")}
        />
        <MetricCard
          label="نسبة الحضور"
          value={d.latestRate}
          unit="%"
          icon={CalendarCheck}
          emptyText="لم يُسجَّل حضور بعد"
          delta={d.deltaRate != null ? { value: d.deltaRate, unit: "%", label: "عن اليوم السابق" } : null}
          foot={latestLabel ? `آخر يوم مسجّل: ${latestLabel}` : undefined}
          onClick={() => go("attendance")}
        />
        <MetricCard
          label="متوسط الإتقان"
          value={d.mastery}
          unit="%"
          icon={Target}
          emptyText="لا تقييمات بعد"
          tone={d.mastery != null && d.mastery < GAP_THRESHOLD ? "warn" : undefined}
          foot={d.mastery != null ? (d.struggling ? `${d.struggling} ${d.struggling === 1 ? "طالب" : "طلاب"} دون ${GAP_THRESHOLD}%` : "لا طلاب متعثّرون") : undefined}
          onClick={() => go("reports")}
        />
        <MetricCard
          label="مقاعد الترخيص المستخدمة"
          value={seatPct}
          unit="%"
          icon={KeyRound}
          emptyText="لا بيانات ترخيص"
          tone={seatPct != null && (seatPct >= SEAT_WARN || !licenseOk) ? "warn" : undefined}
          meter={seatPct != null ? { value: seatPct, tone: seatPct >= SEAT_WARN ? "warn" : "brand", label: "استهلاك المقاعد" } : undefined}
          foot={school ? `${fmtNum(school.students)} من ${fmtNum(school.seats)} • الترخيص ${school.license}` : undefined}
          onClick={() => go("licenses")}
        />
      </section>

      <div className="ov-grid">
        <Card className="ov-actions" aria-labelledby="ov-actions-h">
          <SectionHeader
            id="ov-actions-h"
            title="يحتاج إلى إجراء"
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
            title="الحضور اليومي"
            desc={d.last10.length ? `نسبة الحاضرين في آخر ${d.last10.length} أيام دراسية مسجّلة (${fmtDate(new Date(d.last10[0]), { day: "numeric", month: "short" })} – ${fmtDate(new Date(d.last10[d.last10.length - 1]), { day: "numeric", month: "short" })})` : undefined}
            action={<Btn size="sm" variant="ghost" onClick={() => go("attendance")}>التفاصيل</Btn>}
          />
          {d.last10.length === 0 ? (
            <Empty compact icon={CalendarCheck} title="لا سجلات حضور بعد" desc="ستظهر النسب هنا بعد أن يسجّل المعلّمون الحضور." />
          ) : (
            <>
              <Bars
                height={160}
                unit="%"
                valueLabels="last"
                data={d.last10.map((k, i) => ({
                  label: fmtDate(new Date(k), { day: "numeric" }),
                  value: d.dayRate(k),
                  tone: i === d.last10.length - 1 ? "brand" : "brand-soft",
                  title: `${fmtDate(new Date(k), { weekday: "long", day: "numeric", month: "long" })}: ${d.dayRate(k)}%`,
                }))}
              />
              <p className="ov-chart-note">
                {schoolDay
                  ? d.unmarked.length
                    ? `اليوم: ${d.unmarked.length} من ${d.tracked.length} فصول لم تسجّل الحضور بعد.`
                    : "اليوم: سُجّل الحضور في كل الفصول."
                  : "اليوم عطلة نهاية الأسبوع."}
              </p>
            </>
          )}
        </Card>

        <Card flush className="ov-classes" aria-labelledby="ov-cls-h">
          <div className="pad" style={{ paddingBottom: 0 }}>
            <SectionHeader
              id="ov-cls-h"
              title="الفصول"
              desc="الإتقان من نتائج الاختبارات المعتمدة • الحضور لآخر 14 يومًا مسجّلًا"
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
              { key: "students", label: "الطلاب", num: true, render: (r) => <span className="num">{r.students}</span> },
              { key: "avg", label: "الإتقان", render: (r) => r.avg == null ? (
                <span className="muted small">لا تقييمات بعد</span>
              ) : (
                <div className="ov-meter">
                  <Progress value={r.avg} tone={masteryTone(r.avg)} size="sm" label={`إتقان ${r.cls.name}`} />
                  <span className="num">{r.avg}%</span>
                </div>
              ) },
              { key: "struggling", label: "متعثّرون", render: (r) => r.avg == null ? <span className="muted">—</span> : r.struggling
                ? <StatusBadge tone="warn" icon={AlertTriangle}>{`${r.struggling} ${r.struggling === 1 ? "طالب" : "طلاب"}`}</StatusBadge>
                : <StatusBadge tone="success">لا أحد</StatusBadge> },
              { key: "att", label: "الحضور", num: true, render: (r) => r.att == null ? <span className="muted small">لا سجلات</span> : <span className="num">{r.att}%</span> },
            ]}
          />
        </Card>

        <Card className="ov-activity" aria-labelledby="ov-act-h">
          <SectionHeader id="ov-act-h" title="آخر العمليات" desc="إجراءات حسابات المدرسة الموثّقة في سجلّ التدقيق" />
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
