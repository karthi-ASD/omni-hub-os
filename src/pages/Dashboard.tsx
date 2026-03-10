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
  Sparkles, Zap, Globe, BarChart3, FileText, CreditCard, Search, Bot,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  usePageTitle("Dashboard", "Your NextWeb OS command center — real-time stats, quick actions, and activity feed.");
  const { profile, isSuperAdmin, hasRole } = useAuth();
  const { stats, loading } = useDashboardStats();
  const { departmentName, designation } = useEmployeeDepartment();
  const navigate = useNavigate();
  const isManager = hasRole("manager");
  const deptLower = departmentName?.toLowerCase() ?? "";
  const isFinanceDept = deptLower.includes("finance") || deptLower.includes("accounts");
  const isSeoDept = deptLower.includes("seo");

  const getStatCards = () => {
    if (isManager && isFinanceDept) {
      return [
        { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-neon-green to-accent" },
        { label: "Invoices", value: stats.openInvoices, icon: Receipt, gradient: "from-neon-blue to-primary" },
        { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-neon-orange to-warning" },
        { label: "Clients", value: stats.totalUsers, icon: Users, gradient: "from-primary to-neon-purple" },
        { label: "Calls", value: stats.todayCalls, icon: Phone, gradient: "from-accent to-neon-blue" },
        { label: "Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-neon-green to-success" },
        { label: "Alerts", value: stats.unreadNotifications, icon: Bell, gradient: "from-neon-pink to-destructive" },
      ];
    }
    if (isManager && isSeoDept) {
      return [
        { label: "Clients", value: stats.totalUsers, icon: Users, gradient: "from-primary to-neon-purple" },
        { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-neon-green to-success" },
        { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-neon-orange to-warning" },
        { label: "Calls", value: stats.todayCalls, icon: Phone, gradient: "from-accent to-neon-blue" },
        { label: "Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-neon-green to-success" },
        { label: "Alerts", value: stats.unreadNotifications, icon: Bell, gradient: "from-neon-pink to-destructive" },
      ];
    }
    return [
      ...(isSuperAdmin ? [{ label: "Businesses", value: stats.totalBusinesses, icon: Building2, gradient: "from-neon-purple to-primary" }] : []),
      { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-primary to-accent" },
      { label: "Leads", value: stats.totalUsers, icon: Target, gradient: "from-neon-green to-success" },
      { label: "Invoices", value: stats.openInvoices, icon: Receipt, gradient: "from-neon-orange to-warning" },
      { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-accent to-neon-blue" },
      { label: "Calls", value: stats.todayCalls, icon: Phone, gradient: "from-neon-blue to-info" },
      { label: "Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-neon-green to-success" },
      { label: "Alerts", value: stats.unreadNotifications, icon: Bell, gradient: "from-neon-pink to-destructive" },
    ];
  };

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
        { label: "Projects", icon: FolderKanban, to: "/seo-ops" },
        { label: "Team", icon: Users, to: "/seo-team" },
        { label: "Tasks", icon: ClipboardList, to: "/tasks" },
        { label: "Clients", icon: Users, to: "/clients" },
        { label: "Reports", icon: BarChart3, to: "/reports" },
        { label: "Keywords", icon: Search, to: "/seo" },
        { label: "Calendar", icon: Calendar, to: "/calendar" },
      ];
    }
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
    if (isManager && isFinanceDept) return "Finance Command Center";
    if (isManager && isSeoDept) return "SEO Command Center";
    return "Command Center";
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
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-background/10" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -mr-10 -mt-10 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full -ml-8 -mb-8 blur-xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 bg-primary-foreground/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Bot className="h-3.5 w-3.5 text-primary-foreground" />
              <span className="text-[11px] text-primary-foreground font-semibold tracking-wide uppercase">{getDashboardTitle()}</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-primary-foreground mt-2">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-primary-foreground/70 mt-1">{getDashboardSubtitle()}</p>
          {isManager && (isFinanceDept || isSeoDept) && (
            <p className="text-xs text-primary-foreground/50 mt-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {designation} · {departmentName} Department
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {statCards.map((s, idx) => (
            <Card key={s.label} className="min-w-[130px] shrink-0 glass-card hover-lift border-0" style={{ animationDelay: `${idx * 50}ms` }}>
              <CardContent className="p-3.5">
                {loading ? (
                  <Skeleton className="h-12 w-16" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{s.label}</span>
                      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                        <s.icon className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold tracking-tight">{s.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl glass-card hover-lift transition-all duration-200 border-0 group"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-primary" /> Activity
          </h2>
          <button onClick={() => navigate("/activity-timeline")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <ActivityFeed />
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-success" /> Upcoming
          </h2>
          <button onClick={() => navigate("/calendar")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline transition-colors">
            Calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <UpcomingEvents />
      </div>
    </div>
  );
};

export default Dashboard;
