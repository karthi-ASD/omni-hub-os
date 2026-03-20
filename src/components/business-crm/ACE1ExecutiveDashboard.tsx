import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, UserPlus, Building2, Handshake, DollarSign, TrendingUp,
  Clock, AlertTriangle, CheckCircle, Target, FileText, Calendar, ClipboardList,
  ShieldAlert, Repeat, BarChart3,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { CRMInsightsPanel } from "./CRMInsightsPanel";
import { useEmployeeDepartment } from "@/hooks/useEmployeeDepartment";

const PALETTE = [
  "hsl(var(--primary))", "hsl(var(--accent))",
  "#D4A574", "#C4956A", "#B8860B", "#DAA520", "#CD853F", "#8B7355",
];

type DashRole = "owner" | "admin" | "sales" | "accounts" | "hr";

function resolveViewRole(roles: string[], departmentName: string | null): DashRole {
  if (roles.includes("super_admin") || roles.includes("business_admin")) return "owner";
  const dept = (departmentName || "").toLowerCase();
  if (dept.includes("account") || dept.includes("finance")) return "accounts";
  if (dept.includes("hr") || dept.includes("human")) return "hr";
  if (dept.includes("sale")) return "sales";
  if (roles.includes("hr_manager")) return "hr";
  return "admin";
}

