import { CalendarDays } from "lucide-react";
import { Badge, Card, Empty, Page, cx } from "../../ui/Primitives";
import { useStore } from "../../store/StoreProvider";
import { weekPlan, userName } from "../../store/selectors";
import { PERIODS } from "../../data/people";

const addMinutes = (hhmm, mins) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};
const periodEnd = (i) => PERIODS[i + 1] || addMinutes(PERIODS[i], 45);
const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

// الجدول الأسبوعي (F4.1): تقويم حصص المواد المسجَّلة بمواعيدها الكاملة (من–إلى)
export default function SchedulePage() {
  const { state, user } = useStore();
  const week = weekPlan(state, user.id);
  const today = week.find((d) => d.today);
  const now = nowHM();

  return (
    <Page kicker="جدولي" title="الجدول الأسبوعي" desc="مواعيد حصصك للمواد المسجَّلة، من بداية كل حصة إلى نهايتها." icon={CalendarDays}>
      <div className="stack">
        <Card title="حصص اليوم" kicker={today ? today.label : "عطلة نهاية الأسبوع"} tone="gold">
          {!today || today.classes.length === 0 ? (
            <Empty icon={CalendarDays} title="لا حصص اليوم" desc="استمتع بيومك، أو راجع مسارك الدراسي." />
          ) : (
            <div className="periods">
              {today.classes.map((c, i) => {
                const end = periodEnd(i);
                const live = now >= c.time && now < end;
                return (
                  <div key={i} className={cx("period", live && "live")}>
                    <span className="num">{c.time} – {end}</span>
                    <b>{c.subject}</b>
                    <small>{userName(state, c.teacherId)}</small>
                    {live && <Badge tone="gold" dot>الآن</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="الأسبوع كاملًا" kicker="الأحد – الخميس">
          <div className="tt-wrap">
            <table className="tt">
              <thead>
                <tr><th />{PERIODS.map((p, i) => <th key={p}><span className="num">{p}–{periodEnd(i)}</span><small>الحصة {i + 1}</small></th>)}</tr>
              </thead>
              <tbody>
                {week.map((d) => (
                  <tr key={d.label} className={d.today ? "tt-today" : ""}>
                    <th>{d.label}</th>
                    {PERIODS.map((_, pi) => {
                      const c = d.classes[pi];
                      return (
                        <td key={pi}>
                          <div className={cx("tt-cell", "readonly", !c && "empty")}>
                            {c ? <><b>{c.subject}</b><small>{userName(state, c.teacherId)}</small></> : <b>—</b>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </Page>
  );
}
