import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoTechnicalAudit {
  id: string;
  campaign_id: string;
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

export function useSeoTechnical(campaignId?: string) {
  const { profile } = useAuth();
  const [audit, setAudit] = useState<SeoTechnicalAudit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!campaignId) { setAudit(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("seo_technical_audits")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .maybeSingle();
    setAudit(data as any);
    setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (input: Partial<SeoTechnicalAudit>) => {
    if (!profile?.business_id || !campaignId) return;
    if (audit) {
      await supabase.from("seo_technical_audits").update(input as any).eq("id", audit.id);
    } else {
      await supabase.from("seo_technical_audits").insert({
        business_id: profile.business_id,
        campaign_id: campaignId,
        ...input,
      } as any);
    }
    toast.success("Technical audit updated");
    fetch();
  };

  return { audit, loading, upsert, refetch: fetch };
}
