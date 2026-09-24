import { lessons, lessonsOfUnit, units } from "./curriculum";
import { seedQuestions, seedBlueprints } from "./questions";
import { students, seedClasses, seedTimetable, seedSchools, seedDirectory, seedTenants, seedRbac } from "./people";
import { seeded, clamp } from "../lib/rng";
import { aiGradeEssay } from "../lib/grading";
import { DAY_MS, HOUR_MS, MIN_MS } from "../lib/format";

export const STATE_VERSION = 6;

const ymd = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const dateKey = ymd;

// أيام الدراسة (أحد–خميس) السابقة
function schoolDaysBack(now, n) {
  const out = [];
  let t = now - DAY_MS;
  while (out.length < n) {
    const dow = new Date(t).getDay(); // 5=الجمعة 6=السبت
    if (dow !== 5 && dow !== 6) out.push(t);
    t -= DAY_MS;
  }
  return out;
}

export function createSeed(now = Date.now()) {
  const questions = seedQuestions.map((q) => ({ ...q }));
  const qById = Object.fromEntries(questions.map((q) => [q.id, q]));
  const blueprints = {
    ...JSON.parse(JSON.stringify(seedBlueprints)),
    "U-A1": { weights: { "L-A1": 34, "L-A2": 33, "L-A3": 33 }, count: 8, durationMin: 15, attempts: 2, essayIds: [] },
  };

  // ── عناصر مراجعة المعلّم (الإنسان في الحلقة — F6.2) ──
  const reviewItems = [];
  let rid = 1;
  const addItem = (item) => reviewItems.push({ id: `R-${rid++}`, decidedAt: null, note: "", decidedBy: null, ...item });
  lessons.forEach((l, i) => {
    const qs = questions.filter((q) => q.lessonId === l.id && q.type !== "essay").map((q) => q.id);
    const pendingQuiz = l.id === "L-M4";
    const pendingSummary = l.id === "L-M3" || l.id === "L-M4";
    const at = now - (pendingQuiz ? 3 * HOUR_MS : (20 - i) * DAY_MS);
    addItem({ kind: "quiz", lessonId: l.id, unitId: l.unitId, title: `اختبار درس «${l.title}»`, questionIds: qs, status: pendingQuiz ? "pending" : "approved", createdAt: at, decidedAt: pendingQuiz ? null : at + 2 * HOUR_MS, decidedBy: pendingQuiz ? null : "tch-khaled" });
    addItem({ kind: "summary", lessonId: l.id, unitId: l.unitId, title: `ملخص درس «${l.title}»`, status: pendingSummary ? "pending" : "approved", createdAt: now - (pendingSummary ? (l.id === "L-M3" ? 6 : 4) * HOUR_MS : (20 - i) * DAY_MS), decidedAt: pendingSummary ? null : now - (19 - i) * DAY_MS, decidedBy: pendingSummary ? null : "tch-khaled" });
  });
  units.slice(0, 3).forEach((u) => {
    const pending = u.id === "U-M3";
    const bp = blueprints[u.id];
    addItem({ kind: "exam", unitId: u.id, title: `امتحان وحدة «${u.title}»`, questionIds: [...questions.filter((q) => Object.keys(bp.weights).includes(q.lessonId) && q.type !== "essay").map((q) => q.id), ...bp.essayIds], status: pending ? "pending" : "approved", createdAt: now - (pending ? 5 * HOUR_MS : 9 * DAY_MS), decidedAt: pending ? null : now - 8 * DAY_MS, decidedBy: pending ? null : "tch-khaled" });
  });
  addItem({ kind: "explain", lessonId: "L-M2", unitId: "U-M3", title: "إعادة توليد شرح «الميل» بمستوى أبسط وأمثلة إضافية", status: "pending", createdAt: now - 26 * HOUR_MS });

  // ── تقدّم الطالبة (سارة) ──
  const attempts = [];
  let aid = 1;
  const mkAttempt = (o) => {
    const qs = questions.filter((q) => q.lessonId === o.refId && q.type !== "essay");
    const items = {};
    const byObjective = {};
    o.got.forEach((g, i) => {
      const q = qs[i];
      items[q.id] = { got: g, answer: null };
      const b = (byObjective[q.objective] ||= { got: 0, total: 0 });
      b.got += g;
      b.total += 1;
    });
    const total = o.got.length;
    const score = Math.round((o.got.reduce((s, g) => s + g, 0) / total) * 100);
    attempts.push({ id: `AT-${aid++}`, studentId: o.studentId, kind: "lesson", refId: o.refId, at: o.at, durationSec: o.dur || 260, items, byObjective, score, essays: {} });
  };
  mkAttempt({ studentId: "stu-sara", refId: "L-M1", at: now - 18 * DAY_MS, got: [1, 1, 1, 0] });
  mkAttempt({ studentId: "stu-sara", refId: "L-S1", at: now - 15 * DAY_MS, got: [1, 1, 1, 1] });
  mkAttempt({ studentId: "stu-sara", refId: "L-A1", at: now - 12 * DAY_MS, got: [1, 1, 0, 1] });
  mkAttempt({ studentId: "stu-sara", refId: "L-M2", at: now - 5 * DAY_MS, got: [1, 0, 1, 1 / 3] });
  mkAttempt({ studentId: "stu-sara", refId: "L-S2", at: now - 2 * DAY_MS, got: [1, 1, 0, 1] });

  const progress = { "stu-sara": {} };
  const doneAt = { "L-M1": 18, "L-S1": 15, "L-A1": 12, "L-M2": 5, "L-S2": 2 };
  const doneScore = { "L-M1": 75, "L-S1": 100, "L-A1": 75, "L-M2": 58, "L-S2": 75 };
  Object.keys(doneAt).forEach((id) => (progress["stu-sara"][id] = { done: true, score: doneScore[id], at: now - doneAt[id] * DAY_MS }));

  // ── إتقان الأهداف: سارة وليان بقيم مقصودة، والباقون بعشوائية مستقرّة ──
  const mastery = {
    "stu-sara": { "O-M1": 88, "O-M2": 58, "O-S1": 90, "O-S2": 75, "O-A1": 84 },
    "stu-layan": { "O-P1": 85, "O-P2": 78, "O-P3": 58, "O-P4": 90, "O-P5": 66, "O-P6": 82 },
  };
  const points = { "stu-sara": 1240, "stu-layan": 620 };
  const streaks = { "stu-sara": 7, "stu-layan": 3 };
  students.forEach((s, idx) => {
    if (mastery[s.id]) return;
    const rnd = seeded(`m:${s.id}`);
    const ability = 52 + Math.round(rnd() * 40) - (s.classId === "c-3b" ? 4 : 0);
    const m = {};
    ["O-M1", "O-M2", "O-M3", "O-S1", "O-S2"].forEach((o, k) => {
      const skip = (o === "O-M3" && rnd() > 0.55) || (o === "O-S2" && rnd() > 0.7);
      if (!skip) m[o] = clamp(Math.round(ability + (rnd() - 0.5) * 26 - (o === "O-M2" ? 6 : 0) + k));
    });
    if (rnd() > 0.8) m["O-M4"] = clamp(Math.round(ability - 8 + rnd() * 10));
    mastery[s.id] = m;
    points[s.id] = 520 + Math.round(rnd() * 900);
    streaks[s.id] = 1 + Math.round(rnd() * 9);
    progress[s.id] = {};
    Object.keys(m).forEach((o) => {
      const lid = lessons.find((l) => l.objectives.includes(o))?.id;
      if (lid) progress[s.id][lid] = { done: true, score: m[o], at: now - (3 + Math.round(rnd() * 14)) * DAY_MS };
    });
  });

  const history = {
    "stu-sara": [61, 64, 66, 70, 72, 73, 75],
    "stu-layan": [70, 71, 69, 72, 74, 73, 75],
  };

  // ── محاولات امتحان وحدة العلوم لزملاء سارة، ومنها مقالي بانتظار تصحيح المعلّم (F2.5/F6.3) ──
  const essayQ = qById["Q-S-E1"];
  const essayTexts = {
    "stu-lujain": "لأن الفعل وردّ الفعل يؤثران في جسمين مختلفين، فكل قوة تؤثر في جسم غير الآخر، وهما متساويتان في المقدار ومتعاكستان في الاتجاه.",
    "stu-omar": "لأنهما متساويتان في المقدار ومتعاكستان في الاتجاه فقط، ولذلك تلغيان بعضهما تقريبًا.",
    "stu-fahd": "لأن الجسمين مختلفان فالقوتان لا تلغيان بعضهما لأن كل واحدة تعمل على جسم مختلف عن الأخرى.",
    "stu-reem": "لأن القوتين تؤثران في جسمين مختلفين وهما متساويتان مقدارًا ومعاكستان اتجاهًا.",
  };
  ["stu-lujain", "stu-omar", "stu-fahd", "stu-reem"].forEach((sid, i) => {
    const ai = aiGradeEssay(essayQ, essayTexts[sid]);
    const graded = sid === "stu-reem";
    attempts.push({
      id: `AT-${aid++}`, studentId: sid, kind: "unit", refId: "U-S2", at: now - (i + 1) * 5 * HOUR_MS - i * 40 * MIN_MS, durationSec: 780,
      items: {}, byObjective: { "O-S1": { got: 2, total: 3 }, "O-S2": { got: 2, total: 3 }, "O-S3": { got: 2, total: 2 } },
      score: [78, 64, 88, 92][i], essays: {
        "Q-S-E1": { text: essayTexts[sid], ai, final: graded ? { score: 5, note: "إجابة كاملة وواضحة، أحسنت.", by: "tch-khaled", at: now - 3 * HOUR_MS, changed: false } : null },
      },
    });
  });

  // ── الواجبات والمهام (F6.4) ──
  const classA = seedClasses[0].studentIds;
  const subs = (ids, stat, offset = 0) => Object.fromEntries(ids.map((id, i) => [id, { status: stat, at: now - (i + 1) * HOUR_MS * 5 - offset, text: "", grade: null, feedback: "" }]));
  const assignments = [
    { id: "A-1", teacherId: "tch-khaled", title: "تمارين الميل (10 مسائل)", subjectId: "S-MATH", classId: "c-3a", due: now + 2 * DAY_MS, points: 10, desc: "احسب ميل المستقيم المار بكل زوج من النقاط ثم صنّف الميل (موجب/سالب/صفري).", createdAt: now - 3 * DAY_MS, submissions: subs(classA.slice(1, 5), "submitted") },
    { id: "A-2", teacherId: "tch-khaled", title: "تقرير: تطبيقات قوانين نيوتن في الحياة", subjectId: "S-SCI", classId: "c-3a", due: now + 4 * DAY_MS, points: 15, desc: "اكتب تقريرًا من صفحة عن ثلاثة أمثلة، لكل قانون مثال من حياتك اليومية.", createdAt: now - 2 * DAY_MS, submissions: subs(classA.slice(2, 4), "submitted") },
    { id: "A-3", teacherId: "tch-khaled", title: "ورقة عمل: الدوال الخطية", subjectId: "S-MATH", classId: "c-3a", due: now - 1 * DAY_MS, points: 10, desc: "حلّ ورقة العمل المرفقة عن الدوال الخطية.", createdAt: now - 8 * DAY_MS, submissions: { ...subs(classA.filter((id) => id !== "stu-sara").slice(0, 6), "graded"), "stu-sara": { status: "graded", at: now - 2 * DAY_MS, text: "", grade: 9, feedback: "عمل ممتاز، انتبهي لإشارة الميل." }, "stu-turki": { status: "late", at: now - 3 * HOUR_MS, text: "", grade: null, feedback: "" } } },
    { id: "A-4", teacherId: "tch-khaled", title: "مسائل على القوة والتسارع", subjectId: "S-SCI", classId: "c-3b", due: now + 3 * DAY_MS, points: 10, desc: "حلّ المسائل من 1 إلى 8.", createdAt: now - 1 * DAY_MS, submissions: subs(["stu-nora", "stu-badr"], "submitted") },
    { id: "A-5", teacherId: "tch-sarah", title: "فقرة حجاجية: أثر الوجبات السريعة", subjectId: "S-ARB", classId: "c-3a", due: now + 1 * DAY_MS, points: 10, desc: "اكتب فقرة حجاجية من ثمانية أسطر تتضمن ادّعاءً ودليلًا وخاتمة.", createdAt: now - 4 * DAY_MS, submissions: {} },
  ];

  // ── الحضور (F7.3) ──
  const attendance = {};
  const days = schoolDaysBack(now, 14);
  const allStudents = students.map((s) => s.id);
  days.forEach((t, di) => {
    const day = {};
    allStudents.forEach((sid) => {
      const r = seeded(`att:${sid}:${di}`)();
      day[sid] = r > 0.965 ? "absent" : r > 0.945 ? "late" : r > 0.93 ? "excused" : "present";
    });
    attendance[ymd(t)] = day;
  });
  attendance[ymd(days[4])]["stu-sara"] = "excused";
  attendance[ymd(days[9])]["stu-layan"] = "absent";

  // ── المراسلات والإعلانات (F5.3 / F9.2) ──
  const threads = [
    { id: "T-1", subject: "متابعة مستوى سارة في الرياضيات", participants: ["par-noura", "tch-khaled"], msgs: [
      { from: "par-noura", text: "السلام عليكم أستاذ خالد، لاحظت أن سارة تجد صعوبة في موضوع الميل. هل من نصيحة؟", at: now - 30 * HOUR_MS },
      { from: "tch-khaled", text: "وعليكم السلام ورحمة الله. أعددنا لها خطة علاجية قصيرة في المنصة (٨ دقائق يوميًّا) وستتحسّن بإذن الله. سأتابع نتيجة إعادة الاختبار.", at: now - 26 * HOUR_MS },
    ] },
    { id: "T-2", subject: "سؤال عن حساب الميل", participants: ["stu-sara", "tch-khaled"], msgs: [
      { from: "stu-sara", text: "أستاذ، لم أفهم لماذا أخطأت في ترتيب النقطتين عند حساب الميل.", at: now - 3 * DAY_MS },
      { from: "tch-khaled", text: "المهم أن تحافظي على الترتيب نفسه في البسط والمقام. راجعي خطأ «شائع» في شرح الدرس ثم أعيدي الاختبار.", at: now - 3 * DAY_MS + 2 * HOUR_MS },
    ] },
    { id: "T-3", subject: "استفسار عن تجديد الاشتراك", participants: ["par-noura", "adm-school"], msgs: [
      { from: "par-noura", text: "متى يبدأ تجديد اشتراك الفصل الدراسي الثاني؟", at: now - 2 * DAY_MS },
      { from: "adm-school", text: "يبدأ التجديد الأسبوع القادم وسيصلكم إشعار وفاتورة عبر التطبيق.", at: now - 2 * DAY_MS + 3 * HOUR_MS },
    ] },
    { id: "T-4", subject: "ملاحظة عن الكسور المختلفة (ليان)", participants: ["par-noura", "tch-huda"], msgs: [
      { from: "tch-huda", text: "ليان بحاجة لمراجعة جمع الكسور المختلفة؛ أضفت لها تمارين علاجية قصيرة.", at: now - 20 * HOUR_MS },
    ] },
    { id: "T-5", subject: "كيف أستعد لامتحان الوحدة؟", participants: ["stu-lujain", "tch-khaled"], msgs: [
      { from: "stu-lujain", text: "أستاذ، هل يشمل امتحان الوحدة الدرس الرابع؟", at: now - 6 * HOUR_MS },
    ] },
    { id: "T-6", subject: "استفسار سريع عن موعد الحصة", channel: "whatsapp", participants: ["par-noura", "tch-khaled"], msgs: [
      { from: "par-noura", text: "مساء الخير أستاذ خالد، فيه تغيير على موعد حصة الغد؟", at: now - 10 * HOUR_MS },
      { from: "tch-khaled", text: "مساء النور، لا يوجد تغيير، الموعد كالمعتاد.", at: now - 9 * HOUR_MS },
    ] },
  ];
  const announcements = [
    { id: "N-1", from: "adm-school", title: "امتحانات نهاية الوحدة الأسبوع القادم", body: "تُفتح امتحانات الوحدات لطلاب المرحلة المتوسطة عبر المنصّة. يُرجى مراجعة الملخصات والخطط العلاجية قبل الدخول.", audience: "all", at: now - 1 * DAY_MS, readBy: ["tch-khaled"] },
    { id: "N-2", from: "adm-school", title: "اجتماع أولياء الأمور — الفصل الدراسي الأول", body: "يُعقد الاجتماع يوم الأربعاء القادم الساعة ٦:٠٠ مساءً في مسرح المدرسة.", audience: "parents", at: now - 3 * DAY_MS, readBy: [] },
  ];

  // ── الإشعارات ──
  let nid = 1;
  const n = (to, title, body, at, link, tone = "info", read = false) => ({ id: `NT-${nid++}`, to, title, body, at, link, tone, read });
  const notifications = [
    n("stu-sara", "اعتُمد اختبار «تمثيل الدالة الخطية»", "أصبح متاحًا بعد الدرس. بالتوفيق!", now - 2 * HOUR_MS, "learn", "success"),
    n("stu-sara", "تذكير: واجب الفقرة الحجاجية غدًا", "موعد التسليم غدًا الساعة ١١:٥٩ مساءً.", now - 5 * HOUR_MS, "home", "warn"),
    n("stu-sara", "خطة علاجية جديدة: مفهوم الميل", "٣ خطوات قصيرة لرفع إتقانك.", now - 5 * DAY_MS, "progress", "info", true),
    n("par-noura", "نتيجة سارة في اختبار «القوة والتسارع»: 75%", "مفهوم نيوتن الثاني بحاجة لتدريب إضافي.", now - 2 * DAY_MS, "child", "info"),
    n("par-noura", "تنبيه ذكي: مفهوم «الميل» يحتاج مراجعة", "إتقان سارة 58% وأقل من الحدّ المطلوب (70%).", now - 5 * DAY_MS, "child", "warn"),
    n("par-noura", "تنبيه ذكي: جمع الكسور المختلفة (ليان)", "إتقان ليان 58% — أُضيفت لها خطة علاجية.", now - 20 * HOUR_MS, "child", "warn"),
    n("par-noura", "التقرير الأسبوعي جاهز", "تقرير أداء سارة وليان للأسبوع الماضي.", now - 1 * DAY_MS, "reports", "success", true),
    n("tch-khaled", "طلب اعتماد: اختبار «معادلة المستقيم»", "٤ أسئلة مولّدة بانتظار مراجعتك.", now - 3 * HOUR_MS, "review", "warn"),
    n("tch-khaled", "٣ إجابات مقالية بانتظار التصحيح", "من امتحان وحدة «الطاقة والحركة».", now - 4 * HOUR_MS, "grading", "warn"),
    n("adm-school", "معلّمان بانتظار اعتماد الحساب", "أ. ماجد الدوسري وأ. ريما السبيعي.", now - 1 * DAY_MS, "users", "warn"),
    n("adm-school", "ترخيص المدرسة: ١٢٤٠ من ١٥٠٠ مقعد", "استهلاك المقاعد ٨٣٪.", now - 2 * DAY_MS, "licenses", "info", true),
    n("sup-1", "مدرسة الرواد: ينتهي الترخيص قريبًا", "٢٢ يومًا على انتهاء الترخيص.", now - 1 * DAY_MS, "home", "warn"),
    n("sys-1", "استهلاك الذكاء الاصطناعي بلغ ٦٨٪ من حدّ الشهر", "راجع الحدود في إعدادات المحرّك.", now - 6 * HOUR_MS, "ai", "warn"),
  ];

  // ── سجلّ التدقيق (F10.5) ──
  const audit = [
    { id: "AU-1", at: now - 30 * MIN_MS, actor: "tch-khaled", actorName: "أ. خالد العتيبي", action: "اعتماد محتوى", target: "اختبار «تمثيل الدالة الخطية»", severity: "info" },
    { id: "AU-2", at: now - 3 * HOUR_MS, actor: "tch-khaled", actorName: "أ. خالد العتيبي", action: "تعديل درجة مقالي", target: "ريم علي — امتحان الطاقة والحركة", severity: "warn" },
    { id: "AU-3", at: now - 8 * HOUR_MS, actor: "adm-school", actorName: "أ. عبدالله الشمري", action: "إضافة مستخدمين", target: "٢٤ طالبًا جديدًا", severity: "info" },
    { id: "AU-4", at: now - 1 * DAY_MS, actor: "sys-1", actorName: "م. طارق العنزي", action: "تغيير سياسة الخصوصية", target: "سياسة حماية بيانات القُصّر v2.3", severity: "warn" },
    { id: "AU-5", at: now - 2 * DAY_MS, actor: "sys-1", actorName: "م. طارق العنزي", action: "تعديل صلاحيات دور", target: "دور «المعلّم»", severity: "warn" },
    { id: "AU-6", at: now - 3 * DAY_MS, actor: "par-noura", actorName: "نورة أحمد", action: "موافقة وليّ أمر", target: "سياسة الاستخدام وحماية البيانات", severity: "info" },
    { id: "AU-7", at: now - 4 * DAY_MS, actor: "sys-1", actorName: "م. طارق العنزي", action: "تصدير بيانات", target: "تقرير جودة المحتوى — أغسطس", severity: "info" },
  ];

  return {
    v: STATE_VERSION,
    session: null,
    now0: now,
    questions,
    blueprints,
    reviewItems,
    lessonState: Object.fromEntries(lessons.map((l) => [l.id, { status: "published", explainEnabled: true, notes: "", files: [] }])),
    extraUnits: [],
    extraLessons: [],
    progress,
    mastery,
    history,
    attempts,
    points,
    pointsLog: [],
    streaks,
    avatars: {},
    saved: { "stu-sara": { summaries: ["L-M1", "L-M2"], cards: {} } },
    remedial: { "stu-sara": { "O-M2": { steps: { reexplain: false, practice: false, retest: false }, startedAt: now - 5 * DAY_MS, closedAt: null } }, "stu-layan": { "O-P3": { steps: { reexplain: true, practice: false, retest: false }, startedAt: now - 20 * HOUR_MS, closedAt: null } } },
    asked: [
      { id: "Q1", studentId: "stu-omar", lessonId: "L-M2", q: "ما الفرق بين الميل الصفري والميل غير المعرّف؟", answered: true, at: now - 2 * DAY_MS },
      { id: "Q2", studentId: "stu-fahd", lessonId: "L-M2", q: "لماذا لا يتغيّر الميل على المستقيم؟", answered: true, at: now - 1 * DAY_MS },
      { id: "Q3", studentId: "stu-maha", lessonId: "L-M2", q: "ما الفرق بين الميل الصفري والميل غير المعرّف؟", answered: true, at: now - 20 * HOUR_MS },
    ],
    assignments,
    classes: seedClasses.map((c) => ({ ...c, studentIds: [...c.studentIds] })),
    studentsExtra: [],
    timetable: seedTimetable,
    attendance,
    threads,
    announcements,
    notifications,
    enrollmentRequests: [],
    teacherPayments: [
      { id: "TP-1", teacherId: "tch-khaled", period: "أغسطس 2026", amount: 4200, status: "مدفوع", at: now - 25 * DAY_MS },
      { id: "TP-2", teacherId: "tch-khaled", period: "سبتمبر 2026", amount: 4200, status: "مستحق", at: now - 2 * DAY_MS },
      { id: "TP-3", teacherId: "tch-sarah", period: "سبتمبر 2026", amount: 3600, status: "مستحق", at: now - 2 * DAY_MS },
      { id: "TP-4", teacherId: "tch-noura", period: "سبتمبر 2026", amount: 3600, status: "مستحق", at: now - 2 * DAY_MS },
      { id: "TP-5", teacherId: "tch-huda", period: "أغسطس 2026", amount: 3900, status: "مدفوع", at: now - 25 * DAY_MS },
    ],
    audit,
    directory: seedDirectory,
    consents: { "par-noura": { terms: true, dataUse: true, media: false, at: now - 3 * DAY_MS, channels: { app: true, email: true, sms: false, whatsapp: false }, weekly: true, monthly: true } },
    qualityNotes: [
      { id: "QN-1", schoolId: "sch-2", itemTitle: "اختبار درس «الكسور المتكافئة»", scores: { accuracy: 5, alignment: 4, clarity: 4, language: 5 }, note: "جودة عالية، يُنصح بإضافة سؤال تطبيقي.", at: now - 4 * DAY_MS, by: "sup-1" },
    ],
    schools: seedSchools.map((s) => ({ ...s })),
    tenants: seedTenants,
    rbac: JSON.parse(JSON.stringify(seedRbac)),
    aiSettings: { provider: "claude", model: "claude-sonnet-5", monthlyLimit: 250000, used: 170200, perSchoolCap: 30000, cacheReuse: true, humanReview: true, noTraining: true, rubricGrading: true },
    plans: [
      { id: "free", name: "مجانية", price: "0", audience: "أفراد (B2C)", subs: 3120, features: "محتوى محدود + ٣ اختبارات أسبوعيًّا" },
      { id: "individual", name: "أفراد", price: "من 29 إلى 49 ريال/شهر", audience: "أفراد (B2C)", subs: 2410, features: "كل المواد + التشخيص والخطط العلاجية" },
      { id: "family", name: "عائلية", price: "69 ريال/شهر", audience: "أسر (B2C)", subs: 890, features: "عدّة أبناء من اشتراك واحد" },
      { id: "school", name: "ترخيص مدرسي", price: "لكل مقعد/سنة", audience: "مدارس (B2B)", subs: 8, features: "لوحات الإدارة والمعلّم" },
      { id: "gov", name: "مؤسسي/حكومي", price: "عرض مخصّص", audience: "جهات (B2G)", subs: 1, features: "لوحات الإشراف والتقارير التجميعية" },
    ],
    invoices: [
      { id: "INV-2026-0091", customer: "مدرسة الأفق الأهلية", amount: 148000, status: "مدفوعة", at: now - 21 * DAY_MS },
      { id: "INV-2026-0092", customer: "مدارس الريادة الأهلية", amount: 104500, status: "مدفوعة", at: now - 14 * DAY_MS },
      { id: "INV-2026-0093", customer: "مدرسة الرواد", amount: 52200, status: "معلّقة", at: now - 6 * DAY_MS },
      { id: "INV-2026-0094", customer: "إدارة تعليم الرياض", amount: 320000, status: "بانتظار الاعتماد", at: now - 2 * DAY_MS },
    ],
    gateways: [
      { id: "mada", name: "مدى", status: "متصل", fee: "1.5%" },
      { id: "apple", name: "Apple Pay", status: "متصل", fee: "2.2%" },
      { id: "stc", name: "STC Pay", status: "اختبار", fee: "1.8%" },
    ],
    integrations: [
      { id: "noor", name: "نظام نور", note: "دراسة الجدوى — يعتمد على إتاحة رسمية", status: "استكشافي" },
      { id: "madrasati", name: "منصّة مدرستي", note: "دراسة الجدوى — يعتمد على إتاحة رسمية", status: "استكشافي" },
      { id: "api", name: "واجهات API العامة", note: "قراءة التقارير وتصديرها للجهات", status: "متاح" },
    ],
    apiKeys: [{ id: "key-1", name: "تكامل إدارة تعليم الرياض", prefix: "tq_live_9f3a…", created: now - 30 * DAY_MS, scope: "قراءة التقارير" }],
    reportSchedules: [{ id: "RS-1", title: "تقرير الأداء الأسبوعي", frequency: "أسبوعيًّا", channel: "التطبيق + البريد" }],
  };
}
