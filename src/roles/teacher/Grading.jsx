import { useEffect, useState } from "react";
import { Bot, Check, Minus, Plus, ShieldAlert, PenLine } from "lucide-react";
import { Avatar, Badge, Btn, Card, Empty, Notice, Page, Tabs, Textarea, cx } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { essayQueue, unitOf, lessonOf } from "../../store/selectors";
import { timeAgo } from "../../lib/format";

// التصحيح اليدوي والملاحظات (F6.3 / F2.5): يراجع المعلّم تقييم الذكاء الاصطناعي المبدئي بالمعايير ويعدّل الدرجة، ويُوثَّق الأثر.
export default function GradingPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState("todo");
  const all = essayQueue(state, user.id);
  const todo = all.filter((e) => !e.essay.final);
  const done = all.filter((e) => e.essay.final);
  const list = tab === "todo" ? todo : done;
  const [selKey, setSelKey] = useState(null);
  const cur = list.find((e) => `${e.attempt.id}:${e.qid}` === selKey) || list[0];
  const [scores, setScores] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!cur) return;
    setScores(cur.essay.final ? cur.essay.ai.byCriterion.map((c) => c.got) : cur.essay.ai.byCriterion.map((c) => c.got));
    setNote(cur.essay.final?.note || "");
  }, [cur?.attempt.id, cur?.qid, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = Math.round(scores.reduce((a, b) => a + Number(b), 0) * 10) / 10;
  const changed = cur && total !== cur.essay.ai.score;

  const save = () => {
    dispatch({ type: "gradeEssay", attemptId: cur.attempt.id, qid: cur.qid, score: total, note, actor: user.id });
    toast(changed ? "حُفظ تعديلك ووُثِّق في السجلّ" : "اعتُمد التصحيح");
    setSelKey(null);
  };
  const step = (i, d) => setScores(scores.map((s, k) => (k === i ? Math.max(0, Math.min(cur.essay.ai.byCriterion[i].w, Math.round((Number(s) + d) * 2) / 2)) : s)));

  return (
    <Page kicker="مراجعة الدرجات" title="التصحيح اليدوي" desc="يقيّم الذكاء الاصطناعي المقالي بمعايير محدّدة، وأنت صاحب القرار النهائي: اعتمد الدرجة أو عدّلها وأضف ملاحظتك." icon={PenLine}>
      <Tabs value={tab} onChange={setTab} tabs={[{ id: "todo", label: "بانتظار التصحيح", count: todo.length }, { id: "done", label: "تم تصحيحها" }]} />
      {list.length === 0 ? <Card><Empty icon={Check} title={tab === "todo" ? "لا إجابات مقالية بانتظار التصحيح" : "لا إجابات مصحَّحة بعد"} /></Card> : (
        <div className="grade-layout">
          <Card flush className="grade-list">
            {list.map((e) => {
              const key = `${e.attempt.id}:${e.qid}`;
              return (
                <button key={key} className={cx("mail-item", cur && key === `${cur.attempt.id}:${cur.qid}` && "active")} onClick={() => setSelKey(key)}>
                  <Avatar name={e.student?.name} />
                  <div>
                    <div className="row spread"><strong>{e.student?.name}</strong><small className="muted">{timeAgo(e.attempt.at)}</small></div>
                    <span className="mail-preview">{unitOf(state, lessonOf(state, e.question.lessonId)?.unitId)?.title}</span>
                    <div className="row"><Badge tone={e.essay.final ? "success" : "warn"} dot>{e.essay.final ? `${e.essay.final.score}/${e.essay.ai.max}` : "بانتظارك"}</Badge></div>
                  </div>
                </button>
              );
            })}
          </Card>
          {cur && (
            <div className="stack">
              <Card title={cur.student?.name} kicker="السؤال المقالي">
                <p className="qv-text small-text">{cur.question.text}</p>
                <blockquote className="essay-quote">{cur.essay.text || "لم يُجب الطالب"}</blockquote>
                <details className="model"><summary>الإجابة النموذجية</summary><p>{cur.question.model}</p></details>
              </Card>
              <Card title="معايير التقييم (Rubric)" kicker="تقييم الذكاء الاصطناعي المبدئي" action={<Badge tone="gold" icon={Bot}>مبدئي {cur.essay.ai.score}/{cur.essay.ai.max}</Badge>}>
                <div className="stack-sm">
                  {cur.essay.ai.byCriterion.map((c, i) => (
                    <div className="crit" key={c.c}>
                      <div><strong>{c.c}</strong><small className="muted">{c.hit ? "رصد المحرّك ما يدلّ عليه في الإجابة" : "لم يرصد المحرّك ما يدلّ عليه"}</small></div>
                      <div className="stepper" role="group" aria-label={`درجة ${c.c}`}>
                        <button onClick={() => step(i, -0.5)} disabled={!!cur.essay.final} aria-label="أنقص"><Minus size={15} /></button>
                        <b className="num">{scores[i] ?? 0}<small> / {c.w}</small></b>
                        <button onClick={() => step(i, 0.5)} disabled={!!cur.essay.final} aria-label="زد"><Plus size={15} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row spread mt"><strong>الدرجة النهائية</strong><span className="big-num num">{total}<small className="muted" style={{ fontSize: 16 }}> / {cur.essay.ai.max}</small></span></div>
                {!cur.essay.final && changed && <Notice tone="warn" icon={ShieldAlert} title="تعديل على درجة الذكاء الاصطناعي">سيُوثَّق هذا التعديل باسمك في سجلّ التدقيق ويُبلَّغ الطالب ووليّ أمره.</Notice>}
                <div className="mt"><span className="field-label">ملاحظات للطالب</span>
                  <Textarea className="mt-sm" value={note} disabled={!!cur.essay.final} onChange={(e) => setNote(e.target.value)} placeholder="اكتب ملاحظة تحسين تظهر للطالب…" /></div>
                {cur.essay.final
                  ? <Notice tone="success" icon={Check} title={`اعتُمدت الدرجة ${cur.essay.final.score}/${cur.essay.ai.max}`}>{cur.essay.final.changed ? "عُدِّلت عن درجة الذكاء الاصطناعي." : "وافقتَ على تقييم الذكاء الاصطناعي."}</Notice>
                  : <div className="row mt"><Btn variant="gold" icon={Check} onClick={save}>{changed ? "حفظ التعديل واعتماد" : "اعتماد الدرجة"}</Btn><span className="small muted">الدرجة تظهر للطالب فور الاعتماد.</span></div>}
              </Card>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
