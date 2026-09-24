import { CheckCheck, Inbox, RotateCcw } from "lucide-react";
import { Badge, Btn, Card, Empty, ListRow, Notice, Page } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { timeAgo } from "../../lib/format";

// طلبات التواصل الواردة من نموذج «تواصل معنا» في الصفحة الرئيسية
export default function LeadsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const leads = state.leads || [];
  const open = leads.filter((l) => l.status === "جديد");
  const closed = leads.filter((l) => l.status !== "جديد");

  const setStatus = (l, status) => {
    dispatch({ type: "setLeadStatus", id: l.id, status, actor: user.id, target: l.name });
    toast(status === "جديد" ? `أُعيد فتح طلب ${l.name}` : `تمت متابعة طلب ${l.name}`, "success");
  };

  const row = (l) => (
    <ListRow
      key={l.id}
      avatar={l.name}
      tone="gold"
      title={l.name}
      meta={`${l.kind} • ${l.contact}${l.org ? ` • ${l.org}` : ""} • ${timeAgo(l.at)}`}
      end={
        l.status === "جديد" ? (
          <>
            <Badge tone="warn" dot>جديد</Badge>
            <Btn size="sm" variant="gold" icon={CheckCheck} onClick={() => setStatus(l, "تمت المتابعة")}>تمت المتابعة</Btn>
          </>
        ) : (
          <>
            <Badge tone="success" dot>تمت المتابعة</Badge>
            <Btn size="sm" variant="ghost" icon={RotateCcw} onClick={() => setStatus(l, "جديد")}>إعادة فتح</Btn>
          </>
        )
      }
    >
      {l.message && <span>{l.message}</span>}
    </ListRow>
  );

  return (
    <Page kicker="الصفحة الرئيسية" title="طلبات التواصل" desc="الطلبات الواردة من نموذج «تواصل معنا» في الصفحة الرئيسية: عروض تجريبية للمدارس، واستفسارات، وشراكات." icon={Inbox}>
      <Notice tone="info" icon={Inbox}>طلبات الانضمام كمعلّم لا تصل هنا؛ تُراجَع من صفحة «طلبات المعلّمين».</Notice>
      <Card className="mt" title="بانتظار المتابعة" kicker={`${open.length} طلبًا`}>
        {open.length === 0 ? <Empty icon={Inbox} title="لا طلبات جديدة" desc="ستظهر هنا الطلبات التي يرسلها الزوّار من الصفحة الرئيسية." /> : open.map(row)}
      </Card>
      {closed.length > 0 && (
        <Card className="mt" title="تمت متابعتها" kicker={`${closed.length}`}>
          {closed.map(row)}
        </Card>
      )}
    </Page>
  );
}
