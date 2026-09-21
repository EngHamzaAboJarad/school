import { useState } from "react";
import { Plus, UserPlus, Users, Send, School } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Field, Input, Modal, Notice, Page, Progress, Select, Textarea } from "../../ui/Primitives";
import { HBars, Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { classStats, snapshot, studentOf, subjectOf, attendanceRate } from "../../store/selectors";
import { subjects } from "../../data/curriculum";
import { levelLabel, fmtDate } from "../../lib/format";

// إدارة الفصول والطلاب (F6.1): إنشاء فصل، إضافة طلاب، ربط المواد، ومتابعة كل طالب
export default function ClassesPage({ go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const [sel, setSel] = useState(classes[0]?.id);
  const [newCls, setNewCls] = useState(false);
  const [addStu, setAddStu] = useState(false);
  const [student, setStudent] = useState(null);
  const cls = classes.find((c) => c.id === sel) || classes[0];
  const stats = cls ? classStats(state, cls) : null;

  return (
    <Page kicker="إدارة الفصول" title="فصولي وطلابي" desc="أنشئ الفصول، أضف الطلاب، اربط المواد، وتابع مستوى كل طالب." icon={Users}
      actions={<Btn variant="primary" icon={Plus} onClick={() => setNewCls(true)}>فصل جديد</Btn>}>
      <div className="grid grid-3">
        {classes.map((c) => {
          const s = classStats(state, c);
          return (
            <button key={c.id} className={`class-card ${cls?.id === c.id ? "active" : ""}`} onClick={() => setSel(c.id)}>
              <div className="row spread"><div><strong>{c.name}</strong><span>{c.room}</span></div><Ring value={s.avg} size={62} stroke={7} label={`إتقان ${c.name}`} /></div>
              <div className="chips">{c.subjects.map((x) => <span className="chip" key={x}>{subjectOf(x)?.name}</span>)}</div>
              <small className="muted"><b className="num">{c.studentIds.length}</b> طالبًا • <b className="num">{s.struggling.length}</b> يحتاجون دعمًا</small>
            </button>
          );
        })}
      </div>

      {cls && (
        <Card className="mt" title={cls.name} kicker="قائمة الطلاب" action={<div className="row"><Btn size="sm" variant="ghost" icon={School}
          onClick={() => { const rest = subjects.filter((s) => s.grade === cls.grade); const next = rest.find((s) => !cls.subjects.includes(s.id)); if (!next) return toast("كل مواد الصف مرتبطة", "info"); dispatch({ type: "updateClass", id: cls.id, patch: { subjects: [...cls.subjects, next.id] }, action: "ربط مادة بفصل", target: `${next.name} ← ${cls.name}`, actor: user.id }); toast(`رُبطت مادة ${next.name}`); }}>ربط مادة</Btn>
          <Btn size="sm" variant="primary" icon={UserPlus} onClick={() => setAddStu(true)}>إضافة طالب</Btn></div>}>
          <div className="chips mb">{cls.subjects.map((x) => <Badge key={x} tone="emerald">{subjectOf(x)?.name}</Badge>)}</div>
          <DataTable onRowClick={(r) => setStudent(r.id)} rows={stats.rows} columns={[
            { key: "name", label: "الطالب", render: (r) => <div className="cell-user"><Avatar name={r.name} size={36} /><div><strong>{r.name}</strong><small>{r.assessed} أهداف مُقيَّمة</small></div></div> },
            { key: "avg", label: "الإتقان", render: (r) => r.assessed ? <div className="cell-bar"><Progress value={r.avg} tone={r.avg >= 70 ? "emerald" : "gold"} /><b className="num">{r.avg}%</b></div> : <Badge>لم يُقيَّم</Badge> },
            { key: "gaps", label: "الفجوات", render: (r) => <Badge tone={r.gaps ? "warn" : "success"}>{r.gaps}</Badge> },
            { key: "lessonsDone", label: "دروس مكتملة", render: (r) => <span className="num">{r.lessonsDone}</span> },
            { key: "att", label: "الحضور", render: (r) => <span className="num">{attendanceRate(state, r.id).rate}%</span> },
            { key: "points", label: "النقاط", render: (r) => <span className="num">{r.points.toLocaleString("en-US")}</span> },
          ]} />
        </Card>
      )}

      {newCls && <NewClass onClose={() => setNewCls(false)} onCreated={(id) => setSel(id)} />}
      <Modal open={addStu} onClose={() => setAddStu(false)} title="إضافة طالب" kicker={cls?.name}>
        <AddStudent cls={cls} onClose={() => setAddStu(false)} />
      </Modal>
      {student && <StudentSheet id={student} onClose={() => setStudent(null)} go={go} />}
    </Page>
  );
}

function AddStudent({ cls, onClose }) {
  const { dispatch, user } = useStore();
  const toast = useToast();
  const [name, setName] = useState("");
  return (
    <div className="stack">
      <Field label="اسم الطالب"><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
      <Notice tone="info">يُنشأ حساب الطالب ويُربط بالفصل، ويحتاج إلى ربط وليّ الأمر واعتماد المدرسة قبل الدخول.</Notice>
      <div className="row"><Btn variant="primary" disabled={!name.trim()} onClick={() => { dispatch({ type: "addStudent", classId: cls.id, name: name.trim(), actor: user.id }); toast("أُضيف الطالب إلى الفصل"); onClose(); }}>إضافة</Btn><Btn variant="ghost" onClick={onClose}>إلغاء</Btn></div>
    </div>
  );
}

function NewClass({ onClose, onCreated }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const grades = [...new Set(subjects.map((s) => s.grade))];
  const [f, setF] = useState({ name: "", grade: grades[0], room: "", subjects: [] });
  const avail = subjects.filter((s) => s.grade === f.grade);
  const toggle = (id) => setF({ ...f, subjects: f.subjects.includes(id) ? f.subjects.filter((x) => x !== id) : [...f.subjects, id] });
  return (
    <Modal open onClose={onClose} title="فصل جديد" kicker="إدارة الفصول"
      footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!f.name.trim() || !f.subjects.length} onClick={() => { dispatch({ type: "createClass", cls: { name: f.name.trim(), grade: f.grade, room: f.room || "—", teacherId: user.id, subjects: f.subjects }, actor: user.id }); toast("أُنشئ الفصل"); onClose(); }}>إنشاء الفصل</Btn></>}>
      <div className="stack">
        <Field label="اسم الفصل"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="الثالث المتوسط / ج" /></Field>
        <div className="form-grid">
          <Field label="الصف"><Select value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value, subjects: [] })}>{grades.map((g) => <option key={g}>{g}</option>)}</Select></Field>
          <Field label="القاعة"><Input value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} placeholder="قاعة 16" /></Field>
        </div>
        <div><span className="field-label">المواد المرتبطة</span><div className="chips mt-sm">{avail.map((s) => <button key={s.id} className={`chip ${f.subjects.includes(s.id) ? "active" : ""}`} onClick={() => toggle(s.id)}>{s.name}</button>)}</div></div>
      </div>
    </Modal>
  );
}

