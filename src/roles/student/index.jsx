import StudentHome from "./Home";
import LearnPage from "./Learn";
import ProgressPage from "./Progress";
import LibraryPage from "./Library";
import RewardsPage from "./Rewards";
import Messages from "../shared/Messages";

export default function StudentPages({ page, param, go }) {
  switch (page) {
    case "learn": return <LearnPage param={param} go={go} />;
    case "progress": return <ProgressPage param={param} go={go} />;
    case "library": return <LibraryPage go={go} />;
    case "rewards": return <RewardsPage />;
    case "messages": return <Messages go={go} />;
    default: return <StudentHome go={go} />;
  }
}
