import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, TrendingDown, Users, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { format, parseISO, startOfMonth, subMonths } from "date-fns";

const SeoClientReportsPage = () => {
  const { profile } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.business_id) return;
    const fetch = async () => {
      setLoading(true);
      const [{ data: cl }, { data: ld }] = await Promise.all([
        supabase.from("clients").select("id, contact_name, created_at, status, onboarding_status, website, city, state")
          .eq("business_id", profile.business_id).order("created_at", { ascending: false }),
        supabase.from("leads").select("id, name, created_at, source, status")
          .eq("business_id", profile.business_id).order("created_at", { ascending: false }).limit(1000),
      ]);
      setClients(cl || []);
      setLeads(ld || []);
      setLoading(false);
    };
    fetch();
  }, [profile?.business_id]);

  // Monthly new clients (last 12 months)
  const monthlyNewClients = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const m = format(subMonths(new Date(), i), "yyyy-MM");
      months[m] = 0;
    }
    clients.forEach(c => {
      const m = c.created_at?.slice(0, 7);
      if (m && months[m] !== undefined) months[m]++;
    });
    return Object.entries(months).map(([month, count]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy"),
      count,
    }));
  }, [clients]);

  // Monthly lost clients (status = cancelled/inactive/lost)
  const lostStatuses = ["cancelled", "inactive", "lost", "churned"];
  const monthlyLostClients = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const m = format(subMonths(new Date(), i), "yyyy-MM");
      months[m] = 0;
    }
    clients.filter(c => lostStatuses.includes(c.status?.toLowerCase())).forEach(c => {
      const m = c.created_at?.slice(0, 7);
      if (m && months[m] !== undefined) months[m]++;
    });
    return Object.entries(months).map(([month, count]) => ({
      month: format(parseISO(month + "-01"), "MMM yyyy"),
      count,
    }));
  }, [clients]);

  // Daily leads (last 30 days)
  const dailyLeads = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(subMonths(new Date(), 0).getTime() - i * 86400000 > 0
        ? new Date(Date.now() - i * 86400000) : new Date(), "yyyy-MM-dd");
      const realD = format(new Date(Date.now() - i * 86400000), "yyyy-MM-dd");
      days[realD] = 0;
    }
    leads.forEach(l => {
      const d = l.created_at?.slice(0, 10);
      if (d && days[d] !== undefined) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: format(parseISO(date), "dd MMM"),
      count,
    }));
  }, [leads]);

  const activeClients = clients.filter(c => !lostStatuses.includes(c.status?.toLowerCase())).length;
  const lostCount = clients.filter(c => lostStatuses.includes(c.status?.toLowerCase())).length;
  const totalLeadsThisMonth = leads.filter(l => l.created_at?.slice(0, 7) === format(new Date(), "yyyy-MM")).length;

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="SEO Client Reports" subtitle="New clients, lost clients & lead tracking" icon={BarChart3} />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />Active Clients</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{activeClients}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3" />Lost Clients</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{lostCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />Leads This Month</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-primary">{totalLeadsThisMonth}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" />Total Clients</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{clients.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="new-clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new-clients">New Clients</TabsTrigger>
          <TabsTrigger value="lost-clients">Lost Clients</TabsTrigger>
          <TabsTrigger value="leads">Daily Leads</TabsTrigger>
        </TabsList>

        <TabsContent value="new-clients">
          <Card>
            <CardHeader><CardTitle>New Clients Per Month (Last 12 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyNewClients}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="New Clients" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lost-clients">
          <Card>
            <CardHeader><CardTitle>Lost Clients Per Month (Last 12 Months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={monthlyLostClients}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Lost Clients" fill="hsl(var(--destructive))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <Card>
            <CardHeader><CardTitle>Daily Leads (Last 30 Days)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={dailyLeads}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Leads" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SeoClientReportsPage;
