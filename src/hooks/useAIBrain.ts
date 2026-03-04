import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAIBrain() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const [healthData, setHealthData] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [advisorLogs, setAdvisorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    const [h, f, t, a, l] = await Promise.all([
      supabase.from("ai_business_health").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(10),
      supabase.from("ai_forecasts").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_team_metrics").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_business_alerts").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_advisor_logs").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(30),
    ]);
    setHealthData(h.data ?? []);
    setForecasts(f.data ?? []);
    setTeamMetrics(t.data ?? []);
    setAlerts(a.data ?? []);
    setAdvisorLogs(l.data ?? []);
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime alerts
  useEffect(() => {
    if (!bid) return;
    const channel = supabase
      .channel("ai-brain-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_business_alerts" }, (payload) => {
        if ((payload.new as any).business_id === bid) {
          setAlerts((prev) => [payload.new as any, ...prev]);
          toast.warning((payload.new as any).message);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [bid]);

  const runHealthAnalysis = useCallback(async () => {
    if (!bid) return;
    toast.info("Running business health analysis…");
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "business_health", payload: { business_id: bid } },
      });
      if (error) throw error;
      const r = data?.result;
      if (r) {
        await supabase.from("ai_business_health").insert({
          business_id: bid, health_score: r.health_score ?? 0, growth_score: r.growth_score ?? 0,
          risk_score: r.risk_score ?? 0, factors_json: r,
        });
        toast.success("Business health analysis complete");
        fetchAll();
      }
    } catch (e: any) { toast.error(e.message || "Analysis failed"); }
  }, [bid, fetchAll]);

  const runTeamAnalysis = useCallback(async () => {
    if (!bid) return;
    toast.info("Analyzing team performance…");
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "team_analysis", payload: { business_id: bid } },
      });
      if (error) throw error;
      const members = data?.result?.team_members;
      if (members?.length) {
        for (const m of members) {
          await supabase.from("ai_team_metrics").insert({
            business_id: bid, employee_name: m.name, performance_score: m.performance_score ?? 0,
            conversion_rate: m.conversion_rate, task_completion_rate: m.task_completion_rate,
            response_time_minutes: m.response_time_minutes, factors_json: m,
          });
        }
        toast.success("Team analysis complete");
        fetchAll();
      }
    } catch (e: any) { toast.error(e.message || "Team analysis failed"); }
  }, [bid, fetchAll]);

  const askAdvisor = useCallback(async (question: string) => {
    if (!bid) return null;
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "ai_advisor", payload: { business_id: bid, question } },
      });
      if (error) throw error;
      const answer = data?.result?.answer || data?.result?.raw || "";
      await supabase.from("ai_advisor_logs").insert({ business_id: bid, user_id: profile?.user_id, question, ai_response: answer });
      fetchAll();
      return answer;
    } catch (e: any) { toast.error(e.message || "Advisor error"); return null; }
  }, [bid, profile?.user_id, fetchAll]);

  const dismissAlert = useCallback(async (id: string) => {
    await supabase.from("ai_business_alerts").update({ status: "dismissed" }).eq("id", id);
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: "dismissed" } : a));
  }, []);

  const latestHealth = healthData[0] ?? null;
  const activeAlerts = alerts.filter((a) => a.status === "active");

  return {
    healthData, latestHealth, forecasts, teamMetrics, alerts, activeAlerts,
    advisorLogs, loading, fetchAll, runHealthAnalysis, runTeamAnalysis,
    askAdvisor, dismissAlert,
  };
}
