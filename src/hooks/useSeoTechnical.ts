import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoTechnicalAudit {
  id: string;
  seo_project_id: string | null;
  desktop_speed: number | null;
  mobile_speed: number | null;
  ssl_active: boolean;
  sitemap_submitted: boolean;
  robots_txt_checked: boolean;
  schema_added: boolean;
  broken_links_count: number;
  core_web_vitals_json: any;
  last_audit_date: string | null;
  notes: string | null;
  created_at: string;
}

export function useSeoTechnical(projectId?: string) {
  const { profile } = useAuth();
  const [audit, setAudit] = useState<SeoTechnicalAudit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setAudit(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_technical_audits") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setAudit(data || null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (input: Partial<SeoTechnicalAudit>) => {
    if (!profile?.business_id || !projectId) return;
    if (audit) {
      await (supabase.from("seo_technical_audits") as any).update({ ...input, last_audit_date: new Date().toISOString() }).eq("id", audit.id);
    } else {
      await (supabase.from("seo_technical_audits") as any).insert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        last_audit_date: new Date().toISOString(),
        ...input,
      });
    }
    toast.success("Technical audit updated");
    fetch();
  };

  return { audit, loading, upsert, refetch: fetch };
}
