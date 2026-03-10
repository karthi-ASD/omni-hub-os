import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoBlog {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string;
  blog_title: string;
  blog_topic: string | null;
  target_keywords_json: any[];
  content_text: string | null;
  seo_score: number | null;
  publish_date: string | null;
  status: string;
  author_employee_id: string | null;
  created_at: string;
}

export function useSeoBlogs(projectId?: string) {
  const { profile } = useAuth();
  const [blogs, setBlogs] = useState<SeoBlog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setBlogs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from("seo_blogs").select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false });
    setBlogs((data as any as SeoBlog[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: { blog_title: string; blog_topic?: string; target_keywords_json?: string[]; content_text?: string; publish_date?: string; client_id?: string }) => {
    if (!profile?.business_id || !projectId) return;
    await supabase.from("seo_blogs").insert({ business_id: profile.business_id, seo_project_id: projectId, ...input } as any);
    toast.success("Blog created");
    fetch();
  };

  const updateBlog = async (id: string, updates: Partial<SeoBlog>) => {
    await supabase.from("seo_blogs").update(updates as any).eq("id", id);
    fetch();
  };

  return { blogs, loading, create, updateBlog, refetch: fetch };
}
