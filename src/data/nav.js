import {
  Award, BarChart3, BookOpen, BookMarked, Building2, CalendarCheck, CalendarDays, CalendarRange, ClipboardCheck, CreditCard, FileBarChart, FileCheck2, FileText,
  GraduationCap, KeyRound, LayoutDashboard, Library, MessageCircle, PenLine, Plug, School, ScrollText, ShieldCheck, Sparkles, Target, TrendingUp,
  Users, UserPlus, UserCheck, Wallet, Cpu, Database, Layers, Eye, Gauge, Bell, Inbox,
} from "lucide-react";

// لكل دور مجموعات تنقّل تطابق ملاحم الوثيقة (E4–E11).
export const NAV = {
  student: [
    { group: "التعلّم", items: [
      { id: "home", label: "الرئيسية", icon: LayoutDashboard },
      { id: "learn", label: "مساري الدراسي", short: "مساري", icon: BookOpen },
      { id: "progress", label: "تقدّمي وخطتي", short: "تقدّمي", icon: TrendingUp },
    ] },
    { group: "أدواتي", items: [
      { id: "schedule", label: "الجدول الأسبوعي", short: "الجدول", icon: CalendarDays },
      { id: "library", label: "مكتبتي", icon: Library },
      { id: "rewards", label: "إنجازاتي", icon: Award },
      { id: "teachers", label: "معلّمويّ", icon: Users },
      { id: "messages", label: "الرسائل", icon: MessageCircle },
    ] },
  ],
  parent: [
    { group: "المتابعة", items: [
      { id: "home", label: "الرئيسية", icon: LayoutDashboard },
      { id: "child", label: "أداء الأبناء", short: "الأبناء", icon: GraduationCap },
      { id: "attendance", label: "الحضور والغياب", short: "الحضور", icon: CalendarCheck },
      { id: "reports", label: "التقارير", short: "التقارير", icon: FileBarChart },
    ] },
    { group: "التواصل والخصوصية", items: [
      { id: "messages", label: "التواصل", icon: MessageCircle },
      { id: "privacy", label: "الموافقات والخصوصية", icon: ShieldCheck },
    ] },
  ],
  teacher: [
    { group: "لوحتي", items: [
      { id: "home", label: "الرئيسية", icon: LayoutDashboard },
      { id: "classes", label: "فصولي وطلابي", short: "فصولي", icon: Users },
      { id: "performance", label: "أداء الفصل", short: "الأداء", icon: BarChart3 },
    ] },
    { group: "المحتوى والتقييم", items: [
      { id: "review", label: "اعتماد المحتوى", short: "الاعتماد", icon: FileCheck2 },
      { id: "curriculum", label: "المنهج والمحتوى", icon: BookMarked },
      { id: "bank", label: "بنك الأسئلة", icon: Layers },
      { id: "grading", label: "التصحيح اليدوي", icon: PenLine },
    ] },
    { group: "الصف", items: [
      { id: "assignments", label: "الواجبات والمهام", icon: ClipboardCheck },
      { id: "attendance", label: "الحضور", icon: CalendarCheck },
      { id: "enrollments", label: "طلبات التسجيل", icon: UserPlus },
      { id: "finance", label: "الأمور المالية", icon: Wallet },
      { id: "messages", label: "الرسائل", icon: MessageCircle },
    ] },
  ],
  school: [
    { group: "الإدارة", items: [
      { id: "home", label: "الرئيسية", icon: LayoutDashboard },
      { id: "users", label: "المستخدمون والأدوار", short: "المستخدمون", icon: Users },
      { id: "structure", label: "الصفوف والجداول", short: "الصفوف", icon: CalendarRange },
      { id: "attendance", label: "الحضور والغياب", short: "الحضور", icon: CalendarCheck },
    ] },
    { group: "المؤسسة", items: [
      { id: "reports", label: "التقارير المؤسسية", icon: FileBarChart },
      { id: "licenses", label: "الاشتراك والتراخيص", icon: KeyRound },
      { id: "finance", label: "رسوم المعلّمين", icon: Wallet },
      { id: "messages", label: "الإعلانات والرسائل", icon: MessageCircle },
    ] },
  ],
  supervisor: [
    { group: "الإشراف", items: [
      { id: "home", label: "المدارس ضمن النطاق", short: "المدارس", icon: School },
      { id: "kpis", label: "مؤشّرات الأداء", short: "المؤشّرات", icon: Gauge },
      { id: "quality", label: "رقابة الجودة", short: "الجودة", icon: Eye },
      { id: "reports", label: "تقارير الإدارة والوزارة", short: "التقارير", icon: ScrollText },
    ] },
  ],
  system: [
    { group: "المنصّة", items: [
      { id: "home", label: "نظرة عامة", icon: LayoutDashboard },
      { id: "tenants", label: "المستأجرون", short: "المستأجرون", icon: Building2 },
      { id: "teacherRequests", label: "طلبات المعلّمين", short: "الطلبات", icon: UserCheck },
      { id: "leads", label: "طلبات التواصل", short: "التواصل", icon: Inbox },
      { id: "rbac", label: "الصلاحيات (RBAC)", icon: KeyRound },
      { id: "billing", label: "الفوترة والاشتراكات", icon: CreditCard },
    ] },
    { group: "الذكاء والأمان", items: [
      { id: "ai", label: "محرّك الذكاء الاصطناعي", icon: Cpu },
      { id: "audit", label: "سجلّ التدقيق", icon: ScrollText },
      { id: "security", label: "الأمان والامتثال", icon: ShieldCheck },
      { id: "integrations", label: "التكاملات وAPI", icon: Plug },
    ] },
  ],
};

export const flatNav = (role) => NAV[role].flatMap((g) => g.items);
export const pageLabel = (role, id) => flatNav(role).find((i) => i.id === id)?.label;

export const ICONS = { Award, BarChart3, BookOpen, CalendarCheck, FileText, Sparkles, Target, Database, Eye, Bell };
