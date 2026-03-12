import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone, Target, Handshake } from "lucide-react";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

interface AgentPerformance {
  user_id: string;
  name: string;
  callsToday: number;
  callsMonth: number;
  leadsCreated: number;
  dealsWon: number;
}

const SalesTeamPerformancePage = () => {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const now = new Date();
    const dayStart = startOfDay(now).toISOString();
    const dayEnd = endOfDay(now).toISOString();
    const monthStart = startOfMonth(now).toISOString();
    const monthEnd = endOfMonth(now).toISOString();

    // Get all team members in this business
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("business_id", profile.business_id);

    if (!profiles) { setLoading(false); return; }

    const results: AgentPerformance[] = [];
    for (const p of profiles) {
      const [todayRes, monthRes, leadsRes, dealsRes] = await Promise.all([
        supabase.from("cold_calls").select("id", { count: "exact", head: true })
          .eq("business_id", profile.business_id).eq("caller_user_id", p.user_id)
          .gte("created_at", dayStart).lte("created_at", dayEnd),
        supabase.from("cold_calls").select("id", { count: "exact", head: true })
          .eq("business_id", profile.business_id).eq("caller_user_id", p.user_id)
          .gte("created_at", monthStart).lte("created_at", monthEnd),
        supabase.from("leads").select("id", { count: "exact", head: true })
          .eq("business_id", profile.business_id).eq("assigned_to_user_id", p.user_id),
        supabase.from("deals").select("id", { count: "exact", head: true })
          .eq("business_id", profile.business_id).eq("owner_user_id", p.user_id).eq("stage", "closed_won"),
      ]);
      const hasActivity = (todayRes.count || 0) + (monthRes.count || 0) + (leadsRes.count || 0) + (dealsRes.count || 0) > 0;
      if (hasActivity) {
        results.push({
          user_id: p.user_id,
          name: p.full_name || "Unknown",
          callsToday: todayRes.count || 0,
          callsMonth: monthRes.count || 0,
          leadsCreated: leadsRes.count || 0,
          dealsWon: dealsRes.count || 0,
        });
      }
    }
    results.sort((a, b) => b.callsToday - a.callsToday);
    setAgents(results);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className="space-y-4 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Team Performance" subtitle="Sales agent productivity metrics" icon={Users} />

      {agents.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-elevated">
          <CardContent className="py-12 text-center text-muted-foreground">
            No sales activity recorded yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agents.map((agent, idx) => (
            <Card key={agent.user_id} className="rounded-2xl border-0 shadow-elevated">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{agent.name}</p>
                  </div>
                  <div className="flex items-center gap-6 text-center">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> Today</div>
                      <p className="font-bold text-lg">{agent.callsToday}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3" /> Month</div>
                      <p className="font-bold text-lg">{agent.callsMonth}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Target className="h-3 w-3" /> Leads</div>
                      <p className="font-bold text-lg">{agent.leadsCreated}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Handshake className="h-3 w-3" /> Won</div>
                      <p className="font-bold text-lg">{agent.dealsWon}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesTeamPerformancePage;
