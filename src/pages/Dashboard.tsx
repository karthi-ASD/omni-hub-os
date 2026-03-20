import { useAuth } from "@/contexts/AuthContext";
import ClientDashboardPage from "@/pages/ClientDashboardPage";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { usePageTitle } from "@/hooks/usePageTitle";
import { InsightPopupModal } from "@/components/insights/InsightPopupModal";
import { TodayInsightWidget } from "@/components/insights/TodayInsightWidget";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import {
  Users, Bell, Calendar, FolderKanban, Phone, Receipt, DollarSign, Building2,
  Target, ClipboardList, MessageSquare, Briefcase, ArrowRight, TrendingUp,
  Sparkles, Zap, Globe, BarChart3, FileText, CreditCard, Search, Bot,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  trend?: number;
}

const KPICard = ({ stat, loading, index }: { stat: StatCard; loading: boolean; index: number }) => (
  <Card
    className="group relative overflow-hidden rounded-2xl border-0 shadow-elevated hover-lift transition-all duration-300"
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <CardContent className="p-4 relative z-10">
      {loading ? (
        <Skeleton className="h-16 w-full" />
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
            <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-glow-sm group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight mb-1">{stat.value}</p>
          {stat.trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend >= 0 ? "text-success" : "text-destructive"}`}>
              {stat.trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(stat.trend)}% vs last month
            </div>
          )}
        </>
      )}
    </CardContent>
    {/* Subtle gradient overlay on hover */}
    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300`} />
  </Card>
);

const Dashboard = () => {

  usePageTitle("Dashboard", "Your NextWeb OS command center — real-time stats, quick actions, and activity feed.");
  const { profile, isSuperAdmin, hasRole, isClientUser, dashboardShell } = useAuth();
  const { stats, loading } = useDashboardStats();
  const { departmentName } = useEmployeeDepartment();
  const navigate = useNavigate();

  // Tenant-side users get the tenant/client dashboard shell
  if (dashboardShell === "client_business" || dashboardShell === "client_portal") return <ClientDashboardPage />;
  const isManager = hasRole("manager");
  const deptLower = departmentName?.toLowerCase() ?? "";
  const isFinanceDept = deptLower.includes("finance") || deptLower.includes("accounts");
  const isSeoDept = deptLower.includes("seo");

  const getStatCards = (): StatCard[] => {
    if (isManager && isFinanceDept) {
      return [
        { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-neon-green to-accent", trend: 12 },
        { label: "Invoices", value: stats.openInvoices, icon: Receipt, gradient: "from-neon-blue to-primary", trend: 5 },
        { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-neon-orange to-warning" },
        { label: "Clients", value: stats.totalUsers, icon: Users, gradient: "from-primary to-neon-purple", trend: 8 },
        { label: "Calls", value: stats.todayCalls, icon: Phone, gradient: "from-accent to-neon-blue" },
        { label: "Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-neon-green to-success" },
        { label: "Alerts", value: stats.unreadNotifications, icon: Bell, gradient: "from-neon-pink to-destructive" },
      ];
    }
    if (isManager && isSeoDept) {
      return [
        { label: "Clients", value: stats.totalUsers, icon: Users, gradient: "from-primary to-neon-purple", trend: 8 },
        { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-neon-green to-success" },
        { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-neon-orange to-warning", trend: 15 },
        { label: "Calls", value: stats.todayCalls, icon: Phone, gradient: "from-accent to-neon-blue" },
        { label: "Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-neon-green to-success" },
        { label: "Alerts", value: stats.unreadNotifications, icon: Bell, gradient: "from-neon-pink to-destructive" },
      ];
    }
    return [
      ...(isSuperAdmin ? [{ label: "Businesses", value: stats.totalBusinesses, icon: Building2, gradient: "from-neon-purple to-primary" } as StatCard] : []),
      { label: "Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-primary to-accent" },
      { label: "Leads", value: stats.totalLeads, icon: Target, gradient: "from-neon-green to-success", trend: 10 },
      { label: "Invoices", value: stats.openInvoices, icon: Receipt, gradient: "from-neon-orange to-warning" },
      { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-accent to-neon-blue", trend: 12 },
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
        { label: "Calendar", icon: Calendar, to: "/calendar" },
        { label: "AI Brain", icon: Bot, to: "/ai-brain" },
      ];
    }
    return [
      { label: "Clients", icon: Users, to: "/clients" },
      { label: "Leads", icon: Target, to: "/leads" },
      { label: "Deals", icon: FolderKanban, to: "/deals" },
      { label: "Inbox", icon: MessageSquare, to: "/autopilot/inbox" },
      { label: "SEO", icon: Globe, to: "/seo" },
      { label: "Calendar", icon: Calendar, to: "/calendar" },
      { label: "Reports", icon: BarChart3, to: "/reports" },
      { label: "AI Brain", icon: Bot, to: "/ai-brain" },
    ];
  };

  const statCards = getStatCards();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Daily Insight Popup */}
      <InsightPopupModal />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile?.full_name?.split(" ")[0] || "User"} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening across your agency today.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((s, idx) => (
          <KPICard key={s.label} stat={s} loading={loading} index={idx} />
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-primary" /> Quick Actions
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-2 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:border-primary/30 hover:shadow-glow-sm transition-all duration-200 group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-all group-hover:scale-110">
                <action.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Insight Widget */}
      <TodayInsightWidget />

      {/* Two-Column Layout for Activity + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" /> Recent Activity
            </h2>
            <button onClick={() => navigate("/activity-timeline")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline transition-colors">
              View All <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-4">
              <ActivityFeed />
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-success" /> Upcoming
            </h2>
            <button onClick={() => navigate("/calendar")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline transition-colors">
              Calendar <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <Card className="rounded-2xl border-0 shadow-elevated">
            <CardContent className="p-4">
              <UpcomingEvents />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
