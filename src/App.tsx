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

            {/* Protected app shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
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
              <Route path="/notifications" element={<NotificationsPage />} />
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
