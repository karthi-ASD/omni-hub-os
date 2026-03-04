import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Businesses from "./pages/Businesses";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogs from "./pages/AuditLogs";
import NotificationsPage from "./pages/NotificationsPage";
import CalendarPage from "./pages/CalendarPage";
import InquiriesPage from "./pages/InquiriesPage";
import LeadsPage from "./pages/LeadsPage";
import RemindersPage from "./pages/RemindersPage";
import DealsPage from "./pages/DealsPage";
import ProposalsPage from "./pages/ProposalsPage";
import ContractsPage from "./pages/ContractsPage";
import ClientsPage from "./pages/ClientsPage";
import ProjectsPage from "./pages/ProjectsPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import BillingDashboard from "./pages/BillingDashboard";
import PlatformBillingPage from "./pages/PlatformBillingPage";
import TenantBillingPage from "./pages/TenantBillingPage";
import GatewayConfigPage from "./pages/GatewayConfigPage";
import SeoDashboardPage from "./pages/SeoDashboardPage";
import SeoCampaignDetailPage from "./pages/SeoCampaignDetailPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import SystemMonitorPage from "./pages/SystemMonitorPage";
import AnalyticsDashboardPage from "./pages/AnalyticsDashboardPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import WhiteLabelPage from "./pages/WhiteLabelPage";
import InvestorDashboardPage from "./pages/InvestorDashboardPage";
import PartnersPage from "./pages/PartnersPage";
import AIAgentsPage from "./pages/AIAgentsPage";
import InvestorPitchPage from "./pages/InvestorPitchPage";
import MarketplacePage from "./pages/MarketplacePage";
import AppFactoryPage from "./pages/AppFactoryPage";
import InfraMonitorPage from "./pages/InfraMonitorPage";
import CorporateStructurePage from "./pages/CorporateStructurePage";
import FundraisingPage from "./pages/FundraisingPage";
import GovernancePage from "./pages/GovernancePage";
import RiskManagementPage from "./pages/RiskManagementPage";
import ExpansionEnginePage from "./pages/ExpansionEnginePage";
import AcquisitionsPage from "./pages/AcquisitionsPage";
import IPOReadinessPage from "./pages/IPOReadinessPage";
import FranchiseBlueprintPage from "./pages/FranchiseBlueprintPage";
import CompetitiveIntelPage from "./pages/CompetitiveIntelPage";
import CapitalAllocationPage from "./pages/CapitalAllocationPage";
import ObservabilityPage from "./pages/ObservabilityPage";
import IncidentsPage from "./pages/IncidentsPage";
import BackupsPage from "./pages/BackupsPage";
import CompliancePage from "./pages/CompliancePage";
import ReleasesPage from "./pages/ReleasesPage";
import GeoEnginePage from "./pages/GeoEnginePage";
import AnalyticsIntegrationsPage from "./pages/AnalyticsIntegrationsPage";
import GoLivePlaybookPage from "./pages/GoLivePlaybookPage";
import DependenciesWizardPage from "./pages/DependenciesWizardPage";
import QAChecklistPage from "./pages/QAChecklistPage";
import WorkforcePage from "./pages/WorkforcePage";
import LeaveManagementPage from "./pages/LeaveManagementPage";
import PayrollPage from "./pages/PayrollPage";
import SLAPage from "./pages/SLAPage";
import OrgChartPage from "./pages/OrgChartPage";
import Client360Page from "./pages/Client360Page";
import VaultPage from "./pages/VaultPage";
import JobCRMPage from "./pages/JobCRMPage";
import UsageAnalyticsPage from "./pages/UsageAnalyticsPage";
import DemoModePage from "./pages/DemoModePage";
import RevenueIntelligencePage from "./pages/RevenueIntelligencePage";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";
import GovernanceDashboardPage from "./pages/GovernanceDashboardPage";
import TasksPage from "./pages/TasksPage";
import TicketsPage from "./pages/TicketsPage";
import ReportsPage from "./pages/ReportsPage";
import MarketingPage from "./pages/MarketingPage";
import MorePage from "./pages/MorePage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SecurityPage from "./pages/SecurityPage";
import CareersPage from "./pages/CareersPage";
import BlogPage from "./pages/BlogPage";
import DemoRequestPage from "./pages/DemoRequestPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
            <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/demo" element={<DemoRequestPage />} />

            {/* Protected app shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/inquiries" element={<InquiriesPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/billing" element={<BillingDashboard />} />
              <Route path="/platform-billing" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><PlatformBillingPage /></ProtectedRoute>
              } />
              <Route path="/tenant-billing" element={<TenantBillingPage />} />
              <Route path="/gateways" element={<GatewayConfigPage />} />
              <Route path="/seo" element={<SeoDashboardPage />} />
              <Route path="/seo/:campaignId" element={<SeoCampaignDetailPage />} />
              <Route path="/communications" element={<CommunicationsPage />} />
              <Route path="/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/ai-insights" element={<AIInsightsPage />} />
              <Route path="/white-label" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><WhiteLabelPage /></ProtectedRoute>
              } />
              <Route path="/investor-dashboard" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><InvestorDashboardPage /></ProtectedRoute>
              } />
              <Route path="/partners" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><PartnersPage /></ProtectedRoute>
              } />
              <Route path="/ai-agents" element={<AIAgentsPage />} />
              <Route path="/investor-pitch" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><InvestorPitchPage /></ProtectedRoute>
              } />
              <Route path="/marketplace" element={<MarketplacePage />} />
              <Route path="/app-factory" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AppFactoryPage /></ProtectedRoute>
              } />
              <Route path="/infrastructure" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><InfraMonitorPage /></ProtectedRoute>
              } />
              <Route path="/corporate-structure" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><CorporateStructurePage /></ProtectedRoute>
              } />
              <Route path="/fundraising" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><FundraisingPage /></ProtectedRoute>
              } />
              <Route path="/governance" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><GovernancePage /></ProtectedRoute>
              } />
              <Route path="/risk-management" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><RiskManagementPage /></ProtectedRoute>
              } />
              <Route path="/expansion-engine" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><ExpansionEnginePage /></ProtectedRoute>
              } />
              <Route path="/acquisitions" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><AcquisitionsPage /></ProtectedRoute>
              } />
              <Route path="/ipo-readiness" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><IPOReadinessPage /></ProtectedRoute>
              } />
              <Route path="/franchise-blueprint" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><FranchiseBlueprintPage /></ProtectedRoute>
              } />
              <Route path="/competitive-intel" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><CompetitiveIntelPage /></ProtectedRoute>
              } />
              <Route path="/capital-allocation" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><CapitalAllocationPage /></ProtectedRoute>
              } />
              <Route path="/observability" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><ObservabilityPage /></ProtectedRoute>
              } />
              <Route path="/incidents" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><IncidentsPage /></ProtectedRoute>
              } />
              <Route path="/backups" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><BackupsPage /></ProtectedRoute>
              } />
              <Route path="/compliance" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><CompliancePage /></ProtectedRoute>
              } />
              <Route path="/releases" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><ReleasesPage /></ProtectedRoute>
              } />
              <Route path="/geo-engine" element={<GeoEnginePage />} />
              <Route path="/analytics-integrations" element={<AnalyticsIntegrationsPage />} />
              <Route path="/go-live" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><GoLivePlaybookPage /></ProtectedRoute>
              } />
              <Route path="/dependencies" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><DependenciesWizardPage /></ProtectedRoute>
              } />
              <Route path="/qa-checklist" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><QAChecklistPage /></ProtectedRoute>
              } />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/marketing" element={<MarketingPage />} />
              <Route path="/workforce" element={<WorkforcePage />} />
              <Route path="/leave" element={<LeaveManagementPage />} />
              <Route path="/payroll" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><PayrollPage /></ProtectedRoute>
              } />
              <Route path="/sla" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><SLAPage /></ProtectedRoute>
              } />
              <Route path="/org-chart" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><OrgChartPage /></ProtectedRoute>
              } />
              <Route path="/client-360" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><Client360Page /></ProtectedRoute>
              } />
              <Route path="/vault" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><VaultPage /></ProtectedRoute>
              } />
              <Route path="/job-crm" element={<JobCRMPage />} />
              <Route path="/usage-analytics" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><UsageAnalyticsPage /></ProtectedRoute>
              } />
              <Route path="/demo-mode" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><DemoModePage /></ProtectedRoute>
              } />
              <Route path="/revenue-intelligence" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><RevenueIntelligencePage /></ProtectedRoute>
              } />
              <Route path="/activity-timeline" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><ActivityTimelinePage /></ProtectedRoute>
              } />
              <Route path="/governance-controls" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><GovernanceDashboardPage /></ProtectedRoute>
              } />
              <Route
                path="/businesses"
                element={
                  <ProtectedRoute requiredRoles={["super_admin"]}>
                    <Businesses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}>
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/system-monitor"
                element={
                  <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}>
                    <SystemMonitorPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
