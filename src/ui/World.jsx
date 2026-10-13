import { Sparkles, Stamp } from "lucide-react";
import { cx } from "./Primitives";
import { subjects } from "../data/curriculum";

// ───────────────────────────────────────────────────────────────────────────
// عناصر عالم «الطين والباب النجدي»
// الكوّة المثلّثة هي رمز البيانات الوحيد في المنصّة: ممتلئة = حاضر/منجز/متقَن،
// مجوّفة = غائب/غير منجز، نصف ممتلئة = متأخّر/جزئي، حمراء = غياب أو تعثّر، منقّطة = لا بيانات.
// لا تُستخدم أبدًا كزخرفة: كل كوّة تمثّل قيمة حقيقية ولها وصف نصّي (title + aria).
// ───────────────────────────────────────────────────────────────────────────

const VENT_STATES = ["on", "off", "partial", "alert", "empty"];

export function Vent({ state = "on", tone, size = 12, title }) {
  const s = VENT_STATES.includes(state) ? state : "empty";
  const h = size;
  const w = Math.round(size * 1.08);
  const pts = `0.75,${h - 0.75} ${w / 2},0.9 ${w - 0.75},${h - 0.75}`;
  const color = tone ? `var(--c-subj-${tone}, ${tone})` : undefined;
  return (
    <svg className={cx("vent", `vent-${s}`)} width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={color ? { "--vent-tone": color } : undefined} aria-hidden="true">
      {title && <title>{title}</title>}
      {s === "partial" && <polygon className="vent-half" points={`${w * 0.25},${h / 2} ${w * 0.75},${h / 2} ${w - 0.75},${h - 0.75} 0.75,${h - 0.75}`} />}
      <polygon className="vent-shape" points={pts} />
    </svg>
  );
}

// صفّ كوّات: items = [{ state, title, tone }]. label يصف الصف لقارئ الشاشة.
export function VentRow({ items, size = 12, label, className }) {
  return (
    <span className={cx("vent-row", className)} role="img" aria-label={label || items.map((i) => i.title).filter(Boolean).join(" • ")}>
      {items.map((it, i) => (
        <Vent key={i} state={it.state} tone={it.tone} size={size} title={it.title} />
      ))}
    </span>
  );
}

// جدار كوّات: صفوف بعنوان وقيمة. columns = عناوين الأعمدة (مثلًا الأيام).
export function VentWall({ rows, columns, size = 13, valueLabel, legend, caption }) {
  return (
    <div className="vent-wall">
      {caption && <span className="sr-only">{caption}</span>}
      {columns && (
        <div className="vent-wall-row vent-wall-head" aria-hidden="true">
          <span />
          <span className="vent-wall-cols">
            {columns.map((c, i) => (
              <i key={i} style={{ width: Math.round(size * 1.08) }}>{c}</i>
            ))}
          </span>
          <span>{valueLabel}</span>
        </div>
      )}
      {rows.map((r) => (
        <div className="vent-wall-row" key={r.id}>
          <span className="vent-wall-label">
            {r.tone && <SubjectSwatch tone={r.tone} />}
            <span>
              <b>{r.label}</b>
              {r.sub && <small>{r.sub}</small>}
            </span>
          </span>
          <VentRow items={r.items} size={size} label={`${r.label}: ${r.items.map((i) => i.title).join(" • ")}`} />
          <span className="vent-wall-value num">{r.value ?? "—"}</span>
        </div>
      ))}
      {legend && <VentLegend items={legend} />}
    </div>
  );
}

export function VentLegend({ items }) {
  return (
    <div className="vent-legend">
      {items.map((l) => (
        <span key={l.label}>
          <Vent state={l.state} size={11} />
          {l.label}
        </span>
      ))}
    </div>
  );
}

// حالة الحضور → كوّة
export const ATTENDANCE_VENT = {
  present: { state: "on", label: "حاضر" },
  late: { state: "partial", label: "متأخّر" },
  excused: { state: "off", label: "غائب بعذر" },
  absent: { state: "alert", label: "غائب" },
};

// ───── الختم: اعتماد المعلّم مقابل اقتراح الذكاء الاصطناعي ─────
export function Seal({ approved, by, compact }) {
  if (approved)
    return (
      <span className={cx("seal", compact && "seal-compact")} title={by ? `اعتمده ${by}` : "اعتمده المعلّم"}>
        <Stamp size={13} aria-hidden="true" />
        <span>{compact ? "معتمد" : "اعتمده المعلّم"}</span>
      </span>
    );
  return (
    <span className={cx("seal seal-ai", compact && "seal-compact")} title="تقييم مبدئي من «النجمة» ينتظر اعتماد المعلّم">
      <Sparkles size={13} aria-hidden="true" />
      <span>مقترح آليًّا</span>
    </span>
  );
}

// ───── ألوان المواد: لكل مادة لون باب ثابت في كل الأدوار ─────
const BY_NAME = [
  ["رياض", "math"],
  ["علوم", "sci"],
  ["لغتي", "arb"],
  ["العربية", "arb"],
  ["الإنجليزية", "eng"],
  ["القرآن", "quran"],
  ["الإسلامية", "quran"],
  ["البدنية", "pe"],
  ["الاجتماعية", "social"],
];

export function subjectTone(ref) {
  if (!ref) return "other";
  const byId = subjects.find((s) => s.id === ref);
  if (byId) return byId.tone;
  const hit = BY_NAME.find(([k]) => String(ref).includes(k));
  return hit ? hit[1] : "other";
}

export function SubjectSwatch({ tone }) {
  return <i className="subj-swatch" style={{ background: `var(--c-subj-${tone})` }} aria-hidden="true" />;
}

export function SubjectMark({ subject, name }) {
  const tone = subjectTone(subject || name);
  const label = name || subjects.find((s) => s.id === subject)?.name || subject;
  return (
    <span className="subj-mark">
      <SubjectSwatch tone={tone} />
      {label}
    </span>
  );
}

// ───── سطر الحقائق تحت عنوان الصفحة (بديل صفّ «الأرقام الكبيرة») ─────
// items = [{ label, value, tone?, onClick? }] — القيمة null تُعرض «—» مع وصف.
export function FactLine({ items }) {
  return (
    <dl className="fact-line">
      {items.filter(Boolean).map((f) => {
        const Tag = f.onClick ? "button" : "div";
        return (
          <Tag key={f.label} className={cx("fact", f.tone && `fact-${f.tone}`)} onClick={f.onClick} type={f.onClick ? "button" : undefined}>
            <dt>{f.label}</dt>
            <dd>
              <span className="num">{f.value ?? "—"}</span>
              {f.note && <small>{f.note}</small>}
            </dd>
          </Tag>
        );
      })}
    </dl>
  );
}
