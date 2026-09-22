import { Banknote, CheckCircle2, Clock3, Wallet } from "lucide-react";
import { Badge, Btn, Card, Empty, ListRow, Page, Stat } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { userName } from "../../store/selectors";
import { fmtDate } from "../../lib/format";

// دفع رسوم المعلّمين: مستحقّاتهم الدورية وحالتها
export default function SchoolFinancePage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const payments = [...state.teacherPayments].sort((a, b) => b.at - a.at);
  const due = payments.filter((p) => p.status === "مستحق");
  const dueTotal = due.reduce((sum, p) => sum + p.amount, 0);
  const paidTotal = payments.filter((p) => p.status === "مدفوع").reduce((sum, p) => sum + p.amount, 0);

  const pay = (p) => {
    dispatch({ type: "payTeacherFee", id: p.id, actor: user.id });
    toast(`دُفعت رسوم ${userName(state, p.teacherId)}`, "success");
  };

  return (
    <Page kicker="الأمور المالية" title="دفع رسوم المعلّمين" desc="مستحقّات المعلّمين الدورية وحالة الدفع لكل منهم." icon={Wallet}>
      <div className="grid grid-3">
        <Stat label="مستحقّات قيد الانتظار" value={dueTotal.toLocaleString("en-US")} unit="ريال" icon={Clock3} tone="rose" foot={`${due.length} دفعة`} />
        <Stat label="مدفوعات مكتملة" value={paidTotal.toLocaleString("en-US")} unit="ريال" icon={CheckCircle2} tone="success" foot={`${payments.length - due.length} دفعة`} />
        <Stat label="عدد المعلّمين" value={new Set(payments.map((p) => p.teacherId)).size} icon={Banknote} tone="blue" />
      </div>
      <Card className="mt" title="سجلّ الرسوم" kicker="الأحدث أولًا">
        {payments.length === 0 ? <Empty icon={Wallet} title="لا سجلّ رسوم بعد" /> : (
          payments.map((p) => (
            <ListRow key={p.id} avatar={userName(state, p.teacherId)} tone={p.status === "مدفوع" ? "success" : "warn"} title={userName(state, p.teacherId)}
              meta={`${p.period} • ${p.status === "مدفوع" ? `دُفعت ${fmtDate(p.paidAt)}` : "قيد الانتظار"}`}
              end={<>
                <b className="num">{p.amount.toLocaleString("en-US")} ريال</b>
                <Badge tone={p.status === "مدفوع" ? "success" : "warn"} dot>{p.status}</Badge>
                {p.status === "مستحق" && <Btn size="sm" variant="gold" icon={Banknote} onClick={() => pay(p)}>دفع</Btn>}
              </>} />
          ))
        )}
      </Card>
    </Page>
  );
}
