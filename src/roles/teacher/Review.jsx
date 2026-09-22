import { useMemo, useState } from "react";
import { Bot, Check, ClipboardCheck, FileCheck2, FileText, Layers, Pencil, Sparkles, Trophy, X, ShieldCheck, Undo2, Wand2, Sliders } from "lucide-react";
import { Btn, Badge, Card, Empty, Field, ListRow, Modal, Notice, Page, Select, Tabs, Textarea, Input } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allObjectives, lessonOf, lessonsInUnit, pendingReviews, unitOf, unitsInSubject, teacherSubjects, allLessons, subjectOf, userName } from "../../store/selectors";
import { DIFFICULTIES } from "../../data/curriculum";
import { timeAgo } from "../../lib/format";
import { QuestionView, correctText } from "../student/Assess";
import QuestionEditor from "./QuestionEditor";

const KIND = {
  quiz: ["اختبار درس", ClipboardCheck, "emerald"],
  exam: ["امتحان وحدة", Trophy, "gold"],
  summary: ["ملخص", Layers, "blue"],
  explain: ["شرح", Bot, "warn"],
  batch: ["أسئلة مولّدة", Sparkles, "gold"],
};

// اعتماد المحتوى المولَّد بالذكاء الاصطناعي قبل وصوله للطالب (F6.2 — الإنسان في الحلقة)
export default function ReviewPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("pending");
  const [open, setOpen] = useState(null);
  const [gen, setGen] = useState(false);
  const [bp, setBp] = useState(null);
  const items = pendingReviews(state, user.id);
  const by = (s) => items.filter((i) => i.status === s);
  const shown = by(tab);

  return (
    <Page kicker="الإنسان في الحلقة" title="اعتماد المحتوى" desc="لا يصل أي محتوى أو اختبار مولَّد إلى الطالب قبل أن تراجعه وتعتمده. عدّل الأسئلة أو ارفضها أو اعتمدها." icon={FileCheck2}
      actions={<>
        <Btn variant="ghost" icon={Sliders} onClick={() => setBp(true)}>مخطّط امتحان الوحدة</Btn>
        <Btn variant="gold" icon={Wand2} onClick={() => setGen(true)}>توليد أسئلة بالذكاء الاصطناعي</Btn>
      </>}>
      <Notice tone="gold" icon={ShieldCheck} title="سياسة الاعتماد مُفعَّلة">تُسجَّل كل موافقة أو تعديل أو رفض باسمك في سجلّ التدقيق، ويُشعَر الطلاب عند الاعتماد.</Notice>
      <div className="mt" />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "pending", label: "بانتظار الاعتماد", count: by("pending").length }, { id: "approved", label: "معتمَد" }, { id: "rejected", label: "مرفوض" }]} />
      <Card flush>
        <div className="pad">
          {shown.length === 0 && <Empty icon={FileCheck2} title={tab === "pending" ? "لا شيء بانتظار اعتمادك" : "لا عناصر هنا"} desc={tab === "pending" ? "أحسنت! يمكنك توليد أسئلة جديدة من زر «توليد أسئلة»." : ""} />}
          {shown.map((r) => {
            const [label, Icon, tone] = KIND[r.kind];
            const unit = unitOf(state, r.unitId);
            return (
              <ListRow key={r.id} icon={Icon} tone={tone} title={r.title}
                meta={`${label} • ${subjectOf(unit?.subjectId)?.name} • الوحدة ${unit?.no} • ${timeAgo(r.createdAt)}${r.decidedBy ? ` • ${userName(state, r.decidedBy)}` : ""}`}
                end={<>
                  {r.questionIds && <Badge>{r.questionIds.length} سؤالًا</Badge>}
                  <Badge tone={r.status === "approved" ? "success" : r.status === "rejected" ? "danger" : "warn"} dot>{r.status === "approved" ? "معتمَد" : r.status === "rejected" ? "مرفوض" : "بانتظارك"}</Badge>
                  <Btn size="sm" variant={r.status === "pending" ? "primary" : "ghost"} onClick={() => setOpen(r.id)}>{r.status === "pending" ? "مراجعة" : "عرض"}</Btn>
                </>} />
            );
          })}
        </div>
      </Card>
      {open && <ReviewModal itemId={open} onClose={() => setOpen(null)} />}
      {gen && <GenerateModal onClose={() => setGen(false)} />}
      {bp && <BlueprintModal onClose={() => setBp(null)} />}
    </Page>
  );
}

