import { useLayoutEffect, useState } from "react";
import { Bell, CalendarCheck, Check, Download, Edit3, GraduationCap, KeyRound, MoreHorizontal, Plus, Target, Trash2, UserX, Users } from "lucide-react";
import {
  Avatar, Badge, Btn, Card, DataTable, Empty, ErrorState, Field, Input, Menu, MetricCard, Modal, Notice, Progress, SearchBox, SectionHeader,
  Segmented, Select, Skeleton, StatusBadge, Tabs, Textarea, Toggle,
} from "../ui/Primitives";
import { useToast } from "../ui/Brand";
import { useConfirm } from "../ui/Confirm";

// معرض مكوّنات نظام التصميم — يظهر في وضع التطوير فقط على #/ui-kit (لا يُضمَّن في نسخة الإنتاج).
const SWATCHES = [
  ["--c-brand-900", "Brand 900"], ["--c-brand-800", "Brand 800 / primary"], ["--c-accent-300", "Accent 300"], ["--c-accent-500", "Accent 500"],
  ["--c-bg", "Background"], ["--c-surface", "Surface"], ["--c-border", "Border"], ["--c-text", "Text"], ["--c-text-muted", "Text muted"],
  ["--c-success", "Success"], ["--c-warn", "Warning"], ["--c-danger", "Danger"], ["--c-info", "Info"],
];

const ROWS = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  name: ["سارة أحمد", "عمر خالد", "ريم علي", "فهد ناصر", "لمى سعد", "جود عبدالله"][i % 6],
  role: ["طالب", "وليّ أمر", "معلّم"][i % 3],
  status: ["نشط", "بانتظار الاعتماد", "موقوف"][i % 3],
  mastery: [82, 64, 91, 48][i % 4],
}));
const TONE = { "نشط": "success", "بانتظار الاعتماد": "warn", "موقوف": "danger" };

