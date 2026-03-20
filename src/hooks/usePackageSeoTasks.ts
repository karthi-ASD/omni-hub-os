import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logActivity as logAI } from "@/lib/activity-logger";

export interface PackageSeoTask {
  id: string;
  business_id: string;
  seo_project_id: string | null;
  client_id: string | null;
  package_id: string | null;
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
  // joined
  assigned_employee_name?: string;
}

export const TASK_CATEGORIES = [
  { value: "TECHNICAL_SEO", label: "Technical SEO" },
  { value: "ON_PAGE_SEO", label: "On-Page SEO" },
  { value: "OFF_PAGE_SEO", label: "Off-Page SEO" },
  { value: "LOCAL_SEO", label: "Local SEO" },
  { value: "CONTENT", label: "Content" },
  { value: "BLOG", label: "Blog" },
  { value: "GMB", label: "GMB" },
  { value: "SOCIAL_MEDIA", label: "Social Media" },
] as const;

export const TASK_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
] as const;

export const TASK_PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
] as const;

export function usePackageSeoTasks(packageId?: string, clientId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<PackageSeoTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!packageId && !clientId) { setTasks([]); setLoading(false); return; }
    setLoading(true);

    let query = supabase
      .from("seo_tasks")
      .select("*, hr_employees!seo_tasks_assigned_to_employee_id_fkey(full_name)")
      .order("created_at", { ascending: false });

    if (packageId) {
      query = query.eq("package_id", packageId);
    } else if (clientId) {
      query = query.eq("client_id", clientId);
    }

    const { data } = await query;
    const mapped = ((data as any[]) || []).map((t: any) => ({
      ...t,
      assigned_employee_name: t.hr_employees?.full_name || null,
    }));
    setTasks(mapped);
    setLoading(false);
  }, [packageId, clientId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (input: {
    task_category: string;
    task_title: string;
    task_description?: string;
    assigned_to_employee_id?: string;
    priority?: string;
    deadline?: string;
  }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("seo_tasks").insert({
      business_id: profile.business_id,
      seo_project_id: null as any,
      package_id: packageId || null,
      client_id: clientId || null,
      ...input,
    } as any);
    if (error) { toast.error("Failed to create task"); return; }
    toast.success("Task created");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "tasks", actionType: "create", entityType: "seo_task", description: `Created SEO task: ${input.task_title}` });
    fetchTasks();
  };

  const updateTask = async (id: string, updates: Partial<PackageSeoTask>) => {
    const { error } = await supabase.from("seo_tasks").update(updates as any).eq("id", id);
    if (error) { toast.error("Failed to update task"); return; }
    toast.success("Task updated");
    logAI({ userId: profile?.user_id || "", userRole: "staff", businessId: profile?.business_id, module: "tasks", actionType: "update", entityType: "seo_task", entityId: id, description: "SEO task updated" });
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from("seo_tasks").delete().eq("id", id);
    toast.success("Task deleted");
    logAI({ userId: profile?.user_id || "", userRole: "staff", businessId: profile?.business_id, module: "tasks", actionType: "delete", entityType: "seo_task", entityId: id, description: "SEO task deleted" });
    fetchTasks();
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "PENDING").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
    blocked: tasks.filter(t => t.status === "BLOCKED").length,
    overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "COMPLETED").length,
  };

  return { tasks, loading, stats, createTask, updateTask, deleteTask, refetch: fetchTasks };
}
