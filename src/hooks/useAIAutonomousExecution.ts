import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAIAutonomousExecution() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const [autonomousTasks, setAutonomousTasks] = useState<any[]>([]);
  const [contentOpportunities, setContentOpportunities] = useState<any[]>([]);
  const [emailDrafts, setEmailDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    const [tasks, content, emails] = await Promise.all([
      supabase.from("ai_autonomous_tasks").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(100),
      supabase.from("ai_content_opportunities").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_email_drafts").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
    ]);
    setAutonomousTasks(tasks.data ?? []);
    setContentOpportunities(content.data ?? []);
    setEmailDrafts(emails.data ?? []);
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const invoke = useCallback(async (taskType: string, payload: any) => {
    const { data, error } = await supabase.functions.invoke("ai-engine", {
      body: { task_type: taskType, payload: { business_id: bid, ...payload } },
    });
    if (error) throw error;
    return data?.result;
  }, [bid]);

  const autoCreateTask = useCallback(async (taskData: { title: string; description: string; department: string; priority: string; source_module: string; ai_confidence?: number }) => {
    if (!bid) return;
    const { error } = await supabase.from("ai_autonomous_tasks").insert({
      business_id: bid,
      ...taskData,
      assigned_department: taskData.department,
      auto_created: true,
    } as any);
    if (error) { toast.error("Failed to create AI task"); return; }
    toast.success("AI autonomous task created");
    fetchAll();
  }, [bid, fetchAll]);

  const approveTask = useCallback(async (taskId: string) => {
    if (!profile?.user_id) return;
    await supabase.from("ai_autonomous_tasks").update({
      status: "approved",
      approved_by_user_id: profile.user_id,
      approved_at: new Date().toISOString(),
    } as any).eq("id", taskId);
    toast.success("Task approved");
    fetchAll();
  }, [profile?.user_id, fetchAll]);

  const rejectTask = useCallback(async (taskId: string) => {
    await supabase.from("ai_autonomous_tasks").update({ status: "rejected" } as any).eq("id", taskId);
    toast.success("Task rejected");
    fetchAll();
  }, [fetchAll]);

  const generateContentOpportunities = useCallback(async (clientData: any) => {
    if (!bid) return;
    try {
      const result = await invoke("agency_task_suggest", clientData);
      if (result?.suggestions) {
        for (const s of result.suggestions) {
          if (s.category === "content" || s.category === "seo") {
            await supabase.from("ai_content_opportunities").insert({
              business_id: bid,
              client_id: clientData.client_id,
              keyword: s.title,
              opportunity_type: s.category === "content" ? "blog_post" : "landing_page",
              recommendation: s.description,
              ai_confidence: 75,
            } as any);
          }
        }
        toast.success("Content opportunities generated");
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, fetchAll]);

  const generateEmailDraft = useCallback(async (clientData: any) => {
    if (!bid) return;
    try {
      const result = await invoke("agency_client_report", clientData);
      if (result) {
        await supabase.from("ai_email_drafts").insert({
          business_id: bid,
          client_id: clientData.client_id,
          draft_type: "report",
          subject: `Monthly Report: ${result.report_title || "Client Update"}`,
          body: result.client_summary || result.performance_summary || "",
        } as any);
        toast.success("Email draft generated");
        fetchAll();
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Failed"); }
  }, [bid, invoke, fetchAll]);

  const updateDraftStatus = useCallback(async (id: string, status: string) => {
    await supabase.from("ai_email_drafts").update({ status } as any).eq("id", id);
    fetchAll();
  }, [fetchAll]);

  const pendingTasks = autonomousTasks.filter(t => t.status === "pending");
  const approvedTasks = autonomousTasks.filter(t => t.status === "approved");

  return {
    autonomousTasks, contentOpportunities, emailDrafts, loading,
    pendingTasks, approvedTasks, autoCreateTask, approveTask, rejectTask,
    generateContentOpportunities, generateEmailDraft, updateDraftStatus, fetchAll,
  };
}
