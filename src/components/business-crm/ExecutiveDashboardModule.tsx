import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserPlus, Building2, Handshake, DollarSign, TrendingUp, Clock, AlertTriangle, CheckCircle, Target } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const GOLD_PALETTE = ["#D4A574", "#C4956A", "#B8860B", "#DAA520", "#CD853F", "#8B7355", "#A0926B", "#6B8E23"];

export function ExecutiveDashboardModule() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const { data: leads = [] } = useQuery({
    queryKey: ["crm-leads-dash", bid], queryFn: async () => {
      const { data } = await supabase.from("crm_leads").select("*").eq("business_id", bid!);
      return data || [];
    }, enabled: !!bid,
  });
  const { data: investors = [] } = useQuery({
    queryKey: ["crm-investors-dash", bid], queryFn: async () => {
      const { data } = await supabase.from("crm_investors").select("*").eq("business_id", bid!);
      return data || [];
    }, enabled: !!bid,
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals-dash", bid], queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*").eq("business_id", bid!);
      return data || [];
    }, enabled: !!bid,
  });
  const { data: properties = [] } = useQuery({
    queryKey: ["crm-props-dash", bid], queryFn: async () => {
      const { data } = await supabase.from("crm_properties").select("*").eq("business_id", bid!);
      return data || [];
    }, enabled: !!bid,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ["crm-tasks-dash", bid], queryFn: async () => {
      const { data } = await supabase.from("crm_tasks").select("*").eq("business_id", bid!).eq("status", "pending");
      return data || [];
    }, enabled: !!bid,
  });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const newLeadsWeek = leads.filter((l: any) => new Date(l.created_at) >= weekAgo).length;
  const qualifiedLeads = leads.filter((l: any) => l.stage === "qualified").length;
  const activeInvestors = investors.length;
  const activeOpps = properties.filter((p: any) => p.availability === "available").length;
  const dealsInProgress = deals.filter((d: any) => !["settled", "lost"].includes(d.deal_stage)).length;
  const totalPipeline = deals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const settledMonth = deals.filter((d: any) => d.deal_stage === "settled" && new Date(d.updated_at).getMonth() === now.getMonth()).length;
  const todayStr = now.toISOString().split("T")[0];
  const tasksDueToday = tasks.filter((t: any) => t.due_date === todayStr).length;
  const financeDelayed = deals.filter((d: any) => d.deal_stage === "finance_in_progress" && d.blocker_summary).length;
  const depositPending = deals.filter((d: any) => d.deposit_status === "pending" && ["deposit_pending"].includes(d.deal_stage)).length;

  const kpis = [
    { label: "New Leads (Week)", value: newLeadsWeek, icon: UserPlus, color: "text-primary" },
    { label: "Qualified Leads", value: qualifiedLeads, icon: Target, color: "text-primary" },
    { label: "Active Investors", value: activeInvestors, icon: Users, color: "text-primary" },
    { label: "Active Opportunities", value: activeOpps, icon: Building2, color: "text-primary" },
    { label: "Deals in Progress", value: dealsInProgress, icon: Handshake, color: "text-primary" },
    { label: "Pipeline Value", value: `$${(totalPipeline / 1e6).toFixed(1)}M`, icon: DollarSign, color: "text-primary" },
    { label: "Settled (Month)", value: settledMonth, icon: CheckCircle, color: "text-primary" },
    { label: "Tasks Due Today", value: tasksDueToday, icon: Clock, color: "text-primary" },
    { label: "Finance Delayed", value: financeDelayed, icon: AlertTriangle, color: "text-destructive" },
    { label: "Deposits Pending", value: depositPending, icon: AlertTriangle, color: "text-amber-500" },
  ];

  // Source chart data
  const sourceMap: Record<string, number> = {};
  leads.forEach((l: any) => { sourceMap[l.source || "Unknown"] = (sourceMap[l.source || "Unknown"] || 0) + 1; });
  const sourceChart = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  // Pipeline stage chart
  const stageMap: Record<string, number> = {};
  deals.forEach((d: any) => { stageMap[d.deal_stage || "unknown"] = (stageMap[d.deal_stage || "unknown"] || 0) + 1; });
  const stageChart = Object.entries(stageMap).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10"><Icon className={`h-4 w-4 ${k.color}`} /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Leads by Source</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            {sourceChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceChart}><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No lead data yet</div>}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Deal Pipeline Distribution</CardTitle></CardHeader>
          <CardContent className="h-[220px]">
            {stageChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={stageChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {stageChart.map((_, i) => <Cell key={i} fill={GOLD_PALETTE[i % GOLD_PALETTE.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No deal data yet</div>}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Urgent Actions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {financeDelayed > 0 && <div className="flex items-center gap-2 text-sm"><Badge variant="destructive" className="text-[10px]">Finance</Badge><span className="text-foreground">{financeDelayed} deal(s) with finance delays</span></div>}
          {depositPending > 0 && <div className="flex items-center gap-2 text-sm"><Badge className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/30">Deposit</Badge><span className="text-foreground">{depositPending} deposit(s) pending</span></div>}
          {tasksDueToday > 0 && <div className="flex items-center gap-2 text-sm"><Badge variant="outline" className="text-[10px]">Tasks</Badge><span className="text-foreground">{tasksDueToday} task(s) due today</span></div>}
          {financeDelayed === 0 && depositPending === 0 && tasksDueToday === 0 && <p className="text-sm text-muted-foreground">No urgent actions — all clear</p>}
        </CardContent>
      </Card>
    </div>
  );
}
