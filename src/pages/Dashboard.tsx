import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield, Activity, Clock, Bell, Calendar, ArrowRight, BarChart3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { profile, roles, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { stats, loading } = useDashboardStats();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const StatCard = ({ title, value, icon: Icon, subtitle }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle: string;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting()}, {profile?.full_name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isSuperAdmin
            ? "Super Admin — Global overview"
            : isBusinessAdmin
            ? "Business Admin — Your tenant overview"
            : "Welcome to NextWeb OS"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSuperAdmin && (
          <>
            <StatCard
              title="Businesses"
              value={stats.totalBusinesses}
              icon={Building2}
              subtitle={`${stats.activeBusinesses} active · ${stats.suspendedBusinesses} suspended`}
            />
          </>
        )}
        <StatCard
          title="Users"
          value={stats.totalUsers}
          icon={Users}
          subtitle="Active users"
        />
        <StatCard
          title="Events Today"
          value={stats.recentEventsCount}
          icon={Activity}
          subtitle="System events"
        />
        <StatCard
          title="Notifications"
          value={stats.unreadNotifications}
          icon={Bell}
          subtitle="Unread"
        />
        <StatCard
          title="Upcoming"
          value={stats.upcomingEvents}
          icon={Calendar}
          subtitle="Calendar events"
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Activity Feed + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <UpcomingEvents />
        </div>
      </div>

      {/* Role info card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile?.full_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role(s)</span>
            <span className="font-medium capitalize">{roles.join(", ").replace(/_/g, " ") || "No role assigned"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
