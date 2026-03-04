import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useVoiceAgentSessions() {
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [extractions, setExtractions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [scripts, setScripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const biz = profile?.business_id;

  const fetchSessions = useCallback(async () => {
    if (!biz) return;
    const { data } = await supabase
      .from("voice_agent_sessions")
      .select("*")
      .eq("business_id", biz)
      .order("created_at", { ascending: false });
    setSessions(data ?? []);
    setLoading(false);
  }, [biz]);

  const fetchExtractions = useCallback(async () => {
    if (!biz) return;
    const { data } = await supabase
      .from("voice_agent_extractions")
      .select("*")
      .eq("business_id", biz)
      .order("created_at", { ascending: false });
    setExtractions(data ?? []);
  }, [biz]);

  const fetchEvents = useCallback(async (sessionId?: string) => {
    if (!biz) return;
    let q = supabase.from("voice_agent_events").select("*").eq("business_id", biz);
    if (sessionId) q = q.eq("session_id", sessionId);
    const { data } = await q.order("created_at", { ascending: false }).limit(100);
    setEvents(data ?? []);
  }, [biz]);

  const fetchPolicies = useCallback(async () => {
    if (!biz) return;
    const { data } = await supabase.from("voice_agent_policies").select("*").eq("business_id", biz);
    setPolicies(data ?? []);
  }, [biz]);

  const fetchScripts = useCallback(async () => {
    if (!biz) return;
    const { data } = await supabase.from("voice_agent_scripts").select("*")
      .or(`business_id.eq.${biz},business_id.is.null`)
      .order("created_at", { ascending: false });
    setScripts(data ?? []);
  }, [biz]);

  useEffect(() => {
    fetchSessions(); fetchExtractions(); fetchPolicies(); fetchScripts();
  }, [fetchSessions, fetchExtractions, fetchPolicies, fetchScripts]);

  // Realtime for sessions
  useEffect(() => {
    if (!biz) return;
    const channel = supabase
      .channel("va-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "voice_agent_sessions" }, () => {
        fetchSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [biz, fetchSessions]);

  // Stats
  const stats = {
    total: sessions.length,
    queued: sessions.filter(s => s.status === "QUEUED").length,
    calling: sessions.filter(s => s.status === "CALLING").length,
    completed: sessions.filter(s => s.status === "COMPLETED").length,
    failed: sessions.filter(s => s.status === "FAILED").length,
    noAnswer: sessions.filter(s => s.status === "NO_ANSWER").length,
    booked: extractions.filter(e => e.call_outcome === "BOOKED").length,
    conversionRate: sessions.length > 0
      ? Math.round((extractions.filter(e => e.call_outcome === "BOOKED").length / sessions.length) * 100)
      : 0,
  };

  const createSession = async (values: {
    lead_id?: string; inquiry_id?: string; thread_id?: string;
    agent_id?: string; scheduled_call_at?: string;
  }) => {
    if (!user || !biz) return;
    const { error } = await supabase.from("voice_agent_sessions").insert({
      ...values,
      business_id: biz,
      status: "QUEUED",
      scheduled_call_at: values.scheduled_call_at || new Date().toISOString(),
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Voice session queued");
    fetchSessions();
  };

  const retrySession = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    await supabase.from("voice_agent_sessions").update({
      status: "QUEUED",
      attempt_number: (session.attempt_number || 1) + 1,
      scheduled_call_at: new Date().toISOString(),
      error_message: null,
    } as any).eq("id", sessionId);
    toast.success("Session re-queued");
    fetchSessions();
  };

  const savePolicy = async (values: Record<string, any>) => {
    if (!biz) return;
    if (policies.length > 0) {
      await supabase.from("voice_agent_policies").update(values as any).eq("id", policies[0].id);
    } else {
      await supabase.from("voice_agent_policies").insert({ ...values, business_id: biz } as any);
    }
    toast.success("Policy saved");
    fetchPolicies();
  };

  const saveScript = async (values: { name: string; script_json: any; language?: string }) => {
    if (!biz) return;
    const { error } = await supabase.from("voice_agent_scripts").insert({
      ...values,
      business_id: biz,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Script saved");
    fetchScripts();
  };

  return {
    sessions, extractions, events, policies, scripts, stats, loading,
    createSession, retrySession, savePolicy, saveScript,
    fetchEvents, refresh: fetchSessions,
  };
}
