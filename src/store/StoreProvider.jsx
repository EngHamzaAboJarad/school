import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { createSeed, STATE_VERSION } from "../data/seed";
import { updateMastery, generateFromLesson, GAP_THRESHOLD, CLOSE_THRESHOLD } from "../lib/grading";
import { userName, studentOf, lessonOf, unitOf, objectiveOf, lessonsInUnit } from "./selectors";
import { users } from "../data/people";

const KEY = `taqat-state-v${STATE_VERSION}`;
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.v === STATE_VERSION) return parsed;
    }
  } catch {
    /* تجاهل: نبدأ من البيانات الأولية */
  }
  return createSeed();
}

const note = (s, to, title, body, link, tone = "info") => [
  { id: uid("NT"), to, title, body, at: Date.now(), link, tone, read: false },
  ...s.notifications,
];
const audit = (s, actor, action, target, severity = "info") => [
  { id: uid("AU"), at: Date.now(), actor, actorName: userName(s, actor), action, target, severity },
  ...s.audit,
];

function reducer(s, a) {
  const now = Date.now();
  switch (a.type) {
    case "login":
      return { ...s, session: { userId: a.userId, role: a.role } };
    case "logout":
      return { ...s, session: null };
    case "reset":
      return { ...createSeed(), session: s.session };

    // ───────── الطالب: التقييم والتقدّم ─────────
    case "submitAttempt": {
      const at = a.attempt;
      const sid = at.studentId;
      const stu = studentOf(s, sid);
      const mastery = { ...s.mastery, [sid]: { ...(s.mastery[sid] || {}) } };
      Object.entries(at.byObjective).forEach(([o, { got, total }]) => {
        mastery[sid][o] = updateMastery(mastery[sid][o], got, total);
      });
      const progress = at.kind === "lesson" ? { ...s.progress, [sid]: { ...(s.progress[sid] || {}), [at.refId]: { done: true, score: at.score, at: now } } } : s.progress;
      let notifications = s.notifications;
      const remedial = { ...s.remedial, [sid]: { ...(s.remedial[sid] || {}) } };
      Object.keys(at.byObjective).forEach((o) => {
        const m = mastery[sid][o];
        const plan = remedial[sid][o];
        const title = objectiveOf(s, o)?.title || o;
        if (at.kind === "retest" && at.refId === o && plan && !plan.closedAt) remedial[sid][o] = { ...plan, steps: { ...plan.steps, retest: true } };
        const cur = remedial[sid][o];
        if (m < GAP_THRESHOLD && (!cur || cur.closedAt)) {
          remedial[sid][o] = { steps: { reexplain: false, practice: false, retest: false }, startedAt: now, closedAt: null };
          notifications = note({ ...s, notifications }, sid, `خطة علاجية جديدة: ${title}`, "أُنشئت خطة قصيرة لرفع إتقانك.", "progress", "warn");
          if (stu?.parentId) notifications = note({ ...s, notifications }, stu.parentId, `تنبيه ذكي: «${title}» يحتاج مراجعة`, `إتقان ${stu.name} ${m}% — أقل من الحدّ المطلوب (${GAP_THRESHOLD}%).`, "child", "warn");
        } else if (m >= CLOSE_THRESHOLD && cur && !cur.closedAt) {
          remedial[sid][o] = { ...cur, closedAt: now };
          notifications = note({ ...s, notifications }, sid, `أحسنت! أُغلقت الفجوة: ${title}`, `وصل إتقانك إلى ${m}%.`, "progress", "success");
          if (stu?.parentId) notifications = note({ ...s, notifications }, stu.parentId, `تحسّن: أُغلقت فجوة «${title}»`, `${stu.name} وصلت إلى ${m}%.`, "child", "success");
        }
      });
      const label = at.kind === "lesson" ? lessonOf(s, at.refId)?.title : at.kind === "unit" ? unitOf(s, at.refId)?.title : objectiveOf(s, at.refId)?.title;
      if (stu?.parentId) notifications = note({ ...s, notifications }, stu.parentId, `نتيجة ${stu.name}: ${at.score}% في «${label}»`, at.kind === "unit" ? "امتحان وحدة" : at.kind === "retest" ? "إعادة اختبار علاجي" : "اختبار درس", "child", at.score >= 70 ? "success" : "warn");
      if (Object.keys(at.essays || {}).length) {
        const teacher = s.classes.find((c) => c.id === stu?.classId)?.teacherId;
        if (teacher) notifications = note({ ...s, notifications }, teacher, `إجابة مقالية بانتظار التصحيح — ${stu.name}`, `امتحان «${label}»`, "grading", "warn");
      }
      const earned = Math.round(20 + at.score / 2);
      const reason = `${at.kind === "unit" ? "امتحان وحدة" : at.kind === "retest" ? "إعادة اختبار علاجي" : "اختبار درس"} «${label}»`;
      return {
        ...s, attempts: [...s.attempts, at], mastery, progress, remedial, notifications,
        points: { ...s.points, [sid]: (s.points[sid] || 0) + earned },
        pointsLog: [{ id: uid("PL"), studentId: sid, amount: earned, reason, at: now }, ...s.pointsLog],
        streaks: { ...s.streaks, [sid]: Math.max(s.streaks[sid] || 0, 1) },
      };
    }
    case "toggleSummary": {
      const cur = s.saved[a.sid] || { summaries: [], cards: {} };
      const has = cur.summaries.includes(a.lessonId);
      return { ...s, saved: { ...s.saved, [a.sid]: { ...cur, summaries: has ? cur.summaries.filter((x) => x !== a.lessonId) : [...cur.summaries, a.lessonId] } } };
    }
    case "rateCard": {
      const cur = s.saved[a.sid] || { summaries: [], cards: {} };
      return { ...s, saved: { ...s.saved, [a.sid]: { ...cur, cards: { ...cur.cards, [a.key]: a.level } } } };
    }
    case "askLog":
      return { ...s, asked: [{ id: uid("Q"), studentId: a.studentId, lessonId: a.lessonId, q: a.q, answered: a.answered, at: now }, ...s.asked] };
    case "escalate": {
      const stu = studentOf(s, a.studentId);
      const teacher = s.classes.find((c) => c.id === stu?.classId)?.teacherId;
      if (!teacher) return s;
      const l = lessonOf(s, a.lessonId);
      return {
        ...s,
        asked: [{ id: uid("Q"), studentId: a.studentId, lessonId: a.lessonId, q: a.q, answered: false, escalated: true, at: now }, ...s.asked],
        threads: [{ id: uid("T"), subject: `سؤال عن درس «${l?.title}»`, participants: [a.studentId, teacher], msgs: [{ from: a.studentId, text: a.q, at: now }] }, ...s.threads],
        notifications: note(s, teacher, `سؤال محوّل من ${stu.name}`, a.q, "messages", "info"),
      };
    }
    case "remedialStep": {
      const cur = s.remedial[a.sid]?.[a.objectiveId];
      if (!cur) return s;
      return { ...s, remedial: { ...s.remedial, [a.sid]: { ...s.remedial[a.sid], [a.objectiveId]: { ...cur, steps: { ...cur.steps, [a.step]: true } } } } };
    }
    case "submitAssignment": {
      const as = s.assignments.find((x) => x.id === a.assignmentId);
      if (!as) return s;
      const status = now > as.due ? "late" : "submitted";
      return {
        ...s,
        assignments: s.assignments.map((x) => (x.id === as.id ? { ...x, submissions: { ...x.submissions, [a.studentId]: { status, at: now, text: a.text, grade: null, feedback: "" } } } : x)),
        notifications: note(s, as.teacherId, `تسليم جديد: ${as.title}`, studentOf(s, a.studentId)?.name, "assignments", "info"),
      };
    }

    // ───────── المعلّم: اعتماد المحتوى والتصحيح ─────────
    case "decideReview": {
      const item = s.reviewItems.find((r) => r.id === a.itemId);
      if (!item) return s;
      const status = a.decision;
      let questions = s.questions;
      if (item.questionIds) {
        questions = s.questions.map((q) => (item.questionIds.includes(q.id) && q.status === "pending" ? { ...q, status: status === "approved" ? "approved" : "rejected" } : q));
      }
      let lessonState = s.lessonState;
      if (item.kind === "explain" && status === "approved" && item.lessonId && lessonState[item.lessonId]?.status === "review") {
        lessonState = { ...lessonState, [item.lessonId]: { ...lessonState[item.lessonId], status: "published" } };
      }
      const approved = status === "approved";
      return {
        ...s, questions, lessonState,
        reviewItems: s.reviewItems.map((r) => (r.id === item.id ? { ...r, status, note: a.note || "", decidedAt: now, decidedBy: a.actor } : r)),
        notifications: approved && item.kind !== "explain" ? note(s, "role:student", `اعتُمد: ${item.title}`, "أصبح متاحًا لك الآن.", "learn", "success") : s.notifications,
        audit: audit(s, a.actor, approved ? "اعتماد محتوى" : "رفض محتوى", item.title, approved ? "info" : "warn"),
      };
    }
    case "updateQuestion":
      return {
        ...s,
        questions: s.questions.map((q) => (q.id === a.qid ? { ...q, ...a.patch, edited: true, editedBy: a.actor } : q)),
        audit: audit(s, a.actor, "تعديل سؤال مولّد", `${a.qid}`, "info"),
      };
    case "setQuestionStatus":
      return { ...s, questions: s.questions.map((q) => (q.id === a.qid ? { ...q, status: a.status } : q)), audit: audit(s, a.actor, a.status === "approved" ? "اعتماد سؤال" : "رفض سؤال", a.qid) };
    case "generateBatch": {
      const l = lessonOf(s, a.lessonId);
      if (!l) return s;
      const startId = `Q-G${Date.now().toString(36).slice(-4)}`;
      const qs = generateFromLesson({ lesson: l, unitLessons: lessonsInUnit(s, l.unitId), count: a.count, difficulty: a.difficulty, startId });
      if (!qs.length) return s;
      return {
        ...s,
        questions: [...s.questions, ...qs],
        reviewItems: [{ id: uid("R"), kind: "batch", lessonId: l.id, unitId: l.unitId, title: `${qs.length} أسئلة جديدة لدرس «${l.title}» (${a.difficulty})`, questionIds: qs.map((q) => q.id), status: "pending", createdAt: now, decidedAt: null, note: "", decidedBy: null }, ...s.reviewItems],
        audit: audit(s, a.actor, "توليد أسئلة", `${qs.length} أسئلة — ${l.title}`),
      };
    }
    case "setBlueprint":
      return { ...s, blueprints: { ...s.blueprints, [a.unitId]: { ...s.blueprints[a.unitId], ...a.patch } }, audit: audit(s, a.actor, "تعديل مخطّط امتحان", unitOf(s, a.unitId)?.title || a.unitId) };
    case "gradeEssay": {
      const attempts = s.attempts.map((x) => {
        if (x.id !== a.attemptId) return x;
        const e = x.essays[a.qid];
        const changed = a.score !== e.ai.score;
        return { ...x, essays: { ...x.essays, [a.qid]: { ...e, final: { score: a.score, note: a.note, by: a.actor, at: now, changed } } } };
      });
      const at = s.attempts.find((x) => x.id === a.attemptId);
      const e = at.essays[a.qid];
      const stu = studentOf(s, at.studentId);
      let notifications = note(s, at.studentId, "صُحّحت إجابتك المقالية", `درجتك ${a.score} من ${e.ai.max}`, "progress", "success");
      if (stu?.parentId) notifications = note({ ...s, notifications }, stu.parentId, `صُحّح مقالي ${stu.name}`, `${a.score} من ${e.ai.max}`, "child", "info");
      return { ...s, attempts, notifications, audit: audit(s, a.actor, a.score !== e.ai.score ? "تعديل درجة مقالي" : "اعتماد تصحيح مقالي", `${stu?.name} — ${a.qid}`, a.score !== e.ai.score ? "warn" : "info") };
    }
    case "saveLessonNotes":
      return { ...s, lessonState: { ...s.lessonState, [a.lessonId]: { ...s.lessonState[a.lessonId], ...a.patch } } };
    case "requestPublish": {
      const l = lessonOf(s, a.lessonId);
      return {
        ...s,
        lessonState: { ...s.lessonState, [a.lessonId]: { ...s.lessonState[a.lessonId], status: "review" } },
        reviewItems: [{ id: uid("R"), kind: "explain", lessonId: l.id, unitId: l.unitId, title: `طلب نشر درس «${l.title}»`, status: "pending", createdAt: now, decidedAt: null, note: "", decidedBy: null }, ...s.reviewItems],
        audit: audit(s, a.actor, "طلب نشر محتوى", l.title),
      };
    }
    case "setLessonStatus":
      return { ...s, lessonState: { ...s.lessonState, [a.lessonId]: { ...s.lessonState[a.lessonId], status: a.status } }, audit: audit(s, a.actor, a.status === "archived" ? "أرشفة درس" : "تغيير حالة درس", lessonOf(s, a.lessonId)?.title || a.lessonId) };
    case "toggleExplain": {
      const cur = s.lessonState[a.lessonId]?.explainEnabled !== false;
      return { ...s, lessonState: { ...s.lessonState, [a.lessonId]: { ...s.lessonState[a.lessonId], explainEnabled: !cur } }, audit: audit(s, a.actor, cur ? "تعطيل الشرح الذكي" : "تفعيل الشرح الذكي", lessonOf(s, a.lessonId)?.title || a.lessonId, "warn") };
    }

    // ───────── الفصول والواجبات والحضور ─────────
    case "createAssignment":
      return { ...s, assignments: [{ ...a.assignment, id: uid("A"), createdAt: now, submissions: {} }, ...s.assignments], notifications: note(s, "role:student", `واجب جديد: ${a.assignment.title}`, "افتح لوحتك لمعرفة التفاصيل.", "home", "info"), audit: audit(s, a.assignment.teacherId, "إسناد واجب", a.assignment.title) };
    case "gradeAssignment":
      return { ...s, assignments: s.assignments.map((x) => (x.id === a.assignmentId ? { ...x, submissions: { ...x.submissions, [a.studentId]: { ...x.submissions[a.studentId], status: "graded", grade: a.grade, feedback: a.feedback } } } : x)) };
    case "createClass":
      return { ...s, classes: [...s.classes, { ...a.cls, id: uid("c"), studentIds: [] }], audit: audit(s, a.actor, "إنشاء فصل", a.cls.name) };
    case "addStudent": {
      const id = uid("stu");
      return {
        ...s,
        studentsExtra: [...s.studentsExtra, { id, name: a.name, classId: a.classId }],
        classes: s.classes.map((c) => (c.id === a.classId ? { ...c, studentIds: [...c.studentIds, id] } : c)),
        points: { ...s.points, [id]: 0 },
        directory: [...s.directory, { id, name: a.name, role: "student", email: `${id}@afaq.edu.sa`, status: "نشط", joined: new Date().toISOString().slice(0, 10) }],
        audit: audit(s, a.actor, "إضافة طالب لفصل", `${a.name} — ${s.classes.find((c) => c.id === a.classId)?.name}`),
      };
    }
    case "markAttendance": {
      const day = { ...(s.attendance[a.date] || {}), ...a.marks };
      let notifications = s.notifications;
      Object.entries(a.marks).forEach(([sid, m]) => {
        const stu = studentOf(s, sid);
        const prev = s.attendance[a.date]?.[sid];
        if (m === "absent" && prev !== "absent" && stu?.parentId) notifications = note({ ...s, notifications }, stu.parentId, `غياب: ${stu.name}`, "سُجّل غياب اليوم. يمكنك التواصل مع المدرسة لتبرير الغياب.", "attendance", "danger");
      });
      return { ...s, attendance: { ...s.attendance, [a.date]: day }, notifications, audit: audit(s, a.actor, "تسجيل حضور", `${Object.keys(a.marks).length} طلاب`) };
    }

    // ───────── التواصل ─────────
    case "sendMessage": {
      const t = s.threads.find((x) => x.id === a.threadId);
      if (!t) return s;
      let notifications = s.notifications;
      t.participants.filter((p) => p !== a.from).forEach((p) => (notifications = note({ ...s, notifications }, p, `رسالة جديدة من ${userName(s, a.from)}`, a.text.slice(0, 80), "messages", "info")));
      return { ...s, notifications, threads: s.threads.map((x) => (x.id === t.id ? { ...x, msgs: [...x.msgs, { from: a.from, text: a.text, at: now }], readBy: { ...(x.readBy || {}), [a.from]: now } } : x)) };
    }
    case "newThread": {
      const id = uid("T");
      return { ...s, threads: [{ id, subject: a.subject, channel: a.channel || "app", participants: [a.from, a.to], msgs: [{ from: a.from, text: a.text, at: now }], readBy: { [a.from]: now } }, ...s.threads], notifications: note(s, a.to, `رسالة جديدة من ${userName(s, a.from)}`, a.subject, "messages") };
    }
    case "readThread":
      return { ...s, threads: s.threads.map((t) => (t.id === a.threadId ? { ...t, readBy: { ...(t.readBy || {}), [a.userId]: now } } : t)) };
    case "announce": {
      const roles = a.audience === "all" ? ["student", "parent", "teacher"] : [a.audience.replace(/s$/, "")];
      let notifications = s.notifications;
      roles.forEach((r) => (notifications = note({ ...s, notifications }, `role:${r}`, `إعلان: ${a.title}`, a.body.slice(0, 80), "messages", "info")));
      return { ...s, notifications, announcements: [{ id: uid("N"), from: a.from, title: a.title, body: a.body, audience: a.audience, at: now, readBy: [] }, ...s.announcements], audit: audit(s, a.from, "نشر إعلان", a.title) };
    }
    case "readAnnouncement":
      return { ...s, announcements: s.announcements.map((n) => (n.id === a.id && !n.readBy.includes(a.userId) ? { ...n, readBy: [...n.readBy, a.userId] } : n)) };
    case "readNotif":
      return { ...s, notifications: s.notifications.map((n) => (n.id === a.id ? { ...n, read: true } : n)) };
    case "readAllNotifs":
      return { ...s, notifications: s.notifications.map((n) => (n.to === a.user.id || n.to === `role:${a.user.role}` ? { ...n, read: true } : n)) };

    // ───────── التسجيل الخاص لدى المعلّم (طالب ← وليّ أمر ← معلّم) ─────────
    case "requestEnrollment": {
      const stu = studentOf(s, a.studentId);
      const req = { id: uid("ENR"), studentId: a.studentId, teacherId: a.teacherId, parentId: stu?.parentId || null, subject: a.subject, price: a.price, status: "pending_parent", createdAt: now };
      const notifications = stu?.parentId
        ? note(s, stu.parentId, "طلب تسجيل جديد بانتظار موافقتك", `${stu.name} يطلب التسجيل في «${a.subject}»`, "child", "info")
        : s.notifications;
      return { ...s, enrollmentRequests: [req, ...s.enrollmentRequests], notifications };
    }
    case "payEnrollment": {
      const req = s.enrollmentRequests.find((r) => r.id === a.id);
      if (!req || req.status !== "pending_parent") return s;
      const notifications = note(s, req.teacherId, "طلب تسجيل جديد بانتظار موافقتك", `${userName(s, req.studentId)} — ${req.subject}`, "enrollments", "info");
      return {
        ...s,
        enrollmentRequests: s.enrollmentRequests.map((r) => (r.id === a.id ? { ...r, status: "pending_teacher", paidAt: now } : r)),
        notifications,
        audit: audit(s, a.actor, "دفع رسوم تسجيل", `${req.subject} — ${userName(s, req.studentId)}`),
      };
    }
    case "decideEnrollment": {
      const req = s.enrollmentRequests.find((r) => r.id === a.id);
      if (!req || req.status !== "pending_teacher") return s;
      const status = a.approve ? "approved" : "rejected";
      let notifications = note(s, req.studentId, a.approve ? "تم تفعيل تسجيلك لدى المعلّم" : "اعتذر المعلّم عن طلب التسجيل", req.subject, "teachers", a.approve ? "success" : "warn");
      if (req.parentId) notifications = note({ ...s, notifications }, req.parentId, a.approve ? "تم تفعيل تسجيل ابنك" : "اعتذر المعلّم عن طلب التسجيل", `${userName(s, req.studentId)} — ${req.subject}`, "child", a.approve ? "success" : "warn");
      return {
        ...s,
        enrollmentRequests: s.enrollmentRequests.map((r) => (r.id === a.id ? { ...r, status, decidedAt: now } : r)),
        notifications,
        audit: audit(s, a.actor, a.approve ? "قبول طلب تسجيل" : "رفض طلب تسجيل", `${req.subject} — ${userName(s, req.studentId)}`),
      };
    }
    case "redeemReward": {
      const bal = s.points[a.studentId] || 0;
      if (bal < a.cost) return s;
      return {
        ...s,
        points: { ...s.points, [a.studentId]: bal - a.cost },
        pointsLog: [{ id: uid("PL"), studentId: a.studentId, amount: -a.cost, reason: `استبدال: ${a.title}`, at: now }, ...s.pointsLog],
      };
    }
    case "setAvatar":
      return { ...s, avatars: { ...s.avatars, [a.userId]: a.dataUrl } };
    case "payTeacherFee": {
      const pay = s.teacherPayments.find((p) => p.id === a.id);
      if (!pay) return s;
      return {
        ...s,
        teacherPayments: s.teacherPayments.map((p) => (p.id === a.id ? { ...p, status: "مدفوع", paidAt: now } : p)),
        audit: audit(s, a.actor, "دفع رسوم معلّم", `${userName(s, pay.teacherId)} — ${pay.period}`),
      };
    }

    // ───────── الإدارة والنظام ─────────
    case "setConsent":
      return { ...s, consents: { ...s.consents, [a.parentId]: { ...(s.consents[a.parentId] || {}), ...a.patch, at: now } }, audit: audit(s, a.parentId, a.action || "تحديث موافقات وتفضيلات", a.target || "موافقات وليّ الأمر") };
    case "addUser":
      return { ...s, directory: [{ id: uid("usr"), joined: new Date().toISOString().slice(0, 10), ...a.user }, ...s.directory], audit: audit(s, a.actor, "إضافة مستخدم", `${a.user.name} — ${a.user.role}`) };
    case "updateUser":
      return { ...s, directory: s.directory.map((d) => (d.id === a.id ? { ...d, ...a.patch } : d)), notifications: s.notifications, audit: audit(s, a.actor, a.action, a.target, "warn") };
    case "addLead":
      return { ...s, leads: [{ id: uid("LD"), at: now, status: "جديد", ...a.lead }, ...(s.leads || [])], audit: audit(s, "زائر الصفحة الرئيسية", "طلب تواصل جديد", `${a.lead.name} — ${a.lead.kind}`) };
    case "setLeadStatus":
      return { ...s, leads: (s.leads || []).map((l) => (l.id === a.id ? { ...l, status: a.status } : l)), audit: audit(s, a.actor, "تحديث حالة طلب تواصل", `${a.target} — ${a.status}`) };
    case "togglePermission": {
      const cur = s.rbac[a.role] || [];
      const has = cur.includes(a.perm);
      return { ...s, rbac: { ...s.rbac, [a.role]: has ? cur.filter((p) => p !== a.perm) : [...cur, a.perm] }, audit: audit(s, a.actor, has ? "سحب صلاحية" : "منح صلاحية", `${a.perm} ← ${a.roleLabel}`, "warn") };
    }
    case "addUnit": {
      const id = uid("U");
      const no = s.extraUnits.filter((u) => u.subjectId === a.subjectId).length + 10;
      return { ...s, extraUnits: [...s.extraUnits, { id, subjectId: a.subjectId, no, title: a.title }], audit: audit(s, a.actor, "إضافة وحدة", a.title) };
    }
    case "addLesson": {
      const id = uid("L");
      const oid = uid("O");
      const objTitle = a.objective || `يتقن مفاهيم درس «${a.title}»`;
      const unit = unitOf(s, a.unitId);
      const lesson = {
        id, unitId: a.unitId, no: lessonsInUnit(s, a.unitId).length + 1, title: a.title, duration: 15, objectives: [oid], custom: true,
        explain: { base: [{ h: "مقدمة", p: "أضف محتوى الشرح من محرّر المحتوى، وسيُبنى الشرح والاختبار عليه بعد الاعتماد." }], medium: [], deep: [] },
        examples: [], summary: { points: [], terms: [] }, cards: [], media: null,
      };
      return {
        ...s,
        extraLessons: [...s.extraLessons, lesson],
        extraObjectives: [...(s.extraObjectives || []), { id: oid, subjectId: unit?.subjectId, unitId: a.unitId, lessonId: id, title: objTitle }],
        lessonState: { ...s.lessonState, [id]: { status: "draft", explainEnabled: true, notes: "", files: [] } },
        audit: audit(s, a.actor, "إضافة درس", a.title),
      };
    }
    case "addObjective": {
      const l = lessonOf(s, a.lessonId);
      const oid = uid("O");
      const unit = unitOf(s, l?.unitId);
      return {
        ...s,
        extraObjectives: [...(s.extraObjectives || []), { id: oid, subjectId: unit?.subjectId, unitId: l?.unitId, lessonId: l?.id, title: a.title }],
        audit: audit(s, a.actor, "ربط هدف تعلّم", `${a.title} ← ${l?.title}`),
      };
    }
    case "updateClass":
      return { ...s, classes: s.classes.map((c) => (c.id === a.id ? { ...c, ...a.patch } : c)), audit: audit(s, a.actor, a.action || "تعديل فصل", a.target || a.id) };
    case "setTimetableCell": {
      const table = (s.timetable[a.classId] || Array.from({ length: 5 }, () => Array(6).fill(["—", ""]))).map((d) => d.slice());
      table[a.day] = table[a.day].slice();
      table[a.day][a.period] = [a.subject, a.teacherId];
      return { ...s, timetable: { ...s.timetable, [a.classId]: table }, audit: audit(s, a.actor, "تعديل الجدول الدراسي", `${s.classes.find((c) => c.id === a.classId)?.name} — ${a.subject}`) };
    }
    case "addTenant":
      return { ...s, tenants: [{ id: uid("t"), isolation: "معزول", status: "نشط", ...a.tenant }, ...s.tenants], audit: audit(s, a.actor, "إنشاء مستأجر", a.tenant.name) };
    case "setAI":
      return { ...s, aiSettings: { ...s.aiSettings, ...a.patch }, audit: audit(s, a.actor, "تعديل إعدادات الذكاء الاصطناعي", a.describe || "إعدادات المحرّك", "warn") };
    case "addQualityNote":
      return { ...s, qualityNotes: [{ id: uid("QN"), at: now, by: a.by, ...a.note }, ...s.qualityNotes], audit: audit(s, a.by, "تسجيل ملاحظة جودة", a.note.itemTitle) };
    case "setGateway":
      return { ...s, gateways: s.gateways.map((g) => (g.id === a.id ? { ...g, status: g.status === "متصل" ? "متوقف" : "متصل" } : g)), audit: audit(s, a.actor, "تغيير حالة بوّابة دفع", a.name, "warn") };
    case "addApiKey":
      return { ...s, apiKeys: [{ id: uid("key"), created: now, ...a.key }, ...s.apiKeys], audit: audit(s, a.actor, "إنشاء مفتاح API", a.key.name, "warn") };
    case "revokeApiKey":
      return { ...s, apiKeys: s.apiKeys.filter((k) => k.id !== a.id), audit: audit(s, a.actor, "إلغاء مفتاح API", a.name, "warn") };
    case "addSchedule":
      return { ...s, reportSchedules: [...s.reportSchedules, { id: uid("RS"), ...a.schedule }] };
    case "removeSchedule":
      return { ...s, reportSchedules: s.reportSchedules.filter((r) => r.id !== a.id) };
    case "logAudit":
      return { ...s, audit: audit(s, a.actor, a.action, a.target, a.severity) };
    case "renewLicense":
      return { ...s, schools: s.schools.map((x) => (x.id === a.id ? { ...x, license: "نشط", seats: a.seats ?? x.seats } : x)), audit: audit(s, a.actor, "تجديد ترخيص", a.name) };
    default:
      return s;
  }
}

const Ctx = createContext(null);

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* التخزين ممتلئ أو غير متاح */
    }
  }, [state]);
  const user = useMemo(() => {
    if (!state.session) return null;
    const base = users.find((u) => u.id === state.session.userId);
    return base ? { ...base, role: state.session.role } : null;
  }, [state.session]);
  const value = useMemo(() => ({ state, dispatch, user }), [state, user]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
