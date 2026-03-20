import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigate, useNavigate } from "react-router-dom";
import { Building2, Users, TrendingUp, Ticket, Clock, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function NextWebMasterDashboard() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: businesses = [] } = useQuery({
    queryKey: ["master-businesses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, status, created_at, slug, email")
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["master-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nextweb_service_requests" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: isSuperAdmin,
  });

  const { data: clientCount = 0 } = useQuery({
    queryKey: ["master-client-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
    enabled: isSuperAdmin,
  });

  const { data: leadCount = 0 } = useQuery({
    queryKey: ["master-lead-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true });
      return count || 0;
    },
    enabled: isSuperAdmin,
  });

  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  const activeBusinesses = businesses.filter((b: any) => b.status === "active").length;
  const pendingRequests = requests.filter((r: any) => r.status === "pending").length;
  const resolvedRequests = requests.filter((r: any) => r.status === "resolved" || r.status === "closed").length;

  const kpis = [
    { label: "Total Businesses", value: businesses.length, icon: Building2, color: "text-primary" },
    { label: "Active Businesses", value: activeBusinesses, icon: CheckCircle, color: "text-green-500" },
    { label: "Total Clients", value: clientCount, icon: Users, color: "text-blue-500" },
    { label: "Total Leads", value: leadCount, icon: TrendingUp, color: "text-purple-500" },
    { label: "Open Requests", value: pendingRequests, icon: Clock, color: "text-yellow-500" },
    { label: "Resolved Requests", value: resolvedRequests, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NextWeb Master Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform-wide overview across all tenants</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Businesses */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Businesses</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/nextweb-clients")} className="text-xs">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {businesses.slice(0, 8).map((b: any) => (
              <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{b.email || b.slug}</p>
                </div>
                <Badge variant={b.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {b.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Service Requests</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin-service-requests")} className="text-xs">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No requests yet</p>
            ) : (
              requests.slice(0, 8).map((r: any) => (
                <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.title}</p>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px]">{r.request_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(r.created_at), "dd MMM")}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{r.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
