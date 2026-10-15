import { useRef, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, Info, Mail, MessageCircle, Phone, Send, ShieldCheck } from "lucide-react";
import { Btn, Field, Input, Notice, Select, Textarea } from "../ui/Primitives";
import { leadsAreLive, submitLead } from "../lib/leads";
import { CONTACT, JOIN_CARDS, LEAD_KINDS } from "./content";

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const latinDigits = (v) => v.replace(/[٠-٩]/g, (d) => ARABIC_DIGITS.indexOf(d));
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = (v) => /^(?:\+?966|0)?5\d{8}$/.test(latinDigits(v).replace(/[\s-]/g, ""));

const EMPTY = { name: "", contact: "", org: "", kind: LEAD_KINDS[0], message: "" };

export default function ContactSection({ onJoin }) {
  const [vals, setVals] = useState(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState({});
  // null | "sending" | "delivered" | "demo" | "failed"
  const [status, setStatus] = useState(null);
  const sent = status === "delivered" || status === "demo";
  const nameRef = useRef(null);
  const set = (k, v) => setVals((x) => ({ ...x, [k]: v }));

  const channels = [
    CONTACT.whatsapp && { icon: MessageCircle, label: "واتساب", value: `+${CONTACT.whatsapp}`, href: `https://wa.me/${CONTACT.whatsapp}` },
    CONTACT.email && { icon: Mail, label: "البريد الإلكتروني", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    CONTACT.phone && { icon: Phone, label: "الهاتف", value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, "")}` },
  ].filter(Boolean);

  const pick = (card) => {
    if (card.action === "school") {
      set("kind", LEAD_KINDS[0]);
      setStatus(null);
      nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 350);
    } else onJoin(card.action);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    const err = {};
    const contact = vals.contact.trim();
    if (!vals.name.trim()) err.name = "هذا الحقل مطلوب";
    if (!contact) err.contact = "هذا الحقل مطلوب";
    else if (!emailOk(contact) && !phoneOk(contact)) err.contact = "أدخل بريدًا إلكترونيًّا أو رقم جوال سعوديًّا صحيحًا";
    if (!consent) err.consent = "الموافقة مطلوبة للمتابعة.";
    setErrors(err);
    if (Object.keys(err).length) return;
    setStatus("sending");
    try {
      const { delivered } = await submitLead({ name: vals.name.trim(), contact, org: vals.org.trim(), kind: vals.kind, message: vals.message.trim() });
      setStatus(delivered ? "delivered" : "demo");
      setVals(EMPTY);
      setConsent(false);
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div className="ld-contact">
      <div className="ld-contact-side">
        <div className="ld-join-list">
          {JOIN_CARDS.map((c) => (
            <button key={c.title} type="button" className="ld-join" onClick={() => pick(c)}>
              <span className="ld-role-icon">
                <c.icon size={20} />
              </span>
              <span className="ld-join-copy">
                <strong>{c.title}</strong>
                <span>{c.desc}</span>
                <em>
                  {c.cta} <ChevronLeft size={15} />
                </em>
              </span>
            </button>
          ))}
        </div>
        {channels.length > 0 && (
          <ul className="ld-channels">
            {channels.map((c) => (
              <li key={c.label}>
                <a href={c.href} target={c.icon === MessageCircle ? "_blank" : undefined} rel="noreferrer">
                  <c.icon size={18} />
                  <span>{c.label}</span>
                  <bdi dir="ltr">{c.value}</bdi>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="ld-form-card">
        {sent ? (
          <div className={`ld-sent ${status === "demo" ? "is-demo" : ""}`} role="status">
            <span className="ld-sent-icon">{status === "demo" ? <Info size={28} /> : <Check size={28} />}</span>
            {status === "delivered" ? (
              <>
                <h3>وصلنا طلبك</h3>
                <p>شكرًا لتواصلك. سيردّ عليك فريق مشرق عبر البريد أو الجوال الذي أدخلته.</p>
              </>
            ) : (
              <>
                <h3>هذه نسخة عرض للمنصّة</h3>
                <p>لم يُرسَل طلبك إلى فريق مشرق، فالنماذج في هذه النسخة لا تتّصل بخادم بعد. يظهر طلبك في لوحة مدير النظام التجريبية ضمن «الطلبات الواردة».</p>
              </>
            )}
            <Btn variant="ghost" onClick={() => setStatus(null)}>
              إرسال طلب آخر
            </Btn>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h3>أرسل لنا رسالة</h3>
            <p className="muted small">املأ النموذج وسنردّ عليك عبر البريد أو الجوال.</p>
            <div className="form-grid mt-sm">
              <Field label="نوع الطلب" className="span-2">
                <Select name="kind" value={vals.kind} onChange={(e) => set("kind", e.target.value)}>
                  {LEAD_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="الاسم" error={errors.name}>
                <Input ref={nameRef} name="name" value={vals.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
              </Field>
              <Field label="البريد الإلكتروني أو الجوال" hint="أو رقم جوال سعودي (05XXXXXXXX)" error={errors.contact}>
                <Input name="contact" dir="auto" value={vals.contact} onChange={(e) => set("contact", e.target.value)} placeholder="name@example.com" autoComplete="email" />
              </Field>
              <Field label="المدرسة أو الجهة (اختياري)" className="span-2">
                <Input name="org" value={vals.org} onChange={(e) => set("org", e.target.value)} autoComplete="organization" />
              </Field>
              <Field label="رسالتك (اختياري)" className="span-2">
                <Textarea name="message" rows={4} maxLength={600} value={vals.message} onChange={(e) => set("message", e.target.value)} />
              </Field>
            </div>
            <label className="check consent ld-consent">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{" "}
              <span>
                أوافق على التواصل معي بخصوص طلبي وعلى معالجة بياناتي وفق <a href="/privacy/">سياسة الخصوصية</a>.
              </span>
            </label>
            {errors.consent && (
              <span className="field-error" role="alert">
                {errors.consent}
              </span>
            )}
            {status === "failed" && (
              <Notice tone="danger" icon={AlertTriangle}>
                تعذّر إرسال طلبك الآن. تحقّق من اتصالك وحاول مرّة أخرى.
              </Notice>
            )}
            {!leadsAreLive && (
              <Notice tone="info" icon={Info}>
                نسخة عرض: هذا النموذج لا يرسل إلى فريق مشرق بعد.
              </Notice>
            )}
            <Btn type="submit" variant="primary" className="btn-block btn-lg" icon={Send} disabled={status === "sending"}>
              {status === "sending" ? "جارٍ الإرسال…" : "إرسال الرسالة"}
            </Btn>
            <Notice tone="gold" icon={ShieldCheck}>
              نستخدم بياناتك للرد على طلبك فقط.
            </Notice>
          </form>
        )}
      </div>
    </div>
  );
}
