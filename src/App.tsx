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
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
