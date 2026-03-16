import { useState } from "react";
import { useLeadIntelligence } from "@/hooks/useLeadIntelligence";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Flame, Snowflake, ThermometerSun, Target, TrendingUp,
  RefreshCw, Phone, Mail, MessageSquare, Clock, AlertTriangle,
  ChevronRight, Zap, BarChart3,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const tempConfig: Record<string, { icon: React.ElementType; color: string; label: string; emoji: string }> = {
  hot: { icon: Flame, color: "text-destructive", label: "Hot", emoji: "🔥" },
  warm: { icon: ThermometerSun, color: "text-warning", label: "Warm", emoji: "⚠️" },
  cold: { icon: Snowflake, color: "text-info", label: "Cold", emoji: "❄️" },
};

const predictionLabels: Record<string, { label: string; color: string }> = {
  likely_to_convert: { label: "Likely to Convert", color: "bg-success/10 text-success" },
  needs_follow_up: { label: "Needs Follow-up", color: "bg-warning/10 text-warning" },
  low_probability: { label: "Low Probability", color: "bg-muted text-muted-foreground" },
};

const LeadIntelligencePage = () => {
  const {
    leads, loading, hotLeads, warmLeads, coldLeads,
    likelyToConvert, needsFollowUp, agingLeads, avgScore,
    recalculateAll,
  } = useLeadIntelligence();
  const [tab, setTab] = useState("hot");
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculate = async () => {
    setRecalculating(true);
    await recalculateAll();
    setRecalculating(false);
  };

  const displayLeads =
    tab === "hot" ? hotLeads :
    tab === "warm" ? warmLeads :
    tab === "cold" ? coldLeads :
    tab === "convert" ? likelyToConvert :
    tab === "aging" ? agingLeads :
    leads;

  const renderLeadCard = (lead: typeof leads[0]) => {
    const temp = tempConfig[lead.lead_temperature] || tempConfig.cold;
    const pred = predictionLabels[lead.ai_prediction] || predictionLabels.needs_follow_up;
    const TempIcon = temp.icon;

    return (
      <Card key={lead.id} className="rounded-2xl border-0 shadow-elevated overflow-hidden hover-lift transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Score Circle */}
            <div className="relative h-14 w-14 shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none"
                  stroke={lead.lead_score >= 71 ? "hsl(var(--destructive))" : lead.lead_score >= 31 ? "hsl(var(--warning))" : "hsl(var(--info))"}
                  strokeWidth="4"
                  strokeDasharray={`${(lead.lead_score / 100) * 150.8} 150.8`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                {lead.lead_score}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-sm truncate">{lead.name}</p>
                <span className={`text-sm ${temp.color}`}>{temp.emoji}</span>
                <Badge className={`text-[10px] px-1.5 py-0 border-0 ${pred.color}`}>
                  {pred.label}
                </Badge>
              </div>

              {lead.business_name && (
                <p className="text-xs text-muted-foreground truncate">{lead.business_name}</p>
              )}

              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                {lead.total_calls > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Phone className="h-3 w-3" /> {lead.total_calls}
                  </span>
                )}
                {lead.total_emails > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Mail className="h-3 w-3" /> {lead.total_emails}
                  </span>
                )}
                {lead.total_whatsapp > 0 && (
                  <span className="flex items-center gap-0.5">
                    <MessageSquare className="h-3 w-3" /> {lead.total_whatsapp}
                  </span>
                )}
                {lead.proposal_sent && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">Proposal Sent</Badge>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {lead.last_activity_at
                  ? `Last activity ${formatDistanceToNow(new Date(lead.last_activity_at), { addSuffix: true })}`
                  : `Created ${formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}`
                }
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
          </div>

          {/* Engagement bar */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Engagement</span>
              <span>{lead.engagement_score} pts</span>
            </div>
            <Progress value={Math.min(lead.engagement_score * 5, 100)} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lead Intelligence"
        subtitle="AI-powered lead scoring and priority ranking"
        icon={Brain}
        actions={[
          {
            label: recalculating ? "Recalculating..." : "Recalculate Scores",
            icon: RefreshCw,
            onClick: handleRecalculate,
          },
        ]}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Avg Score" value={avgScore} icon={BarChart3} gradient="from-primary to-accent" />
        <StatCard label="Hot Leads" value={hotLeads.length} icon={Flame} gradient="from-destructive to-neon-orange" />
        <StatCard label="Warm Leads" value={warmLeads.length} icon={ThermometerSun} gradient="from-warning to-neon-orange" />
        <StatCard label="Cold Leads" value={coldLeads.length} icon={Snowflake} gradient="from-info to-neon-blue" />
        <StatCard label="Likely Convert" value={likelyToConvert.length} icon={TrendingUp} gradient="from-success to-neon-green" />
      </div>

      {/* Alert: Hot leads without follow-up */}
      {hotLeads.filter(l => !l.next_follow_up_at).length > 0 && (
        <Card className="rounded-2xl border-0 shadow-elevated bg-destructive/5 border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {hotLeads.filter(l => !l.next_follow_up_at).length} hot lead(s) have no follow-up scheduled
              </p>
              <p className="text-xs text-muted-foreground">
                High probability leads need immediate attention
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="hot">
            🔥 Hot ({hotLeads.length})
          </TabsTrigger>
          <TabsTrigger value="warm">
            ⚠️ Warm ({warmLeads.length})
          </TabsTrigger>
          <TabsTrigger value="cold">
            ❄️ Cold ({coldLeads.length})
          </TabsTrigger>
          <TabsTrigger value="convert">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Likely Convert ({likelyToConvert.length})
          </TabsTrigger>
          <TabsTrigger value="aging">
            <AlertTriangle className="h-3.5 w-3.5 mr-1" />
            Aging ({agingLeads.length})
          </TabsTrigger>
          <TabsTrigger value="all">All ({leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {displayLeads.length === 0 ? (
            <Card className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="py-12 text-center text-muted-foreground">
                No leads in this category
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {displayLeads.map(renderLeadCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Source Performance (simple) */}
      <Card className="rounded-2xl border-0 shadow-elevated">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" /> Lead Quality by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(
              leads.reduce<Record<string, { count: number; totalScore: number; converted: number }>>((acc, l) => {
                const src = l.source || "unknown";
                if (!acc[src]) acc[src] = { count: 0, totalScore: 0, converted: 0 };
                acc[src].count++;
                acc[src].totalScore += l.lead_score || 0;
                if (l.stage === "won") acc[src].converted++;
                return acc;
              }, {})
            )
              .sort(([, a], [, b]) => (b.totalScore / b.count) - (a.totalScore / a.count))
              .map(([source, data]) => (
                <div key={source} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{source.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{data.count} leads · {data.converted} converted</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{Math.round(data.totalScore / data.count)}</p>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                </div>
              ))
            }
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadIntelligencePage;