function StudentSheet({ id, onClose, go }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const stu = studentOf(state, id);
  const snap = snapshot(state, id);
  const attempts = state.attempts.filter((a) => a.studentId === id).sort((a, b) => b.at - a.at).slice(0, 4);
  const [msg, setMsg] = useState("");
  return (
    <Modal open wide onClose={onClose} title={stu.name} kicker="ملف الطالب"
      footer={<><Textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="رسالة للطالب (اختياري)" style={{ minHeight: 44, flex: 1 }} />
        <Btn variant="primary" icon={Send} disabled={!msg.trim()} onClick={() => { dispatch({ type: "newThread", from: user.id, to: id, subject: "ملاحظة من المعلّم", text: msg }); toast("أُرسلت الرسالة"); setMsg(""); }}>إرسال</Btn></>}>
      <div className="grid grid-2">
        <div className="stack">
          <div className="row"><Ring value={snap.avg} size={84} stroke={9} label="الإتقان العام" /><div><strong>{levelLabel(snap.avg)}</strong><p className="muted small">{snap.entries.length} أهداف مُقيَّمة • {snap.gaps.length} فجوات • الحضور {attendanceRate(state, id).rate}%</p></div></div>
          <HBars data={snap.entries.map((e) => ({ label: e.title, value: e.mastery }))} />
        </div>
        <div className="stack-sm">
          <h4>الفجوات المفتوحة</h4>
          {snap.gaps.length === 0 && <Notice tone="success">لا فجوات مفتوحة.</Notice>}
          {snap.gaps.map((g) => <div className="term" key={g.id}><strong>{g.title}</strong><span>الإتقان {g.mastery}% — {g.plan ? `الخطة ${Object.values(g.plan.steps).filter(Boolean).length}/3` : "بلا خطة"}</span></div>)}
          <h4 className="mt-sm">آخر المحاولات</h4>
          {attempts.length === 0 && <p className="muted small">لا محاولات.</p>}
          {attempts.map((a) => <div className="term" key={a.id}><strong>{a.score}% — {a.kind === "unit" ? "امتحان وحدة" : a.kind === "retest" ? "علاجي" : "اختبار درس"}</strong><span>{fmtDate(a.at)}</span></div>)}
        </div>
      </div>
    </Modal>
  );
}
