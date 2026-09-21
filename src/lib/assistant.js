import { normalizeAr } from "./rng";

// المساعد الذكي (F1.5): يجيب من محتوى الدرس نفسه فقط ويذكر مصدر الإجابة، ويرفض ما هو خارج النطاق.
const STOP = new Set(
  ["ما", "ماذا", "هل", "كيف", "لماذا", "لما", "متى", "أين", "في", "من", "على", "عن", "إلى", "هو", "هي", "هذا", "هذه", "ذلك", "اشرح", "لي", "أن", "أو", "ثم", "كل", "مع", "أريد", "ممكن", "لو", "إذا", "الذي", "التي", "معنى", "يعني", "بين", "الفرق", "وضح", "لخص", "عرف", "اذكر"].map(normalizeAr),
);
const stem = (w) => {
  const s = w.replace(/^(وال|بال|فال|كال|لل|ال|و)(?=.{3})/, "");
  return s.length > 3 ? s.slice(0, 4) : s;
};
const tokens = (t) => [...new Set(normalizeAr(t).split(" ").filter((w) => w.length > 1 && !STOP.has(w)).map(stem))];

export function answerFromLesson(lesson, question) {
  const qt = tokens(question);
  const wantsSummary = /(ملخص|لخص|خلاصه)/.test(normalizeAr(question));
  if (wantsSummary)
    return { answered: true, text: `الخلاصة: ${lesson.summary.points.join(" ")}`, ref: "ملخص الدرس" };

  const docs = [];
  const sections = [...lesson.explain.base, ...lesson.explain.medium, ...lesson.explain.deep];
  sections.forEach((s) => docs.push({ text: `${s.h} ${s.p}`, answer: s.p, ref: `قسم «${s.h}»` }));
  lesson.cards.forEach(([q, a]) => docs.push({ text: `${q} ${a}`, answer: `${a}.`, ref: "بطاقة المراجعة" }));
  lesson.examples.forEach((e) => docs.push({ text: `${e.title} ${e.body}`, answer: e.body, ref: e.title }));
  lesson.summary.terms.forEach(([t, d]) => docs.push({ text: `${t} ${d}`, answer: `${t}: ${d}.`, ref: "مصطلحات الدرس" }));

  let best = null;
  docs.forEach((d) => {
    const dt = tokens(d.text);
    const score = qt.filter((t) => dt.includes(t)).length;
    if (score > 0 && (!best || score > best.score)) best = { ...d, score };
  });
  if (!best || qt.length === 0)
    return { answered: false, text: `أستطيع الإجابة عن محتوى درس «${lesson.title}» فقط. لم أجد في الدرس ما يجيب عن سؤالك — جرّب صياغة أخرى أو حوّل السؤال إلى معلّمك.`, ref: null };
  return { answered: true, text: best.answer, ref: best.ref };
}
