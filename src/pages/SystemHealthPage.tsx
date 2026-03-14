import { useAuth } from "@/contexts/AuthContext";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Building2, Users, Globe, Smartphone, Monitor, AlertTriangle,
  TrendingUp, Activity, Shield, BarChart3,
} from "lucide-react";

const SystemHealthPage = () => {
  const { isSuperAdmin } = useAuth();
  const { data, loading } = useSystemHealth();

  if (!isSuperAdmin) return <p className="text-muted-foreground p-6">Access denied – Super Admin only</p>;

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="System Health" subtitle="Platform-wide overview" icon={Activity} />
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="System Health Panel" subtitle="Real-time platform overview across all NextWeb OS tenants" icon={Activity} />

      {/* Platform Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Total Businesses" value={data.totalBusinesses} icon={Building2} gradient="from-primary to-accent" />
        <StatCard title="Total Employees" value={data.totalEmployees} icon={Users} gradient="from-blue-500 to-blue-600" />
        <StatCard title="Client Portal Users" value={data.totalClients} icon={Globe} gradient="from-emerald-500 to-emerald-600" />
        <StatCard title="Mobile App Users" value={data.totalMobileUsers} icon={Smartphone} gradient="from-violet-500 to-violet-600" />
        <StatCard title="Total CRM Users" value={data.totalCrmUsers} icon={Monitor} gradient="from-amber-500 to-amber-600" />
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated border-l-4 border-l-destructive">
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> System Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {data.alerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <span className="text-sm">{alert.message}</span>
                <Badge variant={alert.type === "warning" ? "destructive" : "secondary"} className="text-xs">{alert.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active vs Inactive */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Business Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Businesses</span>
              <Badge variant="default" className="text-xs">{data.activeBusinesses}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Inactive Businesses</span>
              <Badge variant="secondary" className="text-xs">{data.inactiveBusinesses}</Badge>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: data.totalBusinesses > 0 ? `${(data.activeBusinesses / data.totalBusinesses) * 100}%` : "0%" }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{data.totalBusinesses > 0 ? Math.round((data.activeBusinesses / data.totalBusinesses) * 100) : 0}% active</p>
          </CardContent>
        </Card>

        {/* Mobile Distribution */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Smartphone className="h-4 w-4" /> Mobile App Distribution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Mobile Access Enabled</span>
              <Badge variant="default" className="text-xs">{data.mobileEnabled}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Mobile Expired</span>
              <Badge variant="destructive" className="text-xs">{data.mobileExpired}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Mobile Disabled</span>
              <Badge variant="secondary" className="text-xs">{data.mobileDisabled}</Badge>
            </div>
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-sm font-medium">Total Downloads</span>
              <span className="text-sm font-bold">{data.totalMobileDownloads}</span>
            </div>
          </CardContent>
        </Card>

        {/* CRM Usage */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Monitor className="h-4 w-4" /> CRM Access</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">CRM Active Businesses</span>
              <Badge variant="default" className="text-xs">{data.crmActiveBusinesses}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">CRM Disabled Businesses</span>
              <Badge variant="secondary" className="text-xs">{data.crmDisabledBusinesses}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Registered Users</span>
              <span className="text-sm font-bold">{data.totalCrmUsers}</span>
            </div>
          </CardContent>
        </Card>

        {/* Growth Snapshot */}
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Growth – Last 30 Days</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">New Businesses</span>
              <Badge variant="default" className="text-xs">+{data.businessesLast30}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Employees</span>
              <Badge variant="default" className="text-xs">+{data.employeesLast30}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Clients</span>
              <Badge variant="default" className="text-xs">+{data.clientsLast30}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Month Activity */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="New Businesses (Month)" value={data.newBusinessesThisMonth} icon={Building2} gradient="from-primary to-accent" />
        <StatCard title="New Employees (Month)" value={data.newEmployeesThisMonth} icon={Users} gradient="from-blue-500 to-blue-600" />
        <StatCard title="New Clients (Month)" value={data.newClientsThisMonth} icon={Globe} gradient="from-emerald-500 to-emerald-600" />
      </div>

      {/* Department Distribution */}
      {data.departmentDistribution.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Department Distribution Across Platform</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Total Across Platform</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.departmentDistribution.slice(0, 15).map(d => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right">{d.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SystemHealthPage;