export default function UiKit() {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState("a");
  const [seg, setSeg] = useState("class");
  const [q, setQ] = useState("");
  const [on, setOn] = useState(true);
  const [modal, setModal] = useState(null);
  useLayoutEffect(() => {
    document.body.classList.add("in-app");
    return () => document.body.classList.remove("in-app");
  }, []);

  return (
    <div className="page uikit" style={{ maxWidth: 1200 }}>
      <style>{CSS}</style>
      <header className="page-head">
        <div className="page-head-copy">
          <span className="kicker">نظام التصميم</span>
          <h1>مكوّنات طاقات سكول</h1>
          <p>معرض للمطوّرين (وضع التطوير فقط). كل الألوان والمسافات من tokens.css.</p>
        </div>
        <div className="page-actions">
          <Btn variant="ghost" icon={Download}>ثانوي</Btn>
          <Btn variant="primary" icon={Plus}>إجراء رئيسي</Btn>
        </div>
      </header>

      <div className="uikit-grid">
        <Card>
          <SectionHeader title="الألوان" desc="ثنائيات النص/الخلفية مفحوصة لتباين WCAG AA" />
          <div className="uikit-swatches">
            {SWATCHES.map(([v, n]) => (
              <div key={v}><i style={{ background: `var(${v})` }} /><b>{n}</b><code dir="ltr">{v}</code></div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="الخطوط" desc="IBM Plex Sans Arabic — عناوين مضغوطة" />
          <div className="stack-sm">
            <div style={{ fontSize: "var(--fs-xl)", fontWeight: 600 }}>عنوان الصفحة — fs-xl</div>
            <div style={{ fontSize: "var(--fs-lg)", fontWeight: 600 }}>عنوان بطاقة — fs-lg</div>
            <div style={{ fontSize: "var(--fs-md)" }}>نص الواجهة الأساسي — fs-md</div>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--c-text-muted)" }}>نص ثانوي ووصف — fs-sm</div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--c-text-muted)" }}>تسمية وعنوان عمود — fs-xs</div>
          </div>
        </Card>

        <Card className="span-2">
          <SectionHeader title="الأزرار" />
          <div className="row">
            <Btn variant="primary">رئيسي</Btn>
            <Btn variant="ghost">ثانوي</Btn>
            <Btn variant="soft">خفيف</Btn>
            <Btn variant="gold">تمييز</Btn>
            <Btn variant="danger" icon={UserX}>إيقاف</Btn>
            <Btn variant="danger-solid" icon={Trash2}>حذف نهائي</Btn>
            <Btn variant="primary" disabled>معطّل</Btn>
            <Btn variant="link">رابط</Btn>
            <Btn variant="ghost" icon={Edit3} aria-label="تعديل" />
            <Btn size="sm" variant="ghost" icon={Check}>صغير</Btn>
            <Btn size="lg" variant="primary">كبير</Btn>
            <button className="icon-btn" aria-label="الإشعارات"><Bell size={19} /></button>
          </div>
        </Card>

        <Card className="span-2">
          <SectionHeader title="بطاقات المؤشّرات" desc="القيمة من البيانات فقط — null يعرض حالة فارغة" />
          <div className="ov-metrics" style={{ marginBottom: 0 }}>
            <MetricCard label="الطلاب في الفصول" value="17" icon={GraduationCap} foot="3 فصول" />
            <MetricCard label="نسبة الحضور" value={96.4} unit="%" icon={CalendarCheck} delta={{ value: -1.8, unit: "%", label: "عن اليوم السابق" }} />
            <MetricCard label="مقاعد الترخيص" value={91} unit="%" icon={KeyRound} tone="warn" meter={{ value: 91, tone: "warn" }} foot="1,365 من 1,500" />
            <MetricCard label="متوسط الإتقان" value={null} icon={Target} emptyText="لا تقييمات بعد" />
          </div>
        </Card>

        <Card>
          <SectionHeader title="الحقول" />
          <div className="stack">
            <Field label="الاسم الكامل" hint="كما يظهر في الشهادات"><Input placeholder="مثال: سارة أحمد" /></Field>
            <Field label="البريد الإلكتروني" error="صيغة البريد غير صحيحة"><Input aria-invalid="true" defaultValue="sara@" dir="ltr" /></Field>
            <div className="form-grid">
              <Field label="الدور"><Select defaultValue="s"><option value="s">طالب</option><option value="t">معلّم</option></Select></Field>
              <Field label="معطّل"><Input disabled defaultValue="غير قابل للتعديل" /></Field>
            </div>
            <Field label="ملاحظة"><Textarea placeholder="اكتب ملاحظة…" /></Field>
            <SearchBox value={q} onChange={setQ} placeholder="ابحث بالاسم أو البريد…" />
            <Toggle checked={on} onChange={setOn} label="تنبيه وليّ الأمر" hint="يُرسل عند تسجيل الغياب" />
          </div>
        </Card>

        <Card>
          <SectionHeader title="الحالات والشارات" />
          <div className="stack">
            <div className="row">
              <StatusBadge tone="success">نشط</StatusBadge>
              <StatusBadge tone="warn">بانتظار الاعتماد</StatusBadge>
              <StatusBadge tone="danger">موقوف</StatusBadge>
              <StatusBadge tone="info">قيد المراجعة</StatusBadge>
              <Badge tone="gold">مقترح آليًّا</Badge>
              <Badge>محايد</Badge>
            </div>
            <Notice tone="success" title="تم الحفظ">حُدِّث الجدول ووُثِّق في السجلّ.</Notice>
            <Notice tone="warn" title="اقتربت من الحدّ">استُهلك 91% من المقاعد.</Notice>
            <Notice tone="danger" title="تعذّر الإرسال">تحقّق من الاتصال وحاول مجدّدًا.</Notice>
            <Notice tone="info">التعديلات تُطبَّق من الفصل الدراسي القادم.</Notice>
            <div className="stack-sm">
              <Progress value={82} tone="emerald" label="إتقان" />
              <Progress value={64} tone="mid" label="إتقان" />
              <Progress value={38} tone="low" label="إتقان" />
            </div>
          </div>
        </Card>

        <Card className="span-2">
          <SectionHeader title="التبويبات والفلاتر والقوائم" />
          <Tabs value={tab} onChange={setTab} tabs={[{ id: "a", label: "المستخدمون", icon: Users, count: 2 }, { id: "b", label: "صلاحيات الأدوار" }]} />
          <div className="filter-bar">
            <Segmented options={[{ id: "class", label: "حسب الفصل" }, { id: "subject", label: "حسب المادة" }]} value={seg} onChange={setSeg} />
            <button className="chip active">الكل</button>
            <button className="chip">نشط</button>
            <button className="chip">موقوف</button>
            <Menu label="إجراءات" icon={MoreHorizontal} items={[
              { label: "تعديل", icon: Edit3, onClick: () => toast("تعديل") },
              { label: "تصدير", icon: Download, onClick: () => toast("تصدير") },
              "sep",
              { label: "إيقاف الحساب", icon: UserX, danger: true, onClick: () => toast("إيقاف", "warn") },
            ]} />
          </div>
        </Card>

        <Card flush className="span-2">
          <div className="pad" style={{ paddingBottom: 0 }}><SectionHeader title="جدول + ترقيم صفحات" desc="على الجوال يتحوّل إلى بطاقات" /></div>
          <DataTable pageSize={5} rows={ROWS} caption="مثال" columns={[
            { key: "name", label: "المستخدم", primary: true, render: (r) => <div className="cell-user"><Avatar name={r.name} size={32} /><strong>{r.name}</strong></div> },
            { key: "role", label: "الدور" },
            { key: "status", label: "الحالة", render: (r) => <StatusBadge tone={TONE[r.status]}>{r.status}</StatusBadge> },
            { key: "mastery", label: "الإتقان", render: (r) => <span className="num">{r.mastery}%</span> },
            { key: "act", label: "", render: () => <Btn size="sm" variant="ghost">عرض</Btn> },
          ]} />
        </Card>

        <Card>
          <SectionHeader title="الفارغ والخطأ والتحميل" />
          <Empty compact icon={Users} title="لا مستخدمين مطابقين" desc="جرّب تغيير الفلاتر." action={<Btn size="sm" variant="ghost">مسح الفلاتر</Btn>} />
          <div className="divider" />
          <ErrorState onRetry={() => toast("إعادة المحاولة", "info")} />
          <div className="divider" />
          <div className="stack-sm"><Skeleton style={{ height: 18, width: "40%" }} /><Skeleton lines={3} /></div>
        </Card>

        <Card>
          <SectionHeader title="النوافذ والإشعارات" />
          <div className="row">
            <Btn variant="ghost" onClick={() => setModal("modal")}>نافذة</Btn>
            <Btn variant="ghost" onClick={() => setModal("drawer")}>لوحة جانبية</Btn>
            <Btn variant="danger" id="uikit-confirm" onClick={async () => {
              const ok = await confirm({ title: "إيقاف حساب «عمر خالد»؟", body: "لن يتمكّن من تسجيل الدخول حتى يُعاد تفعيله. يُسجَّل الإجراء في سجلّ التدقيق.", confirmLabel: "إيقاف الحساب", icon: UserX });
              toast(ok ? "أُوقف الحساب" : "أُلغي الإجراء", ok ? "warn" : "info");
            }}>تأكيد إجراء حسّاس</Btn>
            <Btn variant="ghost" onClick={() => toast("حُفظت التغييرات")}>إشعار نجاح</Btn>
            <Btn variant="ghost" onClick={() => toast("تعذّر الحفظ", "danger")}>إشعار خطأ</Btn>
          </div>
        </Card>
      </div>

      <Modal open={!!modal} drawer={modal === "drawer"} onClose={() => setModal(null)} title={modal === "drawer" ? "تفاصيل المستخدم" : "إضافة مستخدم"} kicker="مثال"
        footer={<><Btn variant="ghost" onClick={() => setModal(null)}>إلغاء</Btn><Btn variant="primary" onClick={() => setModal(null)}>حفظ</Btn></>}>
        <div className="stack">
          <Field label="الاسم الكامل"><Input autoFocus /></Field>
          <Field label="الدور"><Select><option>طالب</option></Select></Field>
        </div>
      </Modal>
    </div>
  );
}

const CSS = `
.uikit-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-4); align-items: start; }
.uikit-grid .span-2 { grid-column: 1 / -1; }
.uikit-swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--sp-3); }
.uikit-swatches div { display: flex; flex-direction: column; gap: 2px; font-size: var(--fs-xs); }
.uikit-swatches i { height: 40px; border-radius: var(--rad-md); border: 1px solid var(--c-border); }
.uikit-swatches code { color: var(--c-text-muted); font-size: var(--fs-2xs); }
@media (max-width: 760px) { .uikit-grid { grid-template-columns: 1fr; } }
`;
