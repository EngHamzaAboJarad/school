import TeacherHome from "./Home";
import ClassesPage from "./Classes";
import ReviewPage from "./Review";
import CurriculumPage from "./Curriculum";
import BankPage from "./Bank";
import GradingPage from "./Grading";
import AssignmentsPage from "./Assignments";
import PerformancePage from "./Performance";
import AttendancePage from "./Attendance";
import Messages from "../shared/Messages";

export default function TeacherPages({ page, go }) {
  switch (page) {
    case "classes": return <ClassesPage go={go} />;
    case "performance": return <PerformancePage />;
    case "review": return <ReviewPage />;
    case "curriculum": return <CurriculumPage />;
    case "bank": return <BankPage />;
    case "grading": return <GradingPage />;
    case "assignments": return <AssignmentsPage />;
    case "attendance": return <AttendancePage />;
    case "messages": return <Messages go={go} />;
    default: return <TeacherHome go={go} />;
  }
}
