import { useState } from "react";
import { Check, UserPlus, X } from "lucide-react";
import { Badge, Btn, Card, Empty, ListRow, Notice, Page, Tabs } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { userName } from "../../store/selectors";
import { timeAgo } from "../../lib/format";

const STATUS_LABEL = { pending_teacher: "بانتظارك", approved: "مفعَّل", rejected: "مرفوض" };
const STATUS_TONE = { pending_teacher: "warn", approved: "success", rejected: "danger" };

// طلبات التسجيل الخاص: تصل بعد موافقة وليّ الأمر ودفعه، وتُعتمَد هنا قبل تفعيلها
export default function EnrollmentsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("pending");
  const mine = state.enrollmentRequests.filter((r) => r.teacherId === user.id && r.status !== "pending_parent");
  const by = (s) => mine.filter((r) => r.status === s).sort((a, b) => b.createdAt - a.createdAt);
  const shown = tab === "pending" ? by("pending_teacher") : tab === "approved" ? by("approved") : by("rejected");

  const decide = (r, approve) => {
    dispatch({ type: "decideEnrollment", id: r.id, approve, actor: user.id });
    toast(approve ? "فُعِّل تسجيل الطالب" : "رُفض طلب التسجيل", approve ? "success" : "warn");
  };

  return (
    <Page kicker="تسجيل خاص" title="طلبات التسجيل" desc="طلبات تسجيل طلاب لديك في مواد مدفوعة، بعد موافقة وليّ الأمر ودفعه." icon={UserPlus}>
      <Notice tone="info" icon={UserPlus}>يصل الطلب إليك بعد أن يستكمله وليّ الأمر ويدفع رسومه؛ اعتمادك هنا يُفعِّل تسجيل الطالب رسميًّا.</Notice>
      <div className="mt" />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "pending", label: "بانتظارك", count: by("pending_teacher").length }, { id: "approved", label: "مفعَّل" }, { id: "rejected", label: "مرفوض" }]} />
      <Card flush>
        <div className="pad">
          {shown.length === 0 && <Empty icon={UserPlus} title={tab === "pending" ? "لا طلبات بانتظارك" : "لا عناصر هنا"} desc={tab === "pending" ? "ستظهر هنا طلبات التسجيل فور دفع وليّ الأمر." : ""} />}
          {shown.map((r) => (
            <ListRow key={r.id} avatar={userName(state, r.studentId)} tone="gold" title={userName(state, r.studentId)}
              meta={`${r.subject} • ${r.price} • ولي الأمر: ${r.parentId ? userName(state, r.parentId) : "—"} • ${timeAgo(r.paidAt || r.createdAt)}`}
              end={<>
                <Badge tone={STATUS_TONE[r.status]} dot>{STATUS_LABEL[r.status]}</Badge>
                {r.status === "pending_teacher" && <>
                  <Btn size="sm" variant="danger" icon={X} onClick={() => decide(r, false)}>رفض</Btn>
                  <Btn size="sm" variant="gold" icon={Check} onClick={() => decide(r, true)}>قبول</Btn>
                </>}
              </>} />
          ))}
        </div>
      </Card>
    </Page>
  );
}
