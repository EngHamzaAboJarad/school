// عناصر عالم «مشرق». الأشعّة والأختام في rays.jsx (خفيفة، تستعملها الصفحة الرئيسية أيضًا)؛
// هنا ما يحتاج بيانات المنهج: لون المادة من اسمها أو معرّفها، وسطر الحقائق.
import { subjects } from "../data/curriculum";
import { SubjectSwatch } from "./rays";
import { cx } from "./Primitives";

export { rayWidth, Vent, VentRow, VentWall, VentLegend, ATTENDANCE_VENT, Seal, SubjectSwatch } from "./rays";

// ───── ألوان المواد: لكل مادة لون ثابت في كل الأدوار ─────
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
