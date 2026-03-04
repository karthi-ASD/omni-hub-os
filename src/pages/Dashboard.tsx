import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  Users, Bell, Calendar, FolderKanban, Phone, Receipt, DollarSign, Building2,
  Target, ClipboardList, MessageSquare, Briefcase, ArrowRight, TrendingUp,
  Sparkles, Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  usePageTitle("Dashboard", "Your NextWeb OS command center — real-time stats, quick actions, and activity feed.");
  const { profile, isSuperAdmin } = useAuth();
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();

  const statCards = [
    ...(isSuperAdmin ? [{ label: "Businesses", value: stats.totalBusinesses, icon: Building2, gradient: "from-[#2563eb] to-[#0ea5e9]" }] : []),
    { label: "Open Deals", value: stats.openDeals, icon: FolderKanban, gradient: "from-[#d4a853] to-[#b8902e]" },
    { label: "Leads", value: stats.totalUsers, icon: Target, gradient: "from-[#22c55e] to-[#16a34a]" },
    { label: "Invoices", value: stats.openInvoices, icon: Receipt, gradient: "from-[#f59e0b] to-[#d97706]" },
    { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, gradient: "from-[#8b5cf6] to-[#7c3aed]" },
    { label: "Calls", value: stats.todayCalls, icon: Phone, gradient: "from-[#ec4899] to-[#db2777]" },
    { label: "Events", value: stats.upcomingEvents, icon: Calendar, gradient: "from-[#2563eb] to-[#0ea5e9]" },
    { label: "Alerts", value: stats.unreadNotifications, icon: Bell, gradient: "from-[#ef4444] to-[#dc2626]" },
  ];

  const quickActions = [
    { label: "Leads", icon: Target, to: "/leads" },
    { label: "Tasks", icon: ClipboardList, to: "/tasks" },
    { label: "Deals", icon: FolderKanban, to: "/deals" },
    { label: "Clients", icon: Users, to: "/clients" },
    { label: "Inquiries", icon: MessageSquare, to: "/inquiries" },
    { label: "Projects", icon: Briefcase, to: "/projects" },
    { label: "Invoices", icon: Receipt, to: "/invoices" },
    { label: "Calendar", icon: Calendar, to: "/calendar" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0a0e1a] via-[#111832] to-[#0a0e1a] border border-[#1e2a4a] p-5">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#d4a853]/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-[#d4a853]" />
            <span className="text-xs text-[#d4a853] font-medium">Dashboard</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Welcome back, {profile?.full_name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Here's what's happening with your business today</p>
        </div>
      </div>

      {/* Stats scroll */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {statCards.map((s) => (
            <Card key={s.label} className="min-w-[140px] shrink-0 bg-[#111832] border-[#1e2a4a] hover:border-[#d4a853]/30 transition-all">
              <CardContent className="p-3.5">
                {loading ? (
                  <Skeleton className="h-10 w-16 bg-[#1e2a4a]" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-500 font-medium">{s.label}</span>
                      <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center`}>
                        <s.icon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-[#d4a853]" /> Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-[#111832] active:bg-[#1e2a4a] transition-colors border border-transparent hover:border-[#1e2a4a]"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#d4a853]/10 to-[#d4a853]/5 border border-[#d4a853]/15 flex items-center justify-center">
                <action.icon className="h-5 w-5 text-[#d4a853]" />
              </div>
              <span className="text-[11px] font-medium text-gray-400">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#2563eb]" /> Activity
          </h2>
          <button onClick={() => navigate("/activity-timeline")} className="text-xs text-[#d4a853] font-medium flex items-center gap-1 hover:text-[#f0d48a] transition-colors">
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <ActivityFeed />
      </div>

      {/* Upcoming */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-[#22c55e]" /> Upcoming
          </h2>
          <button onClick={() => navigate("/calendar")} className="text-xs text-[#d4a853] font-medium flex items-center gap-1 hover:text-[#f0d48a] transition-colors">
            Calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <UpcomingEvents />
      </div>
    </div>
  );
};

export default Dashboard;
