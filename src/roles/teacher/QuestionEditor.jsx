import { useState } from "react";
import { Btn, Field, Input, Modal, Notice, Select, Textarea } from "../../ui/Primitives";
import { DIFFICULTIES, QUESTION_TYPES } from "../../data/curriculum";

// محرّر السؤال: يعدّل المعلّم نص السؤال وخياراته وإجابته وصعوبته، ويُوثَّق التعديل في سجلّ التدقيق.
export default function QuestionEditor({ q, objectives, onSave, onClose }) {
  const [d, setD] = useState(() => JSON.parse(JSON.stringify(q)));
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const valid =
    d.text.trim() &&
    (d.type !== "mcq" || (d.options.every((o) => o.trim()) && d.options.length >= 2)) &&
    (d.type !== "fill" || d.answers.filter(Boolean).length > 0) &&
    (d.type !== "match" || d.pairs.every(([l, r]) => l.trim() && r.trim()));

  const save = () => {
    const patch = { text: d.text.trim(), difficulty: d.difficulty, objective: d.objective, why: d.why };
    if (d.type === "mcq") Object.assign(patch, { options: d.options.map((o) => o.trim()), answer: d.answer });
    if (d.type === "tf") patch.answer = d.answer;
    if (d.type === "fill") patch.answers = d.answers.map((a) => a.trim()).filter(Boolean);
    if (d.type === "match") patch.pairs = d.pairs;
    if (d.type === "essay") patch.model = d.model;
    onSave(patch);
  };

  return (
    <Modal open wide onClose={onClose} title="تعديل السؤال" kicker={QUESTION_TYPES[q.type]}
      footer={<><Btn variant="ghost" onClick={onClose}>إلغاء</Btn><Btn variant="primary" disabled={!valid} onClick={save}>حفظ التعديل</Btn></>}>
      <div className="stack">
        <Field label="نص السؤال" hint={d.type === "fill" ? "استخدم ___ لتحديد موضع الفراغ" : undefined}><Textarea value={d.text} onChange={(e) => set({ text: e.target.value })} style={{ minHeight: 80 }} /></Field>
        {d.type === "mcq" && (
          <div className="stack-sm">
            <span className="field-label">الخيارات — اختر الإجابة الصحيحة</span>
            {d.options.map((o, i) => (
              <div className="row" key={i}>
                <input type="radio" name="correct" className="radio" checked={d.answer === i} onChange={() => set({ answer: i })} aria-label={`الخيار ${i + 1} صحيح`} />
                <Input className="grow" value={o} onChange={(e) => set({ options: d.options.map((x, k) => (k === i ? e.target.value : x)) })} />
              </div>
            ))}
          </div>
        )}
        {d.type === "tf" && (
          <Field label="الإجابة الصحيحة"><Select value={String(d.answer)} onChange={(e) => set({ answer: e.target.value === "true" })}><option value="true">صح</option><option value="false">خطأ</option></Select></Field>
        )}
        {d.type === "fill" && (
          <Field label="الإجابات المقبولة (افصل بينها بفاصلة)"><Input value={d.answers.join("، ")} onChange={(e) => set({ answers: e.target.value.split(/[،,]/) })} /></Field>
        )}
        {d.type === "match" && (
          <div className="stack-sm">
            <span className="field-label">أزواج المطابقة</span>
            {d.pairs.map(([l, r], i) => (
              <div className="row" key={i}>
                <Input className="grow" value={l} onChange={(e) => set({ pairs: d.pairs.map((p, k) => (k === i ? [e.target.value, p[1]] : p)) })} />
                <span className="muted">←</span>
                <Input className="grow" value={r} onChange={(e) => set({ pairs: d.pairs.map((p, k) => (k === i ? [p[0], e.target.value] : p)) })} />
              </div>
            ))}
          </div>
        )}
        {d.type === "essay" && (
          <>
            <Field label="الإجابة النموذجية"><Textarea value={d.model} onChange={(e) => set({ model: e.target.value })} /></Field>
            <Notice tone="info">معايير التقييم (Rubric): {d.rubric.map((r) => `${r.c} (${r.w})`).join(" • ")}</Notice>
          </>
        )}
        <Field label="تفسير الإجابة (يظهر للطالب بعد التصحيح)"><Textarea value={d.why || ""} onChange={(e) => set({ why: e.target.value })} style={{ minHeight: 70 }} /></Field>
        <div className="form-grid">
          <Field label="مستوى الصعوبة"><Select value={d.difficulty} onChange={(e) => set({ difficulty: e.target.value })}>{DIFFICULTIES.map((x) => <option key={x} value={x}>{x}</option>)}</Select></Field>
          <Field label="هدف التعلّم"><Select value={d.objective} onChange={(e) => set({ objective: e.target.value })}>{objectives.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}</Select></Field>
        </div>
        <Notice tone="gold">يُوثَّق تعديلك في سجلّ التدقيق باسمك وتاريخه.</Notice>
      </div>
    </Modal>
  );
}
