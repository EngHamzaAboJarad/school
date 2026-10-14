import { useState } from "react";
import { Cpu, Lock, Save } from "lucide-react";
import { Badge, Btn, Card, Field, Notice, Page, Progress, Select, Split, Toggle } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { FactLine } from "../../ui/World";
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
      <FactLine
        items={[
          { label: "الاستهلاك هذا الشهر", value: `${pct}%`, note: `${fmtNum(d.used)} من ${fmtNum(d.monthlyLimit)} رمز`, tone: pct > 85 ? "warn" : undefined },
          { label: "أسئلة معتمدة في البنك", value: reused, note: "تُعاد استخدامها بدل توليد جديد" },
          { label: "إعادة استخدام المعتمد", value: d.cacheReuse ? "مفعّلة" : "معطّلة" },
        ]}
      />
      <Card className="mb" title="استهلاك الحدّ الشهري" kicker={`${fmtNum(Math.max(0, d.monthlyLimit - d.used))} رمز متبقٍّ هذا الشهر`}>
        <Progress value={pct} tone={pct > 85 ? "warn" : "brand"} size="lg" label="استهلاك الحدّ الشهري" />
      </Card>
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
