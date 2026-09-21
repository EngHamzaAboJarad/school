import { useMemo, useState } from "react";
import { Check, Download, Layers, Pencil, X, Sparkles } from "lucide-react";
import { Badge, Btn, Card, DataTable, Modal, Page, Select, SearchBox, Stat, Notice } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allLessons, allObjectives, lessonOf, teacherSubjects, unitOf } from "../../store/selectors";
import { DIFFICULTIES, QUESTION_TYPES } from "../../data/curriculum";
import { normalizeAr } from "../../lib/rng";
import { downloadCSV } from "../../lib/export";
import { QuestionView, correctText } from "../student/Assess";
import QuestionEditor from "./QuestionEditor";

const ST = { approved: ["success", "معتمَد"], pending: ["warn", "بانتظار الاعتماد"], rejected: ["danger", "مرفوض"] };

// بنك الأسئلة (F2.6): أسئلة موسومة بالهدف والصعوبة والحالة، تُعاد استخدامها في الاختبارات وامتحانات الوحدات
export default function BankPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const subs = teacherSubjects(state, user.id);
  const lessons = allLessons(state).filter((l) => subs.includes(unitOf(state, l.unitId)?.subjectId));
  const [f, setF] = useState({ lesson: "", diff: "", status: "", type: "", q: "" });
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const objs = allObjectives(state);
  const objTitle = (id) => objs.find((o) => o.id === id)?.title;
  const pool = state.questions.filter((q) => lessons.some((l) => l.id === q.lessonId));
  const rows = useMemo(() => pool.filter((q) => (!f.lesson || q.lessonId === f.lesson) && (!f.diff || q.difficulty === f.diff) && (!f.status || q.status === f.status) && (!f.type || q.type === f.type) && (!f.q || normalizeAr(q.text).includes(normalizeAr(f.q)))),
    [pool.length, f, state.questions]); // eslint-disable-line react-hooks/exhaustive-deps
  const usedIn = (q) => state.reviewItems.filter((r) => r.questionIds?.includes(q.id) && r.status === "approved").length;

  return (
    <Page kicker="إعادة الاستخدام" title="بنك الأسئلة" desc="كل سؤال معتمد يُحفظ هنا موسومًا بهدفه وصعوبته، ويُسحب تلقائيًّا في اختبارات الدروس وامتحانات الوحدات لخفض الكلفة ورفع الجودة." icon={Layers}
      actions={<Btn variant="ghost" icon={Download} onClick={() => { downloadCSV("بنك-الأسئلة", [["المعرّف", "النص", "النوع", "الصعوبة", "الهدف", "الحالة"], ...rows.map((q) => [q.id, q.text, QUESTION_TYPES[q.type], q.difficulty, objTitle(q.objective), ST[q.status][1]])]); toast("صُدِّر البنك (CSV)"); }}>تصدير</Btn>}>
      <div className="grid grid-4">
        <Stat label="إجمالي الأسئلة" value={pool.length} icon={Layers} />
        <Stat label="معتمَدة" value={pool.filter((q) => q.status === "approved").length} icon={Check} />
        <Stat label="بانتظار الاعتماد" value={pool.filter((q) => q.status === "pending").length} tone="gold" icon={Sparkles} />
        <Stat label="مولَّدة بالذكاء الاصطناعي" value={pool.filter((q) => q.source === "ai").length} tone="blue" icon={Sparkles} foot={`${pool.filter((q) => q.edited).length} عدّلها معلّم`} />
      </div>
      <Card className="mt" flush>
        <div className="bank-filters">
          <SearchBox value={f.q} onChange={(q) => setF({ ...f, q })} placeholder="ابحث في نصوص الأسئلة…" />
          <Select value={f.lesson} onChange={(e) => setF({ ...f, lesson: e.target.value })} aria-label="الدرس"><option value="">كل الدروس</option>{lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</Select>
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} aria-label="النوع"><option value="">كل الأنواع</option>{Object.entries(QUESTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
          <Select value={f.diff} onChange={(e) => setF({ ...f, diff: e.target.value })} aria-label="الصعوبة"><option value="">كل المستويات</option>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</Select>
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="الحالة"><option value="">كل الحالات</option>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v[1]}</option>)}</Select>
        </div>
        <div className="pad">
          <DataTable dense rows={rows} empty="لا أسئلة مطابقة" columns={[
            { key: "text", label: "السؤال", render: (q) => <div className="bank-q"><strong>{q.text.length > 70 ? `${q.text.slice(0, 70)}…` : q.text}</strong><small className="muted">{objTitle(q.objective)}</small></div> },
            { key: "type", label: "النوع", render: (q) => <Badge tone="emerald">{QUESTION_TYPES[q.type]}</Badge> },
            { key: "difficulty", label: "الصعوبة", render: (q) => <Badge tone={q.difficulty === "صعب" ? "danger" : q.difficulty === "متوسط" ? "warn" : "success"}>{q.difficulty}</Badge> },
            { key: "status", label: "الحالة", render: (q) => <Badge tone={ST[q.status][0]} dot>{ST[q.status][1]}</Badge> },
            { key: "used", label: "الاستخدام", render: (q) => <span className="num muted">{usedIn(q)} مرات{q.edited ? " • عُدِّل" : ""}</span> },
            { key: "act", label: "", render: (q) => (
              <div className="row" onClick={(e) => e.stopPropagation()}>
                <Btn size="sm" variant="ghost" onClick={() => setView(q)}>عرض</Btn>
                <Btn size="sm" variant="ghost" icon={Pencil} aria-label="تعديل" onClick={() => setEdit(q)} />
                {q.status !== "approved" && <Btn size="sm" variant="ghost" icon={Check} aria-label="اعتماد" onClick={() => { dispatch({ type: "setQuestionStatus", qid: q.id, status: "approved", actor: user.id }); toast("اعتُمد السؤال"); }} />}
                {q.status !== "rejected" && <Btn size="sm" variant="danger" icon={X} aria-label="رفض" onClick={() => { dispatch({ type: "setQuestionStatus", qid: q.id, status: "rejected", actor: user.id }); toast("رُفض السؤال", "warn"); }} />}
              </div>) },
          ]} />
        </div>
      </Card>
      <Notice tone="gold" icon={Layers}>لا يُنشر سؤال إلا بعد اعتماده. تُسحب الأسئلة المعتمدة تلقائيًّا في امتحانات الوحدات بحسب المخطّط (Blueprint) وتُعاد استخدامها لخفض كلفة التوليد.</Notice>
      <Modal open={!!view} onClose={() => setView(null)} title="معاينة السؤال" kicker={view ? lessonOf(state, view.lessonId)?.title : ""} footer={<Btn variant="primary" onClick={() => setView(null)}>إغلاق</Btn>}>
        {view && <QuestionView q={view} value={view.type === "mcq" ? view.answer : view.type === "tf" ? view.answer : view.type === "fill" ? view.answers[0] : view.type === "match" ? Object.fromEntries(view.pairs.map(([, r], k) => [k, r])) : view.model} result={view.type === "essay" ? undefined : { got: 1, preview: true }} disabled />}
      </Modal>
      {edit && <QuestionEditor q={edit} objectives={objs.filter((o) => o.subjectId === unitOf(state, lessonOf(state, edit.lessonId)?.unitId)?.subjectId)} onClose={() => setEdit(null)} onSave={(patch) => { dispatch({ type: "updateQuestion", qid: edit.id, patch, actor: user.id }); setEdit(null); toast("حُفظ التعديل ووُثِّق"); }} />}
    </Page>
  );
}
