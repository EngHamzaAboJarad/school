import { CreditCard, Download, ReceiptText, Wallet } from "lucide-react";
import { Badge, Btn, Card, DataTable, ListRow, Page, Split, Stat, Toggle } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { downloadCSV } from "../../lib/export";
import { fmtDate, fmtNum } from "../../lib/format";

// الفوترة والاشتراكات (F10.3) وبوّابات الدفع السعودية (F13.2)
export default function BillingPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const paid = state.invoices.filter((i) => i.status === "مدفوعة").reduce((a, i) => a + i.amount, 0);
  const due = state.invoices.filter((i) => i.status !== "مدفوعة").reduce((a, i) => a + i.amount, 0);
  const subs = state.plans.reduce((a, p) => a + p.subs, 0);

  return (
    <Page kicker="الإيرادات" title="الفوترة والاشتراكات" desc="خطط الاشتراك والتراخيص، والفواتير، وبوّابات الدفع المحلية (مدى / Apple Pay / STC Pay)." icon={CreditCard}
      actions={<Btn variant="ghost" icon={Download} onClick={() => { downloadCSV("الفواتير", [["الرقم", "العميل", "المبلغ", "الحالة"], ...state.invoices.map((i) => [i.id, i.customer, i.amount, i.status])]); toast("صُدِّرت الفواتير"); }}>تصدير الفواتير</Btn>}>
      <div className="grid grid-4">
        <Stat label="محصَّل" value={fmtNum(paid)} unit="ر.س" icon={Wallet} />
        <Stat label="مستحق" value={fmtNum(due)} unit="ر.س" icon={ReceiptText} tone="gold" />
        <Stat label="اشتراكات نشطة" value={fmtNum(subs)} icon={CreditCard} tone="blue" />
        <Stat label="بوّابات متصلة" value={state.gateways.filter((g) => g.status === "متصل").length} unit={`/ ${state.gateways.length}`} icon={CreditCard} tone="rose" />
      </div>
      <div className="grid grid-3 mt">
        {state.plans.map((p) => (
          <Card key={p.id} className="plan-card"><Badge tone="gold">{p.audience}</Badge><h3>{p.name}</h3><b className="plan-price">{p.price}</b><p className="muted small">{p.features}</p><small className="num muted">{fmtNum(p.subs)} مشترك</small></Card>
        ))}
      </div>
      <Split className="mt">
        <Card title="الفواتير" kicker="آخر العمليات" flush><div className="pad">
          <DataTable dense rows={state.invoices} columns={[
            { key: "id", label: "الفاتورة", render: (r) => <span className="num">{r.id}</span> },
            { key: "customer", label: "العميل" },
            { key: "amount", label: "المبلغ", render: (r) => <span className="num">{fmtNum(r.amount)}</span> },
            { key: "status", label: "الحالة", render: (r) => <Badge tone={r.status === "مدفوعة" ? "success" : "warn"} dot>{r.status}</Badge> },
            { key: "at", label: "التاريخ", render: (r) => fmtDate(r.at) },
          ]} /></div></Card>
        <Card title="بوّابات الدفع" kicker="تحصيل الاشتراكات">
          {state.gateways.map((g) => (
            <div key={g.id}><Toggle label={g.name} hint={`رسوم ${g.fee} • ${g.status}`} checked={g.status === "متصل"} onChange={() => { dispatch({ type: "setGateway", id: g.id, name: g.name, actor: user.id }); toast(`${g.name}: ${g.status === "متصل" ? "أُوقفت" : "فُعِّلت"}`, "warn"); }} /></div>
          ))}
        </Card>
      </Split>
    </Page>
  );
}
