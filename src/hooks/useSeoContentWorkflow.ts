import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoContentWorkflow {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  content_type: string;
  title: string;
  target_keyword: string | null;
  generated_content: string | null;
  edited_content: string | null;
  approval_status: string;
  approved_by: string | null;
  publish_status: string;
  publish_platform: string | null;
  publish_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const CONTENT_TYPES = ["BLOG", "SERVICE_PAGE", "LOCATION_PAGE", "FAQ", "GMB_POST"] as const;
export const APPROVAL_STATUSES = ["DRAFT", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
export const PUBLISH_STATUSES = ["NOT_PUBLISHED", "SCHEDULED", "PUBLISHED"] as const;
export const PUBLISH_PLATFORMS = ["WORDPRESS", "SHOPIFY", "WEBFLOW", "MANUAL_EXPORT"] as const;

export function useSeoContentWorkflow(projectId?: string) {
  const { profile } = useAuth();
  const [items, setItems] = useState<SeoContentWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_content_workflow") as any)
      .select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false });
    setItems((data as SeoContentWorkflow[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const generateContent = async (input: { content_type: string; title: string; target_keyword: string; tone?: string }) => {
    if (!profile?.business_id || !projectId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "seo_content_generate", payload: input },
      });
      if (error) throw error;
      const r = data?.result || {};
      await (supabase.from("seo_content_workflow") as any).insert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        content_type: input.content_type,
        title: input.title,
        target_keyword: input.target_keyword,
        generated_content: r.content || "",
        created_by: profile.user_id,
      });
      toast.success("Content generated");
      fetch();
    } catch {
      toast.error("Failed to generate content");
    }
    setGenerating(false);
  };

  const update = async (id: string, updates: Partial<SeoContentWorkflow>) => {
    await (supabase.from("seo_content_workflow") as any).update(updates).eq("id", id);
    fetch();
  };

  return { items, loading, generating, generateContent, update, refetch: fetch };
}
