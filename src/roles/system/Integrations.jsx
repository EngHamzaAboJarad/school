import { useState } from "react";
import { Copy, KeyRound, Plug, Plus, Trash2 } from "lucide-react";
import { Badge, Btn, Card, Field, Input, ListRow, Modal, Notice, Page, Select } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { fmtDate } from "../../lib/format";

// التكاملات (E13): أنظمة التعليم (استكشافي) وواجهات API وتصدير البيانات
export default function IntegrationsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", scope: "قراءة التقارير" });
  const [created, setCreated] = useState(null);

  return (
    <Page kicker="الربط والتوسّع" title="التكاملات وواجهات API" desc="ربط الأنظمة الحكومية حيث يُتاح رسميًّا، وواجهات موثّقة وآمنة لتصدير التقارير للجهات." icon={Plug}
      actions={<Btn variant="primary" icon={Plus} onClick={() => setAdding(true)}>مفتاح API جديد</Btn>}>
      <div className="grid grid-2">
        <Card title="التكامل مع أنظمة التعليم" kicker="مرحلة استكشافية">
          {state.integrations.filter((i) => i.id !== "api").map((i) => <ListRow key={i.id} icon={Plug} tone="gold" title={i.name} meta={i.note} end={<Badge tone="warn" dot>{i.status}</Badge>} />)}
          <Notice tone="info" className="mt-sm">يعتمد الربط على إتاحة رسمية من الجهات المعنية؛ الحالة الحالية دراسة جدوى وواجهات ربط.</Notice>
        </Card>
        <Card title="مفاتيح API" kicker="واجهات موثّقة وآمنة">
          {state.apiKeys.length === 0 && <p className="muted">لا مفاتيح.</p>}
          {state.apiKeys.map((k) => (
            <ListRow key={k.id} icon={KeyRound} tone="blue" title={k.name} meta={`${k.scope} • أُنشئ ${fmtDate(k.created)}`} end={<><code className="key num">{k.prefix}</code>
              <Btn size="sm" variant="danger" icon={Trash2} aria-label="إلغاء المفتاح" onClick={() => { dispatch({ type: "revokeApiKey", id: k.id, name: k.name, actor: user.id }); toast("أُلغي المفتاح", "warn"); }} /></>} />
          ))}
        </Card>
      </div>
      <Modal open={adding} onClose={() => { setAdding(false); setCreated(null); }} title="مفتاح API جديد" kicker="تصدير التقارير والبيانات"
        footer={created ? <Btn variant="primary" onClick={() => { setAdding(false); setCreated(null); }}>تم</Btn> : <><Btn variant="ghost" onClick={() => setAdding(false)}>إلغاء</Btn><Btn variant="primary" disabled={!f.name.trim()} onClick={() => { const secret = `tq_live_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`; dispatch({ type: "addApiKey", key: { name: f.name.trim(), scope: f.scope, prefix: `${secret.slice(0, 12)}…` }, actor: user.id }); setCreated(secret); }}>إنشاء</Btn></>}>
        {created ? (
          <div className="stack"><Notice tone="warn" title="انسخ المفتاح الآن">لن يظهر كاملًا مرة أخرى بعد إغلاق النافذة.</Notice><div className="row"><code className="key big num grow">{created}</code><Btn variant="ghost" icon={Copy} onClick={() => { navigator.clipboard?.writeText(created); toast("نُسخ المفتاح"); }}>نسخ</Btn></div></div>
        ) : (
          <div className="stack"><Field label="اسم التكامل"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
            <Field label="النطاق"><Select value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })}><option>قراءة التقارير</option><option>تصدير البيانات المجمّعة</option></Select></Field></div>
        )}
      </Modal>
    </Page>
  );
}
