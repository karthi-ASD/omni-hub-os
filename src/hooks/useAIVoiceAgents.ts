import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AIVoiceAgent {
  id: string;
  business_id: string | null;
  agent_name: string;
  scope: string;
  autonomy_level: string;
  enabled: boolean;
  voice_type: string;
  language: string;
  ai_provider: string;
  call_timeout_seconds: number;
  retry_attempts: number;
  script_id: string | null;
  created_at: string;
}

export interface AIAgentScript {
  id: string;
  business_id: string;
  agent_id: string | null;
  script_name: string;
  intro_text: string | null;
  verification_text: string | null;
  qualification_questions_json: any;
  scheduling_text: string | null;
  closing_text: string | null;
  is_default: boolean;
  created_at: string;
}

export interface AIVoiceCallLog {
  id: string;
  business_id: string;
  agent_id: string | null;
  lead_id: string | null;
  lead_name: string | null;
  lead_phone: string | null;
  lead_email: string | null;
  website_source: string | null;
  call_status: string;
  call_duration_seconds: number | null;
  call_outcome: string | null;
  recording_url: string | null;
  transcript: string | null;
  ai_summary: string | null;
  consent_given: boolean;
  provider: string;
  created_at: string;
}

export interface AILeadQualification {
  id: string;
  business_id: string;
  call_log_id: string | null;
  lead_id: string | null;
  lead_name: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeframe: string | null;
  project_type: string | null;
  requirement_summary: string | null;
  followup_date: string | null;
  followup_time: string | null;
  timezone: string;
  ai_summary: string | null;
  lead_score: number;
  status: string;
  created_at: string;
}

export function useAIVoiceAgents() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<AIVoiceAgent[]>([]);
  const [scripts, setScripts] = useState<AIAgentScript[]>([]);
  const [callLogs, setCallLogs] = useState<AIVoiceCallLog[]>([]);
  const [qualifications, setQualifications] = useState<AILeadQualification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    const { data } = await supabase.from("ai_agents").select("*").order("created_at", { ascending: false });
    setAgents((data as any) || []);
  }, []);

  const fetchScripts = useCallback(async () => {
    const { data } = await supabase.from("ai_agent_scripts").select("*").order("created_at", { ascending: false });
    setScripts((data as any) || []);
  }, []);

  const fetchCallLogs = useCallback(async () => {
    const { data } = await supabase.from("ai_voice_call_logs").select("*").order("created_at", { ascending: false }).limit(200);
    setCallLogs((data as any) || []);
  }, []);

  const fetchQualifications = useCallback(async () => {
    const { data } = await supabase.from("ai_lead_qualifications").select("*").order("created_at", { ascending: false }).limit(200);
    setQualifications((data as any) || []);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAgents(), fetchScripts(), fetchCallLogs(), fetchQualifications()]).finally(() => setLoading(false));
  }, [fetchAgents, fetchScripts, fetchCallLogs, fetchQualifications]);

  const createAgent = async (agent: Partial<AIVoiceAgent>) => {
    if (!profile?.business_id) {
      toast.error("Please complete your business setup before creating an agent");
      return false;
    }
    if (!agent.agent_name?.trim()) {
      toast.error("Agent name is required");
      return false;
    }
    try {
      const { error } = await supabase.from("ai_agents").insert({
        agent_name: agent.agent_name.trim(),
        scope: agent.scope || "sales",
        autonomy_level: agent.autonomy_level || "suggest_only",
        business_id: profile.business_id,
        enabled: false,
        voice_type: agent.voice_type || "professional",
        language: agent.language || "en-AU",
        ai_provider: agent.ai_provider || "elevenlabs",
        call_timeout_seconds: agent.call_timeout_seconds || 60,
        retry_attempts: agent.retry_attempts || 2,
      } as any);
      if (error) {
        toast.error(error.message);
        return false;
      }
      toast.success("AI Voice Agent created");
      fetchAgents();
      return true;
    } catch (err: any) {
      toast.error(err?.message || "Failed to create agent");
      return false;
    }
  };

  const toggleAgent = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("ai_agents").update({ enabled } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(enabled ? "Agent activated" : "Agent paused");
    fetchAgents();
  };

  const createScript = async (script: Partial<AIAgentScript>) => {
    if (!profile?.business_id) return false;
    const { error } = await supabase.from("ai_agent_scripts").insert({
      business_id: profile.business_id,
      script_name: script.script_name,
      agent_id: script.agent_id || null,
      intro_text: script.intro_text,
      verification_text: script.verification_text,
      qualification_questions_json: script.qualification_questions_json || [],
      scheduling_text: script.scheduling_text,
      closing_text: script.closing_text,
      is_default: script.is_default || false,
    } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Script created");
    fetchScripts();
    return true;
  };

  // Dashboard stats
  const todayCalls = callLogs.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString());
  const stats = {
    totalCallsToday: todayCalls.length,
    qualifiedLeads: qualifications.filter(q => q.status === "qualified").length,
    callsAnswered: callLogs.filter(c => c.call_status === "completed").length,
    callsMissed: callLogs.filter(c => c.call_status === "no_answer").length,
    callsScheduled: callLogs.filter(c => c.call_status === "scheduled").length,
    conversionRate: callLogs.length > 0 ? Math.round((qualifications.filter(q => q.lead_score >= 70).length / Math.max(callLogs.length, 1)) * 100) : 0,
  };

  return {
    agents, scripts, callLogs, qualifications, loading, stats,
    createAgent, toggleAgent, createScript,
    refetch: () => Promise.all([fetchAgents(), fetchScripts(), fetchCallLogs(), fetchQualifications()]),
  };
}
