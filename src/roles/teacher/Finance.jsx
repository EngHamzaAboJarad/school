import { Banknote, CheckCircle2, Clock3, GraduationCap, Wallet } from "lucide-react";
import { Badge, Card, Empty, ListRow, Notice, Page, Split, Stat } from "../../ui/Primitives";
import { useStore } from "../../store/StoreProvider";
import { userName, teacherPaymentsFor } from "../../store/selectors";
import { fmtDate, timeAgo } from "../../lib/format";

const numFrom = (price) => Number(String(price).replace(/[^\d]/g, "")) || 0;

// الأمور المالية للمعلّم: دخل التسجيل الخاص من الطلاب، ورسوم المدرسة الدورية
export default function FinancePage() {
  const { state, user } = useStore();
  const approved = state.enrollmentRequests.filter((r) => r.teacherId === user.id && r.status === "approved");
  const privateIncome = approved.reduce((sum, r) => sum + numFrom(r.price), 0);
  const payments = teacherPaymentsFor(state, user.id);
  const due = payments.filter((p) => p.status === "مستحق");
  const paid = payments.filter((p) => p.status === "مدفوع");
  const dueTotal = due.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Page kicker="الأمور المالية" title="الأمور المالية" desc="دخلك من التسجيل الخاص لدى الطلاب، ورسومك الدورية من المدرسة." icon={Wallet}>
      <div className="grid grid-3">
        <Stat label="دخل التسجيل الخاص" value={privateIncome.toLocaleString("en-US")} unit="ريال" icon={GraduationCap} tone="gold" foot={`${approved.length} طالبًا مفعَّلًا`} />
        <Stat label="مستحقّات من المدرسة" value={dueTotal.toLocaleString("en-US")} unit="ريال" icon={Clock3} tone="rose" foot={`${due.length} دفعة قيد الانتظار`} />
        <Stat label="مدفوعات سابقة" value={paid.reduce((s, p) => s + p.amount, 0).toLocaleString("en-US")} unit="ريال" icon={CheckCircle2} tone="blue" foot={`${paid.length} دفعة مكتملة`} />
      </div>
      <Split className="mt">
        <Card title="دخل التسجيل الخاص" kicker="من طلابك مباشرة">
          {approved.length === 0 ? <Empty icon={GraduationCap} title="لا تسجيلات مفعَّلة بعد" /> : (
            approved.map((r) => (
              <ListRow key={r.id} icon={GraduationCap} tone="gold" title={userName(state, r.studentId)} meta={`${r.subject} • ${timeAgo(r.decidedAt || r.createdAt)}`} end={<b className="num">{r.price}</b>} />
            ))
          )}
        </Card>
        <Card title="رسوم المدرسة الدورية" kicker="من إدارة المدرسة">
          <Notice tone="info" icon={Banknote}>تُحوَّل رسومك الشهرية من إدارة المدرسة؛ يمكنك متابعة حالتها هنا.</Notice>
          <div className="mt-sm">
            {payments.length === 0 ? <Empty title="لا سجلّ مدفوعات بعد" /> : (
              payments.map((p) => (
                <ListRow key={p.id} icon={Banknote} tone={p.status === "مدفوع" ? "success" : "warn"} title={p.period}
                  meta={p.status === "مدفوع" ? `دُفعت ${fmtDate(p.paidAt)}` : "قيد الانتظار"}
                  end={<><b className="num">{p.amount.toLocaleString("en-US")} ريال</b><Badge tone={p.status === "مدفوع" ? "success" : "warn"} dot>{p.status}</Badge></>} />
              ))
            )}
          </div>
        </Card>
      </Split>
    </Page>
  );
}
