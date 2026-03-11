import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ContentTask {
  id: string;
  business_id: string;
  client_id: string | null;
  content_type: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  word_count: number | null;
  target_keyword: string | null;
  published_url: string | null;
  created_at: string;
  updated_at: string;
}

export const CONTENT_TYPES = [
  { value: "blog", label: "Blog Writing" },
  { value: "creative_design", label: "Creative Design" },
  { value: "video", label: "Video Production" },
  { value: "social_post", label: "Social Media Post" },
  { value: "infographic", label: "Infographic" },
  { value: "email_copy", label: "Email Copy" },
  { value: "ad_copy", label: "Ad Copy" },
] as const;

export function useContentTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("content_tasks" as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setTasks((data as any as ContentTask[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Partial<ContentTask>) => {
    if (!profile?.business_id) return;
    await supabase.from("content_tasks" as any).insert({
      business_id: profile.business_id,
      ...values,
    } as any);
    toast.success("Content task created");
    fetch();
  };

  const update = async (id: string, values: Partial<ContentTask>) => {
    await supabase.from("content_tasks" as any).update(values as any).eq("id", id);
    toast.success("Task updated");
    fetch();
  };

  const remove = async (id: string) => {
    await supabase.from("content_tasks" as any).delete().eq("id", id);
    toast.success("Task deleted");
    fetch();
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
    blogs: tasks.filter(t => t.content_type === "blog").length,
    designs: tasks.filter(t => t.content_type === "creative_design").length,
    videos: tasks.filter(t => t.content_type === "video").length,
  };

  return { tasks, loading, create, update, remove, stats, refetch: fetch };
}
