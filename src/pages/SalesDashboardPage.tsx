import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Target, CalendarCheck, Handshake, TrendingDown, Users, BarChart3 } from "lucide-react";
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

const SalesDashboardPage = () => {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DailyMetrics>({
    callsToday: 0, leadsToday: 0, followUpsToday: 0,
    dealsWon: 0, dealsLost: 0, dealsInProgress: 0, totalActiveLeads: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; clients: number; lost: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!profile?.business_id) return;
    const today = new Date();
    const dayStart = startOfDay(today).toISOString();
    const dayEnd = endOfDay(today).toISOString();

    const [callsRes, leadsRes, followUpsRes, dealsRes, activeLeadsRes] = await Promise.all([
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

    // Monthly client data (last 6 months)
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
          .eq("business_id", profile.business_id).eq("stage", "closed_lost")
          .gte("created_at", mStart).lte("created_at", mEnd),
      ]);
      monthly.push({ month: format(m, "MMM"), clients: newRes.count || 0, lost: lostRes.count || 0 });
    }
    setMonthlyData(monthly);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) return <div className="space-y-4 p-6">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Sales Dashboard" subtitle="Daily performance overview" icon={BarChart3} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Calls Today" value={metrics.callsToday} icon={Phone} gradient="from-primary to-accent" />
        <StatCard label="New Leads" value={metrics.leadsToday} icon={Target} gradient="from-neon-blue to-info" />
        <StatCard label="Follow-ups Today" value={metrics.followUpsToday} icon={CalendarCheck} gradient="from-warning to-neon-orange" />
        <StatCard label="Active Leads" value={metrics.totalActiveLeads} icon={Users} gradient="from-neon-green to-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Deals Won" value={metrics.dealsWon} icon={Handshake} gradient="from-success to-neon-green" />
        <StatCard label="In Progress" value={metrics.dealsInProgress} icon={BarChart3} gradient="from-info to-neon-blue" />
        <StatCard label="Deals Lost" value={metrics.dealsLost} icon={TrendingDown} gradient="from-destructive to-neon-orange" />
      </div>

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
    </div>
  );
};

export default SalesDashboardPage;
