import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Shield, BarChart3, Clock, Activity } from "lucide-react";

const Dashboard = () => {
  const { profile, roles, isSuperAdmin, isBusinessAdmin } = useAuth();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

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
            : `Welcome to NextWeb OS`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isSuperAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Businesses</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">—</p>
              <p className="text-xs text-muted-foreground mt-1">Total tenants</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Events today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Audit Logs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Recent actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">99.9%</p>
            <p className="text-xs text-muted-foreground mt-1">System health</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
            <p className="text-xs text-muted-foreground mt-1">Coming in Stage 2</p>
          </CardContent>
        </Card>
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
