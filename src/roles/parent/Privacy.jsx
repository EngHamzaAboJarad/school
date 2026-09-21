import { Check, Download, FileLock2, ShieldCheck } from "lucide-react";
import { Badge, Btn, Card, Notice, Page, Toggle, ListRow } from "../../ui/Primitives";
import { useToast } from "../../ui/Brand";
import { useStore } from "../../store/StoreProvider";
import { childrenOf } from "../../store/selectors";
import { fmtDate } from "../../lib/format";
import { downloadText } from "../../lib/export";

// الموافقات وسياسات الاستخدام (F11.4) وحماية بيانات القُصّر (F11.1)
export default function PrivacyPage() {
  const { state, dispatch, user } = useStore();
  const toast = useToast();
  const c = state.consents[user.id] || {};
  const kids = childrenOf(state, user.id);
  const mine = state.audit.filter((a) => a.actor === user.id).slice(0, 5);
  const set = (patch, target) => { dispatch({ type: "setConsent", parentId: user.id, patch, action: "تحديث موافقة", target }); toast("حُفظ اختيارك ووُثِّق"); };

  return (
    <Page kicker="الثقة والخصوصية" title="الموافقات والخصوصية" desc="تُوثَّق موافقاتك وتُدار سياسات الاستخدام بوضوح. بيانات أبنائك محميّة ولا تُستخدم لتدريب النماذج." icon={ShieldCheck}>
      <div className="grid grid-2">
        <Card title="موافقاتي" kicker={c.at ? `آخر تحديث ${fmtDate(c.at)}` : ""}>
          <Toggle label="شروط الاستخدام وسياسة الخصوصية" hint="مطلوبة لاستمرار الحساب" checked disabled onChange={() => {}} />
          <Toggle label="معالجة بيانات أبنائي التعليمية" hint="لعرض التقدّم وبناء الخطط العلاجية" checked={c.dataUse !== false} onChange={(v) => set({ dataUse: v }, "معالجة البيانات التعليمية")} />
          <Toggle label="استخدام صورة/وسائط ابني في المدرسة" hint="اختياري — لأنشطة المدرسة فقط" checked={!!c.media} onChange={(v) => set({ media: v }, "استخدام الوسائط")} />
          <Notice tone="gold" icon={ShieldCheck} title="التزامنا">لا تُستخدم بيانات الطلاب لتدريب نماذج الذكاء الاصطناعي، وتُشفَّر بياناتهم وفق نظام حماية البيانات الشخصية (PDPL).</Notice>
        </Card>
        <Card title="الأبناء المرتبطون" kicker="علاقة موثَّقة ضمن سياق المدرسة">
          {kids.map((k) => <ListRow key={k.id} avatar={k.name} title={k.name} meta={`${k.grade} • ${k.className || "مدرسة الأفق الأهلية"}`} end={<Badge tone="success" icon={Check}>مرتبط</Badge>} />)}
          <div className="divider" />
          <h4>حقوقي في البيانات</h4>
          <div className="row mt-sm">
            <Btn variant="ghost" icon={Download} onClick={() => { downloadText("بيانات-الأسرة.txt", `بيانات وليّ الأمر: ${user.name}\nالأبناء: ${kids.map((k) => k.name).join("، ")}\nالموافقات: ${JSON.stringify(c, null, 2)}`); toast("صُدِّرت نسخة من بياناتك"); }}>تنزيل نسخة من بياناتي</Btn>
            <Btn variant="danger" icon={FileLock2} onClick={() => toast("سيتواصل معك فريق الخصوصية خلال يومي عمل", "info")}>طلب حذف البيانات</Btn>
          </div>
        </Card>
      </div>
      <Card className="mt" title="سجلّ نشاطي" kicker="شفافية">
        {mine.length === 0 && <p className="muted">لا نشاط مسجّل بعد.</p>}
        {mine.map((a) => <ListRow key={a.id} title={a.action} meta={`${a.target} • ${fmtDate(a.at, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" })}`} />)}
      </Card>
    </Page>
  );
}
