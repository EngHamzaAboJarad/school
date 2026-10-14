import { useMemo, useState } from "react";
import { Check, CheckCheck, Lock, MoreHorizontal, Plus, ShieldCheck, UserCheck, UserX, Users, XCircle } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Field, Input, Menu, Modal, Notice, Page, SearchBox, Select, StatusBadge, Tabs, cx } from "../../ui/Primitives";
import { FactLine } from "../../ui/World";
import { useToast } from "../../ui/Brand";
import { useConfirm } from "../../ui/Confirm";
import { useStore } from "../../store/StoreProvider";
import { ROLES, PERMISSIONS } from "../../data/people";

const STATUS_TONE = { "نشط": "success", "موقوف": "danger", "بانتظار الاعتماد": "warn" };
const STATUSES = ["نشط", "بانتظار الاعتماد", "موقوف"];
const ASSIGNABLE = ["student", "parent", "teacher", "school"];

// إدارة المستخدمين والأدوار (F7.1) وفق نظام الصلاحيات (F10.2).
// كل إجراء يغيّر وصول شخص (إيقاف، رفض، تغيير دور) يمرّ بتأكيد يشرح أثره، ويُوثَّق في سجلّ التدقيق.
export default function UsersPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("users");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [adding, setAdding] = useState(false);
  const rows = useMemo(
    () => state.directory.filter((d) => (!role || d.role === role) && (!status || d.status === status) && (!q || `${d.name} ${d.email}`.toLowerCase().includes(q.toLowerCase()))),
    [state.directory, q, role, status],
  );
  const count = (st) => state.directory.filter((d) => d.status === st).length;
  const approvable = state.directory.filter((d) => d.status === "بانتظار الاعتماد" && d.role !== "teacher");
  const teacherPending = state.directory.filter((d) => d.status === "بانتظار الاعتماد" && d.role === "teacher");

  const setStatusOf = async (d, s, verb) => {
    if (s === "موقوف") {
      const ok = await confirm({
        title: verb === "رفض" ? `رفض طلب «${d.name}»؟` : `إيقاف حساب «${d.name}»؟`,
        body: verb === "رفض" ? "لن يُنشأ الحساب، ويمكن تفعيله لاحقًا من القائمة. يُسجَّل الإجراء في سجلّ التدقيق." : "لن يتمكّن من تسجيل الدخول حتى يُعاد تفعيله. بياناته وسجلّاته تبقى محفوظة، ويُسجَّل الإجراء في سجلّ التدقيق.",
        confirmLabel: verb === "رفض" ? "رفض الطلب" : "إيقاف الحساب",
        icon: verb === "رفض" ? XCircle : UserX,
      });
      if (!ok) return;
    }
    dispatch({ type: "updateUser", id: d.id, patch: { status: s }, action: s === "نشط" ? "اعتماد/تفعيل حساب" : verb === "رفض" ? "رفض طلب حساب" : "إيقاف حساب", target: d.name, actor: user.id });
    toast(`${d.name}: ${s}`, s === "موقوف" ? "warn" : "success");
  };

  const setRoleOf = async (d, r) => {
    if (r === d.role) return;
    const ok = await confirm({
      title: `تغيير دور «${d.name}»؟`,
      body: `من «${ROLES[d.role].long}» إلى «${ROLES[r].long}». تتغيّر صلاحياته فورًا وفق مصفوفة الأدوار، ويُوثَّق التغيير في سجلّ التدقيق.`,
      confirmLabel: "تغيير الدور",
      tone: "warn",
    });
    if (!ok) return;
    dispatch({ type: "updateUser", id: d.id, patch: { role: r }, action: "تغيير دور مستخدم", target: `${d.name} ← ${ROLES[r].long}`, actor: user.id });
    toast("عُدِّل الدور ووُثِّق في السجلّ");
  };

  const approveAll = async () => {
    const ok = await confirm({
      title: `اعتماد ${approvable.length} حسابات؟`,
      body: approvable.map((d) => d.name).join("، "),
      confirmLabel: "اعتماد الكل",
      tone: "info",
      icon: CheckCheck,
    });
    if (!ok) return;
    approvable.forEach((d) => dispatch({ type: "updateUser", id: d.id, patch: { status: "نشط" }, action: "اعتماد/تفعيل حساب", target: d.name, actor: user.id }));
    toast(`اعتُمد ${approvable.length} حسابات`);
  };

  return (
    <Page
      title="المستخدمون والأدوار"
      desc="أنشئ الحسابات وأسند الأدوار داخل المدرسة. طلبات انضمام المعلّمين يعتمدها مدير النظام."
      actions={<Btn variant="primary" icon={Plus} onClick={() => setAdding(true)}>إضافة مستخدم</Btn>}
    >
      <FactLine
        items={[
          { label: "كل الحسابات", value: state.directory.length, onClick: () => setStatus("") },
          { label: "نشطة", value: count("نشط"), onClick: () => setStatus("نشط") },
          { label: "بانتظار الاعتماد", value: count("بانتظار الاعتماد"), note: teacherPending.length ? `${teacherPending.length} منها معلّمون (مدير النظام)` : undefined, tone: count("بانتظار الاعتماد") ? "warn" : undefined, onClick: () => setStatus("بانتظار الاعتماد") },
          { label: "موقوفة", value: count("موقوف"), tone: count("موقوف") ? "danger" : undefined, onClick: () => setStatus("موقوف") },
        ]}
      />

      <Tabs value={tab} onChange={setTab} tabs={[{ id: "users", label: "المستخدمون", icon: Users, count: approvable.length }, { id: "perms", label: "صلاحيات الأدوار", icon: ShieldCheck }]} />

      {tab === "users" && (
        <Card flush>
          <div className="pad users-toolbar">
            <SearchBox value={q} onChange={setQ} placeholder="ابحث بالاسم أو البريد…" className="grow" />
            <Select value={role} onChange={(e) => setRole(e.target.value)} aria-label="الدور" style={{ width: "auto" }}>
              <option value="">كل الأدوار</option>
              {Object.values(ROLES).map((r) => <option key={r.id} value={r.id}>{r.long}</option>)}
            </Select>
            <div className="chips" role="group" aria-label="الحالة">
              <button className={cx("chip", !status && "active")} aria-pressed={!status} onClick={() => setStatus("")}>الكل</button>
              {STATUSES.map((s) => (
                <button key={s} className={cx("chip", status === s && "active")} aria-pressed={status === s} onClick={() => setStatus(status === s ? "" : s)}>
                  {s} <span className="num">{count(s)}</span>
                </button>
              ))}
            </div>
          </div>
          {approvable.length > 0 && (
            <div className="pad" style={{ paddingTop: 0 }}>
              <Notice tone="warn" icon={UserCheck} title={`${approvable.length} حسابات بانتظار اعتمادك`} action={<Btn size="sm" variant="primary" icon={CheckCheck} onClick={approveAll}>اعتماد الكل</Btn>}>
                {approvable.map((d) => d.name).join("، ")}
              </Notice>
            </div>
          )}
          <DataTable
            caption="قائمة المستخدمين"
            pageSize={10}
            rows={rows}
            empty={<Empty compact icon={Users} title="لا مستخدمين مطابقين" desc="جرّب تغيير البحث أو الفلاتر." action={(q || role || status) && <Btn size="sm" variant="ghost" onClick={() => { setQ(""); setRole(""); setStatus(""); }}>مسح الفلاتر</Btn>} />}
            columns={[
              { key: "name", label: "المستخدم", primary: true, render: (d) => (
                <div className="cell-user">
                  <Avatar name={d.name} size={34} />
                  <div style={{ minWidth: 0 }}>
                    <strong>{d.name}{d.id === user.id && <span className="muted small"> (أنت)</span>}</strong>
                    <small dir="ltr" style={{ textAlign: "start" }}>{d.email}</small>
                  </div>
                </div>
              ) },
              { key: "role", label: "الدور", render: (d) => (ASSIGNABLE.includes(d.role) && d.id !== user.id ? (
                <Select value={d.role} onChange={(e) => setRoleOf(d, e.target.value)} aria-label={`دور ${d.name}`} style={{ height: 32, minWidth: 140, width: "auto" }}>
                  {ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLES[r].long}</option>)}
                </Select>
              ) : <Badge tone="gold" icon={Lock}>{ROLES[d.role]?.long}</Badge>) },
              { key: "status", label: "الحالة", render: (d) => <StatusBadge tone={STATUS_TONE[d.status]}>{d.status}</StatusBadge> },
              { key: "joined", label: "الانضمام", render: (d) => <span className="num muted">{d.joined}</span> },
              { key: "act", label: "", srLabel: "إجراءات", align: "end", render: (d) => {
                if (d.id === user.id) return null;
                if (d.status === "بانتظار الاعتماد" && d.role === "teacher") return <Badge tone="info">لدى مدير النظام</Badge>;
                if (d.status === "بانتظار الاعتماد")
                  return (
                    <div className="row" style={{ gap: 6, justifyContent: "flex-end" }}>
                      <Btn size="sm" variant="primary" icon={UserCheck} onClick={() => setStatusOf(d, "نشط")}>اعتماد</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => setStatusOf(d, "موقوف", "رفض")}>رفض</Btn>
                    </div>
                  );
                return (
                  <Menu label={`إجراءات ${d.name}`} icon={MoreHorizontal} items={[
                    d.status === "موقوف"
                      ? { label: "إعادة التفعيل", icon: Check, onClick: () => setStatusOf(d, "نشط") }
                      : { label: "إيقاف الحساب", icon: UserX, danger: true, onClick: () => setStatusOf(d, "موقوف") },
                  ]} />
                );
              } },
            ]}
          />
        </Card>
      )}

      {tab === "perms" && (
        <div className="stack">
          <Notice tone="info" icon={ShieldCheck}>تُقيَّد كل وظيفة بالصلاحية المناسبة لدور المستخدم. تعديل المصفوفة من اختصاص مدير النظام؛ هنا تطّلع على ما يملكه كل دور داخل مدرستك.</Notice>
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
        <caption className="sr-only">مصفوفة الصلاحيات حسب الدور</caption>
        <thead><tr><th scope="col">الصلاحية</th>{roles.map((r) => <th key={r.id} scope="col" style={{ textAlign: "center" }}>{r.long}</th>)}</tr></thead>
        <tbody>
          {PERMISSIONS.map(([k, label]) => (
            <tr key={k}>
              <td><strong>{label}</strong><small className="muted num" style={{ display: "block", direction: "ltr", textAlign: "start" }}>{k}</small></td>
              {roles.map((r) => {
                const on = (rbac[r.id] || []).includes(k);
                return (
                  <td key={r.id} style={{ textAlign: "center" }}>
                    {onToggle ? <button className={`perm-dot ${on ? "on" : ""}`} onClick={() => onToggle(r, k)} aria-label={`${on ? "سحب" : "منح"} ${label} ${on ? "من" : "إلى"} ${r.long}`} aria-pressed={on}>{on && <Check size={14} />}</button>
                      : <span className={`perm-dot static ${on ? "on" : ""}`} role="img" aria-label={on ? "ممنوحة" : "غير ممنوحة"}>{on && <Check size={14} />}</span>}
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
  const [touched, setTouched] = useState(false);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email);
  const ok = f.name.trim() && emailOk;
  return (
    <Modal open onClose={onClose} title="إضافة مستخدم" kicker="يُوثَّق إنشاء الحساب في سجلّ التدقيق" footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!ok} onClick={() => { dispatch({ type: "addUser", user: { name: f.name.trim(), email: f.email.trim(), role: f.role, status: f.status }, actor: user.id }); toast("أُضيف المستخدم ووُثِّق في السجلّ"); onClose(); }}>إضافة</Btn></>}>
      <div className="stack">
        <Field label="الاسم الكامل"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus /></Field>
        <Field label="البريد الإلكتروني" error={touched && f.email && !emailOk ? "صيغة البريد غير صحيحة، مثال: name@school.edu.sa" : ""}>
          <Input type="email" dir="ltr" value={f.email} aria-invalid={touched && f.email && !emailOk ? "true" : undefined} onBlur={() => setTouched(true)} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <div className="form-grid">
          <Field label="الدور"><Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ASSIGNABLE.map((r) => <option key={r} value={r}>{ROLES[r].long}</option>)}</Select></Field>
          <Field label="الحالة"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="نشط">نشط</option><option value="بانتظار الاعتماد">بانتظار الاعتماد</option></Select></Field>
        </div>
      </div>
    </Modal>
  );
}
