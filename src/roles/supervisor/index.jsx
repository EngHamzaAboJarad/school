import SupervisorHome from "./Home";
import KpisPage from "./Kpis";
import QualityPage from "./Quality";
import SupervisorReports from "./Reports";

export default function SupervisorPages({ page, go }) {
  switch (page) {
    case "kpis": return <KpisPage />;
    case "quality": return <QualityPage />;
    case "reports": return <SupervisorReports />;
    default: return <SupervisorHome go={go} />;
  }
}
