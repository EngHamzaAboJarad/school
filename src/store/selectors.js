import { lessons, units, subjects, objectives } from "../data/curriculum";
import { students as seedStudents, users, WEEKDAYS, PERIODS } from "../data/people";
import { dateKey } from "../data/seed";
import { DAY_MS } from "../lib/format";
import { GAP_THRESHOLD, CLOSE_THRESHOLD } from "../lib/grading";

// ── المنهج (مع ما يُضاف من الإدارة/المعلّم) ──
export const allUnits = (s) => [...units, ...s.extraUnits];
export const allLessons = (s) => [...lessons, ...s.extraLessons];
export const allObjectives = (s) => [...objectives, ...(s.extraObjectives || [])];
export const allStudents = (s) =>
  [...seedStudents, ...s.studentsExtra].map((x) => (x.grade ? x : { ...x, grade: s.classes.find((c) => c.id === x.classId)?.grade }));
export const lessonOf = (s, id) => allLessons(s).find((l) => l.id === id);
export const unitOf = (s, id) => allUnits(s).find((u) => u.id === id);
export const objectiveOf = (s, id) => allObjectives(s).find((o) => o.id === id);
export const subjectOf = (id) => subjects.find((x) => x.id === id);
export const studentOf = (s, id) => allStudents(s).find((x) => x.id === id);
export const lessonsInUnit = (s, unitId) => allLessons(s).filter((l) => l.unitId === unitId).sort((a, b) => a.no - b.no);
export const unitsInSubject = (s, subjectId) => allUnits(s).filter((u) => u.subjectId === subjectId).sort((a, b) => a.no - b.no);
export const subjectOfLesson = (s, lessonId) => subjectOf(unitOf(s, lessonOf(s, lessonId)?.unitId)?.subjectId);

export const userName = (s, id) => {
  const u = s.directory.find((d) => d.id === id);
  return u?.name || studentOf(s, id)?.name || (id === "par-noura" ? "نورة أحمد" : id === "tch-khaled" ? "أ. خالد العتيبي" : id === "tch-noura" ? "أ. نورة الحربي" : id === "tch-sarah" ? "أ. سارة منصور" : id === "tch-huda" ? "أ. هدى القحطاني" : id === "adm-school" ? "إدارة المدرسة" : id === "sup-1" ? "د. منى الزهراني" : id === "sys-1" ? "م. طارق العنزي" : id);
};

// ── حالة الاعتماد (الإنسان في الحلقة) ──
export const reviewOf = (s, kind, key) =>
  s.reviewItems.find((r) => r.kind === kind && (kind === "exam" ? r.unitId === key : r.lessonId === key));
export const isApproved = (s, kind, key) => reviewOf(s, kind, key)?.status === "approved";
export const lessonPublished = (s, id) => (s.lessonState[id]?.status ?? "published") === "published";
export const lessonQuizQuestions = (s, lessonId) =>
  s.questions.filter((q) => q.lessonId === lessonId && q.type !== "essay" && q.status === "approved");

// ── حالة الدرس للطالب ──
export function lessonStateFor(s, sid, lesson) {
  const done = !!s.progress[sid]?.[lesson.id]?.done;
  const published = lessonPublished(s, lesson.id);
  const quizReady = isApproved(s, "quiz", lesson.id) && lessonQuizQuestions(s, lesson.id).length > 0;
  return { done, published, quizReady, score: s.progress[sid]?.[lesson.id]?.score ?? null };
}

export function unitProgress(s, sid, unit) {
  const ls = lessonsInUnit(s, unit.id).filter((l) => lessonPublished(s, l.id));
  const done = ls.filter((l) => s.progress[sid]?.[l.id]?.done).length;
  const currentId = ls.find((l) => !s.progress[sid]?.[l.id]?.done)?.id || null;
  const bp = s.blueprints[unit.id];
  const examApproved = isApproved(s, "exam", unit.id);
  const attempts = s.attempts.filter((a) => a.studentId === sid && a.kind === "unit" && a.refId === unit.id);
  const complete = ls.length > 0 && done === ls.length;
  let lock = null;
  if (!bp) lock = "لم يُعدّ المعلّم امتحانًا لهذه الوحدة بعد";
  else if (!complete) lock = `أكمل دروس الوحدة أولًا (تبقّى ${ls.length - done})`;
  else if (!examApproved) lock = "امتحان الوحدة بانتظار اعتماد المعلّم";
  else if (attempts.length >= bp.attempts) lock = "استُنفدت محاولات الامتحان";
  return { lessons: ls, done, total: ls.length, currentId, complete, bp, examApproved, attempts, lock, pct: ls.length ? Math.round((done / ls.length) * 100) : 0 };
}