export function ACE1ExecutiveDashboard() {
  const { profile, roles } = useAuth();
  const { departmentName } = useEmployeeDepartment();
  const bid = profile?.business_id;
  const viewRole = resolveViewRole(roles, departmentName);

  const { data: leads = [] } = useQuery({
    queryKey: ["ace1-leads", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_leads").select("*").eq("business_id", bid!);
      return data || [];
    },
    enabled: !!bid,
  });

  const { data: investors = [] } = useQuery({
    queryKey: ["ace1-investors", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_investors").select("*").eq("business_id", bid!);
      return data || [];
    },
    enabled: !!bid,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["ace1-deals", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*").eq("business_id", bid!);
      return data || [];
    },
    enabled: !!bid,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["ace1-properties", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_properties").select("*").eq("business_id", bid!);
      return data || [];
    },
    enabled: !!bid,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["ace1-tasks", bid],
    queryFn: async () => {
      const { data } = await supabase.from("crm_tasks").select("*").eq("business_id", bid!).eq("status", "pending");
      return data || [];
    },
    enabled: !!bid,
  });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const todayStr = now.toISOString().split("T")[0];

  // Common metrics
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l: any) => l.priority === "hot" || l.stage === "qualified").length;
  const newLeadsWeek = leads.filter((l: any) => new Date(l.created_at) >= weekAgo).length;
  const uncontacted = leads.filter((l: any) => l.stage === "new" && !l.last_contacted_at).length;
  const dealsInProgress = deals.filter((d: any) => !["settled", "lost"].includes(d.deal_stage)).length;
  const depositPending = deals.filter((d: any) => d.deposit_status === "pending").length;
  const financeDelayed = deals.filter((d: any) => d.deal_stage === "finance_in_progress" && d.blocker_summary).length;
  const totalPipeline = deals.reduce((s: number, d: any) => s + (d.deal_value || 0), 0);
  const settledMonth = deals.filter((d: any) => d.deal_stage === "settled" && new Date(d.updated_at).getMonth() === now.getMonth()).length;
  const tasksDueToday = tasks.filter((t: any) => t.due_date === todayStr).length;
  const repeatInvestors = investors.filter((i: any) => (i.total_deals || 0) > 1).length;
  const highRisk = deals.filter((d: any) => d.risk_level === "high" || d.blocker_summary).length;

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
      {/* Role Badge */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Executive Dashboard</h2>
          <p className="text-xs text-muted-foreground">Property Investment Command Centre</p>
        </div>
        <Badge variant="outline" className="text-xs capitalize">{viewRole} View</Badge>
      </div>

      {/* OWNER VIEW */}
      {viewRole === "owner" && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total Leads", value: totalLeads, icon: Target, color: "text-primary" },
              { label: "Hot Leads", value: hotLeads, icon: TrendingUp, color: "text-amber-500" },
              { label: "Deals in Progress", value: dealsInProgress, icon: Handshake, color: "text-primary" },
              { label: "Deposits Pending", value: depositPending, icon: AlertTriangle, color: "text-amber-500" },
              { label: "Finance Delays", value: financeDelayed, icon: ShieldAlert, color: "text-destructive" },
              { label: "Settlements Due", value: settledMonth, icon: CheckCircle, color: "text-emerald-500" },
              { label: "Revenue Pipeline", value: `$${(totalPipeline / 1e6).toFixed(1)}M`, icon: DollarSign, color: "text-primary" },
              { label: "Repeat Investors", value: repeatInvestors, icon: Repeat, color: "text-primary" },
              { label: "High-Risk Deals", value: highRisk, icon: AlertTriangle, color: "text-destructive" },
              { label: "Tasks Due Today", value: tasksDueToday, icon: Clock, color: "text-muted-foreground" },
            ].map((k) => {
              const Icon = k.icon;
              return (
                <Card key={k.label} className="bg-card border-border">
                  <CardContent className="p-3 flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-primary/10"><Icon className={`h-4 w-4 ${k.color}`} /></div>
                    <div><p className="text-lg font-bold text-foreground">{k.value}</p><p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p></div>
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
                ) : <p className="flex items-center justify-center h-full text-muted-foreground text-sm">No lead data yet</p>}
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Deal Pipeline</CardTitle></CardHeader>
              <CardContent className="h-[220px]">
                {stageChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={stageChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                      {stageChart.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie><Tooltip /></PieChart>
                  </ResponsiveContainer>
                ) : <p className="flex items-center justify-center h-full text-muted-foreground text-sm">No deal data yet</p>}
              </CardContent>
            </Card>
          </div>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Urgent Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {financeDelayed > 0 && <div className="flex items-center gap-2 text-sm"><Badge variant="destructive" className="text-[10px]">Finance</Badge><span>{financeDelayed} deal(s) with finance delays</span></div>}
              {depositPending > 0 && <div className="flex items-center gap-2 text-sm"><Badge className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">Deposit</Badge><span>{depositPending} deposit(s) pending</span></div>}
              {highRisk > 0 && <div className="flex items-center gap-2 text-sm"><Badge variant="destructive" className="text-[10px]">Risk</Badge><span>{highRisk} high-risk deal(s)</span></div>}
              {financeDelayed === 0 && depositPending === 0 && highRisk === 0 && <p className="text-sm text-muted-foreground">No urgent actions — all clear</p>}
            </CardContent>
          </Card>
        </>
      )}

      {/* ADMIN VIEW */}
      {viewRole === "admin" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Leads to Assign", value: leads.filter((l: any) => !l.assigned_to).length, icon: UserPlus },
            { label: "Uncontacted Leads", value: uncontacted, icon: Target },
            { label: "Invalid Leads", value: leads.filter((l: any) => l.stage === "disqualified").length, icon: AlertTriangle },
            { label: "Pending Documents", value: deals.filter((d: any) => d.deal_stage === "documents_pending").length, icon: FileText },
            { label: "Follow-Ups Due", value: tasksDueToday, icon: Calendar },
            { label: "Open Tickets", value: 0, icon: Clock },
            { label: "New This Week", value: newLeadsWeek, icon: TrendingUp },
            { label: "Total Pipeline", value: `$${(totalPipeline / 1e6).toFixed(1)}M`, icon: DollarSign },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="bg-card border-border">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-lg font-bold text-foreground">{k.value}</p><p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* SALES VIEW */}
      {viewRole === "sales" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "My Leads", value: totalLeads, icon: Target },
            { label: "Follow-Ups Due", value: tasksDueToday, icon: Calendar },
            { label: "Deals Closing", value: deals.filter((d: any) => ["negotiation", "contract_review"].includes(d.deal_stage)).length, icon: Handshake },
            { label: "Lost Leads", value: leads.filter((l: any) => l.stage === "lost").length, icon: AlertTriangle },
            { label: "Hot Leads", value: hotLeads, icon: TrendingUp },
            { label: "Pipeline Value", value: `$${(totalPipeline / 1e6).toFixed(1)}M`, icon: DollarSign },
            { label: "Properties Matched", value: properties.filter((p: any) => p.availability === "available").length, icon: Building2 },
            { label: "Deposits Pending", value: depositPending, icon: Clock },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="bg-card border-border">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-lg font-bold text-foreground">{k.value}</p><p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ACCOUNTS VIEW */}
      {viewRole === "accounts" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Payments Due", value: depositPending, icon: DollarSign },
            { label: "Commissions Pending", value: deals.filter((d: any) => d.deal_stage === "settled" && !d.commission_paid).length, icon: Handshake },
            { label: "Settled This Month", value: settledMonth, icon: CheckCircle },
            { label: "Pipeline Value", value: `$${(totalPipeline / 1e6).toFixed(1)}M`, icon: BarChart3 },
            { label: "Finance Delayed", value: financeDelayed, icon: AlertTriangle },
            { label: "Total Deals", value: deals.length, icon: FileText },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="bg-card border-border">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-lg font-bold text-foreground">{k.value}</p><p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* HR VIEW */}
      {viewRole === "hr" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Team Members", value: investors.length || "–", icon: Users },
            { label: "Tasks Due Today", value: tasksDueToday, icon: Calendar },
            { label: "Pending Follow-Ups", value: tasks.length, icon: ClipboardList },
          ].map(k => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="bg-card border-border">
                <CardContent className="p-3 flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-primary/10"><Icon className="h-4 w-4 text-primary" /></div>
                  <div><p className="text-lg font-bold text-foreground">{k.value}</p><p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Insights for Owner/Admin */}
      {(viewRole === "owner" || viewRole === "admin") && (
        <div className="md:col-span-2">
          <CRMInsightsPanel />
        </div>
      )}
    </div>
  );
}
