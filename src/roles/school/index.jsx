import SchoolHome from "./Home";
import UsersPage from "./Users";
import StructurePage from "./Structure";
import SchoolAttendance from "./Attendance";
import SchoolReports from "./Reports";
import LicensesPage from "./Licenses";
import Messages from "../shared/Messages";

export default function SchoolPages({ page, go }) {
  switch (page) {
    case "users": return <UsersPage />;
    case "structure": return <StructurePage />;
    case "attendance": return <SchoolAttendance />;
    case "reports": return <SchoolReports />;
    case "licenses": return <LicensesPage />;
    case "messages": return <Messages go={go} />;
    default: return <SchoolHome go={go} />;
  }
}
