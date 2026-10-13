import { useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, Download } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Page, SectionHeader, Segmented } from "../../ui/Primitives";
import { FactLine, VentLegend, VentWall } from "../../ui/World";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { attendanceRate, classAttendanceOn, studentOf, userName } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { downloadCSV } from "../../lib/export";
import { fmtDate, fmtLongDate } from "../../lib/format";
import { attendanceVents } from "../shared/walls";

const PRESENT = ["present", "late", "excused"];

// الحضور والغياب على مستوى المدرسة (F7.3): جدار حضور لكل طالب، وحالة اليوم لكل فصل، والغيابات المتكرّرة — مرتبط بتنبيهات أولياء الأمور.
export default function SchoolAttendance() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const today = dateKey(Date.now());
  const tracked = state.classes.filter((c) => c.subjects.some((s) => s.startsWith("S-")));
  const [clsId, setClsId] = useState("all");
  const days = Object.keys(state.attendance).sort().slice(-10);
  const rate = (d) => {
    const m = Object.values(state.attendance[d] || {});
    return m.length ? Math.round((m.filter((x) => PRESENT.includes(x)).length / m.length) * 1000) / 10 : null;
  };
  const todayRows = tracked.map((c) => ({ id: c.id, cls: c, ...classAttendanceOn(state, c, today) }));
  const absentToday = tracked.flatMap((c) => c.studentIds.filter((s) => state.attendance[today]?.[s] === "absent"));
  const lateToday = todayRows.reduce((a, r) => a + r.late + r.excused, 0);
  const unmarkedClasses = todayRows.filter((r) => r.unmarked === r.cls.studentIds.length);
  const frequent = state.classes
    .flatMap((c) => c.studentIds.map((s) => ({ id: s, cls: c })))
    .map((r) => ({ ...r, name: studentOf(state, r.id)?.name, ...attendanceRate(state, r.id, 14) }))
    .filter((r) => r.absent >= 2)
    .sort((a, b) => b.absent - a.absent);
  const shown = clsId === "all" ? state.classes : state.classes.filter((c) => c.id === clsId);

  const remind = (c) => {
    dispatch({ type: "newThread", from: user.id, to: c.teacherId, subject: "تذكير بتسجيل الحضور", text: `يرجى تسجيل حضور فصل ${c.name} لليوم.` });
    toast(`أُرسل تذكير إلى ${userName(state, c.teacherId)}`);
  };
  const exportCsv = () => {
    downloadCSV("حضور-المدرسة", [["اليوم", "نسبة الحضور %"], ...days.map((d) => [d, rate(d) ?? ""])]);
    toast("صُدِّر تقرير الحضور");
  };

  return (
    <Page
      title="الحضور والغياب"
      desc={`${fmtLongDate()} • يُنبَّه وليّ أمر كل طالب غائب فور تسجيل غيابه`}
      actions={<Btn variant="ghost" icon={Download} onClick={exportCsv}>تصدير Excel</Btn>}
    >
      <FactLine
        items={[
          { label: "حاضرون اليوم", value: todayRows.reduce((a, r) => a + r.present, 0) },
          { label: "غائبون اليوم", value: absentToday.length, tone: absentToday.length ? "danger" : undefined, note: absentToday.length ? "أُبلغ أولياء أمورهم" : undefined },
          { label: "متأخرون أو بعذر", value: lateToday },
          { label: "فصول لم تسجّل اليوم", value: unmarkedClasses.length, note: `من ${tracked.length}`, tone: unmarkedClasses.length ? "warn" : undefined },
          { label: "غيابات متكرّرة", value: frequent.length, note: "يومان فأكثر في 14 يومًا", tone: frequent.length ? "warn" : undefined },
        ]}
      />

      <div className="home-grid">
        <Card className="span-7" aria-labelledby="sa-today">
          <SectionHeader id="sa-today" title="تسجيل اليوم حسب الفصل" desc="يسجّل المعلّم الحضور من صفحته؛ ذكّره إن تأخّر" />
          <DataTable
            dense
            caption="حالة تسجيل الحضور اليوم"
            rows={todayRows}
            columns={[
              { key: "cls", label: "الفصل", primary: true, render: (r) => <div className="ov-cls-name"><strong>{r.cls.name}</strong><small>{userName(state, r.cls.teacherId)}</small></div> },
              { key: "present", label: "حاضر", num: true, render: (r) => <span className="num">{r.present}</span> },
              { key: "absent", label: "غائب", num: true, render: (r) => <span className="num" style={{ color: r.absent ? "var(--c-danger)" : undefined }}>{r.absent}</span> },
              { key: "late", label: "متأخر/بعذر", num: true, render: (r) => <span className="num">{r.late + r.excused}</span> },
              { key: "st", label: "التسجيل", align: "end", render: (r) => r.unmarked === r.cls.studentIds.length
                ? <Btn size="sm" variant="ghost" icon={BellRing} onClick={() => remind(r.cls)}>ذكّر المعلّم</Btn>
                : r.unmarked > 0 ? <Badge tone="warn" icon={AlertTriangle}>{`ناقص ${r.unmarked}`}</Badge> : <Badge tone="success" icon={CheckCircle2}>مُسجَّل</Badge> },
            ]}
          />
        </Card>

        <Card className="span-5" aria-labelledby="sa-freq">
          <SectionHeader id="sa-freq" title="غيابات متكرّرة" desc="تستدعي تواصلًا مع وليّ الأمر" />
          {frequent.length === 0 ? (
            <Empty compact icon={CheckCircle2} title="لا غيابات متكرّرة" />
          ) : (
            <ul className="hl">
              {frequent.map((r) => (
                <li key={r.id}>
                  <Avatar name={r.name} size={32} />
                  <div className="hl-main"><strong>{r.name}</strong><span>{`${r.cls.name} • حضور ${r.rate}%`}</span></div>
                  <div className="hl-end"><Badge tone="danger" icon={AlertTriangle}>{`${r.absent} غياب`}</Badge></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="span-12" aria-labelledby="sa-wall">
          <SectionHeader
            id="sa-wall"
            title="جدار الحضور"
            desc={days.length ? `كوّة لكل يوم دراسي • من ${fmtDate(new Date(days[0]), { day: "numeric", month: "long" })} إلى ${fmtDate(new Date(days[days.length - 1]), { day: "numeric", month: "long" })}` : undefined}
            action={state.classes.length > 1 && <Segmented options={[{ id: "all", label: "كل الفصول" }, ...state.classes.map((c) => ({ id: c.id, label: c.name }))]} value={clsId} onChange={setClsId} />}
          />
          {days.length === 0 ? (
            <Empty compact title="لا سجلات حضور بعد" />
          ) : (
            <div className="sa-walls">
              {shown.map((c) => (
                <section key={c.id} className="sa-wall" aria-label={c.name}>
                  <h3>{c.name} <small>{userName(state, c.teacherId)}</small></h3>
                  <VentWall
                    columns={days.map((k) => fmtDate(new Date(k), { day: "numeric" }))}
                    valueLabel="الحضور"
                    size={14}
                    rows={c.studentIds.map((sid) => {
                      const r = attendanceRate(state, sid, 10);
                      return { id: sid, label: studentOf(state, sid)?.name, items: attendanceVents(state, sid, days), value: r.days ? `${r.rate}%` : null };
                    })}
                  />
                </section>
              ))}
            </div>
          )}
          <VentLegend items={[{ state: "on", label: "حاضر" }, { state: "partial", label: "متأخّر" }, { state: "off", label: "بعذر" }, { state: "alert", label: "غائب" }, { state: "empty", label: "لم يُسجَّل" }]} />
        </Card>
      </div>
    </Page>
  );
}
