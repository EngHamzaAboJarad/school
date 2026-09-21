import { Activity, AlertTriangle, Building2, Cpu, Server, ShieldCheck, Users } from "lucide-react";
import { Badge, Btn, Card, ListRow, Page, Split, Stat } from "../../ui/Primitives";
import { Bars, Ring } from "../../ui/Charts";
import { useStore } from "../../store/StoreProvider";
import { fmtLongDate, fmtNum, timeAgo } from "../../lib/format";

export default function SystemHome({ go }) {
  const { state } = useStore();
  const ai = state.aiSettings;
  const pct = Math.round((ai.used / ai.monthlyLimit) * 100);
  const users = state.tenants.reduce((a, t) => a + t.users, 0);
  const trend = [92, 105, 118, 131, 149, Math.round(ai.used / 1000)];
  const warn = state.audit.filter((a) => a.severity === "warn").slice(0, 4);

  return (
    <Page>
      <section className="hero">
        <div>
          <span className="kicker"><Server size={14} /> {fmtLongDate()}</span>
          <h2>لوحة النظام، <em>كل الخدمات تعمل</em></h2>
          <p>مراقبة المستأجرين والذكاء الاصطناعي والفوترة والأمان من مكان واحد.</p>
          <div className="hero-actions"><Btn variant="gold" size="lg" icon={Cpu} onClick={() => go("ai")}>إعدادات الذكاء الاصطناعي</Btn><Btn variant="light" icon={ShieldCheck} onClick={() => go("audit")}>سجلّ التدقيق</Btn></div>
        </div>
        <div className="hero-side"><Ring value={pct} size={150} stroke={12} tone={pct > 85 ? "low" : "gold"} label="استهلاك الذكاء الاصطناعي" sub="من حدّ الشهر" /></div>
      </section>
      <div className="grid grid-4">
        <Stat label="المستأجرون" value={state.tenants.length} icon={Building2} foot="مدارس • جهات • أفراد" />
        <Stat label="المستخدمون" value={fmtNum(users)} icon={Users} tone="blue" />
        <Stat label="زمن التشغيل" value="99.98" unit="%" icon={Activity} tone="gold" foot="آخر ٣٠ يومًا" />
        <Stat label="حوادث مفتوحة" value="0" icon={AlertTriangle} tone="rose" foot="لا حوادث أمنية" />
      </div>
      <Split className="mt">
        <Card title="استهلاك الذكاء الاصطناعي" kicker="ألف رمز — آخر ٦ أشهر"><Bars data={trend.map((v, i) => ({ label: ["-5", "-4", "-3", "-2", "-1", "الآن"][i], value: v, tone: i === 5 ? "gold" : "emerald", active: i === 5 }))} max={Math.round(ai.monthlyLimit / 1000)} height={160} /></Card>
        <Card title="عمليات حسّاسة أخيرة" kicker="سجلّ التدقيق" action={<button className="btn-link small" onClick={() => go("audit")}>عرض الكل</button>}>
          {warn.map((a) => <ListRow key={a.id} icon={ShieldCheck} tone="warn" title={a.action} meta={`${a.actorName} — ${a.target} • ${timeAgo(a.at)}`} />)}
        </Card>
      </Split>
    </Page>
  );
}
