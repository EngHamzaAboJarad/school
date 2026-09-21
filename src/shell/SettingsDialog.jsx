import { useState } from "react";
import { LockKeyhole, Smartphone, Monitor, RotateCcw } from "lucide-react";
import { Modal, Btn, Toggle, Segmented, Notice, Badge } from "../ui/Primitives";
import { useToast } from "../ui/Brand";
import { useStore } from "../store/StoreProvider";

const PREFS_KEY = "taqat-prefs";
export const loadPrefs = () => {
  try {
    return { textSize: "md", contrast: false, motion: true, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return { textSize: "md", contrast: false, motion: true };
  }
};
export function applyPrefs(p) {
  const r = document.documentElement;
  r.dataset.textsize = p.textSize;
  r.dataset.contrast = p.contrast ? "high" : "normal";
  r.dataset.motion = p.motion ? "on" : "off";
}

// الإعدادات: الإتاحة (F12.3)، الأمان والجلسات (F11.2)، إعادة ضبط بيانات العرض.
export default function SettingsDialog({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [prefs, setPrefs] = useState(loadPrefs);
  const [sessions, setSessions] = useState([
    { id: 1, device: "هذا الجهاز — Chrome على Windows", place: "الرياض", current: true },
    { id: 2, device: "iPhone 15 — تطبيق طاقات", place: "الرياض", current: false },
  ]);
  const [twofa, setTwofa] = useState(true);

  const update = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    applyPrefs(next);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <Modal open onClose={onClose} title="الإعدادات" kicker="الحساب والأمان" wide
      footer={<Btn variant="primary" onClick={onClose}>تم</Btn>}>
      <div className="grid grid-2">
        <div className="stack-sm">
          <h4>الإتاحة وسهولة القراءة</h4>
          <div>
            <span className="field-label">حجم الخط</span>
            <div className="mt-sm">
              <Segmented options={[{ id: "sm", label: "صغير" }, { id: "md", label: "عادي" }, { id: "lg", label: "كبير" }]} value={prefs.textSize} onChange={(v) => update({ textSize: v })} />
            </div>
          </div>
          <Toggle label="تباين عالٍ" hint="ألوان أوضح ونصوص أغمق" checked={prefs.contrast} onChange={(v) => update({ contrast: v })} />
          <Toggle label="الحركات والانتقالات" hint="عطّلها لتقليل الحركة" checked={prefs.motion} onChange={(v) => update({ motion: v })} />
          <Notice tone="gold">اللغة: العربية بالاتجاه من اليمين إلى اليسار. ستتوفر لغات إضافية لاحقًا ضمن التوطين.</Notice>
        </div>
        <div className="stack-sm">
          <h4>الأمان والجلسات</h4>
          <Toggle label="التحقّق بخطوتين (2FA)" hint="رمز من ٦ أرقام عند كل تسجيل دخول" checked={twofa}
            onChange={(v) => { setTwofa(v); toast(v ? "فُعِّل التحقّق بخطوتين" : "أُوقف التحقّق بخطوتين", v ? "success" : "warn"); }} />
          <div className="sessions">
            {sessions.map((s) => (
              <div className="session" key={s.id}>
                {s.device.includes("iPhone") ? <Smartphone size={18} /> : <Monitor size={18} />}
                <div><strong>{s.device}</strong><small className="muted">{s.place}</small></div>
                {s.current ? <Badge tone="success" dot>الجلسة الحالية</Badge> : <Btn size="sm" variant="danger" onClick={() => { setSessions(sessions.filter((x) => x.id !== s.id)); toast("أُنهيت الجلسة"); }}>إنهاء</Btn>}
              </div>
            ))}
          </div>
          <Notice tone="info" icon={LockKeyhole}>بيانات الطلاب القُصّر مشفّرة، ولا تُستخدم لتدريب نماذج الذكاء الاصطناعي.</Notice>
        </div>
      </div>
      <div className="divider" />
      <div className="row spread">
        <div>
          <strong>بيانات العرض التجريبي</strong>
          <p className="muted small">تعيد كل شيء (الاختبارات، الاعتمادات، الرسائل) إلى حالته الأولى.</p>
        </div>
        <Btn variant="danger" icon={RotateCcw} onClick={() => { if (window.confirm("إعادة ضبط كل بيانات العرض؟")) { dispatch({ type: "reset" }); toast("أُعيد ضبط بيانات العرض"); onClose(); } }}>إعادة الضبط</Btn>
      </div>
    </Modal>
  );
}
