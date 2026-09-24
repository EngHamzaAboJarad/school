import { useState } from "react";
import { BrainCircuit, Check, RotateCcw, X } from "lucide-react";

const QUESTION = {
  text: "أيّ الكسور التالية يساوي ٢/٤؟",
  options: ["١/٣", "١/٢", "٣/٤"],
  answer: 1,
  why: "نقسم البسط والمقام على ٢ فيصير ٢/٤ = ١/٢، فالكسران يمثّلان القدر نفسه.",
};

// تجربة مصغّرة توضّح التصحيح الفوري وتشخيص الفجوة كما يراها الطالب داخل المنصّة
export default function TryQuiz() {
  const [picked, setPicked] = useState(null);
  const done = picked !== null;
  const ok = picked === QUESTION.answer;
  const mastery = ok ? 85 : 35;

  return (
    <div className="ld-try">
      <div className="ld-try-head">
        <span className="ld-try-badge">
          <BrainCircuit size={14} /> جرّب بنفسك
        </span>
        <small>تجربة توضيحية مصغّرة</small>
      </div>
      <h4>{QUESTION.text}</h4>
      <div className="ld-try-options" role="group" aria-label="خيارات الإجابة">
        {QUESTION.options.map((o, i) => {
          const state = !done ? "" : i === QUESTION.answer ? "right" : i === picked ? "wrong" : "dim";
          return (
            <button key={o} type="button" className={`ld-try-opt ${state}`} disabled={done} onClick={() => setPicked(i)}>
              <span className="ld-try-opt-text">{o}</span>
              {state === "right" && <Check size={16} />}
              {state === "wrong" && <X size={16} />}
            </button>
          );
        })}
      </div>

      <div className="ld-try-result" aria-live="polite">
        {!done ? (
          <p className="ld-try-hint">اختر إجابة لترى التصحيح الفوري والتشخيص.</p>
        ) : (
          <>
            <div className={`ld-try-verdict ${ok ? "ok" : "bad"}`}>
              <strong>{ok ? "إجابة صحيحة" : "ليست الإجابة الصحيحة"}</strong>
              <p>{QUESTION.why}</p>
            </div>
            <div className="ld-try-mastery">
              <div>
                <span>إتقان الهدف: الكسور المتكافئة</span>
                <b className="num">{mastery}%</b>
              </div>
              <div className="ld-meter" role="progressbar" aria-valuenow={mastery} aria-valuemin={0} aria-valuemax={100}>
                <i className={ok ? "ok" : "bad"} style={{ width: `${mastery}%` }} />
              </div>
              <p>{ok ? "ممتاز — الدرس التالي مفتوح أمامك." : "فجوة مُشخَّصة — خطة علاجية جاهزة: شرح ← تمارين ← إعادة اختبار."}</p>
            </div>
            <button type="button" className="btn-link small" onClick={() => setPicked(null)}>
              <RotateCcw size={13} /> أعد التجربة
            </button>
          </>
        )}
      </div>
    </div>
  );
}
