import { normalizeAr, shuffle, clamp } from "./rng";

// ── تصحيح سؤال موضوعي: يعيد نسبة من 0 إلى 1 ──
export function gradeQuestion(q, answer) {
  if (answer === undefined || answer === null || answer === "") return 0;
  switch (q.type) {
    case "mcq":
      return Number(answer) === q.answer ? 1 : 0;
    case "tf":
      return answer === q.answer ? 1 : 0;
    case "fill": {
      const given = normalizeAr(String(answer));
      return q.answers.some((a) => normalizeAr(a) === given) ? 1 : 0;
    }
    case "match": {
      // answer: { [leftIndex]: rightText }
      const total = q.pairs.length;
      const ok = q.pairs.filter(([, right], i) => answer[i] === right).length;
      return ok / total;
    }
    default:
      return 0;
  }
}

// ── تقييم مقالي بمعايير (Rubric) — محاكاة محرّك التقييم بالذكاء الاصطناعي ──
export function aiGradeEssay(q, text) {
  const norm = normalizeAr(text || "");
  const words = norm ? norm.split(" ").length : 0;
  const byCriterion = q.rubric.map((r) => {
    const hit = r.kw.some((k) => norm.includes(normalizeAr(k)));
    // إجابة وافية بلا كلمات مفتاحية تنال جزءًا من الدرجة، وتُترك للمعلّم
    const got = hit ? r.w : words >= 25 ? Math.round(r.w * 0.3 * 10) / 10 : 0;
    return { c: r.c, w: r.w, got, hit };
  });
  const score = Math.round(byCriterion.reduce((s, r) => s + r.got, 0) * 10) / 10;
  const feedback = byCriterion.map((r) => (r.hit ? `أحسنت: ${r.c}.` : `لم يتّضح: ${r.c}.`));
  return { score: Math.min(score, q.maxScore), max: q.maxScore, byCriterion, feedback, words };
}

// ── تصحيح محاولة كاملة ──
export function scoreAttempt(questions, answers, essays = {}) {
  const items = {};
  const byObjective = {};
  let got = 0;
  let total = 0;
  questions.forEach((q) => {
    if (q.type === "essay") return;
    const g = gradeQuestion(q, answers[q.id]);
    items[q.id] = { got: g, answer: answers[q.id] ?? null };
    got += g;
    total += 1;
    const o = (byObjective[q.objective] ||= { got: 0, total: 0 });
    o.got += g;
    o.total += 1;
  });
  const score = total ? Math.round((got / total) * 100) : 0;
  return { items, byObjective, score, essays };
}

// ── تحديث الإتقان بمتوسط متحرّك: يعطي الأداء الأخير وزنًا أكبر ──
export function updateMastery(prev, got, total) {
  const now = (got / total) * 100;
  if (prev === undefined || prev === null) return Math.round(now);
  return Math.round(clamp(prev * 0.55 + now * 0.45));
}

export const GAP_THRESHOLD = 70;
export const CLOSE_THRESHOLD = 80;

// ── بناء امتحان الوحدة من المخطّط (Blueprint) وأوزان الدروس (F2.2) ──
export function buildUnitExam({ blueprint, questions, seed }) {
  const lessonIds = Object.keys(blueprint.weights);
  const pool = {};
  lessonIds.forEach((id) => {
    pool[id] = shuffle(
      questions.filter((q) => q.lessonId === id && q.type !== "essay" && q.status === "approved"),
      `${seed}:${id}`,
    );
  });
  const sum = lessonIds.reduce((s, id) => s + blueprint.weights[id], 0) || 1;
  const quota = {};
  let assigned = 0;
  lessonIds.forEach((id) => {
    quota[id] = Math.min(pool[id].length, Math.round((blueprint.weights[id] / sum) * blueprint.count));
    assigned += quota[id];
  });
  // أعد توزيع الفارق على الدروس التي لديها أسئلة متاحة
  let guard = 0;
  while (assigned < blueprint.count && guard++ < 50) {
    const next = lessonIds.find((id) => quota[id] < pool[id].length);
    if (!next) break;
    quota[next] += 1;
    assigned += 1;
  }
  while (assigned > blueprint.count && guard++ < 100) {
    const heavy = [...lessonIds].sort((a, b) => quota[b] - quota[a])[0];
    quota[heavy] -= 1;
    assigned -= 1;
  }
  const picked = lessonIds.flatMap((id) => pool[id].slice(0, quota[id]));
  const essays = questions.filter((q) => (blueprint.essayIds || []).includes(q.id) && q.status === "approved");
  // خلط الترتيب وخيارات الاختيار من متعدد لكل طالب (نزاهة الاختبار F2.8)
  const ordered = shuffle(picked, `${seed}:order`).map((q) => (q.type === "mcq" ? shuffleOptions(q, seed) : q));
  return [...ordered, ...essays];
}

export function shuffleOptions(q, seed) {
  const idx = shuffle(q.options.map((_, i) => i), `${seed}:${q.id}`);
  return { ...q, options: idx.map((i) => q.options[i]), answer: idx.indexOf(q.answer) };
}

// ── توليد أسئلة اختيار من متعدد من بطاقات الدرس (محاكاة التوليد من المحتوى) ──
export function generateFromLesson({ lesson, unitLessons, count, difficulty, startId }) {
  const otherAnswers = unitLessons.filter((l) => l.id !== lesson.id).flatMap((l) => l.cards.map((c) => c[1]));
  const own = lesson.cards.map((c) => c[1]);
  return lesson.cards.slice(0, count).map(([front, back], i) => {
    const distractors = shuffle(
      [...otherAnswers, ...own.filter((a) => a !== back)].filter((a, k, arr) => a !== back && arr.indexOf(a) === k),
      `${lesson.id}:${i}:${startId}`,
    ).slice(0, 3);
    const options = shuffle([back, ...distractors], `${lesson.id}:${i}:opts`);
    return {
      id: `${startId}-${i + 1}`,
      lessonId: lesson.id,
      objective: lesson.objectives[0],
      type: "mcq",
      difficulty,
      text: front,
      options,
      answer: options.indexOf(back),
      why: `الإجابة الصحيحة: ${back}.`,
      status: "pending",
      source: "ai",
    };
  });
}