// ── لقطة أداء الطالب: الإتقان والفجوات (E3) ──
export function snapshot(s, sid) {
  const m = s.mastery[sid] || {};
  const objs = allObjectives(s);
  const entries = objs.filter((o) => m[o.id] !== undefined).map((o) => ({ ...o, mastery: m[o.id] }));
  const avg = entries.length ? Math.round(entries.reduce((a, e) => a + e.mastery, 0) / entries.length) : 0;
  const bySubject = {};
  entries.forEach((e) => (bySubject[e.subjectId] ||= []).push(e.mastery));
  const subjectAvg = Object.fromEntries(Object.entries(bySubject).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length)]));
  const plans = s.remedial[sid] || {};
  const gaps = entries
    .filter((e) => e.mastery < GAP_THRESHOLD || (plans[e.id] && !plans[e.id].closedAt))
    .filter((e) => !(plans[e.id]?.closedAt))
    .map((e) => ({ ...e, plan: plans[e.id] || null, priority: 100 - e.mastery }))
    .sort((a, b) => b.priority - a.priority);
  const mastered = entries.filter((e) => e.mastery >= CLOSE_THRESHOLD).length;
  const history = [...(s.history[sid] || [])];
  if (entries.length) history[history.length ? history.length - 1 : 0] = avg;
  return { entries, avg, subjectAvg, gaps, mastered, history };
}

export const remedialProgress = (plan) => (plan ? Object.values(plan.steps).filter(Boolean).length : 0);

// ── الخطوة التالية (F3.3) ──
export function recommendation(s, sid) {
  const snap = snapshot(s, sid);
  const gap = snap.gaps[0];
  if (gap)
    return { type: "remedial", objective: gap, title: `راجع «${gap.title}»`, why: `إتقانك الحالي ${gap.mastery}% — مراجعة قصيرة الآن سترفعه قبل الانتقال.`, minutes: 8 };
  const myUnits = allUnits(s).filter((u) => {
    const sub = subjectOf(u.subjectId);
    const stu = studentOf(s, sid);
    return sub && stu && sub.grade === (stu.grade || s.classes.find((c) => c.id === stu.classId)?.grade);
  });
  for (const u of myUnits) {
    const up = unitProgress(s, sid, u);
    if (up.currentId) {
      const l = lessonOf(s, up.currentId);
      return { type: "lesson", lesson: l, unit: u, title: `الدرس التالي: ${l.title}`, why: "أنت في منتصف هذه الوحدة، أكمل الدرس ثم اختبره.", minutes: l.duration };
    }
  }
  for (const u of myUnits) {
    const up = unitProgress(s, sid, u);
    if (!up.lock) return { type: "exam", unit: u, title: `امتحان وحدة «${u.title}»`, why: "أنهيت جميع الدروس وامتحان الوحدة متاح الآن.", minutes: up.bp.durationMin };
  }
  return { type: "done", title: "أنجزت كل المتاح", why: "ستظهر لك خطوات جديدة عند نشر دروس جديدة.", minutes: 0 };
}

// ── الجدول الأسبوعي والمهام (F4.1) ──
export function weekStart(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime() - d.getDay() * DAY_MS; // الأحد
}

export function weekPlan(s, sid, now = Date.now()) {
  const stu = studentOf(s, sid);
  const table = s.timetable[stu?.classId] || s.timetable["c-3a"];
  const start = weekStart(now);
  return WEEKDAYS.map((label, i) => {
    const ts = start + i * DAY_MS;
    const dueToday = s.assignments.filter((a) => dateKey(a.due) === dateKey(ts) && (!stu || a.classId === stu.classId));
    return {
      label, ts, today: dateKey(ts) === dateKey(now),
      classes: (table?.[i] || []).map(([subject, teacherId], p) => ({ time: PERIODS[p], subject, teacherId })),
      due: dueToday,
    };
  });
}

