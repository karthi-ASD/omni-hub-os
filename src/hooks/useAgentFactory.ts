import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAgentFactory() {
  const { user, profile } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("ai_agents")
      .select("*")
      .or(`business_id.eq.${profile.business_id},business_id.is.null`)
      .order("created_at", { ascending: false });
    setAgents(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchVersions = useCallback(async (agentId?: string) => {
    if (!profile?.business_id) return;
    let q = supabase.from("ai_agent_versions").select("*")
      .or(`business_id.eq.${profile.business_id},business_id.is.null`);
    if (agentId) q = q.eq("agent_id", agentId);
    const { data } = await q.order("version_number", { ascending: false });
    setVersions(data ?? []);
  }, [profile?.business_id]);

  const fetchAssignments = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("ai_agent_assignments")
      .select("*")
      .eq("business_id", profile.business_id);
    setAssignments(data ?? []);
  }, [profile?.business_id]);

  useEffect(() => {
    fetchAgents();
    fetchAssignments();
  }, [fetchAgents, fetchAssignments]);

  const createAgent = async (values: Record<string, any>) => {
    if (!user || !profile?.business_id) return;
    const { error } = await supabase.from("ai_agents").insert({
      ...values,
      business_id: profile.business_id,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Agent created");
    fetchAgents();
  };

  const createVersion = async (agentId: string, values: Record<string, any>) => {
    if (!profile?.business_id) return;
    // Deactivate existing versions
    await supabase.from("ai_agent_versions").update({ is_active: false } as any)
      .eq("agent_id", agentId).eq("business_id", profile.business_id);
    // Get next version number
    const existing = versions.filter(v => v.agent_id === agentId);
    const nextVersion = existing.length > 0 ? Math.max(...existing.map(v => v.version_number)) + 1 : 1;
    const { error } = await supabase.from("ai_agent_versions").insert({
      ...values,
      agent_id: agentId,
      business_id: profile.business_id,
      version_number: nextVersion,
      is_active: true,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success(`Version ${nextVersion} activated`);
    fetchVersions(agentId);
  };

  const assignAgent = async (agentId: string, scopeType: string) => {
    if (!user || !profile?.business_id) return;
    const { error } = await supabase.from("ai_agent_assignments").insert({
      business_id: profile.business_id,
      agent_id: agentId,
      scope_type: scopeType,
      assigned_user_id: user.id,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Agent assigned");
    fetchAssignments();
  };

  return {
    agents, versions, assignments, loading,
    createAgent, createVersion, assignAgent,
    fetchVersions, refresh: fetchAgents,
  };
}
