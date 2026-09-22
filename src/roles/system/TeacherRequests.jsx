import { UserCheck, UserX } from "lucide-react";
import { Badge, Btn, Card, Empty, ListRow, Notice, Page } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";

// طلبات انضمام المعلّمين: تُدقَّق وتُعتمَد مركزيًّا من مدير النظام قبل تفعيل أي حساب معلّم
export default function TeacherRequestsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const pending = state.directory.filter((d) => d.role === "teacher" && d.status === "بانتظار الاعتماد");
  const decided = state.directory.filter((d) => d.role === "teacher" && d.status !== "بانتظار الاعتماد");

  const decide = (d, status) => {
    dispatch({ type: "updateUser", id: d.id, patch: { status }, action: status === "نشط" ? "اعتماد حساب معلّم" : "رفض حساب معلّم", target: d.name, actor: user.id });
    toast(status === "نشط" ? `اعتُمد حساب ${d.name}` : `رُفض حساب ${d.name}`, status === "نشط" ? "success" : "warn");
  };

  return (
    <Page kicker="مراجعة مركزية" title="طلبات المعلّمين" desc="كل طلب انضمام معلّم — من أي مدرسة — يُدقَّق ويُعتمَد من هنا قبل تفعيل حسابه." icon={UserCheck}>
      <Notice tone="info" icon={UserCheck}>اعتماد حساب المعلّم من اختصاص مدير النظام حصرًا، للتحقّق من الوثائق والمؤهلات قبل إتاحة الدخول لأي مدرسة.</Notice>
      <Card className="mt" title="بانتظار الاعتماد" kicker={`${pending.length} طلبًا`}>
        {pending.length === 0 ? <Empty icon={UserCheck} title="لا طلبات بانتظار المراجعة" /> : (
          pending.map((d) => (
            <ListRow key={d.id} avatar={d.name} tone="gold" title={d.name} meta={`${d.email} • انضمّ ${d.joined}`}
              end={<>
                <Badge tone="warn" dot>بانتظار الاعتماد</Badge>
                <Btn size="sm" variant="danger" icon={UserX} onClick={() => decide(d, "موقوف")}>رفض</Btn>
                <Btn size="sm" variant="gold" icon={UserCheck} onClick={() => decide(d, "نشط")}>اعتماد</Btn>
              </>} />
          ))
        )}
      </Card>
      {decided.length > 0 && (
        <Card className="mt" title="قرارات سابقة" kicker={`${decided.length}`}>
          {decided.map((d) => (
            <ListRow key={d.id} avatar={d.name} tone={d.status === "نشط" ? "success" : "danger"} title={d.name} meta={d.email}
              end={<Badge tone={d.status === "نشط" ? "success" : "danger"} dot>{d.status}</Badge>} />
          ))}
        </Card>
      )}
    </Page>
  );
}
