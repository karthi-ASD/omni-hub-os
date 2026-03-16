import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoGbpProfile {
  id: string;
  seo_project_id: string | null;
  existing_listing: boolean;
  listing_url: string | null;
  verification_status: string;
  nap_consistency_check: boolean;
  reviews_count: number;
  rating_avg: number;
  gmb_posts_count: number;
  last_optimisation_date: string | null;
  last_post_date: string | null;
  status: string;
}

export function useSeoGbp(projectId?: string) {
  const { profile } = useAuth();
  const [gbp, setGbp] = useState<SeoGbpProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setGbp(null); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_gbp_profiles") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .maybeSingle();
    setGbp(data || null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (input: Partial<SeoGbpProfile>) => {
    if (!profile?.business_id || !projectId) return;
    if (gbp) {
      await (supabase.from("seo_gbp_profiles") as any).update(input).eq("id", gbp.id);
    } else {
      await (supabase.from("seo_gbp_profiles") as any).insert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        ...input,
      });
    }
    toast.success("GBP profile updated");
    fetch();
  };

  return { gbp, loading, upsert, refetch: fetch };
}
