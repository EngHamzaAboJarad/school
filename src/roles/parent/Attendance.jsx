import { useState } from "react";
import { CalendarCheck, Send } from "lucide-react";
import { Badge, Btn, Card, Field, Modal, Notice, Page, Stat, Textarea, cx } from "../../ui/Primitives";
import { Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { attendanceRate } from "../../store/selectors";
import { fmtDate } from "../../lib/format";
import { ChildSwitcher, useChild } from "./shared";
import { ATT } from "../teacher/Attendance";

// الحضور والغياب (F7.3): يرى وليّ الأمر سجلّ ابنه ويُنبَّه فورًا عند الغياب
export default function ParentAttendance() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const { kids, child, select } = useChild();
  const att = attendanceRate(state, child.id, 30);
  const days = Object.keys(state.attendance).sort().slice(-20).reverse();
  const absent = days.filter((d) => state.attendance[d][child.id] === "absent");
  const [justify, setJustify] = useState(false);
  const [reason, setReason] = useState("");

  const send = () => {
    dispatch({ type: "newThread", from: user.id, to: "adm-school", subject: `تبرير غياب ${child.name}`, text: `التواريخ: ${absent.join("، ")}.\nالسبب: ${reason.trim()}` });
    toast("أُرسل تبرير الغياب إلى الإدارة");
    setJustify(false);
    setReason("");
  };

  return (
    <Page kicker="الحضور والغياب" title="الحضور والغياب" desc="سجلّ الحضور اليومي لابنك، وتصلك رسالة فورية عند تسجيل أي غياب." icon={CalendarCheck}>
      <ChildSwitcher kids={kids} child={child} onSelect={select} />
      <div className="grid grid-4 mt">
        <Card><div className="row"><Ring value={att.rate} size={96} stroke={9} label="نسبة الحضور" sub="حضور" /><div><strong>{att.rate >= 95 ? "ممتاز" : att.rate >= 90 ? "جيد" : "يحتاج متابعة"}</strong><p className="muted small">آخر {att.days} يومًا</p></div></div></Card>
        <Stat label="أيام الغياب" value={att.absent} tone="rose" icon={CalendarCheck} />
        <Stat label="مرات التأخر" value={att.late} tone="gold" icon={CalendarCheck} />
        <Stat label="أيام مسجّلة" value={att.days} tone="blue" icon={CalendarCheck} />
      </div>
      <Card className="mt" title={`سجلّ ${child.name}`} kicker="آخر ٢٠ يوم دراسي">
        <div className="cal">
          {days.map((d) => {
            const st = state.attendance[d][child.id];
            return (
              <div key={d} className={cx("cal-day", `att-${st}`)} title={`${d} — ${ATT[st]?.[0]}`}>
                <span className="num">{fmtDate(new Date(d).getTime(), { day: "numeric", month: "short" })}</span>
                <b>{ATT[st]?.[0]}</b>
              </div>
            );
          })}
        </div>
      </Card>
      {absent.length > 0 && (
        <Notice tone="warn" title={`${absent.length} أيام غياب في الفترة`} action={<Btn size="sm" variant="ghost" icon={Send} onClick={() => setJustify(true)}>أرسل تبرير الغياب</Btn>}>
          يمكنك إرسال عذر الغياب إلى إدارة المدرسة.
        </Notice>
      )}

      <Modal open={justify} onClose={() => setJustify(false)} title="تبرير الغياب" kicker={child.name}
        footer={<><Btn variant="ghost" onClick={() => setJustify(false)}>إلغاء</Btn><Btn variant="primary" icon={Send} disabled={!reason.trim()} onClick={send}>إرسال إلى الإدارة</Btn></>}>
        <div className="stack">
          <p className="muted small">التواريخ: {absent.join("، ")}</p>
          <Field label="سبب الغياب"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="اكتب سبب غياب ابنك خلال هذه الفترة…" autoFocus /></Field>
        </div>
      </Modal>
    </Page>
  );
}
