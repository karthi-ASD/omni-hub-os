import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Target } from "lucide-react";
import type { AICoachingInsight, AIAssistStatus } from "@/hooks/useAICallAssistant";

interface AICoachPanelProps {
  coaching: AICoachingInsight | null;
  status: AIAssistStatus;
}

const SENTIMENT_CONFIG = {
  positive: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  neutral: { icon: Minus, color: "text-amber-600", bg: "bg-amber-500/10" },
  negative: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
};

const RISK_CONFIG = {
  low: { color: "text-emerald-600", bg: "bg-emerald-500/20" },
  medium: { color: "text-amber-600", bg: "bg-amber-500/20" },
  high: { color: "text-destructive", bg: "bg-destructive/20" },
};

const CLOSE_CONFIG = {
  not_ready: { label: "Not Ready", color: "text-muted-foreground" },
  warming: { label: "Warming Up", color: "text-amber-600" },
  ready: { label: "Ready to Close", color: "text-emerald-600" },
};

export function AICoachPanel({ coaching, status }: AICoachPanelProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" /> AI Coach
          </CardTitle>
          <Badge className={`text-[10px] ${
            status === "active" ? "bg-emerald-500/20 text-emerald-700" :
            status === "processing" ? "bg-amber-500/20 text-amber-700" :
            "bg-muted text-muted-foreground"
          }`}>
            {status === "active" ? "Active" : status === "processing" ? "Analyzing..." : "Idle"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 flex-1 overflow-y-auto space-y-3">
        {!coaching ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            <p>Coaching insights appear during calls</p>
          </div>
        ) : (
          <>
            {/* Summary chips */}
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-lg p-2 ${SENTIMENT_CONFIG[coaching.sentiment]?.bg || "bg-muted"}`}>
                <p className="text-[10px] text-muted-foreground font-medium">Sentiment</p>
                <p className={`text-xs font-semibold capitalize ${SENTIMENT_CONFIG[coaching.sentiment]?.color}`}>
                  {coaching.sentiment}
                </p>
              </div>
              <div className={`rounded-lg p-2 ${RISK_CONFIG[coaching.risk]?.bg || "bg-muted"}`}>
                <p className="text-[10px] text-muted-foreground font-medium">Risk</p>
                <p className={`text-xs font-semibold capitalize ${RISK_CONFIG[coaching.risk]?.color}`}>
                  {coaching.risk}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-muted/50">
                <p className="text-[10px] text-muted-foreground font-medium">Close Readiness</p>
                <p className={`text-xs font-semibold ${CLOSE_CONFIG[coaching.closeReadiness]?.color || "text-muted-foreground"}`}>
                  {CLOSE_CONFIG[coaching.closeReadiness]?.label || coaching.closeReadiness}
                </p>
              </div>
              <div className="rounded-lg p-2 bg-muted/50">
                <p className="text-[10px] text-muted-foreground font-medium">Talk Balance</p>
                <p className="text-xs font-semibold capitalize">
                  {coaching.talkListenBalance.replace("_", " ")}
                </p>
              </div>
            </div>

            {/* Intent */}
            <div className="rounded-lg border p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Target className="h-3 w-3 text-primary" />
                <p className="text-[10px] font-semibold text-muted-foreground">Customer Intent</p>
              </div>
              <p className="text-xs leading-relaxed">{coaching.intent}</p>
            </div>

            {/* Opportunity */}
            {coaching.opportunity && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-500/5 p-2">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <p className="text-[10px] font-semibold text-emerald-700">Opportunity</p>
                </div>
                <p className="text-xs leading-relaxed">{coaching.opportunity}</p>
              </div>
            )}

            {/* Coaching Tips */}
            {coaching.tips.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-amber-500" />
                  <p className="text-[10px] font-semibold text-muted-foreground">Coaching Tips</p>
                </div>
                {coaching.tips.map((tip, i) => (
                  <div key={i} className="text-xs pl-4 py-1 border-l-2 border-amber-300 bg-amber-500/5 rounded-r px-2">
                    {tip}
                  </div>
                ))}
              </div>
            )}

            {/* Missed Opportunities */}
            {coaching.missedOpportunities.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-destructive" />
                  <p className="text-[10px] font-semibold text-muted-foreground">Missed Opportunities</p>
                </div>
                {coaching.missedOpportunities.map((m, i) => (
                  <div key={i} className="text-xs pl-4 py-1 border-l-2 border-destructive/30 bg-destructive/5 rounded-r px-2">
                    {m}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
