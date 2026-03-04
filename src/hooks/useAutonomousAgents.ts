import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAutonomousAgents() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const [agents, setAgents] = useState<any[]>([]);
  const [playbooks, setPlaybooks] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [guardrails, setGuardrails] = useState<any[]>([]);
  const [toolConnections, setToolConnections] = useState<any[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    const [ag, pb, rn, ac, ap, gr, tc, kb] = await Promise.all([
      supabase.from("ai_autonomous_agents").select("*").eq("business_id", bid).order("created_at", { ascending: false }),
      supabase.from("ai_playbooks").select("*").eq("business_id", bid).order("created_at", { ascending: false }),
      supabase.from("ai_agent_runs").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_agent_actions_v2").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(200),
      supabase.from("ai_agent_approvals").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_agent_guardrails").select("*").eq("business_id", bid).order("created_at", { ascending: false }),
      supabase.from("ai_agent_tool_connections").select("*").eq("business_id", bid),
      supabase.from("ai_agent_knowledge_base").select("*").eq("business_id", bid).order("created_at", { ascending: false }),
    ]);
    setAgents(ag.data ?? []);
    setPlaybooks(pb.data ?? []);
    setRuns(rn.data ?? []);
    setActions(ac.data ?? []);
    setApprovals(ap.data ?? []);
    setGuardrails(gr.data ?? []);
    setToolConnections(tc.data ?? []);
    setKnowledgeBase(kb.data ?? []);
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime for approvals
  useEffect(() => {
    if (!bid) return;
    const ch = supabase.channel("agent-approvals-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_agent_approvals" }, (p) => {
        if ((p.new as any).business_id === bid) {
          setApprovals((prev) => [p.new as any, ...prev]);
          toast.info("New agent approval request");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_agent_runs" }, (p) => {
        if ((p.new as any).business_id === bid) {
          setRuns((prev) => {
            const exists = prev.find((r) => r.id === (p.new as any).id);
            if (exists) return prev.map((r) => r.id === (p.new as any).id ? p.new : r);
            return [p.new as any, ...prev];
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bid]);

  const createAgent = useCallback(async (data: { name: string; agent_type: string; mode: string }) => {
    if (!bid) return;
    const { error } = await supabase.from("ai_autonomous_agents").insert({
      business_id: bid, name: data.name, agent_type: data.agent_type as any,
      mode: data.mode as any, owner_user_id: profile?.user_id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Agent created");
    fetchAll();
  }, [bid, profile?.user_id, fetchAll]);

  const toggleAgent = useCallback(async (id: string, enabled: boolean) => {
    await supabase.from("ai_autonomous_agents").update({ is_enabled: enabled }).eq("id", id);
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, is_enabled: enabled } : a));
    toast.success(enabled ? "Agent enabled" : "Agent disabled");
  }, []);

  const updateAgentMode = useCallback(async (id: string, mode: string) => {
    await supabase.from("ai_autonomous_agents").update({ mode: mode as any }).eq("id", id);
    setAgents((prev) => prev.map((a) => a.id === id ? { ...a, mode } : a));
    toast.success("Agent mode updated");
  }, []);

  const createPlaybook = useCallback(async (data: { name: string; agent_type: string; trigger_type: string; steps_json: any[] }) => {
    if (!bid) return;
    const { error } = await supabase.from("ai_playbooks").insert({
      business_id: bid, name: data.name, agent_type: data.agent_type as any,
      trigger_type: data.trigger_type, steps_json: data.steps_json,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Playbook created");
    fetchAll();
  }, [bid, fetchAll]);

  const triggerRun = useCallback(async (agentId: string, playbookId?: string, inputJson?: any) => {
    if (!bid) return;
    toast.info("Starting agent run…");
    const { data: run, error } = await supabase.from("ai_agent_runs").insert({
      business_id: bid, agent_id: agentId, playbook_id: playbookId || null,
      trigger_source: "MANUAL", status: "QUEUED" as any,
      input_json: inputJson || {}, created_by_user_id: profile?.user_id,
    }).select().single();
    if (error) { toast.error(error.message); return; }

    // Call AI engine to reason about this run
    try {
      const { data: aiResult, error: aiErr } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "agent_execute_run", payload: { business_id: bid, agent_id: agentId, run_id: run.id, input: inputJson } },
      });
      if (aiErr) throw aiErr;

      const result = aiResult?.result;
      const actionsPlanned = result?.actions || [];

      // Insert planned actions
      for (const a of actionsPlanned) {
        await supabase.from("ai_agent_actions_v2").insert({
          business_id: bid, run_id: run.id, action_type: a.action_type || "UNKNOWN",
          target_table: a.target_table, action_payload_json: a.payload,
          execution_status: "PLANNED" as any, requires_approval: a.requires_approval ?? false,
        });
      }

      // Update run status
      await supabase.from("ai_agent_runs").update({
        status: (actionsPlanned.some((a: any) => a.requires_approval) ? "NEEDS_APPROVAL" : "COMPLETED") as any,
        confidence_score: result?.confidence_score ?? 0,
        output_json: result, ended_at: new Date().toISOString(),
      }).eq("id", run.id);

      toast.success("Agent run completed");
      fetchAll();
    } catch (e: any) {
      await supabase.from("ai_agent_runs").update({
        status: "FAILED" as any, error_message: e.message, ended_at: new Date().toISOString(),
      }).eq("id", run.id);
      toast.error(e.message || "Agent run failed");
      fetchAll();
    }
  }, [bid, profile?.user_id, fetchAll]);

  const approveAction = useCallback(async (approvalId: string, approved: boolean, reason?: string) => {
    await supabase.from("ai_agent_approvals").update({
      status: (approved ? "APPROVED" : "REJECTED") as any,
      reason: reason || null, decided_at: new Date().toISOString(),
    }).eq("id", approvalId);
    toast.success(approved ? "Approved" : "Rejected");
    fetchAll();
  }, [fetchAll]);

  const createGuardrail = useCallback(async (data: { agent_type: string; risk_level: string; rule_name: string; enforcement: string }) => {
    if (!bid) return;
    await supabase.from("ai_agent_guardrails").insert({
      business_id: bid, agent_type: data.agent_type as any,
      risk_level: data.risk_level as any, rule_name: data.rule_name,
      enforcement: data.enforcement as any,
    });
    toast.success("Guardrail created");
    fetchAll();
  }, [bid, fetchAll]);

  const pendingApprovals = approvals.filter((a) => a.status === "PENDING");
  const todayRuns = runs.filter((r) => new Date(r.created_at).toDateString() === new Date().toDateString());
  const failedRuns = runs.filter((r) => r.status === "FAILED");

  return {
    agents, playbooks, runs, actions, approvals, guardrails,
    toolConnections, knowledgeBase, loading, pendingApprovals,
    todayRuns, failedRuns, fetchAll, createAgent, toggleAgent,
    updateAgentMode, createPlaybook, triggerRun, approveAction, createGuardrail,
  };
}
