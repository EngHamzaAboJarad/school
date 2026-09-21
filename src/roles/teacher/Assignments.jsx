import { useState } from "react";
import { ClipboardCheck, Plus, Send, CheckCircle2 } from "lucide-react";
import { Avatar, Badge, Btn, Card, DataTable, Empty, Field, Input, Modal, Notice, Page, Progress, Select, Textarea } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { studentOf, subjectOf, teacherSubjects } from "../../store/selectors";
import { DAY_MS, relativeDay, timeAgo } from "../../lib/format";

const STATUS = { pending: ["neutral", "لم يُسلِّم"], submitted: ["info", "سُلِّم"], late: ["danger", "متأخر"], graded: ["success", "صُحّح"], missing: ["danger", "غير مُسلَّم"] };

// الواجبات والمهام (F6.4): إسناد واجب وتتبّع حالة تسليمه ونتيجته
export default function AssignmentsPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const mine = state.assignments.filter((a) => a.teacherId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const [sel, setSel] = useState(mine[0]?.id);
  const [creating, setCreating] = useState(false);
  const a = mine.find((x) => x.id === sel) || mine[0];
  const cls = a && state.classes.find((c) => c.id === a.classId);

  const rows = a ? cls.studentIds.map((sid) => {
    const sub = a.submissions[sid];
    const st = sub?.status || (a.due < Date.now() ? "missing" : "pending");
    return { id: sid, name: studentOf(state, sid)?.name, st, sub };
  }) : [];
  const counts = (k) => rows.filter((r) => r.st === k).length;
  const submitted = rows.filter((r) => ["submitted", "late", "graded"].includes(r.st)).length;

  return (
    <Page kicker="المهام" title="الواجبات والمهام" desc="أسند واجبات لفصولك وتابع التسليم والدرجات." icon={ClipboardCheck}
      actions={<Btn variant="primary" icon={Plus} onClick={() => setCreating(true)}>واجب جديد</Btn>}>
      {mine.length === 0 ? <Card><Empty icon={ClipboardCheck} title="لا واجبات بعد" action={<Btn variant="primary" onClick={() => setCreating(true)}>أنشئ أول واجب</Btn>} /></Card> : (
        <div className="assign-layout">
          <div className="stack-sm">
            {mine.map((x) => {
              const c = state.classes.find((k) => k.id === x.classId);
              const n = Object.keys(x.submissions).length;
              return (
                <button key={x.id} className={`assign-item ${a?.id === x.id ? "active" : ""}`} onClick={() => setSel(x.id)}>
                  <strong>{x.title}</strong>
                  <span>{subjectOf(x.subjectId)?.name} • {c?.name}</span>
                  <div className="row spread"><Progress value={(n / c.studentIds.length) * 100} tone="gold" size="sm" /><small className="num">{n}/{c.studentIds.length}</small></div>
                  <small className={x.due < Date.now() ? "late-text" : "muted"}>التسليم {relativeDay(x.due)}</small>
                </button>
              );
            })}
          </div>
          {a && (
            <Card title={a.title} kicker={`${subjectOf(a.subjectId)?.name} • ${cls.name}`} action={<Badge tone="gold">{a.points} درجة</Badge>}>
              <p className="muted">{a.desc}</p>
              <div className="grid grid-4 mt-sm">
                {[["سُلِّم", submitted, "info"], ["صُحّح", counts("graded"), "success"], ["متأخر", counts("late") + counts("missing"), "danger"], ["لم يُسلِّم", counts("pending"), "neutral"]].map(([l, n, t]) => <div className="mini-stat" key={l}><Badge tone={t}>{l}</Badge><b className="num">{n}</b></div>)}
              </div>
              <div className="mt">
                <DataTable dense rows={rows} columns={[
                  { key: "name", label: "الطالب", render: (r) => <div className="cell-user"><Avatar name={r.name} size={32} /><strong>{r.name}</strong></div> },
                  { key: "st", label: "الحالة", render: (r) => <Badge tone={STATUS[r.st][0]} dot>{STATUS[r.st][1]}</Badge> },
                  { key: "at", label: "وقت التسليم", render: (r) => r.sub ? <span className="muted small">{timeAgo(r.sub.at)}</span> : "—" },
                  { key: "grade", label: "الدرجة", render: (r) => r.sub && ["submitted", "late", "graded"].includes(r.st) ? <GradeCell a={a} r={r} /> : "—" },
                ]} />
              </div>
            </Card>
          )}
        </div>
      )}
      {creating && <NewAssignment onClose={() => setCreating(false)} onCreated={() => setSel(null)} />}
    </Page>
  );
}

function GradeCell({ a, r }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [g, setG] = useState(r.sub.grade ?? "");
  const [fb, setFb] = useState(r.sub.feedback || "");
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-link small" onClick={() => setOpen(true)}>{r.sub.grade != null ? `${r.sub.grade}/${a.points}` : "تصحيح"}</button>
      <Modal open={open} onClose={() => setOpen(false)} title={`تصحيح: ${r.name}`} kicker={a.title}
        footer={<><Btn variant="ghost" onClick={() => setOpen(false)}>إلغاء</Btn><Btn variant="primary" icon={CheckCircle2} disabled={g === "" || Number(g) > a.points} onClick={() => { dispatch({ type: "gradeAssignment", assignmentId: a.id, studentId: r.id, grade: Number(g), feedback: fb }); toast("حُفظت الدرجة"); setOpen(false); }}>حفظ</Btn></>}>
        <div className="stack">
          <Notice tone="info" title="ما سلّمه الطالب">{r.sub.text || "سلّم الواجب دون نص مرفق."}</Notice>
          <Field label={`الدرجة (من ${a.points})`}><Input type="number" min="0" max={a.points} value={g} onChange={(e) => setG(e.target.value)} /></Field>
          <Field label="ملاحظات"><Textarea value={fb} onChange={(e) => setFb(e.target.value)} /></Field>
        </div>
      </Modal>
    </>
  );
}

function NewAssignment({ onClose, onCreated }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const classes = state.classes.filter((c) => c.teacherId === user.id);
  const [f, setF] = useState({ title: "", classId: classes[0]?.id, subjectId: "", due: new Date(Date.now() + 3 * DAY_MS).toISOString().slice(0, 10), points: 10, desc: "" });
  const cls = classes.find((c) => c.id === f.classId);
  const subs = (cls?.subjects || []).map(subjectOf);
  const subjectId = f.subjectId || subs[0]?.id;
  return (
    <Modal open wide onClose={onClose} title="واجب جديد" kicker="إسناد مهمة"
      footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" icon={Send} disabled={!f.title.trim() || !f.desc.trim()} onClick={() => { dispatch({ type: "createAssignment", assignment: { teacherId: user.id, title: f.title.trim(), subjectId, classId: f.classId, due: new Date(f.due).getTime() + 23 * 3600000, points: Number(f.points), desc: f.desc.trim() } }); toast("أُسند الواجب وأُشعر الطلاب"); onCreated(); onClose(); }}>إسناد الواجب</Btn></>}>
      <div className="stack">
        <Field label="عنوان الواجب"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <div className="form-grid">
          <Field label="الفصل"><Select value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value, subjectId: "" })}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="المادة"><Select value={subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value })}>{subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label="موعد التسليم"><Input type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
          <Field label="الدرجة الكاملة"><Input type="number" min="1" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} /></Field>
        </div>
        <Field label="وصف المطلوب"><Textarea value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