function ReviewModal({ itemId, onClose }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const item = state.reviewItems.find((r) => r.id === itemId);
  const [edit, setEdit] = useState(null);
  const [note, setNote] = useState("");
  const lesson = lessonOf(state, item.lessonId);
  const unit = unitOf(state, item.unitId);
  const questions = (item.questionIds || []).map((id) => state.questions.find((q) => q.id === id)).filter(Boolean);
  const pending = item.status === "pending";
  const objs = allObjectives(state).filter((o) => o.subjectId === unit?.subjectId);
  const bp = state.blueprints[item.unitId];
  const kept = questions.filter((q) => q.status !== "rejected").length;

  const decide = (decision) => {
    dispatch({ type: "decideReview", itemId, decision, note, actor: user.id });
    toast(decision === "approved" ? "اعتُمد المحتوى وأُشعر الطلاب" : "رُفض المحتوى", decision === "approved" ? "success" : "warn");
    onClose();
  };

  return (
    <Modal open wide onClose={onClose} title={item.title} kicker={KIND[item.kind][0]}
      footer={pending ? <>
        <Textarea placeholder="ملاحظة للمولِّد أو للزملاء (اختياري)" value={note} onChange={(e) => setNote(e.target.value)} style={{ minHeight: 44, flex: 1 }} />
        <Btn variant="danger" icon={X} onClick={() => decide("rejected")}>رفض</Btn>
        <Btn variant="gold" icon={Check} disabled={item.questionIds && kept === 0} onClick={() => decide("approved")}>{item.questionIds ? `اعتماد (${kept} أسئلة)` : "اعتماد"}</Btn>
      </> : <Btn variant="primary" onClick={onClose}>إغلاق</Btn>}>
      <div className="stack">
        {item.note && <Notice tone="info" title="ملاحظتك">{item.note}</Notice>}
        {item.kind === "exam" && bp && (
          <Notice tone="info" title="مخطّط الامتحان">
            {bp.count} أسئلة موضوعية{bp.essayIds?.length ? ` + ${bp.essayIds.length} مقالي` : ""} • {bp.durationMin} دقيقة • {bp.attempts} محاولات — الأوزان: {Object.entries(bp.weights).map(([id, w]) => `${lessonOf(state, id)?.title} ${w}%`).join("، ")}
          </Notice>
        )}
        {item.kind === "summary" && lesson && (
          <div className="grid grid-2">
            <Card title="النقاط الرئيسية"><ol className="points">{lesson.summary.points.map((p) => <li key={p}>{p}</li>)}</ol></Card>
            <Card title="المصطلحات"><div className="stack-sm">{lesson.summary.terms.map(([t, d]) => <div className="term" key={t}><strong>{t}</strong><span>{d}</span></div>)}</div></Card>
          </div>
        )}
        {(item.kind === "explain") && lesson && (
          <Card title={`شرح «${lesson.title}»`}>
            {[...lesson.explain.base, ...lesson.explain.medium].map((s) => <div key={s.h} className="ex-section"><h4>{s.h}</h4><p style={{ paddingInlineStart: 0 }}>{s.p}</p></div>)}
          </Card>
        )}
        {questions.map((q, i) => (
          <div className={`rq ${q.status}`} key={q.id}>
            <div className="row spread">
              <span className="small muted">سؤال <b className="num">{i + 1}</b> • {allLessons(state).find((l) => l.id === q.lessonId)?.title}</span>
              <div className="row">
                {q.edited && <Badge tone="info">عُدِّل</Badge>}
                {q.status === "rejected" && <Badge tone="danger">مستبعَد</Badge>}
                {q.source === "ai" && <Badge tone="gold" icon={Sparkles}>مولَّد</Badge>}
              </div>
            </div>
            <QuestionView q={q} value={q.type === "mcq" ? q.answer : q.type === "tf" ? q.answer : q.type === "fill" ? q.answers[0] : q.type === "match" ? Object.fromEntries(q.pairs.map(([, r], k) => [k, r])) : q.model} result={q.type === "essay" ? undefined : { got: 1, preview: true }} disabled />
            <div className="row">
              <span className="small muted grow">الإجابة: <b>{correctText(q)}</b></span>
              {pending && (
                <>
                  <Btn size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(q)}>تعديل</Btn>
                  {q.status === "rejected"
                    ? <Btn size="sm" variant="ghost" icon={Undo2} onClick={() => dispatch({ type: "setQuestionStatus", qid: q.id, status: "pending", actor: user.id })}>إعادة</Btn>
                    : <Btn size="sm" variant="danger" icon={X} onClick={() => dispatch({ type: "setQuestionStatus", qid: q.id, status: "rejected", actor: user.id })}>استبعاد</Btn>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {edit && <QuestionEditor q={edit} objectives={objs} onClose={() => setEdit(null)} onSave={(patch) => { dispatch({ type: "updateQuestion", qid: edit.id, patch, actor: user.id }); setEdit(null); toast("حُفظ التعديل ووُثِّق في السجلّ"); }} />}
    </Modal>
  );
}

// توليد أسئلة من محتوى الدرس (F2.1): تُنشأ مسودّة بانتظار اعتماد المعلّم
function GenerateModal({ onClose }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const subs = teacherSubjects(state, user.id);
  const lessons = allLessons(state).filter((l) => subs.includes(unitOf(state, l.unitId)?.subjectId));
  const [lessonId, setLessonId] = useState(lessons[0]?.id);
  const [count, setCount] = useState(3);
  const [diff, setDiff] = useState("متوسط");
  const l = lessonOf(state, lessonId);
  return (
    <Modal open onClose={onClose} title="توليد أسئلة" kicker="الذكاء الاصطناعي من محتوى الدرس"
      footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="gold" icon={Wand2} disabled={!l?.cards.length} onClick={() => { dispatch({ type: "generateBatch", lessonId, count: Number(count), difficulty: diff, actor: user.id }); toast("وُلِّدت أسئلة جديدة بانتظار اعتمادك"); onClose(); }}>ولّد الأسئلة</Btn></>}>
      <div className="stack">
        <Notice tone="info" icon={Sparkles}>تُبنى الأسئلة من محتوى الدرس نفسه وتُربط بهدف تعلّمه، وتبقى مسودّة حتى تعتمدها.</Notice>
        <Field label="الدرس"><Select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>{lessons.map((x) => <option key={x.id} value={x.id}>{subjectOf(unitOf(state, x.unitId)?.subjectId)?.name} — {x.title}</option>)}</Select></Field>
        <div className="form-grid">
          <Field label="عدد الأسئلة"><Select value={count} onChange={(e) => setCount(e.target.value)}>{[2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
          <Field label="مستوى الصعوبة"><Select value={diff} onChange={(e) => setDiff(e.target.value)}>{DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}</Select></Field>
        </div>
        {l && !l.cards.length && <Notice tone="warn">لا توجد مادة كافية في هذا الدرس للتوليد. أضف محتوى أولًا.</Notice>}
      </div>
    </Modal>
  );
}

// مخطّط الامتحان: أوزان الدروس وعدد الأسئلة والمدة والمحاولات (F2.2 / F2.8)
function BlueprintModal({ onClose }) {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const subs = teacherSubjects(state, user.id);
  const units = subs.flatMap((s) => unitsInSubject(state, s)).filter((u) => state.blueprints[u.id]);
  const [unitId, setUnitId] = useState(units[0]?.id);
  const [bp, setBp] = useState(() => JSON.parse(JSON.stringify(state.blueprints[units[0]?.id])));
  const pick = (id) => { setUnitId(id); setBp(JSON.parse(JSON.stringify(state.blueprints[id]))); };
  const total = Object.values(bp.weights).reduce((a, b) => a + Number(b), 0);
  return (
    <Modal open wide onClose={onClose} title="مخطّط امتحان الوحدة" kicker="Blueprint"
      footer={<><Btn variant="ghost" onClick={onClose}>إغلاق</Btn><Btn variant="primary" disabled={total !== 100} onClick={() => { dispatch({ type: "setBlueprint", unitId, patch: bp, actor: user.id }); toast("حُفظ المخطّط"); onClose(); }}>حفظ المخطّط</Btn></>}>
      <div className="stack">
        <Field label="الوحدة"><Select value={unitId} onChange={(e) => pick(e.target.value)}>{units.map((u) => <option key={u.id} value={u.id}>{subjectOf(u.subjectId)?.name} — {u.title}</option>)}</Select></Field>
        <div>
          <span className="field-label">أوزان الدروس <Badge tone={total === 100 ? "success" : "danger"}>المجموع {total}%</Badge></span>
          <div className="stack-sm mt-sm">
            {Object.entries(bp.weights).map(([id, w]) => (
              <div className="bp-row" key={id}>
                <span>{lessonOf(state, id)?.title}</span>
                <input type="range" min="0" max="60" step="5" value={w} onChange={(e) => setBp({ ...bp, weights: { ...bp.weights, [id]: Number(e.target.value) } })} aria-label={`وزن ${lessonOf(state, id)?.title}`} />
                <b className="num">{w}%</b>
              </div>
            ))}
          </div>
          {total !== 100 && <span className="field-error">يجب أن يكون مجموع الأوزان 100%.</span>}
        </div>
        <div className="form-grid">
          <Field label="عدد الأسئلة الموضوعية"><Input type="number" min="4" max="20" value={bp.count} onChange={(e) => setBp({ ...bp, count: Number(e.target.value) })} /></Field>
          <Field label="المدة (دقيقة)"><Input type="number" min="5" max="90" value={bp.durationMin} onChange={(e) => setBp({ ...bp, durationMin: Number(e.target.value) })} /></Field>
          <Field label="حدّ المحاولات"><Select value={bp.attempts} onChange={(e) => setBp({ ...bp, attempts: Number(e.target.value) })}>{[1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>
        </div>
      </div>
    </Modal>
  );
}
