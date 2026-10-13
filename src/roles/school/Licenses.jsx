import { useState } from "react";
import { CheckCircle2, Download, KeyRound, Plus } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, Modal, Notice, Page, Progress } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useConfirm } from "../../ui/Confirm";
import { useStore } from "../../store/StoreProvider";
import { FactLine } from "../../ui/World";
import { fmtNum, fmtDate } from "../../lib/format";
import { downloadCSV } from "../../lib/export";

// الاشتراك والتراخيص المدرسية (F7.5): المقاعد وحالة الترخيص والتجديد
export default function LicensesPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [seatsOpen, setSeatsOpen] = useState(false);
  const [seats, setSeats] = useState(1800);
  const school = state.schools.find((s) => s.id === "sch-1");
  const used = Math.round((school.students / school.seats) * 100);
  const invoices = state.invoices.filter((i) => i.customer === school.name);

  return (
    <Page kicker="الترخيص" title="الاشتراك والتراخيص" desc="تابع مقاعد مدرستك وحالة الترخيص والتجديد والفواتير." icon={KeyRound}
      actions={<><Btn variant="ghost" icon={Plus} onClick={() => setSeatsOpen(true)}>زيادة المقاعد</Btn><Btn variant="gold" icon={CheckCircle2} onClick={async () => { if (!(await confirm({ title: "تجديد ترخيص المدرسة؟", body: `يُجدَّد الترخيص لـ ${fmtNum(school.seats)} مقعدًا وتصدر فاتورة جديدة لمدرستك. يُسجَّل الطلب في سجلّ التدقيق.`, confirmLabel: "تجديد الترخيص", tone: "info" }))) return; dispatch({ type: "renewLicense", id: school.id, name: school.name, actor: user.id }); toast("أُرسل طلب التجديد وتحدّثت الحالة"); }}>تجديد الترخيص</Btn></>}>
      <FactLine
        items={[
          { label: "المقاعد المستخدمة", value: `${used}%`, note: `${fmtNum(school.students)} من ${fmtNum(school.seats)}`, tone: used > 85 ? "warn" : undefined },
          { label: "حالة الترخيص", value: school.license, note: "تاريخ الانتهاء غير مسجّل في السجلّ" },
          { label: "الباقة", value: "مدرسي", note: "ترخيص لكل مقعد في السنة" },
        ]}
      />
      <Card className="mb" title="استهلاك المقاعد" kicker={`${fmtNum(school.seats - school.students)} مقعدًا متاحًا`}>
        <Progress value={used} tone={used > 85 ? "warn" : "brand"} size="lg" label="استهلاك المقاعد" />
      </Card>
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
