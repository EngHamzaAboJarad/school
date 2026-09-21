import { CheckCircle2, DatabaseBackup, LockKeyhole, ShieldCheck, UserCheck } from "lucide-react";
import { Badge, Card, ListRow, Page, Stat, Toggle } from "../../ui/Primitives";
import { Ring } from "../../ui/Charts";
import { useStore } from "../../store/StoreProvider";
import { fmtDate } from "../../lib/format";

// الأمان والخصوصية والامتثال (E11): PDPL، المصادقة، التشفير، النسخ الاحتياطي، الموافقات
const CHECKS = [
  ["ضوابط جمع ومعالجة بيانات القُصّر وفق سياسة معتمدة", true, "F11.1"],
  ["عدم استخدام بيانات الطلاب لتدريب النماذج", true, "F11.1"],
  ["تحقّق بخطوتين متاح لجميع الحسابات", true, "F11.2"],
  ["إدارة جلسات سليمة (إنهاء عن بُعد)", true, "F11.2"],
  ["تشفير البيانات الحسّاسة أثناء النقل والتخزين", true, "F11.3"],
  ["نسخ احتياطي دوري وخطة تعافٍ (RTO ٤ ساعات)", true, "F11.3"],
  ["توثيق موافقات أولياء الأمور وسياسات الاستخدام", true, "F11.4"],
  ["مراجعة دورية لصلاحيات الأدوار (كل ٩٠ يومًا)", false, "F10.2"],
];

export default function SecurityPage() {
  const { state } = useStore();
  const done = CHECKS.filter((c) => c[1]).length;
  const consents = Object.values(state.consents);
  return (
    <Page kicker="الثقة والامتثال" title="الأمان والامتثال" desc="حماية بيانات القُصّر والامتثال لنظام حماية البيانات الشخصية (PDPL) شرط أساسي للثقة والتوسّع المؤسسي." icon={ShieldCheck}>
      <div className="grid grid-4">
        <Card><div className="row"><Ring value={Math.round((done / CHECKS.length) * 100)} size={96} stroke={9} label="جاهزية الامتثال" sub="امتثال" /><div><strong>{done} من {CHECKS.length}</strong><p className="muted small">ضوابط مُفعَّلة</p></div></div></Card>
        <Stat label="حسابات بتحقّق بخطوتين" value="98.6" unit="%" icon={UserCheck} tone="blue" />
        <Stat label="آخر نسخة احتياطية" value="03:00" icon={DatabaseBackup} tone="gold" foot="اليوم — ناجحة" />
        <Stat label="موافقات موثَّقة" value={consents.length} icon={LockKeyhole} tone="rose" foot="أولياء أمور" />
      </div>
      <div className="grid grid-2 mt">
        <Card title="ضوابط الامتثال" kicker="قائمة التحقّق">
          {CHECKS.map(([t, ok, ref]) => <ListRow key={t} icon={CheckCircle2} tone={ok ? "success" : "warn"} title={t} end={<><Badge>{ref}</Badge><Badge tone={ok ? "success" : "warn"} dot>{ok ? "مُفعَّل" : "قيد المراجعة"}</Badge></>} />)}
        </Card>
        <Card title="سياسات المصادقة" kicker="الجلسات والدخول">
          <Toggle label="إلزام التحقّق بخطوتين للمعلّمين والإدارة" checked disabled onChange={() => {}} />
          <Toggle label="انتهاء الجلسة بعد ٣٠ دقيقة خمول" checked disabled onChange={() => {}} />
          <Toggle label="قفل الحساب بعد ٥ محاولات فاشلة" checked disabled onChange={() => {}} />
          <div className="divider" />
          <h4>موافقات أولياء الأمور</h4>
          {consents.map((c, i) => <ListRow key={i} icon={ShieldCheck} tone="success" title="سياسة الاستخدام وحماية البيانات" meta={`آخر تحديث ${fmtDate(c.at)}`} end={<Badge tone="success">موثَّقة</Badge>} />)}
        </Card>
      </div>
    </Page>
  );
}
