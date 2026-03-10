import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import {
  Users, Bell, Calendar, FolderKanban, Phone, Receipt, DollarSign, Building2,
  Target, ClipboardList, MessageSquare, Briefcase, ArrowRight, TrendingUp,
  Sparkles, Zap, Globe, BarChart3, FileText, CreditCard, Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  usePageTitle("Dashboard", "Your NextWeb OS command center — real-time stats, quick actions, and activity feed.");
  const { profile, isSuperAdmin, hasRole } = useAuth();
  const { stats, loading } = useDashboardStats();
  const { departmentName, designation } = useEmployeeDepartment();
  const navigate = useNavigate();
  const isManager = hasRole("manager");

  // Determine department context for managers
  const deptLower = departmentName?.toLowerCase() ?? "";
  const isFinanceDept = deptLower.includes("finance") || deptLower.includes("accounts");
  const isSeoDept = deptLower.includes("seo");

  // Build role/department-specific stat cards
  const getStatCards = () => {
    if (isManager && isFinanceDept) {
      return [
        { label: "Monthly Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, color: "text-success" },
        { label: "Invoices", value: stats.openInvoices, icon: Receipt, color: "text-primary" },
        { label: "Open Deals", value: stats.openDeals, icon: FolderKanban, color: "text-warning" },
        { label: "Clients", value: stats.totalUsers, icon: Users, color: "text-info" },
        { label: "Calls", value: stats.todayCalls, icon: Phone, color: "text-primary" },
        { label: "Events", value: stats.upcomingEvents, icon: Calendar, color: "text-success" },
        { label: "Alerts", value: stats.unreadNotifications, icon: Bell, color: "text-destructive" },
      ];
    }

    if (isManager && isSeoDept) {
      return [
        { label: "Clients", value: stats.totalUsers, icon: Users, color: "text-primary" },
        { label: "Open Deals", value: stats.openDeals, icon: FolderKanban, color: "text-success" },
        { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, color: "text-warning" },
        { label: "Calls", value: stats.todayCalls, icon: Phone, color: "text-info" },
        { label: "Events", value: stats.upcomingEvents, icon: Calendar, color: "text-success" },
        { label: "Alerts", value: stats.unreadNotifications, icon: Bell, color: "text-destructive" },
      ];
    }

    // Default cards
    return [
      ...(isSuperAdmin ? [{ label: "Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-primary" }] : []),
      { label: "Open Deals", value: stats.openDeals, icon: FolderKanban, color: "text-primary" },
      { label: "Leads", value: stats.totalUsers, icon: Target, color: "text-success" },
      { label: "Invoices", value: stats.openInvoices, icon: Receipt, color: "text-warning" },
      { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, color: "text-primary" },
      { label: "Calls", value: stats.todayCalls, icon: Phone, color: "text-info" },
      { label: "Events", value: stats.upcomingEvents, icon: Calendar, color: "text-success" },
      { label: "Alerts", value: stats.unreadNotifications, icon: Bell, color: "text-destructive" },
    ];
  };

  // Build role/department-specific quick actions
  const getQuickActions = () => {
    if (isManager && isFinanceDept) {
      return [
        { label: "Billing", icon: CreditCard, to: "/billing" },
        { label: "Invoices", icon: Receipt, to: "/invoices" },
        { label: "Payments", icon: DollarSign, to: "/payments" },
        { label: "Revenue", icon: TrendingUp, to: "/revenue-intelligence" },
        { label: "Clients", icon: Users, to: "/clients" },
        { label: "Deals", icon: FolderKanban, to: "/deals" },
        { label: "Reports", icon: BarChart3, to: "/reports" },
        { label: "Calendar", icon: Calendar, to: "/calendar" },
      ];
    }

    if (isManager && isSeoDept) {
      return [
        { label: "SEO Engine", icon: Globe, to: "/seo" },
        { label: "SEO Projects", icon: FolderKanban, to: "/seo-ops" },
        { label: "SEO Team", icon: Users, to: "/seo-team" },
        { label: "Tasks", icon: ClipboardList, to: "/tasks" },
        { label: "Clients", icon: Users, to: "/clients" },
        { label: "Reports", icon: BarChart3, to: "/reports" },
        { label: "Keywords", icon: Search, to: "/seo" },
        { label: "Calendar", icon: Calendar, to: "/calendar" },
      ];
    }

    // Default
    return [
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Tasks", icon: ClipboardList, to: "/tasks" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Inquiries", icon: MessageSquare, to: "/inquiries" },
      { label: "Projects", icon: Briefcase, to: "/projects" },
      { label: "Invoices", icon: Receipt, to: "/invoices" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
    ];
  };

  const getDashboardTitle = () => {
    if (isManager && isFinanceDept) return "Finance Dashboard";
    if (isManager && isSeoDept) return "SEO Manager Dashboard";
    return "Dashboard";
  };

  const getDashboardSubtitle = () => {
    if (isManager && isFinanceDept) return "Billing, invoices, payments, and revenue overview";
    if (isManager && isSeoDept) return "SEO projects, keyword tracking, and campaign performance";
    return "Here's what's happening with your business today";
  };

  const statCards = getStatCards();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-lg gradient-primary p-5">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-primary-foreground/80" />
            <span className="text-xs text-primary-foreground/80 font-medium">{getDashboardTitle()}</span>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1">{getDashboardSubtitle()}</p>
          {isManager && (isFinanceDept || isSeoDept) && (
            <p className="text-xs text-primary-foreground/50 mt-1">
              {designation} · {departmentName} Department
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {statCards.map((s) => (
            <Card key={s.label} className="min-w-[140px] shrink-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3.5">
                {loading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</span>
                      <s.icon className={`h-4 w-4 ${s.color}`} />
                    </div>
                    <p className="text-2xl font-bold">{s.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg hover:bg-secondary active:bg-secondary/80 transition-colors border border-transparent hover:border-border"
            >
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Activity
          </h2>
          <button onClick={() => navigate("/activity-timeline")} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <ActivityFeed />
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-success" /> Upcoming
          </h2>
          <button onClick={() => navigate("/calendar")} className="text-xs text-primary font-medium flex items-center gap-1 hover:underline transition-colors">
            Calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <UpcomingEvents />
      </div>
    </div>
  );
};

export default Dashboard;
