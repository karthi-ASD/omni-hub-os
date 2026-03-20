import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  DollarSign, Banknote, FileText, Star, Clock, CheckCircle,
  AlertTriangle, User,
} from "lucide-react";

type StatusType = "deposits" | "finance" | "contracts" | "settlements";

const STATUS_CONFIG: Record<StatusType, {
  title: string; subtitle: string; icon: any; field: string;
  statuses: { key: string; label: string; color: string }[];
}> = {
  deposits: {
    title: "Deposit Status", subtitle: "Track your $1,000 initial deposits",
    icon: DollarSign, field: "deposit_status",
    statuses: [
      { key: "pending", label: "Pending", color: "text-amber-500" },
      { key: "received", label: "Received", color: "text-emerald-500" },
      { key: "held_in_trust", label: "Held in Trust", color: "text-blue-500" },
      { key: "refunded", label: "Refunded", color: "text-muted-foreground" },
    ],
  },
  finance: {
    title: "Finance Status", subtitle: "Track your finance approvals (2-4 weeks)",
    icon: Banknote, field: "finance_status",
    statuses: [
      { key: "not_started", label: "Not Started", color: "text-muted-foreground" },
      { key: "in_progress", label: "In Progress", color: "text-blue-500" },
      { key: "conditional", label: "Conditional", color: "text-amber-500" },
      { key: "approved", label: "Approved", color: "text-emerald-500" },
      { key: "rejected", label: "Rejected", color: "text-destructive" },
      { key: "delayed", label: "Delayed", color: "text-destructive" },
    ],
  },
  contracts: {
    title: "Contract Status", subtitle: "Track your contract progress",
    icon: FileText, field: "contract_status",
    statuses: [
      { key: "not_started", label: "Not Started", color: "text-muted-foreground" },
      { key: "drafted", label: "Drafted", color: "text-blue-500" },
      { key: "issued", label: "Issued", color: "text-amber-500" },
      { key: "signed", label: "Signed", color: "text-emerald-500" },
      { key: "exchanged", label: "Exchanged", color: "text-emerald-600" },
    ],
  },
  settlements: {
    title: "Settlement Status", subtitle: "Track your settlement dates",
    icon: Star, field: "deal_stage",
    statuses: [
      { key: "settlement", label: "Due", color: "text-amber-500" },
      { key: "closed", label: "Settled", color: "text-emerald-500" },
    ],
  },
};

interface Props {
  statusType: StatusType;
}

export default function InvestorStatusPage({ statusType }: Props) {
  const config = STATUS_CONFIG[statusType];
  usePageTitle(config.title, config.subtitle);
  const { profile } = useAuth();
  const bid = profile?.business_id;
  const Icon = config.icon;

  const { data: clientLink } = useQuery({
    queryKey: ["investor-client-link", profile?.user_id],
    queryFn: async () => {
      const { data } = await supabase.from("client_users")
        .select("client_id").eq("user_id", profile!.user_id).eq("is_primary", true).maybeSingle();
      return data;
    },
    enabled: !!profile?.user_id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ["investor-status-deals", bid, clientLink?.client_id, statusType],
    queryFn: async () => {
      const { data } = await (supabase.from("crm_deals") as any).select("*")
        .eq("business_id", bid!).eq("client_id", clientLink!.client_id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!bid && !!clientLink?.client_id,
  });

  // Group by status
  const grouped = config.statuses.map(s => ({
    ...s,
    deals: deals.filter((d: any) => {
      const val = statusType === "settlements" ? d.deal_stage : (d as any)[config.field];
      return val === s.key;
    }),
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{config.title}</h1>
          <p className="text-xs text-muted-foreground">{config.subtitle}</p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {grouped.map(g => (
          <Card key={g.key} className="rounded-xl border-0 shadow-sm flex-shrink-0 min-w-[120px]">
            <CardContent className="p-3 text-center">
              <p className={`text-lg font-bold ${g.color}`}>{g.deals.length}</p>
              <p className="text-[9px] text-muted-foreground">{g.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Deal Cards by Status */}
      {grouped.filter(g => g.deals.length > 0).map(g => (
        <div key={g.key}>
          <h2 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${g.color}`}>
            <div className={`w-2 h-2 rounded-full bg-current`} />
            {g.label} ({g.deals.length})
          </h2>
          <div className="space-y-3">
            {g.deals.map((deal: any) => (
              <Card key={deal.id} className="rounded-xl border-0 shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{deal.deal_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {deal.deal_value ? `$${Number(deal.deal_value).toLocaleString()}` : ""}
                        {deal.deal_type ? ` • ${deal.deal_type}` : ""}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${g.color}`}>{g.label}</Badge>
                  </div>

                  {statusType === "settlements" && deal.settlement_target_date && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-semibold">{format(new Date(deal.settlement_target_date), "dd MMM yyyy")}</span>
                    </div>
                  )}

                  {deal.responsible_broker && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />Broker: <span className="text-foreground">{deal.responsible_broker}</span>
                    </p>
                  )}

                  {(deal.blocker_summary || deal.delay_reason) && (
                    <div className="flex items-start gap-1.5 text-xs text-destructive mt-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{deal.blocker_summary || deal.delay_reason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {deals.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No deals to display</p>
        </div>
      )}
    </div>
  );
}
