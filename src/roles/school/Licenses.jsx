import { useState } from "react";
import { CheckCircle2, Download, KeyRound, Plus, ReceiptText } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, ListRow, Modal, Notice, Page, Stat } from "../../ui/Primitives";
import { Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { fmtNum, fmtDate, DAY_MS } from "../../lib/format";
import { downloadCSV } from "../../lib/export";

// الاشتراك والتراخيص المدرسية (F7.5): المقاعد وحالة الترخيص والتجديد
export default function LicensesPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [seats, setSeats] = useState(1800);
  const school = state.schools.find((s) => s.id === "sch-1");
  const used = Math.round((school.students / school.seats) * 100);
  const expires = state.now0 + 22 * DAY_MS;
  const invoices = state.invoices.filter((i) => i.customer === school.name);

  return (
    <Page kicker="الترخيص" title="الاشتراك والتراخيص" desc="تابع مقاعد مدرستك وحالة الترخيص والتجديد والفواتير." icon={KeyRound}
      actions={<><Btn variant="ghost" icon={Plus} onClick={() => setSeatsOpen(true)}>زيادة المقاعد</Btn><Btn variant="gold" icon={CheckCircle2} onClick={() => { dispatch({ type: "renewLicense", id: school.id, name: school.name, actor: user.id }); toast("أُرسل طلب التجديد وتحدّثت الحالة"); }}>تجديد الترخيص</Btn></>}>
      <div className="grid grid-3">
        <Card><div className="row"><Ring value={used} size={110} stroke={10} tone={used > 90 ? "low" : "gold"} label="استهلاك المقاعد" sub="مقاعد" /><div><strong>{fmtNum(school.students)} من {fmtNum(school.seats)}</strong><p className="muted small">مقعدًا مستهلكًا</p></div></div></Card>
        <Stat label="حالة الترخيص" value={school.license} icon={KeyRound} tone="gold" foot={`ينتهي ${fmtDate(expires, { day: "numeric", month: "long", year: "numeric" })}`} />
        <Stat label="الباقة" value="مدرسي" icon={ReceiptText} tone="blue" foot="ترخيص لكل مقعد / سنة" />
      </div>
      <Notice tone={used > 85 ? "warn" : "info"} title={used > 85 ? "اقتربت من الحدّ الأقصى للمقاعد" : "استهلاك المقاعد ضمن الحدّ"}>يمكنك زيادة عدد المقاعد في أي وقت. يبدأ التجديد قبل انتهاء الترخيص بـ ٣٠ يومًا.</Notice>
      <Card className="mt" title="الفواتير" kicker="السجلّ المالي" flush><div className="pad">
        <DataTable dense empty="لا فواتير" rows={invoices} columns={[
          { key: "id", label: "رقم الفاتورة", render: (r) => <span className="num">{r.id}</span> },
          { key: "at", label: "التاريخ", render: (r) => fmtDate(r.at, { day: "numeric", month: "long" }) },
          { key: "amount", label: "المبلغ", render: (r) => <span className="num">{fmtNum(r.amount)} ر.س</span> },
          { key: "status", label: "الحالة", render: (r) => <Badge tone={r.status === "مدفوعة" ? "success" : "warn"} dot>{r.status}</Badge> },
          { key: "dl", label: "", render: (r) => <Btn size="sm" variant="ghost" icon={Download} onClick={() => { downloadCSV(r.id, [["الفاتورة", r.id], ["العميل", r.customer], ["المبلغ", r.amount], ["الحالة", r.status]]); toast("نُزّلت الفاتورة"); }}>تنزيل</Btn> },
        ]} /></div></Card>
      <Modal open={seatsOpen} onClose={() => setSeatsOpen(false)} title="زيادة المقاعد" kicker="ترخيص المدرسة" footer={<><Btn variant="ghost" onClick={() => setSeatsOpen(false)}>إلغاء</Btn><Btn variant="primary" disabled={Number(seats) <= school.seats} onClick={() => { dispatch({ type: "renewLicense", id: school.id, name: `${school.name} — ${seats} مقعدًا`, seats: Number(seats), actor: user.id }); toast("زيدت المقاعد"); setSeatsOpen(false); }}>تأكيد</Btn></>}>
        <Field label="العدد الجديد للمقاعد" hint={`الحالي ${fmtNum(school.seats)}`}><Input type="number" min={school.seats + 1} value={seats} onChange={(e) => setSeats(e.target.value)} /></Field>
      </Modal>
    </Page>
  );
}
