import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AIAgent {
  id: string;
  business_id: string | null;
  agent_name: string;
  scope: string;
  autonomy_level: string;
  enabled: boolean;
  created_at: string;
}

export interface AIAgentTask {
  id: string;
  agent_id: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  task_title: string;
  task_plan_json: any;
  status: string;
  approval_required: boolean;
  created_at: string;
}

export function useAIAgents() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AIAgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("ai_agents").select("*").order("created_at", { ascending: false });
    setAgents((data as any) || []);
    setLoading(false);
  }, []);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from("ai_agent_tasks").select("*").order("created_at", { ascending: false }).limit(50);
    setTasks((data as any) || []);
  }, []);

  useEffect(() => {
    fetchAgents();
    fetchTasks();
  }, [fetchAgents, fetchTasks]);

  const createAgent = async (agent: { agent_name: string; scope: string; autonomy_level: string }) => {
    if (!profile?.business_id) return false;
    const { error } = await supabase.from("ai_agents").insert({ ...agent, business_id: profile.business_id, enabled: false } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Agent created");
    fetchAgents();
    return true;
  };

  const toggleAgent = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("ai_agents").update({ enabled } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(enabled ? "Agent enabled" : "Agent disabled");
    fetchAgents();
  };

  const approveTask = async (taskId: string) => {
    const { error } = await supabase.from("ai_agent_tasks").update({ status: "executed" } as any).eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    toast.success("Task approved & executed");
    fetchTasks();
  };

  const rejectTask = async (taskId: string) => {
    const { error } = await supabase.from("ai_agent_tasks").update({ status: "failed" } as any).eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    toast.info("Task rejected");
    fetchTasks();
  };

  return { agents, tasks, loading, createAgent, toggleAgent, approveTask, rejectTask, refetch: fetchAgents };
}
