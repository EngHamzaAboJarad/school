import { AlertTriangle, Building2, CheckCircle2, ChevronLeft, Cpu, CreditCard, Inbox, KeyRound, ShieldCheck, UserCheck } from "lucide-react";
import { Badge, Btn, Card, DataTable, Empty, Page, Progress, SectionHeader, cx } from "../../ui/Primitives";
import { FactLine } from "../../ui/World";
import { useStore } from "../../store/StoreProvider";
import { fmtLongDate, fmtNum, timeAgo } from "../../lib/format";

const STATUS_TONE = { "نشط": "success", "تجريبي": "info", "ينتهي قريبًا": "warn" };
const INVOICE_TONE = { "مدفوعة": "success", "معلّقة": "warn", "بانتظار الاعتماد": "info" };

// لوحة مدير النظام: ما ينتظر قرارك (طلبات المعلّمين، طلبات التواصل، الفواتير، المستأجرون، حدّ «النجمة»)،
// ثم استهلاك المحرّك هذا الشهر والمستأجرون والعمليات الحسّاسة — من السجلات فقط، بلا مؤشّرات تشغيل غير متوفّرة.
export default function SystemHome({ go }) {
  const { state } = useStore();
  const ai = state.aiSettings;
  const pct = ai.monthlyLimit ? Math.round((ai.used / ai.monthlyLimit) * 100) : null;
  const users = state.tenants.reduce((a, t) => a + t.users, 0);
  const teacherReqs = state.directory.filter((d) => d.status === "بانتظار الاعتماد" && d.role === "teacher");
  const leads = (state.leads || []).filter((l) => l.status === "جديد");
  const unpaid = state.invoices.filter((i) => i.status !== "مدفوعة");
  const unpaidTotal = unpaid.reduce((a, i) => a + i.amount, 0);
  const expiring = state.tenants.filter((t) => t.status === "ينتهي قريبًا");
  const sensitive = state.audit.filter((a) => a.severity === "warn").slice(0, 6);
  const byType = state.tenants.reduce((m, t) => ({ ...m, [t.type]: (m[t.type] || 0) + 1 }), {});

  const actions = [
    teacherReqs.length > 0 && { key: "tch", icon: UserCheck, tone: "warn", title: `${teacherReqs.length} طلبات انضمام معلّمين`, meta: teacherReqs.map((t) => t.name).join(" • "), cta: "مراجعة", run: () => go("teacherRequests") },
    leads.length > 0 && { key: "leads", icon: Inbox, tone: "info", title: `${leads.length} طلبات تواصل جديدة`, meta: "من نموذج «تواصل معنا»", cta: "متابعة", run: () => go("leads") },
    unpaid.length > 0 && { key: "inv", icon: CreditCard, tone: "warn", title: `${unpaid.length} فواتير غير مدفوعة`, meta: `الإجمالي ${fmtNum(unpaidTotal)} ريال`, cta: "الفوترة", run: () => go("billing") },
    expiring.length > 0 && { key: "exp", icon: KeyRound, tone: "danger", title: `${expiring.length} ترخيص ينتهي قريبًا`, meta: expiring.map((t) => t.name).join(" • "), cta: "المستأجرون", run: () => go("tenants") },
    pct != null && pct >= 85 && { key: "ai", icon: Cpu, tone: pct >= 95 ? "danger" : "warn", title: `استهلاك «النجمة» بلغ ${pct}% من حدّ الشهر`, meta: `${fmtNum(ai.used)} من ${fmtNum(ai.monthlyLimit)} رمز`, cta: "الحدود", run: () => go("ai") },
  ].filter(Boolean);

  return (
    <Page
      title="لوحة النظام"
      desc={`منصّة مشرق • ${fmtLongDate()}`}
      actions={
        <>
          <Btn variant="ghost" icon={ShieldCheck} onClick={() => go("audit")}>سجلّ التدقيق</Btn>
          <Btn variant="primary" icon={Cpu} onClick={() => go("ai")}>محرّك «النجمة»</Btn>
        </>
      }
    >
      <FactLine
        items={[
          { label: "المستأجرون", value: state.tenants.length, note: Object.entries(byType).map(([k, v]) => `${v} ${k}`).join(" • "), onClick: () => go("tenants") },
          { label: "المستخدمون", value: fmtNum(users), note: "مجموع حسابات المستأجرين" },
          { label: "استهلاك «النجمة»", value: pct != null ? `${pct}%` : null, note: "من حدّ الشهر", tone: pct >= 85 ? "warn" : undefined, onClick: () => go("ai") },
          { label: "بانتظار قرارك", value: teacherReqs.length + leads.length, note: `${teacherReqs.length} معلّمين • ${leads.length} تواصل`, tone: teacherReqs.length + leads.length ? "warn" : undefined },
        ]}
      />

      <div className="home-grid">
        <Card className="span-7" aria-labelledby="sy-actions">
          <SectionHeader id="sy-actions" title="قرارات اليوم" desc={actions.length ? `${actions.length} بنود` : "لا بنود معلّقة"} />
          {actions.length === 0 ? (
            <Empty compact icon={CheckCircle2} title="لا شيء معلّق" />
          ) : (
            <ul className="ov-action-list">
              {actions.map((a) => (
                <li key={a.key} className="ov-action">
                  <span className={cx("row-icon", `tone-${a.tone}`)} aria-hidden="true"><a.icon size={17} /></span>
                  <div className="ov-action-copy">
                    <strong>{a.title}</strong>
                    <span>{a.meta}</span>
                  </div>
                  <Btn size="sm" variant="ghost" iconEnd={ChevronLeft} onClick={a.run}>{a.cta}</Btn>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="span-5" aria-labelledby="sy-ai">
          <SectionHeader id="sy-ai" title="محرّك «النجمة» هذا الشهر" desc={`${ai.provider === "claude" ? "Claude" : ai.provider} • ${ai.model}`} action={<Btn size="sm" variant="ghost" onClick={() => go("ai")}>الإعدادات</Btn>} />
          <div className="sy-usage">
            <div className="sy-usage-num">
              <b className="num">{fmtNum(ai.used)}</b>
              <span>من {fmtNum(ai.monthlyLimit)} رمز</span>
            </div>
            <Progress value={pct || 0} tone={pct >= 85 ? "warn" : "brand"} size="lg" label="استهلاك الحدّ الشهري" />
            <ul className="sy-policies">
              <li className={ai.humanReview ? "on" : "off"}>{ai.humanReview ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} مراجعة المعلّم قبل وصول المحتوى للطلاب</li>
              <li className={ai.noTraining ? "on" : "off"}>{ai.noTraining ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} لا تُستخدم بيانات الطلاب في التدريب</li>
              <li className={ai.rubricGrading ? "on" : "off"}>{ai.rubricGrading ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} تصحيح المقالي بالمعايير</li>
              <li className={ai.cacheReuse ? "on" : "off"}>{ai.cacheReuse ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} إعادة استخدام المعتمد بدل التوليد</li>
            </ul>
          </div>
        </Card>

        <Card flush className="span-8" aria-labelledby="sy-tenants">
          <div className="pad" style={{ paddingBottom: 0 }}>
            <SectionHeader id="sy-tenants" title="المستأجرون" desc="عزل البيانات لكل مستأجر" action={<Btn size="sm" variant="ghost" icon={Building2} onClick={() => go("tenants")}>الإدارة</Btn>} />
          </div>
          <DataTable
            caption="المستأجرون"
            pageSize={6}
            rows={state.tenants}
            columns={[
              { key: "name", label: "المستأجر", primary: true, render: (t) => <div className="ov-cls-name"><strong>{t.name}</strong><small>{t.type}</small></div> },
              { key: "plan", label: "الباقة" },
              { key: "users", label: "المستخدمون", num: true, render: (t) => <span className="num">{fmtNum(t.users)}</span> },
              { key: "seats", label: "المقاعد", render: (t) => (t.seats ? (
                <div className="ov-meter"><Progress value={Math.min(100, (t.users / t.seats) * 100)} tone={t.users / t.seats > 0.9 ? "warn" : "brand"} size="sm" label={`مقاعد ${t.name}`} /><span className="num">{Math.round((t.users / t.seats) * 100)}%</span></div>
              ) : <span className="muted small">غير محدود</span>) },
              { key: "status", label: "الحالة", render: (t) => <Badge tone={STATUS_TONE[t.status] || "neutral"}>{t.status}</Badge> },
            ]}
          />
        </Card>

        <div className="span-4 home-col">
          <Card aria-labelledby="sy-inv">
            <SectionHeader id="sy-inv" title="فواتير مفتوحة" action={<Btn size="sm" variant="ghost" onClick={() => go("billing")}>الفوترة</Btn>} />
            {unpaid.length === 0 ? <Empty compact icon={CheckCircle2} title="كل الفواتير مدفوعة" /> : (
              <ul className="hl">
                {unpaid.map((i) => (
                  <li key={i.id} className="no-icon">
                    <div className="hl-main"><strong>{i.customer}</strong><span className="num">{i.id}</span></div>
                    <div className="hl-end"><span className="hl-num">{fmtNum(i.amount)}</span><Badge tone={INVOICE_TONE[i.status] || "neutral"}>{i.status}</Badge></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card aria-labelledby="sy-audit">
            <SectionHeader id="sy-audit" title="عمليات حسّاسة" desc="آخر ما سُجّل في التدقيق" action={<Btn size="sm" variant="ghost" onClick={() => go("audit")}>السجلّ</Btn>} />
            {sensitive.length === 0 ? <Empty compact icon={ShieldCheck} title="لا عمليات حسّاسة" /> : (
              <ol className="ov-timeline">
                {sensitive.map((a) => (
                  <li key={a.id} className="is-warn">
                    <span className="ov-dot" aria-hidden="true" />
                    <div><strong>{a.action}</strong><span>{a.target}</span><small>{a.actorName} • {timeAgo(a.at)}</small></div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
