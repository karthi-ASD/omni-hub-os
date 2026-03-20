import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import {
  Building2, Handshake, DollarSign, FileText, TrendingUp,
  Clock, CheckCircle, AlertTriangle, ArrowRight, Bell,
  Banknote, Star, Shield, Rocket,
} from "lucide-react";

const STAGE_ORDER = [
  "new_qualified", "contacted", "qualified", "property_shared", "shortlisted",
  "eoi_submitted", "deposit_pending", "finance_in_progress", "contract_issued",
  "settlement", "closed",
];

const stageProgress = (stage: string) => {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 ? Math.round(((idx + 1) / STAGE_ORDER.length) * 100) : 0;
};

const stageLabel = (s: string) => (s || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function InvestorPortalDashboard() {
  usePageTitle("Investor Dashboard", "Your investment overview");
  const { profile } = useAuth();
  const navigate = useNavigate();
  const bid = profile?.business_id;

  // Get client_id for this user
  const { data: clientLink } = useQuery({
    queryKey: ["investor-client-link", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("client_users")
        .select("client_id").eq("user_id", profile!.user_id).eq("is_primary", true).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const clientId = clientLink?.client_id;

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["investor-deals", bid, clientId],
    queryFn: async () => {
      const { data } = await supabase.from("crm_deals").select("*")
        .eq("business_id", bid!).eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["investor-properties", bid, clientId],
    queryFn: async () => {
      const dealPropertyIds = deals.filter(d => d.property_id).map(d => d.property_id);
      if (dealPropertyIds.length === 0) return [];
      const { data } = await supabase.from("crm_properties").select("*")
        .in("id", dealPropertyIds);
      return data || [];
    },
    enabled: deals.length > 0,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["investor-notifications", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*")
        .eq("user_id", profile!.user_id).eq("is_read", false)
        .order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!profile?.user_id,
  });

  const activeDeals = deals.filter(d => d.deal_stage !== "closed");
  const depositsP = deals.filter(d => d.deposit_status === "pending").length;
  const financeActive = deals.filter(d => d.finance_status === "in_progress" || d.finance_status === "conditional").length;
  const settlementsD = deals.filter(d => d.deal_stage === "settlement").length;
  const totalValue = deals.reduce((s, d) => s + (d.deal_value || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-1">
        <Skeleton className="h-40 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-6 md:p-8 text-primary-foreground">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(var(--accent)/0.15),_transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5" />
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.full_name?.split(" ")[0] || "Investor"}
            </h1>
          </div>
          <p className="text-primary-foreground/70 text-sm mb-4">
            Your investment portfolio at a glance
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Active Deals", value: activeDeals.length, icon: Handshake },
              { label: "Properties", value: properties.length, icon: Building2 },
              { label: "Portfolio Value", value: `$${(totalValue / 1e6).toFixed(1)}M`, icon: DollarSign },
              { label: "Notifications", value: notifications.length, icon: Bell },
            ].map(m => (
              <div key={m.label} className="bg-primary-foreground/10 backdrop-blur-sm rounded-xl p-3 border border-primary-foreground/10">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="h-3.5 w-3.5 text-primary-foreground/60" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-foreground/60">{m.label}</span>
                </div>
                <p className="text-2xl font-black">{typeof m.value === "number" ? m.value : m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Deposits Pending", value: depositsP, icon: Clock, color: "text-amber-500", onClick: () => navigate("/investor/deposits") },
          { label: "Finance Active", value: financeActive, icon: Banknote, color: "text-blue-500", onClick: () => navigate("/investor/finance") },
          { label: "Settlements Due", value: settlementsD, icon: Star, color: "text-emerald-500", onClick: () => navigate("/investor/settlements") },
          { label: "Total Deals", value: deals.length, icon: Handshake, color: "text-primary", onClick: () => navigate("/investor/deals") },
        ].map(k => (
          <Card key={k.label} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={k.onClick}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-card flex items-center justify-center border border-border/50 ${k.color}`}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{k.label}</p>
                <p className="text-xl font-extrabold text-foreground">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Deals Timeline */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" /> Deal Progress
          </CardTitle>
          <button onClick={() => navigate("/investor/deals")} className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
            View All <ArrowRight className="h-3 w-3" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeDeals.length > 0 ? activeDeals.slice(0, 5).map((deal: any) => {
            const progress = stageProgress(deal.deal_stage);
            const hasBlocker = deal.blocker_summary || deal.delay_reason;
            return (
              <div key={deal.id} className="p-3 rounded-xl border border-border/50 hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => navigate("/investor/deals")}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{deal.deal_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : ""} • {stageLabel(deal.deal_stage)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {hasBlocker && <Badge variant="destructive" className="text-[9px]">Blocker</Badge>}
                    <Badge variant="outline" className="text-[9px] font-mono">{progress}%</Badge>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    {deal.deposit_status === "received" ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3" />}
                    Deposit: {(deal.deposit_status || "pending").replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {deal.finance_status === "approved" ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3" />}
                    Finance: {(deal.finance_status || "pending").replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {deal.contract_status === "exchanged" ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Clock className="h-3 w-3" />}
                    Contract: {(deal.contract_status || "pending").replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Handshake className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No active deals yet. Your advisor will update you soon.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" /> Recent Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                <Bell className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground truncate">{n.message}</p>}
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
