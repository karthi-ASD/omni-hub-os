import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchDialerDashboardMetrics, fetchSessionAILog } from "@/services/dialerService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Phone, PhoneOff, PhoneForwarded, TrendingUp, Clock, Users, Brain, Flame } from "lucide-react";

export default function SalesDialerDashboardPage() {
  const { profile } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["dialer-dashboard", profile?.business_id],
    queryFn: () => fetchDialerDashboardMetrics(profile!.business_id!),
    enabled: !!profile?.business_id,
    refetchInterval: 30_000,
  });

  // Hot leads (priority_score > 70)
  const { data: hotLeads } = useQuery({
    queryKey: ["dialer-hot-leads", profile?.business_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("id, name, phone, priority_score")
        .eq("business_id", profile!.business_id!)
        .gt("priority_score", 70)
        .order("priority_score", { ascending: false })
        .limit(10);
      return (data as any[]) || [];
    },
    enabled: !!profile?.business_id,
  });

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dialer Dashboard"
        subtitle="Sales calling performance & AI insights"
        icon={Phone}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Calls Today"
          value={metrics?.totalCalls ?? 0}
          icon={Phone}
          gradient="from-primary to-accent"
        />
        <StatCard
          label="Connected"
          value={metrics?.connectedCalls ?? 0}
          icon={PhoneForwarded}
          gradient="from-emerald-500 to-green-600"
        />
        <StatCard
          label="Failed/Missed"
          value={metrics?.failedCalls ?? 0}
          icon={PhoneOff}
          gradient="from-red-500 to-orange-500"
        />
        <StatCard
          label="Conversion Rate"
          value={`${metrics?.conversionRate ?? 0}%`}
          icon={TrendingUp}
          gradient="from-blue-500 to-indigo-500"
        />
        <StatCard
          label="Avg Duration"
          value={metrics ? formatDuration(metrics.avgDuration) : "0:00"}
          icon={Clock}
          gradient="from-amber-500 to-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Performance Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : !metrics?.agentPerformance?.length ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No calls made today</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Agent</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Calls</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Connected</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Connect %</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Conversions</th>
                      <th className="pb-2 font-medium text-muted-foreground text-center">Follow-ups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.agentPerformance.map((agent: any) => (
                      <tr key={agent.userId} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 font-medium">{agent.agentName}</td>
                        <td className="py-2.5 text-center tabular-nums">{agent.calls}</td>
                        <td className="py-2.5 text-center tabular-nums">{agent.connected}</td>
                        <td className="py-2.5 text-center">
                          <Badge variant="outline" className={agent.connectRate >= 50 ? "border-emerald-300 text-emerald-700" : "border-amber-300 text-amber-700"}>
                            {agent.connectRate}%
                          </Badge>
                        </td>
                        <td className="py-2.5 text-center tabular-nums">{agent.conversions}</td>
                        <td className="py-2.5 text-center tabular-nums">{agent.followUps}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hot Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" /> Hot Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hotLeads?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hot leads yet</p>
            ) : (
              <div className="space-y-2">
                {hotLeads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                    <div>
                      <p className="text-sm font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone}</p>
                    </div>
                    <Badge variant="outline" className="border-orange-300 text-orange-700 tabular-nums">
                      {lead.priority_score}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
