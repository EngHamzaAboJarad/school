// الأدوار الستة كما في الوثيقة (القسم ٥) + الحسابات التجريبية.

export const ROLES = {
  student: { id: "student", label: "طالب", long: "الطالب", desc: "يتعلّم ويُختبر ويتابع تقدّمه" },
  parent: { id: "parent", label: "وليّ أمر", long: "وليّ الأمر", desc: "يتابع أبناءه ويتواصل مع المدرسة" },
  teacher: { id: "teacher", label: "معلّم", long: "المعلّم", desc: "يعتمد المحتوى ويتابع فصوله" },
  school: { id: "school", label: "إدارة المدرسة", long: "إدارة المدرسة", desc: "يُدير المستخدمين والصفوف والتقارير" },
  supervisor: { id: "supervisor", label: "إشراف تربوي", long: "الإشراف التربوي", desc: "رقابة الجودة والمؤشّرات لعدّة مدارس" },
  system: { id: "system", label: "مدير النظام", long: "مدير النظام", desc: "الصلاحيات والفوترة وحوكمة الذكاء الاصطناعي" },
};

export const users = [
  { id: "stu-sara", role: "student", name: "سارة أحمد", email: "student@taqat.test", grade: "الثالث المتوسط", classId: "c-3a", parentId: "par-noura", school: "sch-1" },
  { id: "par-noura", role: "parent", name: "نورة أحمد", email: "parent@taqat.test", children: ["stu-sara", "stu-layan"], school: "sch-1" },
  { id: "tch-khaled", role: "teacher", name: "أ. خالد العتيبي", email: "teacher@taqat.test", title: "معلّم الرياضيات والعلوم", classes: ["c-3a", "c-3b"], school: "sch-1" },
  { id: "adm-school", role: "school", name: "أ. عبدالله الشمري", email: "admin@taqat.test", title: "مدير مدرسة الأفق الأهلية", school: "sch-1" },
  { id: "sup-1", role: "supervisor", name: "د. منى الزهراني", email: "supervisor@taqat.test", title: "مشرفة تربوية — إدارة تعليم الرياض" },
  { id: "sys-1", role: "system", name: "م. طارق العنزي", email: "system@taqat.test", title: "مدير النظام" },
  // بقية من يظهرون في المراسلات والقوائم
  { id: "tch-noura", role: "teacher", name: "أ. نورة الحربي", title: "معلّمة العلوم", school: "sch-1" },
  { id: "tch-sarah", role: "teacher", name: "أ. سارة منصور", title: "معلّمة لغتي", school: "sch-1" },
  { id: "tch-huda", role: "teacher", name: "أ. هدى القحطاني", title: "معلّمة الصف السادس", school: "sch-1" },
];

const classA = ["stu-sara", "stu-lujain", "stu-omar", "stu-reem", "stu-fahd", "stu-lama", "stu-yousef", "stu-joud", "stu-maha", "stu-turki"];
const classB = ["stu-nora", "stu-badr", "stu-hind", "stu-ziyad", "stu-ghada", "stu-salman"];

export const students = [
  { id: "stu-sara", name: "سارة أحمد", classId: "c-3a", parentId: "par-noura" },
  { id: "stu-lujain", name: "لجين محمد", classId: "c-3a" },
  { id: "stu-omar", name: "عمر خالد", classId: "c-3a" },
  { id: "stu-reem", name: "ريم علي", classId: "c-3a" },
  { id: "stu-fahd", name: "فهد ناصر", classId: "c-3a" },
  { id: "stu-lama", name: "لمى سعد", classId: "c-3a" },
  { id: "stu-yousef", name: "يوسف إبراهيم", classId: "c-3a" },
  { id: "stu-joud", name: "جود عبدالله", classId: "c-3a" },
  { id: "stu-maha", name: "مها حسن", classId: "c-3a" },
  { id: "stu-turki", name: "تركي فيصل", classId: "c-3a" },
  { id: "stu-nora", name: "نورة سلطان", classId: "c-3b" },
  { id: "stu-badr", name: "بدر محمد", classId: "c-3b" },
  { id: "stu-hind", name: "هند عمر", classId: "c-3b" },
  { id: "stu-ziyad", name: "زياد ماجد", classId: "c-3b" },
  { id: "stu-ghada", name: "غادة رائد", classId: "c-3b" },
  { id: "stu-salman", name: "سلمان حمد", classId: "c-3b" },
  { id: "stu-layan", name: "ليان أحمد", classId: "c-6b", parentId: "par-noura", grade: "السادس الابتدائي" },
];

