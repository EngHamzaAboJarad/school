import ParentHome from "./Home";
import ChildPage from "./Child";
import ParentAttendance from "./Attendance";
import ParentReports from "./Reports";
import PrivacyPage from "./Privacy";
import Messages from "../shared/Messages";

export default function ParentPages({ page, go }) {
  switch (page) {
    case "child": return <ChildPage go={go} />;
    case "attendance": return <ParentAttendance />;
    case "reports": return <ParentReports />;
    case "privacy": return <PrivacyPage />;
    case "messages": return <Messages go={go} />;
    default: return <ParentHome go={go} />;
  }
}
