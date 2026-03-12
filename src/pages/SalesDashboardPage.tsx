import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesTeam } from "@/hooks/useSalesTeam";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, Target, CalendarCheck, Handshake, TrendingDown, Users, BarChart3, DollarSign, UserCheck, XCircle, CheckCircle, Trophy } from "lucide-react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface DailyMetrics {
  callsToday: number;
  leadsToday: number;
  followUpsToday: number;
  dealsWon: number;
  dealsLost: number;
  dealsInProgress: number;
  totalActiveLeads: number;
}

interface ClientWithRevenue {
  id: string;
  contact_name: string;
  company_name: string | null;
  client_status: string;
  sales_owner_id: string | null;
  salesperson_owner: string | null;
  totalRevenue: number;
  outstanding: number;
}

const SalesDashboardPage = () => {
  const { profile, user, isSuperAdmin, isBusinessAdmin } = useAuth();
  const { members: salesTeam } = useSalesTeam();
  const isAdmin = isSuperAdmin || isBusinessAdmin;

  const [metrics, setMetrics] = useState<DailyMetrics>({
    callsToday: 0, leadsToday: 0, followUpsToday: 0,
    dealsWon: 0, dealsLost: 0, dealsInProgress: 0, totalActiveLeads: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; clients: number; lost: number }[]>([]);
  const [clientsData, setClientsData] = useState<ClientWithRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const currentUserId = user?.id;

  // For non-admin sales users, filter to their own clients
  const myClients = useMemo(() => {
    if (isAdmin) return clientsData;
    return clientsData.filter(c => c.sales_owner_id === currentUserId);
  }, [clientsData, currentUserId, isAdmin]);

  const clientMetrics = useMemo(() => {
    const active = myClients.filter(c => c.client_status === "active").length;
    const cancelled = myClients.filter(c => c.client_status === "cancelled").length;
    const totalRevenue = myClients.reduce((s, c) => s + c.totalRevenue, 0);
    const outstanding = myClients.reduce((s, c) => s + c.outstanding, 0);
    return { total: myClients.length, active, cancelled, totalRevenue, outstanding };
  }, [myClients]);

  // Salesperson leaderboard (admin only)
  const leaderboard = useMemo(() => {
    if (!isAdmin) return [];
    const map: Record<string, { name: string; clients: number; active: number; cancelled: number; revenue: number }> = {};
    clientsData.forEach(c => {
      const key = c.sales_owner_id || "unassigned";
      const name = c.salesperson_owner || "Unassigned";
      if (!map[key]) map[key] = { name, clients: 0, active: 0, cancelled: 0, revenue: 0 };
      map[key].clients++;
      if (c.client_status === "active") map[key].active++;
      if (c.client_status === "cancelled") map[key].cancelled++;
      map[key].revenue += c.totalRevenue;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [clientsData, isAdmin]);

  const fetchAll = useCallback(async () => {
    if (!profile?.business_id) return;
    const today = new Date();
    const dayStart = startOfDay(today).toISOString();
    const dayEnd = endOfDay(today).toISOString();

    const [callsRes, leadsRes, followUpsRes, dealsRes, activeLeadsRes, clientsRes, invoicesRes] = await Promise.all([
      supabase.from("cold_calls").select("id", { count: "exact", head: true })
        .eq("business_id", profile.business_id)
        .gte("created_at", dayStart).lte("created_at", dayEnd),
      supabase.from("leads").select("id", { count: "exact", head: true })
        .eq("business_id", profile.business_id)
        .gte("created_at", dayStart).lte("created_at", dayEnd),
      supabase.from("cold_calls").select("id", { count: "exact", head: true })
        .eq("business_id", profile.business_id)
        .eq("follow_up_date", format(today, "yyyy-MM-dd")),
      supabase.from("deals").select("stage")
        .eq("business_id", profile.business_id),
      supabase.from("leads").select("id", { count: "exact", head: true })
        .eq("business_id", profile.business_id).eq("status", "active"),
      supabase.from("clients").select("id, contact_name, company_name, client_status, sales_owner_id, salesperson_owner")
        .eq("business_id", profile.business_id),
      supabase.from("xero_invoices").select("client_id, total, amount_due, status")
        .eq("business_id", profile.business_id),
    ]);

    const deals = dealsRes.data || [];
    setMetrics({
      callsToday: callsRes.count || 0,
      leadsToday: leadsRes.count || 0,
      followUpsToday: followUpsRes.count || 0,
      dealsWon: deals.filter(d => d.stage === "won").length,
      dealsLost: deals.filter(d => d.stage === "lost").length,
      dealsInProgress: deals.filter(d => !["won", "lost"].includes(d.stage)).length,
      totalActiveLeads: activeLeadsRes.count || 0,
    });

    // Build client revenue map
    const invoices = (invoicesRes.data || []) as any[];
    const revenueMap: Record<string, { total: number; outstanding: number }> = {};
    invoices.forEach(inv => {
      if (!inv.client_id) return;
      if (!revenueMap[inv.client_id]) revenueMap[inv.client_id] = { total: 0, outstanding: 0 };
      revenueMap[inv.client_id].total += Number(inv.total) || 0;
      if (inv.status !== "PAID") revenueMap[inv.client_id].outstanding += Number(inv.amount_due) || 0;
    });

    const enriched: ClientWithRevenue[] = ((clientsRes.data || []) as any[]).map(c => ({
      ...c,
      totalRevenue: revenueMap[c.id]?.total || 0,
      outstanding: revenueMap[c.id]?.outstanding || 0,
    }));
    setClientsData(enriched);

    // Monthly data
    const monthly: { month: string; clients: number; lost: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = subMonths(today, i);
      const mStart = startOfMonth(m).toISOString();
      const mEnd = endOfMonth(m).toISOString();
      const [newRes, lostRes] = await Promise.all([
        supabase.from("clients").select("id", { count: "exact", head: true })
          .eq("business_id", profile.business_id)
          .gte("created_at", mStart).lte("created_at", mEnd),
        supabase.from("deals").select("id", { count: "exact", head: true })
          .eq("business_id", profile.business_id).eq("stage", "lost")
          .gte("created_at", mStart).lte("created_at", mEnd),
      ]);
      monthly.push({ month: format(m, "MMM"), clients: newRes.count || 0, lost: lostRes.count || 0 });
    }
    setMonthlyData(monthly);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sales Dashboard" subtitle={isAdmin ? "Team performance overview" : "Your performance overview"} icon={BarChart3} />

      {/* Daily Activity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Calls Today" value={metrics.callsToday} icon={Phone} gradient="from-primary to-accent" />
        <StatCard label="New Leads" value={metrics.leadsToday} icon={Target} gradient="from-neon-blue to-info" />
        <StatCard label="Follow-ups Today" value={metrics.followUpsToday} icon={CalendarCheck} gradient="from-warning to-neon-orange" />
        <StatCard label="Active Leads" value={metrics.totalActiveLeads} icon={Users} gradient="from-neon-green to-success" />
      </div>

      {/* Client Ownership Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="My Clients" value={clientMetrics.total} icon={UserCheck} gradient="from-primary to-accent" />
        <StatCard label="Active" value={clientMetrics.active} icon={CheckCircle} gradient="from-neon-green to-success" />
        <StatCard label="Cancelled" value={clientMetrics.cancelled} icon={XCircle} gradient="from-destructive to-neon-orange" />
        <StatCard label="Revenue" value={`$${(clientMetrics.totalRevenue / 1000).toFixed(0)}k`} icon={DollarSign} gradient="from-info to-neon-blue" />
        <StatCard label="Outstanding" value={`$${(clientMetrics.outstanding / 1000).toFixed(0)}k`} icon={TrendingDown} gradient="from-warning to-neon-orange" />
      </div>

      {/* Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Deals Won" value={metrics.dealsWon} icon={Handshake} gradient="from-success to-neon-green" />
        <StatCard label="In Progress" value={metrics.dealsInProgress} icon={BarChart3} gradient="from-info to-neon-blue" />
        <StatCard label="Deals Lost" value={metrics.dealsLost} icon={TrendingDown} gradient="from-destructive to-neon-orange" />
      </div>

      {/* Charts + Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader><CardTitle className="text-sm">Monthly New Clients</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="clients" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader><CardTitle className="text-sm">Monthly Lost Deals</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip />
                <Line type="monotone" dataKey="lost" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Admin: Sales Leaderboard */}
      {isAdmin && leaderboard.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" /> Sales Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Salesperson</TableHead>
                  <TableHead className="text-right">Clients</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Cancelled</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((sp, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell className="text-right">{sp.clients}</TableCell>
                    <TableCell className="text-right">{sp.active}</TableCell>
                    <TableCell className="text-right">{sp.cancelled}</TableCell>
                    <TableCell className="text-right font-semibold">${sp.revenue.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top Clients */}
      {myClients.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardHeader><CardTitle className="text-sm">Top Clients by Revenue</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myClients.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10).map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.contact_name}</TableCell>
                    <TableCell><Badge variant={c.client_status === "active" ? "default" : "secondary"}>{c.client_status}</Badge></TableCell>
                    <TableCell className="text-right">${c.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${c.outstanding.toLocaleString()}</TableCell>
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

export default SalesDashboardPage;
