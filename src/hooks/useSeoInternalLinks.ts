import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoInternalLinkSuggestion {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  source_page_url: string;
  target_page_url: string;
  anchor_text: string | null;
  link_context: string | null;
  status: string;
  created_at: string;
}

export const LINK_STATUSES = ["SUGGESTED", "APPROVED", "IMPLEMENTED", "REJECTED"] as const;

export function useSeoInternalLinks(projectId?: string) {
  const { profile } = useAuth();
  const [suggestions, setSuggestions] = useState<SeoInternalLinkSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_internal_link_suggestions") as any)
      .select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false });
    setSuggestions((data as SeoInternalLinkSuggestion[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const generateSuggestions = async (projectData: any) => {
    if (!profile?.business_id || !projectId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "seo_internal_links", payload: projectData },
      });
      if (error) throw error;
      const links = data?.result?.suggestions || [];
      for (const link of links) {
        await (supabase.from("seo_internal_link_suggestions") as any).insert({
          business_id: profile.business_id,
          seo_project_id: projectId,
          source_page_url: link.source_url || "",
          target_page_url: link.target_url || "",
          anchor_text: link.anchor_text,
          link_context: link.reason,
        });
      }
      toast.success(`${links.length} internal link suggestions generated`);
      fetch();
    } catch {
      toast.error("Failed to generate suggestions");
    }
    setGenerating(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from("seo_internal_link_suggestions") as any).update({ status }).eq("id", id);
    fetch();
  };

  return { suggestions, loading, generating, generateSuggestions, updateStatus, refetch: fetch };
}