export const seedClasses = [
  { id: "c-3a", name: "الثالث المتوسط / أ", grade: "الثالث المتوسط", room: "قاعة 12", teacherId: "tch-khaled", subjects: ["S-MATH", "S-SCI"], studentIds: classA },
  { id: "c-3b", name: "الثالث المتوسط / ب", grade: "الثالث المتوسط", room: "قاعة 14", teacherId: "tch-khaled", subjects: ["S-MATH", "S-SCI"], studentIds: classB },
  { id: "c-6b", name: "السادس الابتدائي / ب", grade: "السادس الابتدائي", room: "قاعة 4", teacherId: "tch-huda", subjects: ["P-MATH", "P-SCI", "P-ARB"], studentIds: ["stu-layan"] },
];

export const PERIODS = ["07:30", "08:20", "09:10", "10:15", "11:05", "11:55"];
export const WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس"];

// أسعار التسجيل الفردي لدى المعلّم لكل مادة (اشتراك شهري)
export const SUBJECT_PRICES = {
  "الرياضيات": "220 ريال/شهر",
  "العلوم": "200 ريال/شهر",
  "لغتي الجميلة": "180 ريال/شهر",
  "لغتي": "180 ريال/شهر",
  "اللغة الإنجليزية": "200 ريال/شهر",
  "القرآن الكريم": "150 ريال/شهر",
  "التربية البدنية": "120 ريال/شهر",
};

// الجدول الأسبوعي: لكل يوم ٦ حصص [مادة، معلّم]
const M = ["الرياضيات", "tch-khaled"], Sc = ["العلوم", "tch-khaled"], A = ["لغتي الجميلة", "tch-sarah"], E = ["اللغة الإنجليزية", "tch-noura"], Q = ["القرآن الكريم", "tch-sarah"], Pe = ["التربية البدنية", "tch-noura"];
export const seedTimetable = {
  "c-3a": [
    [M, A, Sc, E, Q, Pe],
    [Sc, M, A, Q, E, M],
    [A, Sc, M, E, Pe, Q],
    [M, Q, Sc, A, E, Sc],
    [Sc, M, A, E, Q, M],
  ],
};

export const seedSchools = [
  { id: "sch-1", name: "مدرسة الأفق الأهلية", district: "الرياض — الملقا", stage: "متوسط / ثانوي", students: 1240, teachers: 68, mastery: 82, attendance: 97.2, active: 91, approval: 96, license: "نشط", seats: 1500 },
  { id: "sch-2", name: "مدارس الريادة الأهلية", district: "الرياض — النرجس", stage: "ابتدائي / متوسط", students: 860, teachers: 49, mastery: 79, attendance: 95.8, active: 86, approval: 93, license: "نشط", seats: 900 },
  { id: "sch-3", name: "مدرسة النور النموذجية", district: "الرياض — الياسمين", stage: "ابتدائي", students: 730, teachers: 41, mastery: 76, attendance: 96.1, active: 84, approval: 90, license: "نشط", seats: 800 },
  { id: "sch-4", name: "مدرسة الفرسان العالمية", district: "الرياض — العليا", stage: "متوسط / ثانوي", students: 690, teachers: 44, mastery: 84, attendance: 97.9, active: 93, approval: 97, license: "نشط", seats: 750 },
  { id: "sch-5", name: "مدرسة القمم الأهلية", district: "الرياض — الروضة", stage: "ابتدائي / متوسط", students: 540, teachers: 33, mastery: 71, attendance: 93.4, active: 74, approval: 88, license: "تجريبي", seats: 600 },
  { id: "sch-6", name: "مدرسة الأندلس", district: "الرياض — الملز", stage: "ابتدائي", students: 480, teachers: 28, mastery: 74, attendance: 94.7, active: 79, approval: 91, license: "نشط", seats: 500 },
  { id: "sch-7", name: "مدرسة الرواد", district: "الرياض — السويدي", stage: "متوسط", students: 410, teachers: 25, mastery: 68, attendance: 92.6, active: 68, approval: 85, license: "ينتهي قريبًا", seats: 450 },
  { id: "sch-8", name: "مدرسة الإبداع", district: "الرياض — الشفا", stage: "ابتدائي / متوسط", students: 320, teachers: 21, mastery: 77, attendance: 96.4, active: 82, approval: 94, license: "تجريبي", seats: 350 },
];

