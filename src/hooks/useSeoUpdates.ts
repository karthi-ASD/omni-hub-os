import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoUpdate {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string;
  update_type: string;
  title: string;
  description: string | null;
  metrics_json: any;
  visible_to_client: boolean;
  created_by_employee_id: string | null;
  created_at: string;
}

export const UPDATE_TYPES = [
  "RANKING_IMPROVEMENT", "TRAFFIC_INCREASE", "NEW_KEYWORD_RANK",
  "TECHNICAL_FIX", "BLOG_PUBLISHED", "BACKLINK_GAINED",
] as const;

export function useSeoUpdates(projectId?: string) {
  const { profile } = useAuth();
  const [updates, setUpdates] = useState<SeoUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setUpdates([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_updates").select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false });
    setUpdates((data as any as SeoUpdate[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: { update_type: string; title: string; description?: string; metrics_json?: any; visible_to_client?: boolean; client_id?: string }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("seo_updates").insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      created_by_employee_id: profile.user_id,
      ...input,
    } as any);
    toast.success("Update posted");
    fetch();
  };

  return { updates, loading, create, refetch: fetch };
}
