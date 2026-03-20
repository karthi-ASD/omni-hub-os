import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  Handshake, DollarSign, Clock, CheckCircle, AlertTriangle,
  FileText, Banknote, Building2, User,
} from "lucide-react";

const STAGE_ORDER = [
  "new_qualified", "contacted", "qualified", "property_shared", "shortlisted",
  "eoi_submitted", "deposit_pending", "finance_in_progress", "contract_issued",
  "settlement", "closed",
];

const STAGE_LABELS: Record<string, string> = {
  new_qualified: "New", contacted: "Contacted", qualified: "Qualified",
  property_shared: "Property Shared", shortlisted: "Shortlisted",
  eoi_submitted: "EOI Submitted", deposit_pending: "Deposit Pending",
  finance_in_progress: "Finance", contract_issued: "Contract Issued",
  settlement: "Settlement", closed: "Closed",
};

const stageProgress = (stage: string) => {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx >= 0 ? Math.round(((idx + 1) / STAGE_ORDER.length) * 100) : 0;
};

const StatusIcon = ({ status, type }: { status: string; type: string }) => {
  const done = ["received", "approved", "exchanged", "signed", "completed", "accepted"].includes(status);
  const warn = ["delayed", "rejected", "pending"].includes(status);
  if (done) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
  if (warn) return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
};

export default function InvestorDealsPage() {
  usePageTitle("Deal Progress", "Track your investment deals");
  const { profile } = useAuth();
  const bid = profile?.business_id;

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

  const { data: deals = [] } = useQuery({
    queryKey: ["investor-deals-full", bid, clientId],
    queryFn: async () => {
      const { data } = await (supabase.from("crm_deals") as any).select("*")
        .eq("business_id", bid!).eq("client_id", clientId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid && !!clientId,
  });

  const active = deals.filter((d: any) => d.deal_stage !== "closed");
  const closed = deals.filter((d: any) => d.deal_stage === "closed");

  const renderDeal = (deal: any) => {
    const progress = stageProgress(deal.deal_stage);
    return (
      <Card key={deal.id} className="rounded-2xl border-0 shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">{deal.deal_name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : ""}
                {deal.deal_type ? ` • ${deal.deal_type}` : ""}
                {deal.created_at ? ` • Started ${format(new Date(deal.created_at), "dd MMM yyyy")}` : ""}
              </p>
            </div>
            <Badge variant={deal.deal_stage === "closed" ? "default" : "secondary"} className="text-[10px]">
              {STAGE_LABELS[deal.deal_stage] || deal.deal_stage}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
              <span>Progress</span>
              <span className="font-semibold text-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2.5" />
          </div>

          {/* Pipeline Steps */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STAGE_ORDER.map((s, i) => {
              const idx = STAGE_ORDER.indexOf(deal.deal_stage);
              const isDone = i <= idx;
              const isCurrent = i === idx;
              return (
                <div key={s} className={`flex-shrink-0 px-2 py-1 rounded-md text-[9px] font-medium border transition-colors ${
                  isCurrent ? "bg-primary text-primary-foreground border-primary" :
                  isDone ? "bg-primary/10 text-primary border-primary/20" :
                  "bg-muted/30 text-muted-foreground border-border/30"
                }`}>
                  {STAGE_LABELS[s] || s}
                </div>
              );
            })}
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "EOI", status: deal.eoi_status || "none", icon: FileText },
              { label: "Deposit", status: deal.deposit_status || "pending", icon: DollarSign },
              { label: "Finance", status: deal.finance_status || "not_started", icon: Banknote },
              { label: "Contract", status: deal.contract_status || "not_started", icon: FileText },
              { label: "Legal", status: deal.legal_status || "not_started", icon: FileText },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-card">
                <StatusIcon status={item.status} type={item.label} />
                <div>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-semibold text-foreground capitalize">{item.status.replace(/_/g, " ")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Settlement */}
          {deal.settlement_target_date && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl border border-border/50 bg-card">
              <Clock className="h-4 w-4 text-primary" />
              <div>
                <p className="text-[10px] text-muted-foreground">Settlement Target</p>
                <p className="text-xs font-semibold text-foreground">
                  {format(new Date(deal.settlement_target_date), "dd MMM yyyy")}
                </p>
              </div>
            </div>
          )}

          {/* Third Parties */}
          <div className="flex gap-3 flex-wrap text-[10px] text-muted-foreground">
            {deal.responsible_broker && <span className="flex items-center gap-1"><User className="h-3 w-3" />Broker: <span className="text-foreground">{deal.responsible_broker}</span></span>}
            {deal.responsible_lawyer && <span className="flex items-center gap-1"><User className="h-3 w-3" />Lawyer: <span className="text-foreground">{deal.responsible_lawyer}</span></span>}
            {deal.responsible_accountant && <span className="flex items-center gap-1"><User className="h-3 w-3" />Accountant: <span className="text-foreground">{deal.responsible_accountant}</span></span>}
          </div>

          {/* Blockers */}
          {(deal.blocker_summary || deal.delay_reason) && (
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Update Required
              </p>
              <p className="text-xs text-destructive/80 mt-1">{deal.blocker_summary || deal.delay_reason}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Handshake className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Deal Progress</h1>
          <p className="text-xs text-muted-foreground">Track every stage of your investment journey</p>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">Active <Badge variant="secondary" className="text-[9px] h-4 px-1">{active.length}</Badge></TabsTrigger>
          <TabsTrigger value="closed" className="gap-1.5">Closed <Badge variant="secondary" className="text-[9px] h-4 px-1">{closed.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="space-y-4 mt-4">
          {active.length > 0 ? active.map(renderDeal) : (
            <div className="text-center py-12 text-muted-foreground">
              <Handshake className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No active deals</p>
            </div>
          )}
        </TabsContent>
        <TabsContent value="closed" className="space-y-4 mt-4">
          {closed.length > 0 ? closed.map(renderDeal) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No completed deals yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
