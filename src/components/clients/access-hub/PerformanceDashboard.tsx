import { useAnalyticsSnapshots, AiInsight } from "@/hooks/useAnalyticsSnapshots";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp, TrendingDown, BarChart3, Search, DollarSign,
  Users, MousePointerClick, Lightbulb, X, RefreshCw, Target,
} from "lucide-react";

interface Props {
  clientId?: string;
  projectId?: string;
}

const severityColors: Record<string, string> = {
  info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  success: "bg-success/10 text-success border-success/20",
};

export function PerformanceDashboard({ clientId, projectId }: Props) {
  const {
    analyticsData, seoData, adsData, roi, insights,
    loading, dismissInsight, generateInsights,
  } = useAnalyticsSnapshots(clientId, projectId);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  // Aggregate latest metrics
  const latestGA = analyticsData[0]?.metrics_json || {};
  const latestSEO = seoData[0]?.metrics_json || {};
  const latestAds = adsData[0]?.metrics_json || {};

  const stats = [
    {
      label: "Sessions",
      value: latestGA.sessions ?? roi?.breakdown_json?.sessions ?? "—",
      icon: Users,
      color: "text-primary",
    },
    {
      label: "Search Clicks",
      value: latestSEO.clicks ?? roi?.breakdown_json?.gsc_clicks ?? "—",
      icon: Search,
      color: "text-blue-500",
    },
    {
      label: "Ad Spend",
      value: roi?.total_spend != null ? `$${Number(roi.total_spend).toFixed(0)}` : "—",
      icon: DollarSign,
      color: "text-orange-500",
    },
    {
      label: "ROI",
      value: roi?.roi_multiple != null ? `${roi.roi_multiple}x` : "—",
      icon: Target,
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(s => (
          <Card key={s.label} className="rounded-xl border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ROI Summary */}
      {roi && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              ROI Summary ({roi.period_start} — {roi.period_end})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total Spend</p>
                <p className="font-semibold">${Number(roi.total_spend).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Leads Generated</p>
                <p className="font-semibold">{roi.leads_generated}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Est. Revenue</p>
                <p className="font-semibold">${Number(roi.estimated_revenue).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">ROI Multiple</p>
                <p className={`font-bold text-lg ${roi.roi_multiple >= 1 ? "text-success" : "text-destructive"}`}>
                  {roi.roi_multiple}x
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card className="rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            AI Insights
          </CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={generateInsights}>
            <RefreshCw className="h-3 w-3" /> Generate
          </Button>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No insights yet. Click Generate to analyze your data.
            </p>
          ) : (
            <div className="space-y-3">
              {insights.map(insight => (
                <InsightItem key={insight.id} insight={insight} onDismiss={dismissInsight} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InsightItem({ insight, onDismiss }: { insight: AiInsight; onDismiss: (id: string) => void }) {
  const isPositive = insight.severity === "success";
  const isWarning = insight.severity === "warning";
  const TrendIcon = isPositive ? TrendingUp : isWarning ? TrendingDown : Lightbulb;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${severityColors[insight.severity] || severityColors.info}`}>
      <TrendIcon className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{insight.title}</p>
        {insight.description && (
          <p className="text-xs mt-0.5 opacity-80">{insight.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-[9px]">{insight.insight_type}</Badge>
          <span className="text-[10px] opacity-60">
            {new Date(insight.created_at).toLocaleDateString("en-AU")}
          </span>
        </div>
      </div>
      <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => onDismiss(insight.id)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
