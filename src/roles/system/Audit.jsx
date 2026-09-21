import { useMemo, useState } from "react";
import { Download, ScrollText } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Page, SearchBox, Select } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { downloadCSV } from "../../lib/export";
import { fmtDate } from "../../lib/format";

// سجلّ التدقيق (F10.5): تسجيل الأحداث الحسّاسة لأغراض الأمان والمساءلة
export default function AuditPage() {
  const { state } = useStore();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [sev, setSev] = useState("");
  const [actor, setActor] = useState("");
  const actors = [...new Set(state.audit.map((a) => a.actorName))];
  const rows = useMemo(() => state.audit.filter((a) => (!sev || a.severity === sev) && (!actor || a.actorName === actor) && (!q || `${a.action} ${a.target}`.includes(q))), [state.audit, q, sev, actor]);
  return (
    <Page kicker="المساءلة" title="سجلّ التدقيق" desc="كل حدث حسّاس — اعتماد محتوى، تعديل درجة، تغيير صلاحية — يُسجَّل باسم فاعله ووقته ولا يُحذف." icon={ScrollText}
      actions={<Btn variant="ghost" icon={Download} onClick={() => { downloadCSV("سجل-التدقيق", [["الوقت", "الفاعل", "الحدث", "الهدف", "الخطورة"], ...rows.map((a) => [new Date(a.at).toISOString(), a.actorName, a.action, a.target, a.severity])]); toast("صُدِّر السجلّ"); }}>تصدير</Btn>}>
      <Card flush>
        <div className="bank-filters">
          <SearchBox value={q} onChange={setQ} placeholder="ابحث في الأحداث…" />
          <Select value={sev} onChange={(e) => setSev(e.target.value)} aria-label="الخطورة"><option value="">كل المستويات</option><option value="info">معلومة</option><option value="warn">حسّاس</option></Select>
          <Select value={actor} onChange={(e) => setActor(e.target.value)} aria-label="الفاعل"><option value="">كل الفاعلين</option>{actors.map((a) => <option key={a}>{a}</option>)}</Select>
        </div>
        <div className="pad"><DataTable dense rows={rows} empty="لا أحداث مطابقة" columns={[
          { key: "at", label: "الوقت", render: (a) => <span className="num muted small">{fmtDate(a.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span> },
          { key: "actorName", label: "الفاعل", render: (a) => <div className="cell-user"><Avatar name={a.actorName} size={30} /><strong>{a.actorName}</strong></div> },
          { key: "action", label: "الحدث", render: (a) => <strong>{a.action}</strong> },
          { key: "target", label: "الهدف" },
          { key: "severity", label: "المستوى", render: (a) => <Badge tone={a.severity === "warn" ? "warn" : "info"} dot>{a.severity === "warn" ? "حسّاس" : "معلومة"}</Badge> },
        ]} /></div>
      </Card>
    </Page>
  );
}
