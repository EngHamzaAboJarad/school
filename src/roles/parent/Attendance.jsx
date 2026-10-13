import { useState } from "react";
import { Send } from "lucide-react";
import { Btn, Card, Empty, Field, Modal, Notice, Page, Textarea, cx } from "../../ui/Primitives";
import { ATTENDANCE_VENT, FactLine, Vent, VentLegend } from "../../ui/World";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { attendanceRate, weekStart } from "../../store/selectors";
import { WEEKDAYS } from "../../data/people";
import { fmtDate } from "../../lib/format";
import { ChildSwitcher, useChild } from "./shared";

// الحضور والغياب (F7.3): يرى وليّ الأمر سجلّ ابنه أسبوعًا بأسبوع (كوّة لكل يوم)، ويُنبَّه فورًا عند الغياب، ويرسل تبريرًا للإدارة.
export default function ParentAttendance() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const { kids, child, select } = useChild();
  const att = attendanceRate(state, child.id, 30);
  const days = Object.keys(state.attendance).sort().slice(-20);
  const absent = days.filter((d) => state.attendance[d][child.id] === "absent");
  const [justify, setJustify] = useState(false);
  const [reason, setReason] = useState("");
  const first = child.name.split(" ")[0];

  // تجميع الأيام في أسابيع دراسية (الأحد–الخميس)، الأحدث أولًا
  const weeks = [];
  days.forEach((d) => {
    const ts = new Date(d).getTime();
    const wk = weekStart(ts);
    let w = weeks.find((x) => x.start === wk);
    if (!w) weeks.push((w = { start: wk, days: {} }));
    w.days[new Date(d).getDay()] = d;
  });
  weeks.sort((a, b) => b.start - a.start);

  const send = () => {
    dispatch({ type: "newThread", from: user.id, to: "adm-school", subject: `تبرير غياب ${child.name}`, text: `التواريخ: ${absent.join("، ")}.\nالسبب: ${reason.trim()}` });
    toast("أُرسل تبرير الغياب إلى الإدارة");
    setJustify(false);
    setReason("");
  };

  return (
    <Page title="الحضور والغياب" desc="سجلّ الحضور اليومي، وتصلك رسالة فورية عند تسجيل أي غياب.">
      <ChildSwitcher kids={kids} child={child} onSelect={select} compact />

      <FactLine
        items={[
          { label: "نسبة الحضور", value: att.days ? `${att.rate}%` : null, note: att.days ? `${att.rate >= 95 ? "ممتاز" : att.rate >= 90 ? "جيد" : "يحتاج متابعة"} • آخر ${att.days} يومًا` : "لا سجلات" },
          { label: "أيام الغياب", value: att.absent, tone: att.absent ? "danger" : undefined },
          { label: "مرات التأخّر", value: att.late, tone: att.late ? "warn" : undefined },
          { label: "أيام مسجّلة", value: att.days },
        ]}
      />

      {absent.length > 0 && (
        <Notice tone="warn" title={`${absent.length} ${absent.length === 1 ? "يوم غياب" : "أيام غياب"} في آخر 20 يومًا دراسيًّا`} action={<Btn size="sm" variant="primary" icon={Send} onClick={() => setJustify(true)}>أرسل تبرير الغياب</Btn>}>
          يمكنك إرسال عذر الغياب إلى إدارة المدرسة لتسجيله.
        </Notice>
      )}

      <Card className="mt" title={`سجلّ ${first} أسبوعًا بأسبوع`} kicker="آخر 20 يومًا دراسيًّا • الأحدث أولًا">
        {weeks.length === 0 ? (
          <Empty compact title="لا سجلات حضور بعد" />
        ) : (
          <div className="att-cal" role="table" aria-label={`سجلّ حضور ${child.name}`}>
            <div className="att-cal-row att-cal-head" role="row">
              <span role="columnheader">الأسبوع</span>
              {WEEKDAYS.map((w) => <span key={w} role="columnheader">{w}</span>)}
            </div>
            {weeks.map((w) => (
              <div className="att-cal-row" role="row" key={w.start}>
                <span className="att-cal-week" role="rowheader">{fmtDate(w.start, { day: "numeric", month: "short" })}</span>
                {[0, 1, 2, 3, 4].map((i) => {
                  const d = w.days[i];
                  const st = d ? state.attendance[d][child.id] : null;
                  const v = st ? ATTENDANCE_VENT[st] : null;
                  return (
                    <span key={i} role="cell" className={cx("att-cal-day", st && `is-${st}`)} title={d ? `${fmtDate(new Date(d), { weekday: "long", day: "numeric", month: "long" })}: ${v?.label || "لم يُسجَّل"}` : undefined}>
                      {d ? (
                        <>
                          <Vent state={v ? v.state : "empty"} size={16} />
                          <b>{v?.label || "لم يُسجَّل"}</b>
                          <small className="num">{fmtDate(new Date(d), { day: "numeric" })}</small>
                        </>
                      ) : (
                        <small className="muted">—</small>
                      )}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <VentLegend items={[{ state: "on", label: "حاضر" }, { state: "partial", label: "متأخّر" }, { state: "off", label: "بعذر" }, { state: "alert", label: "غائب" }, { state: "empty", label: "لم يُسجَّل" }]} />
      </Card>

      <Modal open={justify} onClose={() => setJustify(false)} title="تبرير الغياب" kicker={child.name}
        footer={<><Btn variant="ghost" onClick={() => setJustify(false)}>إلغاء</Btn><Btn variant="primary" icon={Send} disabled={!reason.trim()} onClick={send}>إرسال إلى الإدارة</Btn></>}>
        <div className="stack">
          <p className="muted small">التواريخ: {absent.map((d) => fmtDate(new Date(d), { day: "numeric", month: "long" })).join("، ")}</p>
          <Field label="سبب الغياب"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب سبب غياب ابنك خلال هذه الفترة…" autoFocus /></Field>
        </div>
      </Modal>
    </Page>
  );
}
