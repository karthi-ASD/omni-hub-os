import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoBacklink {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  source_url: string;
  target_url: string | null;
  anchor_text: string | null;
  domain_authority: number | null;
  link_type: string;
  status: string;
  date_found: string;
  last_checked: string;
  created_at: string;
}

export const LINK_TYPES = ["DOFOLLOW", "NOFOLLOW", "UGC", "SPONSORED"];
export const BACKLINK_STATUSES = ["ACTIVE", "LOST", "NEW", "BROKEN"];

export function useSeoBacklinks(projectId?: string) {
  const { profile } = useAuth();
  const [backlinks, setBacklinks] = useState<SeoBacklink[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setBacklinks([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_backlinks") as any)
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false });
    setBacklinks((data as SeoBacklink[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addBacklink = async (input: {
    source_url: string;
    target_url?: string;
    anchor_text?: string;
    domain_authority?: number;
    link_type?: string;
    status?: string;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_backlinks") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Backlink added");
    fetch();
  };

  const updateBacklink = async (id: string, updates: Partial<SeoBacklink>) => {
    await (supabase.from("seo_backlinks") as any).update(updates).eq("id", id);
    fetch();
  };

  return { backlinks, loading, addBacklink, updateBacklink, refetch: fetch };
}
