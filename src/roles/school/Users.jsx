import { useMemo, useState } from "react";
import { Check, Lock, Plus, ShieldCheck, UserCheck, UserX, Users } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Field, Input, Modal, Notice, Page, SearchBox, Select, Tabs } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { ROLES, PERMISSIONS } from "../../data/people";

const STATUS_TONE = { "نشط": "success", "موقوف": "danger", "بانتظار الاعتماد": "warn" };
const ASSIGNABLE = ["student", "parent", "teacher", "school"];

// إدارة المستخدمين والأدوار (F7.1) وفق نظام الصلاحيات (F10.2)
export default function UsersPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("users");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [adding, setAdding] = useState(false);
  const rows = useMemo(() => state.directory.filter((d) => (!role || d.role === role) && (!status || d.status === status) && (!q || `${d.name} ${d.email}`.includes(q))), [state.directory, q, role, status]);
  const pending = state.directory.filter((d) => d.status === "بانتظار الاعتماد" && d.role !== "teacher").length;

  const setStatusOf = (d, s) => { dispatch({ type: "updateUser", id: d.id, patch: { status: s }, action: s === "نشط" ? "اعتماد/تفعيل حساب" : "إيقاف حساب", target: d.name, actor: user.id }); toast(`${d.name}: ${s}`, s === "موقوف" ? "warn" : "success"); };
  const setRoleOf = (d, r) => { dispatch({ type: "updateUser", id: d.id, patch: { role: r }, action: "تغيير دور مستخدم", target: `${d.name} ← ${ROLES[r].long}`, actor: user.id }); toast("عُدِّل الدور ووُثِّق في السجلّ"); };

  return (
    <Page kicker="الحسابات والصلاحيات" title="المستخدمون والأدوار" desc="أنشئ الحسابات وأسند الأدوار والصلاحيات داخل المدرسة. طلبات انضمام المعلّمين تُراجَع وتُعتمَد من مدير النظام." icon={Users}
      actions={<Btn variant="primary" icon={Plus} onClick={() => setAdding(true)}>إضافة مستخدم</Btn>}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "users", label: "المستخدمون", icon: Users, count: pending }, { id: "perms", label: "صلاحيات الأدوار", icon: ShieldCheck }]} />

      {tab === "users" && (
        <Card flush>
          <div className="bank-filters">
            <SearchBox value={q} onChange={setQ} placeholder="ابحث بالاسم أو البريد…" />
            <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="الدور"><option value="">كل الأدوار</option>{Object.values(ROLES).map((r) => <option key={r.id} value={r.id}>{r.long}</option>)}</Select>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="الحالة"><option value="">كل الحالات</option>{Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s}</option>)}</Select>
          </div>
          <div className="pad">
            <DataTable rows={rows} empty="لا مستخدمين مطابقين" columns={[
              { key: "name", label: "المستخدم", render: (d) => <div className="cell-user"><Avatar name={d.name} size={38} /><div><strong>{d.name}</strong><small dir="ltr" style={{ textAlign: "right" }}>{d.email}</small></div></div> },
              { key: "role", label: "الدور", render: (d) => ASSIGNABLE.includes(d.role) && d.id !== user.id ? (
                <Select value={d.role} onChange={(e) => setRoleOf(d, e.target.value)} aria-label={`دور ${d.name}`} style={{ height: 38, minWidth: 150 }}>{ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLES[r].long}</option>)}</Select>
              ) : <Badge tone="gold" icon={Lock}>{ROLES[d.role]?.long}</Badge> },
              { key: "status", label: "الحالة", render: (d) => <Badge tone={STATUS_TONE[d.status]} dot>{d.status}</Badge> },
              { key: "joined", label: "الانضمام", render: (d) => <span className="num muted">{d.joined}</span> },
              { key: "act", label: "", render: (d) => d.id === user.id ? null : (
                <div className="row">
                  {d.status === "بانتظار الاعتماد" && d.role === "teacher" && <Badge tone="info">بانتظار مدير النظام</Badge>}
                  {d.status === "بانتظار الاعتماد" && d.role !== "teacher" && <Btn size="sm" variant="gold" icon={UserCheck} onClick={() => setStatusOf(d, "نشط")}>اعتماد</Btn>}
                  {d.status === "نشط" && <Btn size="sm" variant="ghost" icon={UserX} onClick={() => setStatusOf(d, "موقوف")}>إيقاف</Btn>}
                  {d.status === "موقوف" && <Btn size="sm" variant="ghost" icon={Check} onClick={() => setStatusOf(d, "نشط")}>تفعيل</Btn>}
                  {d.status === "بانتظار الاعتماد" && d.role !== "teacher" && <Btn size="sm" variant="danger" onClick={() => setStatusOf(d, "موقوف")}>رفض</Btn>}
                </div>) },
            ]} />
          </div>
        </Card>
      )}

      {tab === "perms" && (
        <div className="stack">
          <Notice tone="info" icon={ShieldCheck}>تُقيَّد كل وظيفة بالصلاحية المناسبة لدور المستخدم. تعديل مصفوفة الصلاحيات من اختصاص مدير النظام؛ وهنا تطّلع على ما يملكه كل دور داخل مدرستك.</Notice>
          <Card flush><div className="pad"><PermMatrix rbac={state.rbac} /></div></Card>
        </div>
      )}

      {adding && <AddUser onClose={() => setAdding(false)} />}
    </Page>
  );
}

export function PermMatrix({ rbac, onToggle }) {
  const roles = Object.values(ROLES);
  return (
    <div className="table-wrap">
      <table className="table dense perm">
        <thead><tr><th>الصلاحية</th>{roles.map((r) => <th key={r.id} style={{ textAlign: "center" }}>{r.long}</th>)}</tr></thead>
        <tbody>
          {PERMISSIONS.map(([k, label]) => (
            <tr key={k}>
              <td><strong>{label}</strong><small className="muted num" style={{ display: "block", direction: "ltr", textAlign: "right" }}>{k}</small></td>
              {roles.map((r) => {
                const on = (rbac[r.id] || []).includes(k);
                return (
                  <td key={r.id} style={{ textAlign: "center" }}>
                    {onToggle ? <button className={`perm-dot ${on ? "on" : ""}`} onClick={() => onToggle(r, k)} aria-label={`${on ? "سحب" : "منح"} ${label} ${on ? "من" : "إلى"} ${r.long}`} aria-pressed={on}>{on && <Check size={14} />}</button>
                      : <span className={`perm-dot static ${on ? "on" : ""}`}>{on && <Check size={14} />}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddUser({ onClose }) {
  const { dispatch, user } = useStore();
  const toast = useToast();
  const [f, setF] = useState({ name: "", email: "", role: "student", status: "نشط" });
  const ok = f.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  return (
    <Modal open onClose={onClose} title="إضافة مستخدم" kicker="إنشاء حساب" footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!ok} onClick={() => { dispatch({ type: "addUser", user: { name: f.name.trim(), email: f.email.trim(), role: f.role, status: f.status }, actor: user.id }); toast("أُضيف المستخدم ووُثِّق في السجلّ"); onClose(); }}>إضافة</Btn></>}>
      <div className="stack">
        <Field label="الاسم الكامل"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="البريد الإلكتروني" error={f.email && !ok ? "صيغة البريد غير صحيحة" : ""}><Input type="email" dir="ltr" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="الدور"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLES[r].long}</option>)}</Select></Field>
          <Field label="الحالة"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="نشط">نشط</option><option value="بانتظار الاعتماد">بانتظار الاعتماد</option></Select></Field>
        </div>
      </div>
    </Modal>
  );
}
