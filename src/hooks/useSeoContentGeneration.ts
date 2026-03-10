import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoContentGeneration {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  content_type: string;
  title: string;
  target_keyword: string | null;
  secondary_keywords_json: any;
  generated_content: string | null;
  seo_score: number | null;
  tone: string;
  status: string;
  created_by: string | null;
  created_at: string;
}

export const CONTENT_TYPES = [
  "SERVICE_PAGE", "LOCATION_PAGE", "BLOG", "FAQ",
  "META_TITLE", "META_DESCRIPTION", "SOCIAL_CAPTION", "GMB_POST",
];
export const TONES = ["professional", "informative", "engaging", "authority"];
export const CONTENT_STATUSES = ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "REJECTED"];

export function useSeoContentGeneration(projectId?: string) {
  const { profile } = useAuth();
  const [items, setItems] = useState<SeoContentGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_content_generation") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false });
    setItems((data as SeoContentGeneration[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const generate = async (input: {
    content_type: string;
    title: string;
    target_keyword?: string;
    tone?: string;
    secondary_keywords?: string[];
  }) => {
    if (!profile?.business_id || !projectId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: {
          task_type: "seo_content_generate",
          payload: { ...input, project_id: projectId },
        },
      });
      if (error) throw error;

      const content = data?.result?.content || data?.result?.generated_content || "";
      const score = data?.result?.seo_score || null;

      await (supabase.from("seo_content_generation") as any).insert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        content_type: input.content_type,
        title: input.title,
        target_keyword: input.target_keyword,
        secondary_keywords_json: input.secondary_keywords || [],
        generated_content: content,
        seo_score: score,
        tone: input.tone || "professional",
        created_by: profile.user_id,
      });
      toast.success("Content generated");
      fetch();
    } catch {
      toast.error("Failed to generate content");
    }
    setGenerating(false);
  };

  const updateItem = async (id: string, updates: Partial<SeoContentGeneration>) => {
    await (supabase.from("seo_content_generation") as any).update(updates).eq("id", id);
    fetch();
  };

  return { items, loading, generating, generate, updateItem, refetch: fetch };
}