export const assignmentsForStudent = (s, sid) => {
  const stu = studentOf(s, sid);
  return s.assignments.filter((a) => a.classId === stu?.classId).sort((a, b) => a.due - b.due);
};

export function assignmentStatus(a, sid, now = Date.now()) {
  const sub = a.submissions[sid];
  if (sub) return sub.status;
  return a.due < now ? "missing" : "pending";
}

// ── الفصول والمعلّم (E6) ──
export function classStats(s, cls) {
  const rows = cls.studentIds.map((sid) => {
    const snap = snapshot(s, sid);
    const lessonsDone = Object.values(s.progress[sid] || {}).filter((p) => p.done).length;
    return { id: sid, name: studentOf(s, sid)?.name || sid, avg: snap.avg, assessed: snap.entries.length, gaps: snap.gaps.length, lessonsDone, points: s.points[sid] || 0, streak: s.streaks[sid] || 0 };
  });
  const rated = rows.filter((r) => r.assessed);
  const avg = rated.length ? Math.round(rated.reduce((a, r) => a + r.avg, 0) / rated.length) : 0;
  const struggling = rows.filter((r) => r.assessed && r.avg < GAP_THRESHOLD).sort((a, b) => a.avg - b.avg);
  return { rows, avg, struggling };
}

export function commonGaps(s, cls, objectiveIds) {
  return objectiveIds
    .map((oid) => {
      const vals = cls.studentIds.map((sid) => s.mastery[sid]?.[oid]).filter((v) => v !== undefined);
      const weak = vals.filter((v) => v < GAP_THRESHOLD).length;
      return { objective: objectiveOf(s, oid), assessed: vals.length, weak, avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null };
    })
    .filter((g) => g.assessed)
    .sort((a, b) => b.weak - a.weak);
}

export const teacherSubjects = (s, teacherId) => {
  const set = new Set();
  s.classes.filter((c) => c.teacherId === teacherId).forEach((c) => c.subjects.forEach((x) => set.add(x)));
  return [...set];
};

