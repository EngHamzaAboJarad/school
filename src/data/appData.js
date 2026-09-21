import {
  BookOpen,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
  Users,
  CalendarDays,
} from "lucide-react";

export const navItems = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "learning", label: "مساري التعليمي", icon: BookOpen },
  { id: "assessments", label: "التقييمات", icon: ClipboardCheck },
  { id: "files", label: "الملفات والموارد", icon: FileText },
  { id: "messages", label: "الرسائل", icon: MessageCircle },
];

export const roleNavItems = {
  معلم: [
    { id: "overview", label: "لوحة المعلم", icon: LayoutDashboard },
    { id: "workspace", label: "الحصص والمواد", icon: CalendarDays },
    { id: "classes", label: "فصولي وطلابي", icon: Users },
    { id: "content-review", label: "مراجعة المحتوى", icon: ClipboardCheck },
    { id: "messages", label: "الرسائل", icon: MessageCircle },
  ],
  "ولي أمر": [
    { id: "overview", label: "لوحة المتابعة", icon: LayoutDashboard },
    { id: "children", label: "أبنائي", icon: Users },
    { id: "reports", label: "التقارير", icon: TrendingUp },
    { id: "messages", label: "الرسائل", icon: MessageCircle },
  ],
  إدارة: [
    { id: "overview", label: "لوحة الإدارة", icon: LayoutDashboard },
    { id: "users", label: "المستخدمون والأدوار", icon: Users },
    { id: "schools", label: "الفصول والجداول", icon: BookOpen },
    { id: "reports", label: "التقارير المؤسسية", icon: TrendingUp },
  ],
};

export const activities = [
  {
    title: "اختبار الدوال الخطية",
    subject: "رياضيات",
    time: "اليوم، 09:30 ص",
    score: "92%",
    color: "mint",
  },
  {
    title: "ملخص قوانين نيوتن",
    subject: "فيزياء",
    time: "أمس، 07:15 م",
    score: "مكتمل",
    color: "orange",
  },
  {
    title: "واجب القراءة النقدية",
    subject: "لغتي",
    time: "الأحد، 04:20 م",
    score: "قيد المراجعة",
    color: "blue",
  },
];

export const courses = [
  {
    title: "الرياضيات",
    subtitle: "المعادلات والدوال",
    progress: 78,
    lessons: "12 من 16 درس",
    color: "coral",
    icon: "∑",
  },
  {
    title: "العلوم",
    subtitle: "الطاقة والحركة",
    progress: 54,
    lessons: "8 من 15 درس",
    color: "teal",
    icon: "⚛",
  },
  {
    title: "لغتي الجميلة",
    subtitle: "القراءة والكتابة",
    progress: 36,
    lessons: "5 من 14 درس",
    color: "lilac",
    icon: "ع",
  },
];
