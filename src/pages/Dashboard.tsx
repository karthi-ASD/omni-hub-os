import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import {
  Users, Activity, Bell, Calendar, FolderKanban, Phone, Receipt, DollarSign, Building2,
  Target, ClipboardList, MessageSquare, Briefcase, ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { profile, isSuperAdmin } = useAuth();
  const { stats, loading } = useDashboardStats();
  const navigate = useNavigate();

  const statCards = [
    ...(isSuperAdmin ? [{ label: "Businesses", value: stats.totalBusinesses, icon: Building2, color: "text-primary" }] : []),
    { label: "Open Deals", value: stats.openDeals, icon: FolderKanban, color: "text-primary" },
    { label: "Leads", value: stats.totalUsers, icon: Target, color: "text-accent" },
    { label: "Invoices", value: stats.openInvoices, icon: Receipt, color: "text-warning" },
    { label: "Revenue", value: `$${stats.revenueThisMonth.toFixed(0)}`, icon: DollarSign, color: "text-success" },
    { label: "Calls", value: stats.todayCalls, icon: Phone, color: "text-info" },
    { label: "Events", value: stats.upcomingEvents, icon: Calendar, color: "text-primary" },
    { label: "Alerts", value: stats.unreadNotifications, icon: Bell, color: "text-destructive" },
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
    <div className="space-y-5 animate-fade-in">
      {/* Stats scroll */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {statCards.map((s) => (
            <Card key={s.label} className="min-w-[130px] shrink-0">
              <CardContent className="p-3">
                {loading ? (
                  <Skeleton className="h-10 w-16" />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground font-medium">{s.label}</span>
                      <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                    </div>
                    <p className="text-xl font-bold">{s.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
            >
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-[11px] font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity</h2>
          <button
            onClick={() => navigate("/activity-timeline")}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <ActivityFeed />
      </div>

      {/* Upcoming Events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming</h2>
          <button
            onClick={() => navigate("/calendar")}
            className="text-xs text-primary font-medium flex items-center gap-1"
          >
            Calendar <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <UpcomingEvents />
      </div>
    </div>
  );
};

export default Dashboard;
