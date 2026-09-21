import { useState } from "react";
import { CalendarCheck, Check, Save } from "lucide-react";
import { Avatar, Badge, Btn, Card, Notice, Page, Select, Stat, cx } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { studentOf, classAttendanceOn, attendanceRate } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { fmtLongDate } from "../../lib/format";

export const ATT = { present: ["حاضر", "success"], absent: ["غائب", "danger"], late: ["متأخر", "warn"], excused: ["بعذر", "info"] };

// تسجيل الحضور والغياب (F7.3): يُنبَّه وليّ الأمر فور تسجيل الغياب
export default function AttendancePage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const [clsId, setClsId] = useState(classes[0]?.id);
  const cls = classes.find((c) => c.id === clsId);
  const key = dateKey(Date.now());
  const saved = state.attendance[key] || {};
  const [marks, setMarks] = useState({});
  const current = (sid) => marks[sid] ?? saved[sid];
  const counts = classAttendanceOn(state, cls, key);
  const dirty = Object.keys(marks).length > 0;
  const recent = Object.keys(state.attendance).sort().slice(-5).reverse();

  const save = () => {
    dispatch({ type: "markAttendance", date: key, marks, actor: user.id });
    const absents = Object.values(marks).filter((m) => m === "absent").length;
    toast(absents ? `حُفظ الحضور وأُنبّه أولياء ${absents} طلاب غائبين` : "حُفظ الحضور");
    setMarks({});
  };

  return (
    <Page kicker="الحضور والغياب" title="تسجيل الحضور" desc={`${fmtLongDate()} — سجّل حضور فصلك، وسيصل تنبيه فوري إلى وليّ أمر كل طالب غائب.`} icon={CalendarCheck}
      actions={<><Select value={clsId} onChange={(e) => { setClsId(e.target.value); setMarks({}); }} aria-label="الفصل">{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Btn variant="gold" icon={Save} disabled={!dirty} onClick={save}>حفظ الحضور</Btn></>}>
      <div className="grid grid-4">
        <Stat label="حاضرون" value={counts.present} icon={Check} />
        <Stat label="غائبون" value={counts.absent} tone="rose" icon={Check} />
        <Stat label="متأخرون / بعذر" value={counts.late + counts.excused} tone="gold" icon={Check} />
        <Stat label="لم يُسجَّلوا" value={counts.unmarked - Object.keys(marks).filter((s) => !saved[s]).length} tone="blue" icon={Check} foot="لهذا اليوم" />
      </div>
      <Card className="mt" title={cls.name} kicker="قائمة اليوم" action={<div className="row"><Btn size="sm" variant="ghost" onClick={() => setMarks(Object.fromEntries(cls.studentIds.map((s) => [s, "present"])))}>تحديد الكل حاضرًا</Btn></div>}>
        <div className="att-list">
          {cls.studentIds.map((sid) => {
            const cur = current(sid);
            return (
              <div className="att-row" key={sid}>
                <div className="cell-user"><Avatar name={studentOf(state, sid)?.name} size={36} /><div><strong>{studentOf(state, sid)?.name}</strong><small>حضور آخر ٣٠ يومًا: <span className="num">{attendanceRate(state, sid).rate}%</span></small></div></div>
                <div className="att-choices" role="radiogroup" aria-label="الحالة">
                  {Object.entries(ATT).map(([k, [l, t]]) => (
                    <button key={k} role="radio" aria-checked={cur === k} className={cx("att-btn", `att-${k}`, cur === k && "on")} onClick={() => setMarks({ ...marks, [sid]: k })}>{l}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="mt" title="آخر الأيام" kicker="سجلّ الفصل">
        <div className="chips">{recent.map((d) => { const c = classAttendanceOn(state, cls, d); const total = cls.studentIds.length; return <Badge key={d} tone={c.absent ? "warn" : "success"}>{d.slice(5)} • {Math.round(((c.present + c.late + c.excused) / total) * 100)}% • {c.absent} غياب</Badge>; })}</div>
        <Notice tone="info" className="mt-sm">ترتبط سجلات الحضور بتنبيهات أولياء الأمور (E9) وبتقارير الإدارة المدرسية (F7.4).</Notice>
      </Card>
    </Page>
  );
}
