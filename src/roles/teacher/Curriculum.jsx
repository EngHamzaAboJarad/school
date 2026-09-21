import { useMemo, useState } from "react";
import { Archive, BookMarked, Bold, ChevronDown, FilePlus2, FolderPlus, Heading2, List, Paperclip, Plus, Send, Target, Undo2, ToggleLeft } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, Input, Modal, Notice, Page, Select, Split, Textarea, Toggle, cx } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allObjectives, lessonOf, lessonsInUnit, subjectOf, teacherSubjects, unitOf, unitsInSubject } from "../../store/selectors";
import { stages } from "../../data/curriculum";

const STATUS = { published: ["success", "منشور"], draft: ["neutral", "مسودّة"], review: ["warn", "بانتظار الاعتماد"], archived: ["danger", "مؤرشف"] };

// المنهج والمحتوى: شجرة مرحلة ← صف ← مادة ← وحدة ← درس (F1.1) ومحرّر المحتوى العربي RTL (F1.2)
export default function CurriculumPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const subs = teacherSubjects(state, user.id);
  const [sel, setSel] = useState("L-M3");
  const [open, setOpen] = useState(() => Object.fromEntries(["S-MATH", "S-SCI", "U-M3"].map((k) => [k, true])));
  const [addUnit, setAddUnit] = useState(null);
  const [addLesson, setAddLesson] = useState(null);
  const lesson = lessonOf(state, sel);
  const ls = lesson ? state.lessonState[lesson.id] || { status: "published", explainEnabled: true, notes: "", files: [] } : null;
  const objs = lesson ? allObjectives(state).filter((o) => o.lessonId === lesson.id) : [];
  const [obj, setObj] = useState("");
  const [notesDraft, setNotesDraft] = useState(null);
  const notes = notesDraft ?? ls?.notes ?? "";

  const inject = (before, after = "") => setNotesDraft(`${notes}${notes && !notes.endsWith("\n") ? "\n" : ""}${before}نص${after}`);
  const saveNotes = () => { dispatch({ type: "saveLessonNotes", lessonId: lesson.id, patch: { notes } }); setNotesDraft(null); toast("حُفظ المحتوى"); };

  return (
    <Page kicker="هيكلة المحتوى" title="المنهج والمحتوى" desc="شجرة المنهج بأهداف التعلّم لكل درس، مع محرّر عربي للمحتوى، ولا يُنشر شيء قبل اعتماده." icon={BookMarked}>
      <Split wide className="cur-layout">
        <Card title="شجرة المنهج" kicker="المرحلة المتوسطة ← الثالث المتوسط" className="tree-card">
          <div className="crumb-stages">{stages.map((s) => <Badge key={s.id} tone={s.id === "inter" ? "gold" : "neutral"}>{s.name}</Badge>)}</div>
          <ul className="tree">
            {subs.map((sid) => {
              const s = subjectOf(sid);
              return (
                <li key={sid}>
                  <button className="tree-node subject" onClick={() => setOpen({ ...open, [sid]: !open[sid] })}><ChevronDown size={16} className={open[sid] ? "" : "rot"} /><span className={`subj-tag tone-${s.tone}`}>{s.glyph} {s.name}</span></button>
                  {open[sid] && (
                    <ul>
                      {unitsInSubject(state, sid).map((u) => (
                        <li key={u.id}>
                          <button className="tree-node" onClick={() => setOpen({ ...open, [u.id]: !open[u.id] })}><ChevronDown size={15} className={open[u.id] ? "" : "rot"} /><b>الوحدة {u.no}:</b> {u.title}</button>
                          {open[u.id] && (
                            <ul>
                              {lessonsInUnit(state, u.id).map((l) => {
                                const st = state.lessonState[l.id]?.status || "published";
                                return (
                                  <li key={l.id}><button className={cx("tree-node leaf", sel === l.id && "active")} onClick={() => { setSel(l.id); setNotesDraft(null); }}>
                                    <span>{l.no}. {l.title}</span><Badge tone={STATUS[st][0]}>{STATUS[st][1]}</Badge></button></li>
                                );
                              })}
                              <li><button className="tree-add" onClick={() => setAddLesson(u.id)}><FilePlus2 size={14} /> إضافة درس</button></li>
                            </ul>
                          )}
                        </li>
                      ))}
                      <li><button className="tree-add" onClick={() => setAddUnit(sid)}><FolderPlus size={14} /> إضافة وحدة</button></li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        {lesson ? (
          <div className="stack">
            <Card title={lesson.title} kicker={`${subjectOf(unitOf(state, lesson.unitId).subjectId).name} • الوحدة ${unitOf(state, lesson.unitId).no}`} action={<Badge tone={STATUS[ls.status][0]} dot>{STATUS[ls.status][1]}</Badge>}>
              <div className="row spread">
                <Toggle label="الشرح الذكي لهذا الدرس" hint="عند التعطيل لا يرى الطلاب الشرح الآلي" checked={ls.explainEnabled !== false} onChange={() => { dispatch({ type: "toggleExplain", lessonId: lesson.id, actor: user.id }); toast(ls.explainEnabled === false ? "فُعِّل الشرح الذكي" : "عُطِّل الشرح الذكي للدرس", "warn"); }} />
              </div>
              <div className="divider" />
              <h4>أهداف التعلّم (تُبنى الاختبارات عليها)</h4>
              <div className="stack-sm mt-sm">
                {objs.length === 0 && <p className="muted small">لا أهداف مرتبطة بعد.</p>}
                {objs.map((o) => <div className="term" key={o.id}><strong><Target size={14} /> {o.title}</strong></div>)}
                <div className="row"><Input className="grow" value={obj} onChange={(e) => setObj(e.target.value)} placeholder="ربط هدف تعلّم جديد بالدرس…" /><Btn variant="ghost" icon={Plus} disabled={!obj.trim()} onClick={() => { dispatch({ type: "addObjective", lessonId: lesson.id, title: obj.trim(), actor: user.id }); setObj(""); toast("رُبط الهدف بالدرس"); }}>ربط</Btn></div>
              </div>
            </Card>

            <Card title="محرّر المحتوى" kicker="ملاحظات وإضافات المعلّم — تدعم العربية RTL">
              <div className="editor-bar">
                <button onClick={() => inject("**", "**")} aria-label="غامق"><Bold size={16} /></button>
                <button onClick={() => inject("## ")} aria-label="عنوان"><Heading2 size={16} /></button>
                <button onClick={() => inject("• ")} aria-label="قائمة"><List size={16} /></button>
                <span className="grow" />
                <label className="btn btn-ghost btn-sm attach"><Paperclip size={15} /> إرفاق ملف<input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { dispatch({ type: "saveLessonNotes", lessonId: lesson.id, patch: { files: [...(ls.files || []), { name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` }] } }); toast("أُرفق الملف بالدرس"); } }} /></label>
              </div>
              <Textarea dir="rtl" className="editor" value={notes} onChange={(e) => setNotesDraft(e.target.value)} placeholder="اكتب مثالًا إضافيًّا أو تنبيهًا للطلاب أو تمرينًا…" />
              {(ls.files || []).length > 0 && <div className="chips mt-sm">{ls.files.map((f) => <span className="chip" key={f.name}><Paperclip size={13} /> {f.name} ({f.size})</span>)}</div>}
              <div className="row mt">
                <Btn variant="primary" disabled={notesDraft === null} onClick={saveNotes}>حفظ</Btn>
                {ls.status === "draft" && <Btn variant="gold" icon={Send} onClick={() => { dispatch({ type: "requestPublish", lessonId: lesson.id, actor: user.id }); toast("أُرسل الدرس للاعتماد"); }}>إرسال للاعتماد والنشر</Btn>}
                {ls.status === "published" && <Btn variant="ghost" icon={Archive} onClick={() => { dispatch({ type: "setLessonStatus", lessonId: lesson.id, status: "archived", actor: user.id }); toast("أُرشف الدرس", "warn"); }}>أرشفة</Btn>}
                {ls.status === "archived" && <Btn variant="ghost" icon={Undo2} onClick={() => { dispatch({ type: "setLessonStatus", lessonId: lesson.id, status: "draft", actor: user.id }); toast("أُعيد كمسودّة"); }}>استعادة كمسودّة</Btn>}
              </div>
              <Notice tone="gold" icon={ToggleLeft}>حالات المحتوى: مسودّة ← بانتظار الاعتماد ← منشور ← مؤرشف. لا يُنشر محتوى إلا بعد اعتماده.</Notice>
            </Card>
          </div>
        ) : <Card><Empty icon={BookMarked} title="اختر درسًا من الشجرة" /></Card>}
      </Split>

      {addUnit && <AddTitle title="إضافة وحدة" label="عنوان الوحدة" onClose={() => setAddUnit(null)} onSave={(t) => { dispatch({ type: "addUnit", subjectId: addUnit, title: t, actor: user.id }); toast("أُضيفت الوحدة"); }} />}
      {addLesson && <AddTitle title="إضافة درس" label="عنوان الدرس" objective onClose={() => setAddLesson(null)} onSave={(t, o) => { dispatch({ type: "addLesson", unitId: addLesson, title: t, objective: o, actor: user.id }); toast("أُضيف الدرس كمسودّة"); }} />}
    </Page>
  );
}

function AddTitle({ title, label, objective, onClose, onSave }) {
  const [t, setT] = useState("");
  const [o, setO] = useState("");
  return (
    <Modal open onClose={onClose} title={title} kicker="هيكلة المنهج" footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!t.trim()} onClick={() => { onSave(t.trim(), o.trim()); onClose(); }}>إضافة</Btn></>}>
      <div className="stack">
        <Field label={label}><Input value={t} onChange={(e) => setT(e.target.value)} autoFocus /></Field>
        {objective && <Field label="هدف التعلّم" hint="تُبنى عليه الاختبارات لاحقًا"><Input value={o} onChange={(e) => setO(e.target.value)} placeholder="يستطيع الطالب أن…" /></Field>}
      </div>
    </Modal>
  );
}
