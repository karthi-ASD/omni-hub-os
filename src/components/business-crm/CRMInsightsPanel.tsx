import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, UserCheck, Clock, Flame, Target, PhoneOff } from "lucide-react";
import { calculateReadiness } from "./InvestorReadinessScore";

export function CRMInsightsPanel() {
  const { profile } = useAuth();

  const { data: investors = [] } = useQuery({
    queryKey: ["crm-investors", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_investors").select("*").eq("business_id", profile!.business_id!);
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["crm-deals", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*").eq("business_id", profile!.business_id!);
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["crm-tasks", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_tasks").select("*").eq("business_id", profile!.business_id!).neq("status", "completed");
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  const { data: comms = [] } = useQuery({
    queryKey: ["crm-comms-recent", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase.from("crm_communications").select("linked_id, created_at").eq("business_id", profile!.business_id!).eq("linked_type", "investor").order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!profile?.business_id,
  });

  // Computed insights
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Ready to convert
  const readyInvestors = investors.filter((i: any) => calculateReadiness(i).score >= 70);

  // Most active (most comms in last 30 days)
  const commsByInvestor: Record<string, number> = {};
  comms.forEach((c: any) => { commsByInvestor[c.linked_id] = (commsByInvestor[c.linked_id] || 0) + 1; });
  const mostActive = investors
    .map((i: any) => ({ ...i, commCount: commsByInvestor[i.id] || 0 }))
    .sort((a: any, b: any) => b.commCount - a.commCount)
    .slice(0, 5);

  // Not contacted recently
  const contactedIds = new Set(comms.filter((c: any) => c.created_at > sevenDaysAgo).map((c: any) => c.linked_id));
  const notContacted = investors.filter((i: any) => !contactedIds.has(i.id));

  // Overdue tasks
  const overdueTasks = tasks.filter((t: any) => t.due_date && t.due_date < today);

  // Deals at risk
  const atRiskDeals = deals.filter((d: any) =>
    d.risk_rating === "high" || d.delay_reason || d.blocker_summary ||
    (d.deal_stage !== "completed" && d.deal_stage !== "settlement" && d.settlement_date && d.settlement_date < today)
  );

  const insights = [
    {
      icon: Target, color: "text-green-500", bg: "bg-green-500/10",
      label: "Ready to Convert", value: readyInvestors.length,
      items: readyInvestors.slice(0, 3).map((i: any) => i.full_name),
    },
    {
      icon: Flame, color: "text-primary", bg: "bg-primary/10",
      label: "Most Active", value: mostActive.filter((i: any) => i.commCount > 0).length,
      items: mostActive.slice(0, 3).map((i: any) => `${i.full_name} (${i.commCount})`),
    },
    {
      icon: PhoneOff, color: "text-amber-500", bg: "bg-amber-500/10",
      label: "Not Contacted (7d)", value: notContacted.length,
      items: notContacted.slice(0, 3).map((i: any) => i.full_name),
    },
    {
      icon: Clock, color: "text-destructive", bg: "bg-destructive/10",
      label: "Overdue Tasks", value: overdueTasks.length,
      items: overdueTasks.slice(0, 3).map((t: any) => t.title),
    },
    {
      icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10",
      label: "Deals at Risk", value: atRiskDeals.length,
      items: atRiskDeals.slice(0, 3).map((d: any) => d.deal_name),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" /> Intelligence Insights
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map(ins => (
          <Card key={ins.label} className="bg-card border-border">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg ${ins.bg}`}>
                  <ins.icon className={`h-3.5 w-3.5 ${ins.color}`} />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{ins.value}</p>
                  <p className="text-[10px] text-muted-foreground">{ins.label}</p>
                </div>
              </div>
              {ins.items.length > 0 && (
                <div className="space-y-0.5">
                  {ins.items.map((item, idx) => (
                    <p key={idx} className="text-[10px] text-muted-foreground truncate">• {item}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
