import { allObjectives, studentOf, subjectOf } from "../../store/selectors";
import { CLOSE_THRESHOLD, GAP_THRESHOLD } from "../../lib/grading";
import { DAY_MS, fmtDate } from "../../lib/format";
import { dateKey } from "../../data/seed";
import { ATTENDANCE_VENT, SubjectMark, VentRow } from "../../ui/World";

// آخر n أيام دراسية (الأحد–الخميس) حتى اليوم، الأقدم أولًا
export function schoolDays(n, now = Date.now()) {
  const out = [];
  let t = now;
  while (out.length < n) {
    const d = new Date(t).getDay();
    if (d !== 5 && d !== 6) out.unshift(t);
    t -= DAY_MS;
  }
  return out;
}

const dayLabel = (t) => fmtDate(t, { weekday: "long", day: "numeric", month: "long" });

// حضور طالب واحد عبر أيام (مفاتيح yyyy-mm-dd أو طوابع زمنية)
export function attendanceVents(state, sid, days) {
  return days.map((d) => {
    const k = typeof d === "string" ? d : dateKey(d);
    const ts = typeof d === "string" ? new Date(d) : d;
    const m = state.attendance[k]?.[sid];
    return m
      ? { state: ATTENDANCE_VENT[m].state, title: `${dayLabel(ts)}: ${ATTENDANCE_VENT[m].label}` }
      : { state: "empty", title: `${dayLabel(ts)}: لم يُسجَّل` };
  });
}

// إتقان طالب حسب المادة: كوّة لكل هدف تعلّم في مواد صفّه
export function subjectMastery(state, sid) {
  const stu = studentOf(state, sid);
  const cls = state.classes.find((c) => c.id === stu?.classId);
  const grade = stu?.grade || cls?.grade;
  const objs = allObjectives(state).filter((o) => subjectOf(o.subjectId)?.grade === grade);
  const m = state.mastery[sid] || {};
  return [...new Set(objs.map((o) => o.subjectId))].map((subjectId) => {
    const list = objs.filter((o) => o.subjectId === subjectId);
    const vals = list.map((o) => m[o.id]).filter((v) => v !== undefined);
    return {
      id: subjectId,
      items: list.map((o) => {
        const v = m[o.id];
        return {
          state: v === undefined ? "empty" : v >= CLOSE_THRESHOLD ? "on" : v >= GAP_THRESHOLD ? "partial" : "alert",
          title: `${o.title}: ${v === undefined ? "لم يُقيَّم بعد" : `${v}%`}`,
        };
      }),
      avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
      assessed: vals.length,
      total: list.length,
    };
  });
}

export const MASTERY_KEY = "كوّة لكل هدف: ممتلئة متقَن • نصفها قريب • حمراء فجوة • منقّطة لم يُقيَّم";

export function SubjectMasteryWall({ rows }) {
  return (
    <div className="class-wall">
      {rows.map((s) => (
        <div className="class-wall-row" key={s.id}>
          <div className="ov-cls-name">
            <strong><SubjectMark subject={s.id} /></strong>
            <small>{`${s.assessed} من ${s.total} أهداف مُقيَّمة`}</small>
          </div>
          <VentRow size={14} items={s.items} label={`إتقان ${subjectOf(s.id)?.name}`} />
          <span className="hl-num">{s.avg == null ? "—" : `${s.avg}%`}</span>
        </div>
      ))}
    </div>
  );
}
