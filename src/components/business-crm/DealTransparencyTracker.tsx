import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

interface Props {
  deal: any;
}

const STATUS_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  completed: { icon: CheckCircle, color: "text-green-500" },
  approved: { icon: CheckCircle, color: "text-green-500" },
  submitted: { icon: CheckCircle, color: "text-green-500" },
  signed: { icon: CheckCircle, color: "text-green-500" },
  settled: { icon: CheckCircle, color: "text-green-500" },
  in_progress: { icon: Clock, color: "text-amber-500" },
  pending: { icon: Clock, color: "text-muted-foreground" },
  conditional: { icon: Clock, color: "text-amber-500" },
  partial: { icon: Clock, color: "text-amber-500" },
  delayed: { icon: AlertTriangle, color: "text-destructive" },
  rejected: { icon: XCircle, color: "text-destructive" },
  not_started: { icon: Clock, color: "text-muted-foreground" },
};

function getStatusConfig(status: string | null) {
  return STATUS_ICON[status || "pending"] || STATUS_ICON.pending;
}

export function DealTransparencyTracker({ deal }: Props) {
  const stages = [
    { key: "eoi", label: "EOI", status: deal.eoi_status || "pending", responsible: null },
    { key: "finance", label: "Finance", status: deal.finance_status || (deal.finance_approved ? "approved" : "pending"), responsible: deal.responsible_broker },
    { key: "legal", label: "Legal", status: deal.legal_status || "pending", responsible: deal.responsible_lawyer },
    { key: "deposit", label: "Deposit", status: deal.deposit_status || "pending", responsible: null },
    { key: "contract", label: "Contract", status: deal.contract_status || "pending", responsible: deal.responsible_accountant },
    { key: "settlement", label: "Settlement", status: deal.deal_stage === "settlement" ? "in_progress" : deal.deal_stage === "completed" ? "settled" : "pending", responsible: null },
  ];

  const completedCount = stages.filter(s => ["completed", "approved", "submitted", "signed", "settled"].includes(s.status)).length;
  const progress = Math.round((completedCount / stages.length) * 100);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Deal Progress</span>
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Stage indicators */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {stages.map(stage => {
            const config = getStatusConfig(stage.status);
            const Icon = config.icon;
            return (
              <div key={stage.key} className="text-center space-y-1">
                <Icon className={`h-4 w-4 mx-auto ${config.color}`} />
                <p className="text-[10px] font-medium text-foreground">{stage.label}</p>
                <Badge variant="outline" className="text-[8px] py-0">
                  {(stage.status || "pending").replace(/_/g, " ")}
                </Badge>
                {stage.responsible && (
                  <p className="text-[9px] text-muted-foreground truncate">{stage.responsible}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Blockers */}
        {(deal.blocker_summary || deal.delay_reason) && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-destructive/5 border border-destructive/10">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
            <div>
              {deal.delay_reason && <p className="text-[11px] text-destructive font-medium">Delay: {deal.delay_reason}</p>}
              {deal.blocker_summary && <p className="text-[11px] text-muted-foreground">{deal.blocker_summary}</p>}
            </div>
          </div>
        )}

        {deal.pending_actions && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/10">
            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground">Pending: {deal.pending_actions}</p>
          </div>
        )}

        {deal.next_action_owner && (
          <p className="text-[10px] text-muted-foreground">Next action: <span className="text-foreground font-medium">{deal.next_action_owner}</span></p>
        )}
      </CardContent>
    </Card>
  );
}
