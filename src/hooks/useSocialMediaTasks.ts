import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SocialMediaTask {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  platform: string;
  post_caption: string | null;
  image_url: string | null;
  hashtags: string | null;
  post_date: string | null;
  status: string;
  assigned_employee_id: string | null;
  created_at: string;
}

export function useSocialMediaTasks(projectId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<SocialMediaTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("social_media_tasks").select("*").eq("seo_project_id", projectId).order("post_date", { ascending: false });
    setTasks((data as any as SocialMediaTask[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: { platform: string; post_caption?: string; image_url?: string; hashtags?: string; post_date?: string; client_id?: string }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("social_media_tasks").insert({ business_id: profile.business_id, seo_project_id: projectId, ...input } as any);
    toast.success("Social media post created");
    fetch();
  };

  const updateTask = async (id: string, updates: Partial<SocialMediaTask>) => {
    await supabase.from("social_media_tasks").update(updates as any).eq("id", id);
    fetch();
  };

  return { tasks, loading, create, updateTask, refetch: fetch };
}
