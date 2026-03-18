import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeEngine";
import { TooltipProvider } from "@/components/ui/tooltip";
import SaasPlansPage from "./pages/SaasPlansPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import CompanyBillingPortalPage from "./pages/CompanyBillingPortalPage";
import WhiteLabelSettingsPage from "./pages/WhiteLabelSettingsPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import PublicLayout from "@/components/public/PublicLayout";
import PublicPlaceholderPage from "@/pages/public/PublicPlaceholderPage";
import PlatformModulePage from "@/pages/public/PlatformModulePage";
import ServiceDetailPage from "@/pages/public/ServiceDetailPage";
import IndustryDetailPage from "@/pages/public/IndustryDetailPage";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppShell from "@/components/AppShell";
import { ClientRouteGuard } from "@/components/guards/ClientRouteGuard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import LoginV2 from "./pages/LoginV2";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Businesses from "./pages/Businesses";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import AuditLogs from "./pages/AuditLogs";
import RoleManagementPage from "./pages/RoleManagementPage";
import WorkflowAutomationPage from "./pages/WorkflowAutomationPage";
import AIAgencyBrainPage from "./pages/AIAgencyBrainPage";
import NotificationsPage from "./pages/NotificationsPage";
import CalendarPage from "./pages/CalendarPage";
import InquiriesPage from "./pages/InquiriesPage";
import LeadsPage from "./pages/LeadsPage";
import RemindersPage from "./pages/RemindersPage";
import DealsPage from "./pages/DealsPage";
import ProposalsPage from "./pages/ProposalsPage";
import ContractsPage from "./pages/ContractsPage";
import ClientsPage from "./pages/ClientsPage";
import ClientProfilePage from "./pages/ClientProfilePage";
import ClientAccessHubPage from "./pages/ClientAccessHubPage";
import ProjectsPage from "./pages/ProjectsPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import BillingDashboard from "./pages/BillingDashboard";
import PlatformBillingPage from "./pages/PlatformBillingPage";
import TenantBillingPage from "./pages/TenantBillingPage";
import GatewayConfigPage from "./pages/GatewayConfigPage";
import SeoDashboardPage from "./pages/SeoDashboardPage";
import SeoCampaignDetailPage from "./pages/SeoCampaignDetailPage";
import SeoOperationsPage from "./pages/SeoOperationsPage";
import SeoProjectDetailPage from "./pages/SeoProjectDetailPage";
import SeoTeamDashboardPage from "./pages/SeoTeamDashboardPage";
import SeoIntelligencePage from "./pages/SeoIntelligencePage";
import SalesSeoPitchPage from "./pages/SalesSeoPitchPage";
import SeoClientReportsPage from "./pages/SeoClientReportsPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import SystemMonitorPage from "./pages/SystemMonitorPage";
import AnalyticsDashboardPage from "./pages/AnalyticsDashboardPage";
import AIInsightsPage from "./pages/AIInsightsPage";
import AIBusinessIntelligencePage from "./pages/AIBusinessIntelligencePage";
import GrowthEnginePage from "./pages/GrowthEnginePage";
import WhiteLabelPage from "./pages/WhiteLabelPage";
import InvestorDashboardPage from "./pages/InvestorDashboardPage";
import PartnersPage from "./pages/PartnersPage";
import AIAgentsPage from "./pages/AIAgentsPage";
import AIVoiceAgentsPage from "./pages/AIVoiceAgentsPage";
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
import TeamDirectoryPage from "./pages/TeamDirectoryPage";
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
import ReviewMonitorPage from "./pages/ReviewMonitorPage";
import AIReportsPage from "./pages/AIReportsPage";
import CustomFieldBuilderPage from "./pages/CustomFieldBuilderPage";
import UsageAnalyticsPage from "./pages/UsageAnalyticsPage";
import DemoModePage from "./pages/DemoModePage";
import RevenueIntelligencePage from "./pages/RevenueIntelligencePage";
import FinanceDashboardPage from "./pages/FinanceDashboardPage";
import XeroTestPage from "./pages/XeroTestPage";
import ClientBillingPortalPage from "./pages/ClientBillingPortalPage";
import ClientPackagePage from "./pages/ClientPackagePage";
import ContentManagementPage from "./pages/ContentManagementPage";
import WebsiteDevStagesPage from "./pages/WebsiteDevStagesPage";
import ActivityTimelinePage from "./pages/ActivityTimelinePage";
import SuperAdminBusinessManagementPage from "./pages/SuperAdminBusinessManagementPage";
import SuperAdminClientManagementPage from "./pages/SuperAdminClientManagementPage";
import SystemHealthPage from "./pages/SystemHealthPage";
import FeatureRegistryPage from "./pages/FeatureRegistryPage";
import ClientDataIntegrityPage from "./pages/ClientDataIntegrityPage";
import AdvocacyEnginePage from "./pages/AdvocacyEnginePage";
import GovernanceDashboardPage from "./pages/GovernanceDashboardPage";
import TasksPage from "./pages/TasksPage";
import TicketsPage from "./pages/TicketsPage";
import InternalTicketsPage from "./pages/InternalTicketsPage";
import InternalTicketDetailPage from "./pages/InternalTicketDetailPage";
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
import WebDevelopmentPage from "./pages/WebDevelopmentPage";
import MobileTechnologyPage from "./pages/MobileTechnologyPage";
import ITSolutionsPage from "./pages/ITSolutionsPage";
import EMarketingPage from "./pages/EMarketingPage";
import AutomationPage from "./pages/AutomationPage";
import ConversationsPage from "./pages/ConversationsPage";
import AgentFactoryPage from "./pages/AgentFactoryPage";
import ProviderConnectionsPage from "./pages/ProviderConnectionsPage";
import ConsentCompliancePage from "./pages/ConsentCompliancePage";
import VoiceAgentPage from "./pages/VoiceAgentPage";
import DealRoomPage from "./pages/DealRoomPage";
import AutopilotSettingsPage from "./pages/AutopilotSettingsPage";
import AutopilotSequencesPage from "./pages/AutopilotSequencesPage";
import AutopilotInboxPage from "./pages/AutopilotInboxPage";
import AIBrainPage from "./pages/AIBrainPage";
import AILearningPage from "./pages/AILearningPage";
import AISalesBrainPage from "./pages/AISalesBrainPage";
import AutonomousAgentsPage from "./pages/AutonomousAgentsPage";
import WebsitesPage from "./pages/WebsitesPage";
import DomainManagementPage from "./pages/DomainManagementPage";
import HostingManagementPage from "./pages/HostingManagementPage";
import LeadRoutingPage from "./pages/LeadRoutingPage";
import CustomerServiceDashboard from "./pages/CustomerServiceDashboard";
import CompanyAccountsPage from "./pages/CompanyAccountsPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import CSAutomationPage from "./pages/CSAutomationPage";
import CSReportsPage from "./pages/CSReportsPage";
import AIAssistantSettingsPage from "./pages/AIAssistantSettingsPage";
import CustomerPortalPage from "./pages/CustomerPortalPage";
import SatisfactionSurveysPage from "./pages/SatisfactionSurveysPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import CustomerMobileAppPage from "./pages/CustomerMobileAppPage";
import ClientNotificationsPage from "./pages/ClientNotificationsPage";
import ClientReportsPage from "./pages/ClientReportsPage";
import ClientDepartmentsPage from "./pages/ClientDepartmentsPage";
import ClientEmployeesPage from "./pages/ClientEmployeesPage";
import CustomerAppointmentPage from "./pages/CustomerAppointmentPage";
import StaffMobileAppPage from "./pages/StaffMobileAppPage";
import HRDepartmentsPage from "./pages/HRDepartmentsPage";
import HREmployeeListPage from "./pages/HREmployeeListPage";
import HREmployeeProfilePage from "./pages/HREmployeeProfilePage";
import HRLeaveManagementPage from "./pages/HRLeaveManagementPage";
import HRPayrollPage from "./pages/HRPayrollPage";
import HRPerformancePage from "./pages/HRPerformancePage";
import HRTaskTrackingPage from "./pages/HRTaskTrackingPage";
import HRAnalyticsDashboardPage from "./pages/HRAnalyticsDashboardPage";
import EmployeeSelfServicePage from "./pages/EmployeeSelfServicePage";
import ManagerDashboardPage from "./pages/ManagerDashboardPage";
import AgencyCommandCenterPage from "./pages/AgencyCommandCenterPage";
import ClientProjectsPage from "./pages/ClientProjectsPage";
import ClientSeoProjectsPage from "./pages/ClientSeoProjectsPage";
import ClientSeoProjectDetailPage from "./pages/ClientSeoProjectDetailPage";
import TaskPipelinePage from "./pages/TaskPipelinePage";
import TaskDetailPage from "./pages/TaskDetailPage";
import ClientWebsiteStructurePage from "./pages/ClientWebsiteStructurePage";
import ClientWebsitePerformancePage from "./pages/ClientWebsitePerformancePage";
import ClientPerformanceIntelligencePage from "./pages/ClientPerformanceIntelligencePage";
import ClientLocalPresencePage from "./pages/ClientLocalPresencePage";
import ClientLeadsDashboardPage from "./pages/ClientLeadsDashboardPage";
import IntegrationsOverviewPage from "./pages/IntegrationsOverviewPage";
import TeamHierarchyPage from "./pages/TeamHierarchyPage";
import CrossDeptRequestsPage from "./pages/CrossDeptRequestsPage";
import DepartmentDashboardPage from "./pages/DepartmentDashboardPage";
import WorkflowMapPage from "./pages/WorkflowMapPage";
import WorkloadMonitorPage from "./pages/WorkloadMonitorPage";
import SLAMonitorPage from "./pages/SLAMonitorPage";
import AccountTimelinePage from "./pages/AccountTimelinePage";
import AdminOperationsDashboardPage from "./pages/AdminOperationsDashboardPage";
import DailyWorkReportsPage from "./pages/DailyWorkReportsPage";
import DailyInsightsPage from "./pages/DailyInsightsPage";
import InternalBroadcastPage from "./pages/InternalBroadcastPage";
import EmployeeActivityMonitorPage from "./pages/EmployeeActivityMonitorPage";
import DepartmentPerformancePage from "./pages/DepartmentPerformancePage";
import CEODashboardPage from "./pages/CEODashboardPage";
import CompanyLoginPage from "./pages/CompanyLoginPage";
import CompanySignupPage from "./pages/CompanySignupPage";
import DepartmentSignupPage from "./pages/DepartmentSignupPage";
import ClientLoginPage from "./pages/ClientLoginPage";
import ClientRegisterPage from "./pages/ClientRegisterPage";
import FirstLoginSecurityPage from "./pages/FirstLoginSecurityPage";
import SuperAdminToolsPage from "./pages/SuperAdminToolsPage";
import UserProfilePage from "./pages/UserProfilePage";
import SalesDashboardPage from "./pages/SalesDashboardPage";
import SalesCommandCenterPage from "./pages/SalesCommandCenterPage";
import ColdCallingPage from "./pages/ColdCallingPage";
import SalesFollowUpsPage from "./pages/SalesFollowUpsPage";
import SalesTeamPerformancePage from "./pages/SalesTeamPerformancePage";
import AISalesAssistantPage from "./pages/AISalesAssistantPage";
import SalesKnowledgeBasePage from "./pages/SalesKnowledgeBasePage";
import ProspectFinderPage from "./pages/ProspectFinderPage";
import SalesOpportunitiesPage from "./pages/SalesOpportunitiesPage";
import ClientIntelligenceDashboardPage from "./pages/ClientIntelligenceDashboardPage";
import AccountsDashboardPage from "./pages/AccountsDashboardPage";
import StatewideClientsPage from "./pages/StatewideClientsPage";
import RenewalsPage from "./pages/RenewalsPage";
import AccessRenewalsDashboardPage from "./pages/AccessRenewalsDashboardPage";
import RecurringRevenueDashboardPage from "./pages/RecurringRevenueDashboardPage";
import ExecutiveDashboardPage from "./pages/ExecutiveDashboardPage";
import UnifiedTicketsPage from "./pages/UnifiedTicketsPage";
import UnifiedTicketDetailPage from "./pages/UnifiedTicketDetailPage";
import EmailConfigPage from "./pages/EmailConfigPage";
import BusinessOnboardingWizardPage from "./pages/BusinessOnboardingWizardPage";
import CustomizationRequestsPage from "./pages/CustomizationRequestsPage";
import AppModuleSettingsPage from "./pages/AppModuleSettingsPage";
import DepartmentConfigPage from "./pages/DepartmentConfigPage";
import LeadConversionApprovalsPage from "./pages/LeadConversionApprovalsPage";
import LeadIntelligencePage from "./pages/LeadIntelligencePage";
import SalesProspectsPage from "./pages/SalesProspectsPage";
import SalesPipelinePage from "./pages/SalesPipelinePage";
import SalesClientsPage from "./pages/SalesClientsPage";
import SalesProposalsPage from "./pages/SalesProposalsPage";
import SalesActivitiesPage from "./pages/SalesActivitiesPage";
import SalesToolsPage from "./pages/SalesToolsPage";
import SeoLeadCapturePage from "./pages/SeoLeadCapturePage";
import WhatsAppSupportPage from "./pages/WhatsAppSupportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      refetchInterval: false,
      retry: 1,
    },
  },
});

