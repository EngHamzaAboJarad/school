import { useMemo, useState } from "react";
import { Check, Eye, Star } from "lucide-react";
import { Badge, Btn, Card, Empty, Field, ListRow, Modal, Notice, Page, Split, Textarea } from "../../ui/Primitives";
import { HBars } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { allLessons, lessonOf } from "../../store/selectors";
import { QuestionView, correctText } from "../student/Assess";
import { timeAgo } from "../../lib/format";

const CRITERIA = [["accuracy", "دقّة المحتوى"], ["alignment", "مطابقة المنهج"], ["clarity", "وضوح الصياغة"], ["language", "سلامة اللغة"]];

// رقابة جودة المحتوى والاختبارات (F8.3): مراجعة عيّنات وتسجيل ملاحظات جودة
export default function QualityPage() {
  const { state, user } = useStore();
  const [review, setReview] = useState(null);
  const sample = useMemo(() => {
    const schools = state.schools.slice(0, 5);
    return state.questions.filter((q) => q.status === "approved" && q.type !== "essay").slice(0, 10).map((q, i) => ({ q, school: schools[i % schools.length] }));
  }, [state.questions, state.schools]);
  const reviewed = new Set(state.qualityNotes.map((n) => n.itemTitle));
  const avgBy = CRITERIA.map(([k, l]) => ({ label: l, value: state.qualityNotes.length ? Math.round((state.qualityNotes.reduce((a, n) => a + n.scores[k], 0) / state.qualityNotes.length) * 20) : null }));

  return (
    <Page kicker="الجودة والمطابقة" title="رقابة الجودة" desc="راجع عيّنات من الأسئلة والمحتوى المعتمد في المدارس، وسجّل ملاحظات الجودة لضمان المطابقة." icon={Eye}>
      <Split>
        <div className="stack">
          <Card title="عيّنة للمراجعة" kicker="أسئلة معتمدة من مدارس مختلفة">
            {sample.map(({ q, school }) => {
              const title = `سؤال «${q.text.slice(0, 40)}…» — ${school.name}`;
              const done = reviewed.has(title);
              return <ListRow key={q.id} icon={Eye} tone={done ? "success" : "warn"} title={q.text.length > 60 ? `${q.text.slice(0, 60)}…` : q.text} meta={`${school.name} • ${lessonOf(state, q.lessonId)?.title}`}
                end={done ? <Badge tone="success" icon={Check}>روجع</Badge> : <Btn size="sm" variant="primary" onClick={() => setReview({ q, school, title })}>مراجعة</Btn>} />;
            })}
          </Card>
        </div>
        <div className="stack">
          <Card title="متوسط التقييم" kicker={`${state.qualityNotes.length} ملاحظات مسجّلة`}>
            {state.qualityNotes.length ? <HBars data={avgBy} /> : <Empty title="لا مراجعات بعد" />}
          </Card>
          <Card title="سجلّ الملاحظات" kicker="آخر ما سجّلتَه">
            {state.qualityNotes.map((n) => (
              <ListRow key={n.id} icon={Star} tone="gold" title={n.itemTitle} meta={`${n.note || "بلا ملاحظة"} • ${timeAgo(n.at)}`} end={<Badge tone="gold">{Math.round((Object.values(n.scores).reduce((a, b) => a + b, 0) / 4) * 10) / 10}/5</Badge>} />
            ))}
          </Card>
        </div>
      </Split>
      {review && <ReviewForm item={review} onClose={() => setReview(null)} />}
    </Page>
  );
}

function ReviewForm({ item, onClose }) {
  const { dispatch, user } = useStore();
  const toast = useToast();
  const [scores, setScores] = useState({ accuracy: 4, alignment: 4, clarity: 4, language: 4 });
  const [note, setNote] = useState("");
  const q = item.q;
  return (
    <Modal open wide onClose={onClose} title="مراجعة جودة سؤال" kicker={item.school.name}
      footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" icon={Check} onClick={() => { dispatch({ type: "addQualityNote", by: user.id, note: { schoolId: item.school.id, itemTitle: item.title, scores, note } }); toast("سُجّلت ملاحظة الجودة"); onClose(); }}>حفظ المراجعة</Btn></>}>
      <div className="grid grid-2">
        <div className="stack">
          <QuestionView q={q} value={q.type === "mcq" ? q.answer : q.type === "tf" ? q.answer : q.type === "fill" ? q.answers[0] : Object.fromEntries((q.pairs || []).map(([, r], k) => [k, r]))} result={{ got: 1, preview: true }} disabled />
          <small className="muted">الإجابة: <b>{correctText(q)}</b></small>
        </div>
        <div className="stack">
          {CRITERIA.map(([k, l]) => (
            <div key={k}><div className="row spread"><strong>{l}</strong><b className="num">{scores[k]} / 5</b></div>
              <input type="range" min="1" max="5" value={scores[k]} onChange={(e) => setScores({ ...scores, [k]: Number(e.target.value) })} className="range" aria-label={l} /></div>
          ))}
          <Field label="ملاحظة الجودة"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ما الذي يُحسَّن؟" /></Field>
        </div>
      </div>
    </Modal>
  );
}
