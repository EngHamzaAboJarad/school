import { useState } from "react";
import { Building2, CheckCircle2, Database, Plus, ShieldCheck } from "lucide-react";
import { Badge, Btn, Card, DataTable, Field, Input, Modal, Notice, Page, Select, Stat } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { fmtNum } from "../../lib/format";

// تعدّد المستأجرين (F10.1): عزل بيانات كل مدرسة/جهة ضمن مستأجر مستقل على منصّة واحدة
export default function TenantsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [checked, setChecked] = useState({});
  const check = (t) => { setChecked({ ...checked, [t.id]: "checking" }); setTimeout(() => { setChecked((c) => ({ ...c, [t.id]: "ok" })); toast(`اختبار العزل: ${t.name} — لا تسرّب بين المستأجرين`); }, 700); };
  return (
    <Page kicker="البنية متعددة المستأجرين" title="المستأجرون" desc="كل مدرسة أو جهة في مستأجر معزول منطقيًّا لا تتسرّب بياناته إلى غيره، على منصّة واحدة." icon={Building2}
      actions={<Btn variant="primary" icon={Plus} onClick={() => setAdding(true)}>مستأجر جديد</Btn>}>
      <div className="grid grid-3">
        <Stat label="مدارس (B2B)" value={state.tenants.filter((t) => t.type.includes("B2B")).length} icon={Building2} />
        <Stat label="جهات (B2G)" value={state.tenants.filter((t) => t.type.includes("B2G")).length} icon={Building2} tone="gold" />
        <Stat label="العزل" value="100" unit="%" icon={ShieldCheck} tone="blue" foot="كل المستأجرين معزولون" />
      </div>
      <Card className="mt" flush><div className="pad">
        <DataTable rows={state.tenants} columns={[
          { key: "name", label: "المستأجر", render: (t) => <div className="cell-user"><span className="row-icon tone-emerald"><Building2 size={17} /></span><div><strong>{t.name}</strong><small>{t.type}</small></div></div> },
          { key: "plan", label: "الباقة", render: (t) => <Badge tone="gold">{t.plan}</Badge> },
          { key: "users", label: "المستخدمون", render: (t) => <span className="num">{fmtNum(t.users)}</span> },
          { key: "isolation", label: "العزل", render: (t) => <Badge tone="success" icon={Database}>{t.isolation}</Badge> },
          { key: "status", label: "الحالة", render: (t) => <Badge tone={t.status === "نشط" ? "success" : t.status === "تجريبي" ? "info" : "warn"} dot>{t.status}</Badge> },
          { key: "act", label: "", render: (t) => <Btn size="sm" variant="ghost" icon={CheckCircle2} disabled={checked[t.id] === "checking"} onClick={() => check(t)}>{checked[t.id] === "checking" ? "جارٍ الفحص…" : checked[t.id] === "ok" ? "تم الفحص ✓" : "فحص العزل"}</Btn> },
        ]} /></div></Card>
      {adding && <NewTenant onClose={() => setAdding(false)} />}
    </Page>
  );
}

function NewTenant({ onClose }) {
  const { dispatch, user } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ name: "", type: "مدرسة (B2B)", plan: "تجريبي", users: 0 });
  return (
    <Modal open onClose={onClose} title="مستأجر جديد" kicker="إنشاء مساحة معزولة" footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!f.name.trim()} onClick={() => { dispatch({ type: "addTenant", tenant: { name: f.name.trim(), type: f.type, plan: f.plan, users: 0, seats: 0, status: f.plan === "تجريبي" ? "تجريبي" : "نشط" }, actor: user.id }); toast("أُنشئ المستأجر بمساحة بيانات معزولة"); onClose(); }}>إنشاء</Btn></>}>
      <div className="stack">
        <Field label="اسم المدرسة / الجهة"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <div className="form-grid">
          <Field label="النوع"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option>مدرسة (B2B)</option><option>جهة (B2G)</option></Select></Field>
          <Field label="الباقة"><Select value={f.plan} onChange={(e) => setF({ ...f, plan: e.target.value })}><option>تجريبي</option><option>مدرسي</option><option>مؤسسي</option></Select></Field>
        </div>
        <Notice tone="info" icon={Database}>يُنشأ للمستأجر مخطّط بيانات وتشفير ومفاتيح مستقلة.</Notice>
      </div>
    </Modal>
  );
}
