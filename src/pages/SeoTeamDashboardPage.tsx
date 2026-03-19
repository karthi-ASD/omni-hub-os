import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Gauge, Users, CheckCircle2, Clock, AlertCircle, Search,
  MapPin, ArrowRight, ShieldAlert,
} from "lucide-react";

interface AssignedClient {
  id: string;
  client_id: string;
  package_name: string;
  seo_manager_id: string | null;
  client_name: string;
  client_email: string | null;
  seo_data: {
    radius_km?: number;
    suburbs?: string[];
    keyword_count?: number;
    strategy_type?: string;
  } | null;
  onboarding_steps: {
    id: string;
    step_name: string;
    status: string;
  }[];
  seo_step_status: "pending" | "in_progress" | "completed" | "none";
  task_total: number;
  task_pending: number;
  task_in_progress: number;
}

const SeoTeamDashboardPage = () => {
  const navigate = useNavigate();
  const { user, roles, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const [clients, setClients] = useState<AssignedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const isSEO =
    isSuperAdmin ||
    isBusinessAdmin ||
    (departmentName || "").toLowerCase().includes("seo") ||
    (departmentName || "").toLowerCase().includes("digital marketing");

  useEffect(() => {
    if (!user?.id || !isSEO) return;

    const fetchClients = async () => {
      setLoading(true);

      // Build query — admins see all, SEO members see their assignments
      let query = supabase
        .from("client_packages" as any)
        .select(`
          id,
          client_id,
          package_name,
          seo_manager_id,
          clients(contact_name, email),
          seo_package_data(radius_km, suburbs, keyword_count, strategy_type),
          package_onboarding_status(id, step_name, status)
        `);

      if (!isSuperAdmin && !isBusinessAdmin) {
        query = query.eq("seo_manager_id", user.id);
      }

      const { data, error } = await query;

      console.log("[SEO Dashboard] USER ID:", user.id);
      console.log("[SEO Dashboard] IS ADMIN:", isSuperAdmin || isBusinessAdmin);
      console.log("[SEO Dashboard] RAW DATA:", data);
      if (error) console.error("[SEO Dashboard] FETCH ERROR:", error);

      const mapped: AssignedClient[] = ((data as any[]) || []).map((pkg: any) => {
        const clientInfo = Array.isArray(pkg.clients) ? pkg.clients[0] : pkg.clients;
        const seoData = Array.isArray(pkg.seo_package_data) ? pkg.seo_package_data[0] : pkg.seo_package_data;
        const steps = (pkg.package_onboarding_status || []) as any[];
        const seoStep = steps.find((s: any) => s.step_name === "SEO Setup");

        return {
          id: pkg.id,
          client_id: pkg.client_id,
          package_name: pkg.package_name || "Untitled Package",
          seo_manager_id: pkg.seo_manager_id,
          client_name: clientInfo?.contact_name || "Unknown Client",
          client_email: clientInfo?.email || null,
          seo_data: seoData || null,
          onboarding_steps: steps,
          seo_step_status: seoStep?.status || "none",
        };
      });

      setClients(mapped);
      setLoading(false);
    };

    fetchClients();
  }, [user?.id, isSEO, isSuperAdmin, isBusinessAdmin]);

  // Stats
  const stats = useMemo(() => {
    const total = clients.length;
    const pending = clients.filter(c => c.seo_step_status === "pending" || c.seo_step_status === "none").length;
    const inProgress = clients.filter(c => c.seo_step_status === "in_progress").length;
    const completed = clients.filter(c => c.seo_step_status === "completed").length;
    return { total, pending, inProgress, completed };
  }, [clients]);

  // Filtered clients
  const filtered = useMemo(() => {
    let list = clients;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.client_name.toLowerCase().includes(q) ||
        c.package_name.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        list = list.filter(c => c.seo_step_status === "pending" || c.seo_step_status === "none");
      } else {
        list = list.filter(c => c.seo_step_status === statusFilter);
      }
    }
    return list;
  }, [clients, searchQuery, statusFilter]);

  if (!isSEO) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive/60" />
        <h2 className="text-xl font-bold text-foreground">Unauthorized</h2>
        <p className="text-muted-foreground">This dashboard is restricted to SEO team members only.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">In Progress</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Pending</Badge>;
    }
  };

  const getActionLabel = (status: string) => {
    switch (status) {
      case "completed": return "View";
      case "in_progress": return "Continue";
      default: return "Start";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="SEO Team Dashboard"
        subtitle="Track assigned clients, onboarding progress & SEO setup"
        icon={Gauge}
      />

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Assigned" value={stats.total} icon={Users} gradient="from-primary to-accent" />
          <StatCard label="SEO Pending" value={stats.pending} icon={AlertCircle} gradient="from-amber-500 to-orange-500" alert={stats.pending > 0} />
          <StatCard label="In Progress" value={stats.inProgress} icon={Clock} gradient="from-blue-500 to-cyan-500" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} gradient="from-emerald-500 to-green-500" />
        </div>
      )}

      {/* Search + Filter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assigned Clients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                {clients.length === 0 ? "No SEO assignments yet" : "No clients match your filter"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>SEO Status</TableHead>
                    <TableHead className="text-center">Suburbs</TableHead>
                    <TableHead className="text-center">Keywords</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(client => (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{client.client_name}</p>
                          {client.client_email && (
                            <p className="text-xs text-muted-foreground">{client.client_email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{client.package_name}</TableCell>
                      <TableCell>{getStatusBadge(client.seo_step_status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {(client.seo_data?.suburbs as string[])?.length || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {client.seo_data?.keyword_count || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={client.seo_step_status === "completed" ? "outline" : "default"}
                          onClick={() => navigate(`/client-package/${client.client_id}`)}
                          className="gap-1"
                        >
                          {getActionLabel(client.seo_step_status)}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SeoTeamDashboardPage;