export function pendingReviews(s, teacherId) {
  const subs = teacherSubjects(s, teacherId);
  return s.reviewItems
    .filter((r) => {
      const unit = unitOf(s, r.unitId);
      return subs.includes(unit?.subjectId);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function essayQueue(s, teacherId) {
  const subs = teacherSubjects(s, teacherId);
  const out = [];
  s.attempts.forEach((a) => {
    Object.entries(a.essays || {}).forEach(([qid, e]) => {
      const q = s.questions.find((x) => x.id === qid);
      const unit = unitOf(s, q ? lessonOf(s, q.lessonId)?.unitId : null);
      if (q && subs.includes(unit?.subjectId)) out.push({ attempt: a, qid, question: q, essay: e, student: studentOf(s, a.studentId) });
    });
  });
  return out.sort((x, y) => (x.essay.final ? 1 : 0) - (y.essay.final ? 1 : 0) || y.attempt.at - x.attempt.at);
}

// ── الحضور (F7.3) ──
export function attendanceRate(s, sid, limit = 30) {
  const days = Object.keys(s.attendance).sort().slice(-limit);
  const marks = days.map((d) => s.attendance[d][sid]).filter(Boolean);
  if (!marks.length) return { rate: 100, absent: 0, late: 0, days: 0 };
  const ok = marks.filter((m) => m === "present" || m === "excused" || m === "late").length;
  return { rate: Math.round((ok / marks.length) * 1000) / 10, absent: marks.filter((m) => m === "absent").length, late: marks.filter((m) => m === "late").length, days: marks.length };
}

export function classAttendanceOn(s, cls, key) {
  const day = s.attendance[key] || {};
  const counts = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0 };
  cls.studentIds.forEach((sid) => (day[sid] ? counts[day[sid]]++ : counts.unmarked++));
  return counts;
}

// ── التلعيب (F3.5) ──
export function badgesOf(s, sid) {
  const att = s.attempts.filter((a) => a.studentId === sid);
  const snap = snapshot(s, sid);
  const plans = Object.values(s.remedial[sid] || {});
  return [
    { id: "first", title: "الخطوة الأولى", desc: "أكملت أول اختبار", earned: att.length >= 1 },
    { id: "ace", title: "متألّق", desc: "حصلت على 90% فأكثر في اختبار", earned: att.some((a) => a.score >= 90) },
    { id: "streak", title: "مواظب", desc: "سلسلة تعلّم ٧ أيام", earned: (s.streaks[sid] || 0) >= 7 },
    { id: "gap", title: "مُغلق الفجوات", desc: "أغلقت فجوة بخطة علاجية", earned: plans.some((p) => p.closedAt) },
    { id: "unit", title: "متمكّن الوحدة", desc: "اجتزت امتحان وحدة", earned: att.some((a) => a.kind === "unit" && a.score >= 70) },
    { id: "master", title: "خبير", desc: "أتقنت ٥ أهداف فأكثر", earned: snap.mastered >= 5 },
  ];
}

export function leaderboard(s, classId) {
  const cls = s.classes.find((c) => c.id === classId);
  return (cls?.studentIds || [])
    .map((sid) => ({ id: sid, name: studentOf(s, sid)?.name || sid, points: s.points[sid] || 0 }))
    .sort((a, b) => b.points - a.points);
}

// ── الإشعارات والرسائل ──
export const myNotifications = (s, user) =>
  s.notifications.filter((n) => n.to === user.id || n.to === `role:${user.role}`).sort((a, b) => b.at - a.at);
export const myThreads = (s, userId) =>
  s.threads.filter((t) => t.participants.includes(userId)).sort((a, b) => b.msgs[b.msgs.length - 1].at - a.msgs[a.msgs.length - 1].at);
export const unreadThreads = (s, userId) =>
  myThreads(s, userId).filter((t) => {
    const last = t.msgs[t.msgs.length - 1];
    return last.from !== userId && (t.readBy?.[userId] || 0) < last.at;
  }).length;
export const myAnnouncements = (s, user) =>
  s.announcements.filter((a) => a.audience === "all" || a.audience === `${user.role}s` || (a.audience === "parents" && user.role === "parent") || (a.audience === "teachers" && user.role === "teacher") || (a.audience === "students" && user.role === "student") || user.role === "school");

// ── الأبناء (F5.1) ──
export function childrenOf(s, parentId) {
  const ids = users.find((u) => u.id === parentId)?.children || [];
  return ids.map((id) => {
    const stu = studentOf(s, id);
    const cls = s.classes.find((c) => c.id === stu.classId);
    return { ...stu, grade: stu.grade || cls?.grade, className: cls?.name, teacherId: cls?.teacherId };
  });
}

// ── تنبيهات ذكية محسوبة (F9.3) ──
export function smartAlerts(s, sid, now = Date.now()) {
  const alerts = [];
  const snap = snapshot(s, sid);
  snap.gaps.slice(0, 3).forEach((g) =>
    alerts.push({ id: `gap-${g.id}`, tone: "warn", title: `«${g.title}» يحتاج مراجعة`, body: `الإتقان ${g.mastery}% — أقل من الحدّ المطلوب (${GAP_THRESHOLD}%).` }),
  );
  assignmentsForStudent(s, sid).forEach((a) => {
    const st = assignmentStatus(a, sid, now);
    const days = Math.ceil((a.due - now) / DAY_MS);
    if (st === "pending" && days <= 2 && days >= 0) alerts.push({ id: `due-${a.id}`, tone: "info", title: `موعد تسليم قريب: ${a.title}`, body: days === 0 ? "ينتهي اليوم." : `خلال ${days === 1 ? "يوم" : "يومين"}.` });
    if (st === "missing") alerts.push({ id: `miss-${a.id}`, tone: "danger", title: `واجب غير مُسلَّم: ${a.title}`, body: "تجاوز موعد التسليم." });
  });
  const att = attendanceRate(s, sid, 14);
  if (att.absent >= 2) alerts.push({ id: "att", tone: "warn", title: "غياب متكرّر", body: `${att.absent} أيام غياب في آخر أسبوعين.` });
  return alerts;
}
