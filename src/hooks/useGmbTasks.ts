import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface GmbTask {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string;
  post_type: string;
  post_caption: string | null;
  image_urls_json: any[];
  cta_text: string | null;
  scheduled_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
}

export function useGmbTasks(projectId?: string) {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<GmbTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("gmb_tasks").select("*").eq("seo_project_id", projectId).order("scheduled_date", { ascending: false });
    setTasks((data as any as GmbTask[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: { post_type?: string; post_caption?: string; cta_text?: string; scheduled_date?: string; client_id?: string }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("gmb_tasks").insert({ business_id: profile.business_id, seo_project_id: projectId, created_by: profile.user_id, ...input } as any);
    toast.success("GMB post created");
    fetch();
  };

  const updateTask = async (id: string, updates: Partial<GmbTask>) => {
    await supabase.from("gmb_tasks").update(updates as any).eq("id", id);
    fetch();
  };

  return { tasks, loading, create, updateTask, refetch: fetch };
}
