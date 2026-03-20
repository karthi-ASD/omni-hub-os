import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ProjectStatus = "new" | "in_progress" | "on_hold" | "completed";

export interface Project {
  id: string;
  business_id: string;
  client_id: string | null;
  deal_id: string | null;
  project_name: string;
  description: string | null;
  assigned_manager_user_id: string | null;
  status: ProjectStatus;
  start_date: string | null;
  target_end_date: string | null;
  created_at: string;
  updated_at: string;
}

const ONBOARDING_TASKS = [
  "Collect hosting details",
  "Collect domain access",
  "Collect Google access",
  "Keyword research",
  "Competitor analysis",
  "Website audit",
];

export function useProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false }).limit(500);
    setProjects((data as any as Project[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (input: {
    client_id?: string;
    deal_id?: string;
    project_name: string;
    description?: string;
    assigned_manager_user_id?: string;
    start_date?: string;
    target_end_date?: string;
    createOnboardingTasks?: boolean;
  }) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("projects")
      .insert({
        business_id: profile.business_id,
        client_id: input.client_id,
        deal_id: input.deal_id,
        project_name: input.project_name,
        description: input.description,
        assigned_manager_user_id: input.assigned_manager_user_id || profile.user_id,
        start_date: input.start_date,
        target_end_date: input.target_end_date,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create project"); return null; }
    const projectId = (data as any).id;

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "PROJECT_CREATED",
        payload_json: { entity_type: "project", entity_id: projectId, actor_user_id: profile.user_id, short_message: `Project created: ${input.project_name}` },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "CREATE_PROJECT", entity_type: "project", entity_id: projectId,
      }),
    ]);

    // Auto-create onboarding tasks as reminders
    if (input.createOnboardingTasks !== false) {
      const entityId = input.client_id || input.deal_id || projectId;
      const reminders = ONBOARDING_TASKS.map((title, i) => ({
        business_id: profile.business_id,
        entity_type: "project" as any,
        entity_id: projectId,
        assigned_to_user_id: input.assigned_manager_user_id || profile.user_id,
        title: `[${input.project_name}] ${title}`,
        due_at: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
        created_by_user_id: profile.user_id,
        priority: "medium" as const,
      }));
      await supabase.from("reminders").insert(reminders as any);
    }

    toast.success("Project created with onboarding tasks");
    fetchProjects();
    return data as any as Project;
  };

  const updateStatus = async (projectId: string, status: ProjectStatus) => {
    if (!profile) return;
    await supabase.from("projects").update({ status } as any).eq("id", projectId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "PROJECT_STATUS_CHANGED",
      payload_json: { entity_type: "project", entity_id: projectId, actor_user_id: profile.user_id, status, short_message: `Project status: ${status}` },
    });
    toast.success("Project status updated");
    fetchProjects();
  };

  return { projects, loading, createProject, updateStatus, refetch: fetchProjects };
}
