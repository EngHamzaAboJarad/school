import { useState } from "react";
import { Cpu, Lock, Save } from "lucide-react";
import { Badge, Btn, Card, Field, Notice, Page, Select, Split, Stat, Toggle } from "../../ui/Primitives";
import { Ring } from "../../ui/Charts";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { fmtNum } from "../../lib/format";

const MODELS = { claude: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"] };

// إعدادات محرّك الذكاء الاصطناعي والحوكمة (F10.4)
export default function AiPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const [d, setD] = useState(state.aiSettings);
  const dirty = JSON.stringify(d) !== JSON.stringify(state.aiSettings);
  const pct = Math.round((d.used / d.monthlyLimit) * 100);
  const reused = state.questions.filter((q) => q.status === "approved").length;
  const save = () => { dispatch({ type: "setAI", patch: d, describe: "تعديل النموذج والحدود والسياسات", actor: user.id }); toast("حُفظت إعدادات المحرّك ووُثِّقت", "warn"); };

  return (
    <Page kicker="الحوكمة" title="محرّك الذكاء الاصطناعي" desc="تحكّم بمزوّد النماذج والحدود والكلفة وسياسات الاستخدام، مع الإنسان في الحلقة فوق كل مخرجات المحرّك." icon={Cpu}
      actions={<Btn variant="gold" icon={Save} disabled={!dirty} onClick={save}>حفظ الإعدادات</Btn>}>
      <div className="grid grid-3">
        <Card><div className="row"><Ring value={pct} size={110} stroke={10} tone={pct > 85 ? "low" : "gold"} label="الاستهلاك الشهري" sub="من الحدّ" /><div><strong className="num">{fmtNum(d.used)}</strong><p className="muted small">من {fmtNum(d.monthlyLimit)} رمز</p></div></div></Card>
        <Stat label="أسئلة معتمدة في البنك" value={reused} icon={Cpu} tone="gold" foot="تُعاد استخدامها بدل توليد جديد" />
        <Stat label="توفير التخزين المؤقت" value={d.cacheReuse ? "38" : "0"} unit="%" icon={Cpu} tone="blue" foot="من كلفة التوليد" />
      </div>
      <Split className="mt">
        <Card title="النموذج والحدود" kicker="التكامل مع مزوّد النماذج">
          <div className="stack">
            <div className="form-grid">
              <Field label="المزوّد"><Select value={d.provider} onChange={(e) => setD({ ...d, provider: e.target.value, model: MODELS[e.target.value][0] })}><option value="claude">عائلة Claude</option></Select></Field>
              <Field label="النموذج"><Select value={d.model} onChange={(e) => setD({ ...d, model: e.target.value })}>{MODELS[d.provider].map((m) => <option key={m} value={m}>{m}</option>)}</Select></Field>
            </div>
            <Field label={`الحدّ الشهري للرموز: ${fmtNum(d.monthlyLimit)}`}><input type="range" className="range" min="100000" max="500000" step="10000" value={d.monthlyLimit} onChange={(e) => setD({ ...d, monthlyLimit: Number(e.target.value) })} /></Field>
            <Field label={`الحدّ الأقصى لكل مدرسة: ${fmtNum(d.perSchoolCap)}`}><input type="range" className="range" min="5000" max="80000" step="5000" value={d.perSchoolCap} onChange={(e) => setD({ ...d, perSchoolCap: Number(e.target.value) })} /></Field>
            {pct > 85 && <Notice tone="warn">الاستهلاك تجاوز ٨٥٪ من الحدّ — ارفع الحدّ أو فعّل إعادة استخدام البنك.</Notice>}
          </div>
        </Card>
        <Card title="سياسات الاستخدام" kicker="الجودة والخصوصية">
          <Toggle label="مراجعة المعلّم قبل النشر" hint="الإنسان في الحلقة على كل مخرجات المحرّك" checked={d.humanReview} onChange={(v) => setD({ ...d, humanReview: v })} />
          <Toggle label="إعادة استخدام بنك الأسئلة (تخزين مؤقت)" hint="خفض الكلفة ورفع الجودة" checked={d.cacheReuse} onChange={(v) => setD({ ...d, cacheReuse: v })} />
          <Toggle label="تقييم المقالي بمعايير (Rubric)" checked={d.rubricGrading} onChange={(v) => setD({ ...d, rubricGrading: v })} />
          <Toggle label="عدم التدريب على بيانات الطلاب" hint="سياسة ثابتة لحماية بيانات القُصّر — لا يمكن تعطيلها" checked disabled onChange={() => {}} />
          <Badge tone="gold" icon={Lock}>سياسة مقفلة بموجب PDPL</Badge>
        </Card>
      </Split>
    </Page>
  );
}