export const seedDirectory = [
  // حسابات المدرسة (أحدث ٢٠ حسابًا) — بنية قائمة المستخدمين
  ...users.filter((u) => u.school === "sch-1").map((u) => ({ id: u.id, name: u.name, role: u.role, email: u.email || `${u.id}@afaq.edu.sa`, status: "نشط", joined: "2026-08-24" })),
  ...students.filter((s) => s.id !== "stu-sara").slice(0, 10).map((s) => ({ id: s.id, name: s.name, role: "student", email: `${s.id}@afaq.edu.sa`, status: "نشط", joined: "2026-08-26" })),
  { id: "usr-pending-1", name: "أ. ماجد الدوسري", role: "teacher", email: "majed@afaq.edu.sa", status: "بانتظار الاعتماد", joined: "2026-09-18" },
  { id: "usr-pending-2", name: "أ. ريما السبيعي", role: "teacher", email: "reema@afaq.edu.sa", status: "بانتظار الاعتماد", joined: "2026-09-19" },
];

export const seedTenants = [
  ...seedSchools.map((s) => ({ id: s.id, name: s.name, type: "مدرسة (B2B)", plan: s.license === "تجريبي" ? "تجريبي" : "مدرسي", seats: s.seats, users: s.students + s.teachers, isolation: "معزول", status: s.license })),
  { id: "gov-riyadh", name: "إدارة تعليم الرياض", type: "جهة (B2G)", plan: "مؤسسي", seats: 0, users: 14, isolation: "معزول", status: "نشط" },
  { id: "b2c", name: "الأفراد والأسر", type: "أفراد (B2C)", plan: "اشتراكات", seats: 0, users: 6420, isolation: "معزول", status: "نشط" },
];

export const PERMISSIONS = [
  ["content.read", "قراءة المحتوى المنشور"],
  ["content.author", "إنشاء المحتوى وتحريره"],
  ["content.approve", "اعتماد المحتوى والاختبارات"],
  ["assess.take", "خوض الاختبارات"],
  ["assess.grade", "التصحيح اليدوي وتعديل الدرجات"],
  ["class.manage", "إدارة الفصول والطلاب"],
  ["reports.own", "تقارير الفصل / الأبناء"],
  ["reports.school", "التقارير المؤسسية"],
  ["users.manage", "إدارة المستخدمين والأدوار"],
  ["schools.view", "عرض مدارس متعددة"],
  ["quality.review", "رقابة جودة المحتوى"],
  ["billing.manage", "الفوترة والاشتراكات"],
  ["ai.configure", "إعدادات الذكاء الاصطناعي"],
  ["audit.read", "قراءة سجل التدقيق"],
];

export const seedRbac = {
  student: ["content.read", "assess.take"],
  parent: ["reports.own"],
  teacher: ["content.read", "content.author", "content.approve", "assess.grade", "class.manage", "reports.own"],
  school: ["content.read", "content.approve", "class.manage", "reports.own", "reports.school", "users.manage"],
  supervisor: ["content.read", "schools.view", "quality.review", "reports.school"],
  system: ["users.manage", "billing.manage", "ai.configure", "audit.read", "schools.view", "reports.school"],
};

export const DEMO_ACCOUNTS = [
  { email: "student@taqat.test", role: "student", userId: "stu-sara" },
  { email: "parent@taqat.test", role: "parent", userId: "par-noura" },
  { email: "teacher@taqat.test", role: "teacher", userId: "tch-khaled" },
  { email: "admin@taqat.test", role: "school", userId: "adm-school" },
  { email: "supervisor@taqat.test", role: "supervisor", userId: "sup-1" },
  { email: "system@taqat.test", role: "system", userId: "sys-1" },
];
