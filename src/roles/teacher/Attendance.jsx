import { useState } from "react";
import { BellRing, Check, CheckCheck, Clock3, RotateCcw, Save, ShieldCheck, X } from "lucide-react";
import { Avatar, Btn, Card, Empty, Page, SectionHeader, Segmented, cx } from "../../ui/Primitives";
import { FactLine, VentLegend, VentRow } from "../../ui/World";
import { useToast } from "../../ui/Brand";
import { useConfirm } from "../../ui/Confirm";
import { useStore } from "../../store/StoreProvider";
import { attendanceRate, classAttendanceOn, studentOf } from "../../store/selectors";
import { dateKey } from "../../data/seed";
import { fmtLongDate } from "../../lib/format";
import { attendanceVents } from "../shared/walls";

// يُستخدم أيضًا في صفحات أخرى (الإدارة، وليّ الأمر): التسمية ونغمة الشارة لكل حالة
export const ATT = { present: ["حاضر", "success"], absent: ["غائب", "danger"], late: ["متأخر", "warn"], excused: ["بعذر", "info"] };
const ATT_ICON = { present: Check, absent: X, late: Clock3, excused: ShieldCheck };

// تسجيل الحضور والغياب (F7.3): قائمة الفصل لليوم، وتاريخ كل طالب في آخر عشرة أيام بالأشعّة، ويُنبَّه وليّ الأمر فور حفظ الغياب.
export default function AttendancePage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const [clsId, setClsId] = useState(classes[0]?.id);
  const cls = classes.find((c) => c.id === clsId);
  const key = dateKey(Date.now());
  const saved = state.attendance[key] || {};
  const [marks, setMarks] = useState({});
  const current = (sid) => marks[sid] ?? saved[sid];
  const dirty = Object.keys(marks).length > 0;
  const days = Object.keys(state.attendance).sort().filter((k) => k !== key).slice(-9);

  if (!cls)
    return (
      <Page title="تسجيل الحضور">
        <Empty icon={ShieldCheck} title="لا فصول مسندة إليك" desc="تواصل مع إدارة المدرسة لربطك بفصل." />
      </Page>
    );

  const live = cls.studentIds.reduce((c, sid) => {
    const m = current(sid);
    c[m || "unmarked"]++;
    return c;
  }, { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 });
  const newAbsents = Object.entries(marks).filter(([sid, m]) => m === "absent" && saved[sid] !== "absent").length;

  const save = () => {
    dispatch({ type: "markAttendance", date: key, marks, actor: user.id });
    toast(newAbsents ? `حُفظ الحضور، وأُنبّه أولياء أمور ${newAbsents} ${newAbsents === 1 ? "طالب غائب" : "طلاب غائبين"}` : "حُفظ الحضور");
    setMarks({});
  };
  const switchClass = async (id) => {
    if (dirty && !(await confirm({ title: "تجاهل التغييرات؟", body: "لديك تغييرات حضور غير محفوظة في هذا الفصل. إن انتقلت الآن ستُفقد.", confirmLabel: "تجاهل والانتقال", tone: "warn" }))) return;
    setClsId(id);
    setMarks({});
  };

  return (
    <Page
      className="attendance-page"
      title="تسجيل الحضور"
      desc={`${fmtLongDate()} • يصل تنبيه فوري إلى وليّ أمر كل طالب يُسجَّل غائبًا`}
      actions={classes.length > 1 && <Segmented options={classes.map((c) => ({ id: c.id, label: c.name }))} value={clsId} onChange={switchClass} />}
    >
      <FactLine
        items={[
          { label: "حاضرون", value: live.present },
          { label: "غائبون", value: live.absent, tone: live.absent ? "danger" : undefined },
          { label: "متأخرون", value: live.late, tone: live.late ? "warn" : undefined },
          { label: "بعذر", value: live.excused },
          { label: "لم يُسجَّلوا", value: live.unmarked, note: `من ${cls.studentIds.length}`, tone: live.unmarked ? "warn" : undefined },
        ]}
      />

      <Card flush aria-labelledby="att-h">
        <div className="pad">
          <SectionHeader
            id="att-h"
            title={cls.name}
            desc={`${cls.studentIds.length} طالبًا • ${cls.room} • السجلّ: آخر ${days.length} أيام ثم اليوم`}
            action={<Btn size="sm" variant="ghost" icon={CheckCheck} onClick={() => setMarks(Object.fromEntries(cls.studentIds.filter((s) => current(s) !== "present").map((s) => [s, "present"])))}>تحديد الباقين حاضرين</Btn>}
          />
        </div>
        <ul className="roster">
          {cls.studentIds.map((sid) => {
            const cur = current(sid);
            const name = studentOf(state, sid)?.name;
            const rate = attendanceRate(state, sid);
            const hist = [...attendanceVents(state, sid, days), cur ? { state: { present: "on", late: "partial", excused: "off", absent: "alert" }[cur], title: `اليوم: ${ATT[cur][0]}` } : { state: "empty", title: "اليوم: لم يُسجَّل" }];
            return (
              <li key={sid} className={cx("roster-row", cur && `is-${cur}`, marks[sid] && marks[sid] !== saved[sid] && "is-changed")}>
                <div className="roster-who">
                  <Avatar name={name} size={34} />
                  <span>
                    <strong>{name}</strong>
                    <small>حضور آخر 30 يومًا <span className="num">{rate.rate}%</span>{rate.absent ? ` • ${rate.absent} غياب` : ""}</small>
                  </span>
                </div>
                <VentRow size={13} items={hist} label={`سجلّ حضور ${name}`} className="roster-hist" />
                <div className="att-choices" role="radiogroup" aria-label={`حالة ${name}`}>
                  {Object.entries(ATT).map(([k, [l]]) => {
                    const I = ATT_ICON[k];
                    return (
                      <button key={k} type="button" role="radio" aria-checked={cur === k} className={cx("att-choice", `att-${k}`, cur === k && "on")} onClick={() => setMarks({ ...marks, [sid]: k })}>
                        <I size={14} aria-hidden="true" />
                        {l}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="pad">
          <VentLegend items={[{ state: "on", label: "حاضر" }, { state: "partial", label: "متأخّر" }, { state: "off", label: "بعذر" }, { state: "alert", label: "غائب" }, { state: "empty", label: "لم يُسجَّل" }]} />
        </div>
      </Card>

      {dirty && (
        <div className="savebar" role="region" aria-label="تغييرات غير محفوظة">
          <span>
            <b className="num">{Object.keys(marks).length}</b> تغييرات غير محفوظة
            {newAbsents > 0 && <em><BellRing size={13} aria-hidden="true" /> سيُنبَّه {newAbsents} {newAbsents === 1 ? "وليّ أمر" : "أولياء أمور"}</em>}
          </span>
          <div className="row">
            <Btn size="sm" variant="light" icon={RotateCcw} onClick={() => setMarks({})}>تراجع</Btn>
            <Btn size="sm" variant="gold" icon={Save} onClick={save}>حفظ الحضور</Btn>
          </div>
        </div>
      )}
      {classAttendanceOn(state, cls, key).unmarked === 0 && !dirty && (
        <p className="ov-chart-note" role="status"><Check size={14} style={{ verticalAlign: "-2px", color: "var(--c-success)" }} /> سُجّل حضور هذا الفصل لليوم.</p>
      )}
    </Page>
  );
}
