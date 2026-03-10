import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoTask {
  id: string;
  business_id: string;
  seo_project_id: string;
  client_id: string | null;
  task_category: string;
  task_title: string;
  task_description: string | null;
  assigned_to_employee_id: string | null;
  priority: string;
  status: string;
  deadline: string | null;
  progress_percent: number;
  result_notes: string | null;
  is_visible_to_client: boolean;
  created_at: string;
  updated_at: string;
}

export const TASK_CATEGORIES = [
  "TECHNICAL_SEO", "ON_PAGE_SEO", "OFF_PAGE_SEO", "LOCAL_SEO",
  "CONTENT", "BLOG", "GMB", "SOCIAL_MEDIA",
] as const;

export const TASK_STATUSES = [
  "PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "WAITING_CLIENT",
] as const;

export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export function useSeoTasks(projectId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<SeoTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("seo_tasks")
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false });
    setTasks((data as any as SeoTask[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: {
    task_category: string;
    task_title: string;
    task_description?: string;
    assigned_to_employee_id?: string;
    priority?: string;
    deadline?: string;
    is_visible_to_client?: boolean;
    client_id?: string;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("seo_tasks").insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    } as any);
    toast.success("Task created");
    fetch();
  };

  const updateTask = async (id: string, updates: Partial<SeoTask>) => {
    await supabase.from("seo_tasks").update(updates as any).eq("id", id);
    fetch();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("seo_tasks").delete().eq("id", id);
    toast.success("Task deleted");
    fetch();
  };

  // Fetch all tasks across all projects (for dashboard)
  const fetchAllTasks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seo_tasks")
      .select("*")
      .order("deadline", { ascending: true });
    setTasks((data as any as SeoTask[]) || []);
    setLoading(false);
  }, []);

  return { tasks, loading, create, updateTask, deleteTask, refetch: fetch, fetchAllTasks };
}
