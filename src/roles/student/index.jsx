import StudentHome from "./Home";
import LearnPage from "./Learn";
import ProgressPage from "./Progress";
import LibraryPage from "./Library";
import RewardsPage from "./Rewards";
import TeachersPage from "./Teachers";
import SchedulePage from "./Schedule";
import Messages from "../shared/Messages";

export default function StudentPages({ page, param, go }) {
  switch (page) {
    case "learn": return <LearnPage param={param} go={go} />;
    case "progress": return <ProgressPage param={param} go={go} />;
    case "library": return <LibraryPage go={go} />;
    case "rewards": return <RewardsPage />;
    case "teachers": return <TeachersPage go={go} />;
    case "schedule": return <SchedulePage />;
    case "messages": return <Messages param={param} go={go} />;
    default: return <StudentHome go={go} />;
  }
}
