import { useState } from "react";
import { CalendarRange, FilePlus2, FolderPlus, Layers, School, Users } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, Field, Input, ListRow, Modal, Page, Select, Tabs } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allUnits, lessonsInUnit, subjectOf, unitsInSubject, userName } from "../../store/selectors";
import { PERIODS, WEEKDAYS } from "../../data/people";
import { stages, subjects } from "../../data/curriculum";

const TEACHERS = ["tch-khaled", "tch-noura", "tch-sarah", "tch-huda"];
const SUBJECT_NAMES = ["الرياضيات", "العلوم", "لغتي الجميلة", "اللغة الإنجليزية", "القرآن الكريم", "التربية البدنية", "الدراسات الاجتماعية", "—"];

// الصفوف والفصول والجداول (F7.2) + هيكلة المنهج (F1.1)
export default function StructurePage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("classes");
  const [clsId, setClsId] = useState("c-3a");
  const [cell, setCell] = useState(null);
  const [addUnit, setAddUnit] = useState(null);
  const [addLesson, setAddLesson] = useState(null);
  const table = state.timetable[clsId] || Array.from({ length: 5 }, () => Array(6).fill(["—", ""]));

  return (
    <Page kicker="البنية الأكاديمية" title="الصفوف والجداول" desc="نظّم الصفوف والفصول وجداولها واربط المعلّمين، وأدِر بنية المنهج التي تُبنى عليها الاختبارات." icon={CalendarRange}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "classes", label: "الفصول والمعلّمون", icon: Users }, { id: "timetable", label: "الجدول الأسبوعي", icon: CalendarRange }, { id: "curriculum", label: "بنية المنهج", icon: Layers }]} />

      {tab === "classes" && (
        <div className="grid grid-2">
          {stages.slice(0, 2).map((st) => (
            <Card key={st.id} title={st.name} kicker="الصفوف والفصول">
              {state.classes.filter((c) => st.grades.some((g) => g.name === c.grade)).length === 0 && <Empty title="لا فصول" />}
              {state.classes.filter((c) => st.grades.some((g) => g.name === c.grade)).map((c) => (
                <div className="cls-row" key={c.id}>
                  <span className="row-icon tone-emerald"><School size={18} /></span>
                  <div className="row-main"><strong>{c.name}</strong><span>{c.room} • {c.studentIds.length} طالبًا • {c.subjects.map((s) => subjectOf(s)?.name).join("، ")}</span></div>
                  <Select value={c.teacherId} aria-label={`معلّم ${c.name}`} style={{ height: 38, minWidth: 170 }}
                    onChange={(e) => { dispatch({ type: "updateClass", id: c.id, patch: { teacherId: e.target.value }, action: "ربط معلّم بفصل", target: `${userName(state, e.target.value)} ← ${c.name}`, actor: user.id }); toast("رُبط المعلّم بالفصل"); }}>
                    {TEACHERS.map((t) => <option key={t} value={t}>{userName(state, t)}</option>)}
                  </Select>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {tab === "timetable" && (
        <Card title="الجدول الأسبوعي" kicker="اضغط على أي حصة لتعديلها" action={<Select value={clsId} onChange={(e) => setClsId(e.target.value)} aria-label="الفصل" style={{ height: 38 }}>{state.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>}>
          <div className="tt-wrap">
            <table className="tt">
              <thead><tr><th />{PERIODS.map((p, i) => <th key={p}><span className="num">{p}</span><small>الحصة {i + 1}</small></th>)}</tr></thead>
              <tbody>
                {WEEKDAYS.map((d, di) => (
                  <tr key={d}>
                    <th>{d}</th>
                    {PERIODS.map((_, pi) => {
                      const [subj, tid] = table[di][pi];
                      return (
                        <td key={pi}>
                          <button className={`tt-cell ${subj === "—" ? "empty" : ""}`} onClick={() => setCell({ day: di, period: pi, subject: subj, teacherId: tid || TEACHERS[0] })}>
                            <b>{subj}</b><small>{tid ? userName(state, tid) : "غير محدّد"}</small>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "curriculum" && (
        <div className="grid grid-2">
          {subjects.filter((s) => s.grade === "الثالث المتوسط").map((s) => (
            <Card key={s.id} title={s.name} kicker={s.grade} action={<Btn size="sm" variant="ghost" icon={FolderPlus} onClick={() => setAddUnit(s.id)}>وحدة</Btn>}>
              {unitsInSubject(state, s.id).map((u) => (
                <div key={u.id} className="cur-unit">
                  <div className="row spread"><strong>الوحدة {u.no}: {u.title}</strong><Btn size="sm" variant="ghost" icon={FilePlus2} onClick={() => setAddLesson(u.id)}>درس</Btn></div>
                  <ol>{lessonsInUnit(state, u.id).map((l) => <li key={l.id}>{l.title} <Badge tone={(state.lessonState[l.id]?.status || "published") === "published" ? "success" : "neutral"}>{(state.lessonState[l.id]?.status || "published") === "published" ? "منشور" : "مسودّة"}</Badge></li>)}</ol>
                </div>
              ))}
            </Card>
          ))}
        </div>
      )}

      {cell && (
        <Modal open onClose={() => setCell(null)} title="تعديل الحصة" kicker={`${WEEKDAYS[cell.day]} — الحصة ${cell.period + 1} (${PERIODS[cell.period]})`}
          footer={<><Btn variant="ghost" onClick={() => setCell(null)}>إلغاء</Btn><Btn variant="primary" onClick={() => { dispatch({ type: "setTimetableCell", classId: clsId, day: cell.day, period: cell.period, subject: cell.subject, teacherId: cell.subject === "—" ? "" : cell.teacherId, actor: user.id }); toast("حُدِّث الجدول"); setCell(null); }}>حفظ</Btn></>}>
          <div className="stack">
            <Field label="المادة"><Select value={cell.subject} onChange={(e) => setCell({ ...cell, subject: e.target.value })}>{SUBJECT_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
            <Field label="المعلّم"><Select value={cell.teacherId} onChange={(e) => setCell({ ...cell, teacherId: e.target.value })}>{TEACHERS.map((t) => <option key={t} value={t}>{userName(state, t)}</option>)}</Select></Field>
          </div>
        </Modal>
      )}
      {addUnit && <Title title="إضافة وحدة" label="عنوان الوحدة" onClose={() => setAddUnit(null)} onSave={(t) => { dispatch({ type: "addUnit", subjectId: addUnit, title: t, actor: user.id }); toast("أُضيفت الوحدة"); }} />}
      {addLesson && <Title title="إضافة درس" label="عنوان الدرس" objective onClose={() => setAddLesson(null)} onSave={(t, o) => { dispatch({ type: "addLesson", unitId: addLesson, title: t, objective: o, actor: user.id }); toast("أُضيف الدرس كمسودّة"); }} />}
    </Page>
  );
}

function Title({ title, label, objective, onClose, onSave }) {
  const [t, setT] = useState("");
  const [o, setO] = useState("");
  return (
    <Modal open onClose={onClose} title={title} kicker="هيكلة المنهج" footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!t.trim()} onClick={() => { onSave(t.trim(), o.trim()); onClose(); }}>إضافة</Btn></>}>
      <div className="stack">
        <Field label={label}><Input value={t} onChange={(e) => setT(e.target.value)} autoFocus /></Field>
        {objective && <Field label="هدف التعلّم"><Input value={o} onChange={(e) => setO(e.target.value)} placeholder="يستطيع الطالب أن…" /></Field>}
      </div>
    </Modal>
  );
}