if (typeof window !== "undefined") {
  queryClient.getQueryCache().subscribe((event) => {
    const queryEvent = event as {
      type?: string;
      action?: { type?: string };
      query?: { queryKey?: readonly unknown[] };
    };

    if (queryEvent.type !== "updated") return;

    if (queryEvent.action?.type === "fetch") {
      console.log("REFETCH TRIGGERED", queryEvent.query?.queryKey ?? []);
    }

    if (queryEvent.action?.type === "fetch" || queryEvent.action?.type === "success") {
      console.log("QUERY RE-RUN", queryEvent.query?.queryKey ?? []);
    }
  });
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
            <Routes>
            {/* Public routes with mega-menu layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/demo" element={<DemoRequestPage />} />
              <Route path="/web-development" element={<WebDevelopmentPage />} />
              <Route path="/mobile-technology" element={<MobileTechnologyPage />} />
              <Route path="/it-solutions" element={<ITSolutionsPage />} />
              <Route path="/e-marketing" element={<EMarketingPage />} />
              <Route path="/automation" element={<AutomationPage />} />
              {/* Platform pages */}
              <Route path="/platform/:slug" element={<PlatformModulePage />} />
              {/* Service pages */}
              <Route path="/services/:slug" element={<ServiceDetailPage />} />
              {/* Industry pages */}
              <Route path="/industries/:slug" element={<IndustryDetailPage />} />
              {/* Solution pages */}
              <Route path="/solutions" element={<PublicPlaceholderPage />} />
              <Route path="/solutions/:slug" element={<PublicPlaceholderPage />} />
              {/* Resources pages */}
              <Route path="/resources" element={<PublicPlaceholderPage />} />
              <Route path="/resources/:slug" element={<PublicPlaceholderPage />} />
            </Route>

            {/* Auth routes (no mega-menu layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/company/:slug/login" element={<CompanyLoginPage />} />
            <Route path="/company/:slug/signup" element={<CompanySignupPage />} />
            <Route path="/company/:slug/:department" element={<DepartmentSignupPage />} />
            <Route path="/client/login" element={<ClientLoginPage />} />
            <Route path="/client/register" element={<ClientRegisterPage />} />
            <Route path="/security-setup" element={<FirstLoginSecurityPage />} />
            <Route path="/login-v2" element={<LoginV2 />} />

            {/* Protected app shell */}
            <Route
              element={
                <ProtectedRoute>
                  <ClientRouteGuard>
                    <AppShell />
                  </ClientRouteGuard>
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sales-dashboard" element={<SalesDashboardPage />} />
              <Route path="/sales-command-center" element={<SalesCommandCenterPage />} />
              <Route path="/cold-calling" element={<ColdCallingPage />} />
              <Route path="/sales-follow-ups" element={<SalesFollowUpsPage />} />
              <Route path="/sales-team-performance" element={<SalesTeamPerformancePage />} />
              <Route path="/ai-sales-assistant" element={<AISalesAssistantPage />} />
              <Route path="/sales-knowledge" element={<SalesKnowledgeBasePage />} />
              <Route path="/prospect-finder" element={<ProspectFinderPage />} />
              <Route path="/sales-opportunities" element={<SalesOpportunitiesPage />} />
              <Route path="/sales/prospects" element={<SalesProspectsPage />} />
              <Route path="/sales/pipeline" element={<SalesPipelinePage />} />
              <Route path="/sales/clients" element={<SalesClientsPage />} />
              <Route path="/sales/proposals" element={<SalesProposalsPage />} />
              <Route path="/sales/activities" element={<SalesActivitiesPage />} />
              <Route path="/sales/tools" element={<SalesToolsPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/inquiries" element={<InquiriesPage />} />
              <Route path="/leads" element={<LeadsPage />} />
              <Route path="/lead-conversion-approvals" element={<LeadConversionApprovalsPage />} />
              <Route path="/lead-intelligence" element={<LeadIntelligencePage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/deals" element={<DealsPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/deal-room" element={<DealRoomPage />} />
              <Route path="/contracts" element={<ContractsPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/:id" element={<ClientProfilePage />} />
              <Route path="/clients/:id/access" element={<ClientAccessHubPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/billing" element={<BillingDashboard />} />
              <Route path="/platform-billing" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><PlatformBillingPage /></ProtectedRoute>
              } />
              <Route path="/tenant-billing" element={<TenantBillingPage />} />
              <Route path="/gateways" element={<GatewayConfigPage />} />
              <Route path="/accounts-dashboard" element={<AccountsDashboardPage />} />
              <Route path="/statewide-clients" element={<StatewideClientsPage />} />
              <Route path="/renewals" element={<RenewalsPage />} />
              <Route path="/access-renewals" element={<AccessRenewalsDashboardPage />} />
              <Route path="/recurring-revenue" element={<RecurringRevenueDashboardPage />} />
              <Route path="/executive-dashboard" element={<ExecutiveDashboardPage />} />
              <Route path="/seo" element={<SeoDashboardPage />} />
              <Route path="/seo/:campaignId" element={<SeoCampaignDetailPage />} />
              <Route path="/seo-ops" element={<Navigate to="/seo" replace />} />
              <Route path="/seo-ops/:projectId" element={<SeoProjectDetailPage />} />
              <Route path="/seo-team" element={<SeoTeamDashboardPage />} />
              <Route path="/seo-intel/:projectId" element={<SeoIntelligencePage />} />
              <Route path="/seo-lead-capture" element={<SeoLeadCapturePage />} />
              <Route path="/seo-exec/:projectId" element={<Navigate to="/seo" replace />} />
              <Route path="/sales-seo-intel" element={<SalesSeoPitchPage />} />
              <Route path="/seo-client-reports" element={<SeoClientReportsPage />} />
              <Route path="/communications" element={<CommunicationsPage />} />
              <Route path="/analytics" element={<AnalyticsDashboardPage />} />
              <Route path="/ai-insights" element={<AIInsightsPage />} />
              <Route path="/ai-intelligence" element={<AIBusinessIntelligencePage />} />
              <Route path="/growth-engine" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><GrowthEnginePage /></ProtectedRoute>
              } />
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
              <Route path="/ai-voice-agents" element={<AIVoiceAgentsPage />} />
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
              <Route path="/team-directory" element={<TeamDirectoryPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/unified-tickets" element={<UnifiedTicketsPage />} />
              <Route path="/unified-ticket/:id" element={<UnifiedTicketDetailPage />} />
              <Route path="/email-config" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><EmailConfigPage /></ProtectedRoute>
              } />
              <Route path="/internal-tickets" element={<InternalTicketsPage />} />
              <Route path="/internal-ticket/:id" element={<InternalTicketDetailPage />} />
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
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><OrgChartPage /></ProtectedRoute>
              } />
              <Route path="/hr/org-chart" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><OrgChartPage /></ProtectedRoute>
              } />
              <Route path="/client-360" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><Client360Page /></ProtectedRoute>
              } />
              <Route path="/vault" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><VaultPage /></ProtectedRoute>
              } />
              <Route path="/job-crm" element={<JobCRMPage />} />
              <Route path="/review-monitor" element={<ReviewMonitorPage />} />
              <Route path="/ai-reports" element={<AIReportsPage />} />
              <Route path="/custom-fields" element={<CustomFieldBuilderPage />} />
              <Route path="/conversations" element={<ConversationsPage />} />
              <Route path="/agent-factory" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AgentFactoryPage /></ProtectedRoute>
              } />
              <Route path="/providers" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><ProviderConnectionsPage /></ProtectedRoute>
              } />
              <Route path="/consent-compliance" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><ConsentCompliancePage /></ProtectedRoute>
              } />
              <Route path="/voice-agent" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><VoiceAgentPage /></ProtectedRoute>
              } />
              <Route path="/autopilot/settings" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AutopilotSettingsPage /></ProtectedRoute>
              } />
              <Route path="/autopilot/sequences" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AutopilotSequencesPage /></ProtectedRoute>
              } />
              <Route path="/autopilot/inbox" element={<AutopilotInboxPage />} />
              <Route path="/ai-brain" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AIBrainPage /></ProtectedRoute>
              } />
              <Route path="/ai-agency-brain" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "manager"]}><AIAgencyBrainPage /></ProtectedRoute>
              } />
              <Route path="/ai-learning" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AILearningPage /></ProtectedRoute>
              } />
              <Route path="/autonomous-agents" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "manager"]}><AutonomousAgentsPage /></ProtectedRoute>
              } />
              <Route path="/ai-sales-brain" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AISalesBrainPage /></ProtectedRoute>
              } />
              <Route path="/websites" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><WebsitesPage /></ProtectedRoute>
              } />
              <Route path="/domains" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><DomainManagementPage /></ProtectedRoute>
              } />
              <Route path="/hosting" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><HostingManagementPage /></ProtectedRoute>
              } />
              <Route path="/lead-routing" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><LeadRoutingPage /></ProtectedRoute>
              } />
              <Route path="/cs-dashboard" element={<CustomerServiceDashboard />} />
              <Route path="/company-accounts" element={<CompanyAccountsPage />} />
              <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="/cs-automation" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><CSAutomationPage /></ProtectedRoute>
              } />
              <Route path="/cs-reports" element={<CSReportsPage />} />
              <Route path="/ai-assistant-settings" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AIAssistantSettingsPage /></ProtectedRoute>
              } />
              <Route path="/customer-portal" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><CustomerPortalPage /></ProtectedRoute>
              } />
              <Route path="/satisfaction-surveys" element={<SatisfactionSurveysPage />} />
              <Route path="/ticket/:id" element={<TicketDetailPage />} />
              <Route path="/customer-app" element={<CustomerMobileAppPage />} />
              <Route path="/client-notifications" element={<ClientNotificationsPage />} />
              <Route path="/client-reports" element={<ClientReportsPage />} />
              <Route path="/client-departments" element={<ClientDepartmentsPage />} />
              <Route path="/client-employees" element={<ClientEmployeesPage />} />
              <Route path="/client-seo-projects" element={<ClientSeoProjectsPage />} />
              <Route path="/client-seo-projects/:projectId" element={<ClientSeoProjectDetailPage />} />
              <Route path="/my-access" element={<ClientAccessHubPage />} />
              <Route path="/client-website-structure" element={<ClientWebsiteStructurePage />} />
              <Route path="/client-website-performance" element={<ClientWebsitePerformancePage />} />
               <Route path="/client-performance-intelligence" element={<ClientPerformanceIntelligencePage />} />
               <Route path="/client-local-presence" element={<ClientLocalPresencePage />} />
               <Route path="/client-leads-dashboard" element={<ClientLeadsDashboardPage />} />
              <Route path="/my-appointments" element={<CustomerAppointmentPage />} />
              <Route path="/staff-app" element={<StaffMobileAppPage />} />
              <Route path="/hr/departments" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><HRDepartmentsPage /></ProtectedRoute>
              } />
              <Route path="/hr/employees" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><HREmployeeListPage /></ProtectedRoute>
              } />
              <Route path="/hr/employee/:employeeId" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager", "manager"]}><HREmployeeProfilePage /></ProtectedRoute>
              } />
              <Route path="/hr/leave" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager", "manager"]}><HRLeaveManagementPage /></ProtectedRoute>
              } />
              <Route path="/hr/payroll" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><HRPayrollPage /></ProtectedRoute>
              } />
              <Route path="/hr/performance" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager", "manager"]}><HRPerformancePage /></ProtectedRoute>
              } />
              <Route path="/hr/tasks" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager", "manager"]}><HRTaskTrackingPage /></ProtectedRoute>
              } />
              <Route path="/hr/analytics" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><HRAnalyticsDashboardPage /></ProtectedRoute>
              } />
              <Route path="/hr/attendance" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager", "manager"]}><WorkforcePage /></ProtectedRoute>
              } />
              <Route path="/manager-dashboard" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "manager"]}><ManagerDashboardPage /></ProtectedRoute>
              } />
              <Route path="/my-dashboard" element={<EmployeeSelfServicePage />} />
              <Route path="/agency-command" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AgencyCommandCenterPage /></ProtectedRoute>
              } />
              <Route path="/client-projects" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "manager"]}><ClientProjectsPage /></ProtectedRoute>
              } />
              <Route path="/task-pipeline" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "manager"]}><TaskPipelinePage /></ProtectedRoute>
              } />
              <Route path="/task/:taskId" element={<TaskDetailPage />} />
              <Route path="/team-hierarchy" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager", "manager"]}><TeamHierarchyPage /></ProtectedRoute>
              } />
              <Route path="/cross-dept-requests" element={<CrossDeptRequestsPage />} />
              <Route path="/dept-dashboard" element={<DepartmentDashboardPage />} />
              <Route path="/workflow-map" element={<WorkflowMapPage />} />
              <Route path="/account-timeline" element={<AccountTimelinePage />} />
              <Route path="/admin-operations" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AdminOperationsDashboardPage /></ProtectedRoute>
              } />
              <Route path="/ceo-dashboard" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><CEODashboardPage /></ProtectedRoute>
              } />
              <Route path="/daily-work-reports" element={<DailyWorkReportsPage />} />
              <Route path="/daily-insights" element={<DailyInsightsPage />} />
              <Route path="/internal-broadcast" element={<InternalBroadcastPage />} />
              <Route path="/employee-activity-monitor" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><EmployeeActivityMonitorPage /></ProtectedRoute>
              } />
              <Route path="/department-performance" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><DepartmentPerformancePage /></ProtectedRoute>
              } />
              <Route path="/workload-monitor" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><WorkloadMonitorPage /></ProtectedRoute>
              } />
              <Route path="/sla-monitor" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><SLAMonitorPage /></ProtectedRoute>
              } />
              <Route path="/usage-analytics" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><UsageAnalyticsPage /></ProtectedRoute>
              } />
              <Route path="/demo-mode" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><DemoModePage /></ProtectedRoute>
              } />
              <Route path="/revenue-intelligence" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><RevenueIntelligencePage /></ProtectedRoute>
               } />
               <Route path="/finance" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><FinanceDashboardPage /></ProtectedRoute>
              } />
              <Route path="/accounts/client-intelligence-dashboard" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><ClientIntelligenceDashboardPage /></ProtectedRoute>
              } />
              <Route path="/xero-test" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><XeroTestPage /></ProtectedRoute>
              } />
              <Route path="/my-billing" element={<ClientBillingPortalPage />} />
              <Route path="/content-management" element={<ContentManagementPage />} />
              <Route path="/website-dev-stages" element={<WebsiteDevStagesPage />} />
              <Route path="/activity-timeline" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><ActivityTimelinePage /></ProtectedRoute>
              } />
              <Route path="/governance-controls" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><GovernanceDashboardPage /></ProtectedRoute>
              } />
              <Route path="/saas-plans" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><SaasPlansPage /></ProtectedRoute>
              } />
              <Route path="/subscriptions" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><SubscriptionsPage /></ProtectedRoute>
              } />
              <Route path="/company-billing" element={<CompanyBillingPortalPage />} />
              <Route path="/white-label-settings" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><WhiteLabelSettingsPage /></ProtectedRoute>
              } />
              <Route
                path="/businesses"
                element={
                  <ProtectedRoute requiredRoles={["super_admin"]}>
                    <Businesses />
                  </ProtectedRoute>
                }
              />
              <Route path="/super-admin-tools" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><SuperAdminToolsPage /></ProtectedRoute>
              } />
              <Route path="/business-admin-management" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><SuperAdminBusinessManagementPage /></ProtectedRoute>
              } />
              <Route path="/super-admin-clients" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><SuperAdminClientManagementPage /></ProtectedRoute>
              } />
              <Route path="/system-health" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><SystemHealthPage /></ProtectedRoute>
              } />
              <Route path="/integrations-overview" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><IntegrationsOverviewPage /></ProtectedRoute>
              } />
              <Route path="/feature-registry" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><FeatureRegistryPage /></ProtectedRoute>
              } />
              <Route path="/client-data-integrity" element={
                <ProtectedRoute requiredRoles={["super_admin"]}><ClientDataIntegrityPage /></ProtectedRoute>
              } />
              <Route path="/advocacy-engine" element={<AdvocacyEnginePage />} />
              <Route path="/whatsapp-support" element={<WhatsAppSupportPage />} />
              <Route path="/user/:userId" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin", "hr_manager"]}><UserProfilePage /></ProtectedRoute>
              } />
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
                path="/role-management"
                element={
                  <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}>
                    <RoleManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workflow-automation"
                element={
                  <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}>
                    <WorkflowAutomationPage />
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
              <Route path="/business-onboarding" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><BusinessOnboardingWizardPage /></ProtectedRoute>
              } />
              <Route path="/customization-requests" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><CustomizationRequestsPage /></ProtectedRoute>
              } />
              <Route path="/app-module-settings" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><AppModuleSettingsPage /></ProtectedRoute>
              } />
              <Route path="/department-config" element={
                <ProtectedRoute requiredRoles={["super_admin", "business_admin"]}><DepartmentConfigPage /></ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
