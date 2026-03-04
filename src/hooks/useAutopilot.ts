import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAutopilotSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("autopilot_settings")
      .select("*")
      .eq("business_id", profile.business_id)
      .maybeSingle();
    setSettings(data);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    const payload = { ...values, business_id: profile.business_id };
    if (settings?.id) {
      const { error } = await supabase.from("autopilot_settings").update(payload as any).eq("id", settings.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("autopilot_settings").insert(payload as any);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Settings saved");
    fetch();
  };

  return { settings, loading, upsert, refresh: fetch };
}

export function useAutopilotSequences() {
  const { profile } = useAuth();
  const [sequences, setSequences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("autopilot_sequences")
      .select("*")
      .or(`business_id.eq.${profile.business_id},business_id.is.null`)
      .order("created_at", { ascending: false });
    setSequences(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: { name: string; purpose: string }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("autopilot_sequences").insert({ ...values, business_id: profile.business_id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Sequence created");
    fetch();
  };

  return { sequences, loading, create, refresh: fetch };
}

export function useAutopilotSteps(sequenceId: string | null) {
  const { profile } = useAuth();
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!sequenceId) { setSteps([]); setLoading(false); return; }
    const { data } = await supabase
      .from("autopilot_steps")
      .select("*")
      .eq("sequence_id", sequenceId)
      .order("step_order", { ascending: true });
    setSteps(data ?? []);
    setLoading(false);
  }, [sequenceId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addStep = async (values: Record<string, any>) => {
    if (!profile?.business_id || !sequenceId) return;
    const { error } = await supabase.from("autopilot_steps").insert({
      ...values,
      business_id: profile.business_id,
      sequence_id: sequenceId,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Step added");
    fetch();
  };

  const removeStep = async (stepId: string) => {
    await supabase.from("autopilot_steps").delete().eq("id", stepId);
    fetch();
  };

  return { steps, loading, addStep, removeStep, refresh: fetch };
}

export function useLeadConversations() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("lead_conversations")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("last_message_at", { ascending: false, nullsFirst: false });
    setConversations(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!profile?.business_id) return;
    const channel = supabase
      .channel("lead-convos")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "lead_conversations",
      }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.business_id, fetch]);

  const updateMode = async (id: string, mode: string) => {
    await supabase.from("lead_conversations").update({ mode } as any).eq("id", id);
    toast.success(`Mode set to ${mode}`);
    fetch();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("lead_conversations").update({ status } as any).eq("id", id);
    fetch();
  };

  return { conversations, loading, updateMode, updateStatus, refresh: fetch };
}

export function useAutopilotRuns() {
  const { profile } = useAuth();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("autopilot_runs")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(100);
    setRuns(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { runs, loading, refresh: fetch };
}

export function useEscalationRules() {
  const { profile } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("escalation_rules")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRules(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("escalation_rules").insert({ ...values, business_id: profile.business_id } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Escalation rule created");
    fetch();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from("escalation_rules").update({ is_active } as any).eq("id", id);
    fetch();
  };

  return { rules, loading, create, toggle, refresh: fetch };
}
