import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoBacklinkOutreach {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  target_domain: string;
  target_contact_name: string | null;
  target_email: string | null;
  contact_source: string | null;
  outreach_type: string;
  pitch_subject: string | null;
  pitch_body: string | null;
  status: string;
  response_notes: string | null;
  assigned_employee_id: string | null;
  created_at: string;
  updated_at: string;
}

export const OUTREACH_TYPES = ["GUEST_POST", "DIRECTORY_LISTING", "CITATION", "LINK_INSERTION", "RESOURCE_PAGE", "BROKEN_LINK"] as const;
export const OUTREACH_STATUSES = ["PENDING", "SENT", "REPLIED", "NEGOTIATING", "ACCEPTED", "REJECTED", "LINK_ACQUIRED"] as const;

export function useSeoBacklinkOutreach(projectId?: string) {
  const { profile } = useAuth();
  const [outreach, setOutreach] = useState<SeoBacklinkOutreach[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId) { setOutreach([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_backlink_outreach") as any)
      .select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false });
    setOutreach((data as SeoBacklinkOutreach[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: {
    target_domain: string;
    target_contact_name?: string;
    target_email?: string;
    outreach_type?: string;
    pitch_subject?: string;
    pitch_body?: string;
    client_id?: string;
  }) => {
    if (!profile?.business_id || !projectId) return;
    await (supabase.from("seo_backlink_outreach") as any).insert({
      business_id: profile.business_id,
      seo_project_id: projectId,
      ...input,
    });
    toast.success("Outreach created");
    fetch();
  };

  const update = async (id: string, updates: Partial<SeoBacklinkOutreach>) => {
    await (supabase.from("seo_backlink_outreach") as any).update(updates).eq("id", id);
    fetch();
  };

  return { outreach, loading, create, update, refetch: fetch };
}
