import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Props {
  investor: any;
  compact?: boolean;
}

export function calculateReadiness(investor: any): { score: number; label: string } {
  let score = 0;

  // Finance readiness (0-25)
  if (investor.finance_status === "pre-approved") score += 25;
  else if (investor.finance_status === "conditional") score += 15;
  else if (investor.finance_status === "unknown") score += 5;

  // Deposit readiness (0-25)
  if (investor.deposit_readiness === "ready") score += 25;
  else if (investor.deposit_readiness === "partial") score += 15;
  else if (investor.deposit_readiness === "unknown") score += 5;

  // Document/profile completeness (0-20)
  let completeness = 0;
  if (investor.email) completeness += 3;
  if (investor.phone) completeness += 3;
  if (investor.occupation) completeness += 2;
  if (investor.annual_income_band) completeness += 3;
  if (investor.borrowing_capacity_band) completeness += 3;
  if (investor.investment_goals || investor.long_term_goals) completeness += 3;
  if (investor.preferred_name) completeness += 1;
  if (investor.referred_by) completeness += 2;
  score += Math.min(completeness, 20);

  // Engagement level (0-15)
  if (investor.investor_tier === "platinum") score += 15;
  else if (investor.investor_tier === "gold") score += 12;
  else if (investor.investor_tier === "silver") score += 8;
  else score += 3;

  // Timeline urgency (0-15)
  if (investor.timeline_to_invest === "immediate") score += 15;
  else if (investor.timeline_to_invest === "1_3_months") score += 12;
  else if (investor.timeline_to_invest === "3_6_months") score += 8;
  else if (investor.timeline_to_invest === "6_12_months") score += 4;
  else score += 2;

  score = Math.min(score, 100);
  const label = score >= 70 ? "high" : score >= 40 ? "medium" : "low";
  return { score, label };
}

const LABEL_STYLES: Record<string, string> = {
  high: "bg-green-500/10 text-green-500 border-green-500/30",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  low: "bg-red-500/10 text-red-400 border-red-400/30",
};

export function InvestorReadinessScore({ investor, compact = false }: Props) {
  const { score, label } = calculateReadiness(investor);

  if (compact) {
    return (
      <Badge variant="outline" className={`text-[10px] ${LABEL_STYLES[label]}`}>
        {score}% {label}
      </Badge>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Readiness</span>
        <Badge variant="outline" className={`text-[10px] ${LABEL_STYLES[label]}`}>
          {label.charAt(0).toUpperCase() + label.slice(1)}
        </Badge>
      </div>
      <Progress value={score} className="h-1.5" />
      <p className="text-[10px] text-muted-foreground text-right">{score}/100</p>
    </div>
  );
}
