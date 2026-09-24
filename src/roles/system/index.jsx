import SystemHome from "./Home";
import TenantsPage from "./Tenants";
import RbacPage from "./Rbac";
import BillingPage from "./Billing";
import AiPage from "./Ai";
import AuditPage from "./Audit";
import SecurityPage from "./Security";
import IntegrationsPage from "./Integrations";
import TeacherRequestsPage from "./TeacherRequests";
import LeadsPage from "./Leads";

export default function SystemPages({ page, go }) {
  switch (page) {
    case "tenants": return <TenantsPage />;
    case "rbac": return <RbacPage />;
    case "billing": return <BillingPage />;
    case "ai": return <AiPage />;
    case "audit": return <AuditPage />;
    case "security": return <SecurityPage />;
    case "integrations": return <IntegrationsPage />;
    case "teacherRequests": return <TeacherRequestsPage />;
    case "leads": return <LeadsPage />;
    default: return <SystemHome go={go} />;
  }
}
