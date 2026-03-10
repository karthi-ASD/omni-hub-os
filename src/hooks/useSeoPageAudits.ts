import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoPageAudit {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  page_url: string;
  audit_date: string;
  title_tag: string | null;
  meta_description: string | null;
  h1_tag: string | null;
  word_count: number;
  internal_links_count: number;
  external_links_count: number;
  image_count: number;
  missing_alt_tags_count: number;
  canonical_url: string | null;
  page_speed_score: number;
  mobile_friendly: boolean;
  schema_present: boolean;
  broken_links_count: number;
  seo_score: number;
  issues_json: any;
  created_at: string;
}

export function useSeoPageAudits(projectId?: string) {
  const { profile } = useAuth();
  const [audits, setAudits] = useState<SeoPageAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditing, setAuditing] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setAudits([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_page_audits") as any)
      .select("*").eq("seo_project_id", projectId).order("seo_score", { ascending: true });
    setAudits((data as SeoPageAudit[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const auditPage = async (pageUrl: string) => {
    if (!profile?.business_id || !projectId) return;
    setAuditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "seo_page_audit", payload: { page_url: pageUrl, project_id: projectId } },
      });
      if (error) throw error;
      const r = data?.result || {};
      await (supabase.from("seo_page_audits") as any).insert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        page_url: pageUrl,
        title_tag: r.title_tag,
        meta_description: r.meta_description,
        h1_tag: r.h1_tag,
        word_count: r.word_count || 0,
        internal_links_count: r.internal_links_count || 0,
        external_links_count: r.external_links_count || 0,
        image_count: r.image_count || 0,
        missing_alt_tags_count: r.missing_alt_tags_count || 0,
        canonical_url: r.canonical_url,
        page_speed_score: r.page_speed_score || 0,
        mobile_friendly: r.mobile_friendly ?? true,
        schema_present: r.schema_present ?? false,
        broken_links_count: r.broken_links_count || 0,
        seo_score: r.seo_score || 0,
        issues_json: r.issues || [],
      });
      toast.success(`Page audited: ${r.seo_score || 0}/100`);
      fetch();
    } catch {
      toast.error("Failed to audit page");
    }
    setAuditing(false);
  };

  return { audits, loading, auditing, auditPage, refetch: fetch };
}
