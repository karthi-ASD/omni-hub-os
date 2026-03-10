import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoProject {
  id: string;
  business_id: string;
  client_id: string | null;
  website_domain: string;
  project_name: string;
  target_location: string | null;
  target_keywords_json: any[];
  primary_keyword: string | null;
  service_package: string;
  seo_manager_id: string | null;
  seo_specialist_id: string | null;
  project_status: string;
  contract_start: string | null;
  contract_end: string | null;
  created_at: string;
  updated_at: string;
}

export function useSeoProjects() {
  const { profile } = useAuth();
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("seo_projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects((data as any as SeoProject[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (input: {
    client_id?: string;
    website_domain: string;
    project_name: string;
    target_location?: string;
    primary_keyword?: string;
    service_package?: string;
    seo_manager_id?: string;
    seo_specialist_id?: string;
    contract_start?: string;
    contract_end?: string;
  }) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase.from("seo_projects").insert({
      business_id: profile.business_id,
      ...input,
    } as any).select().single();
    if (error) { toast.error("Failed to create SEO project"); return null; }
    toast.success("SEO project created");
    fetch();
    return data as any as SeoProject;
  };

  const updateProject = async (id: string, updates: Partial<SeoProject>) => {
    await supabase.from("seo_projects").update(updates as any).eq("id", id);
    toast.success("Project updated");
    fetch();
  };

  return { projects, loading, create, updateProject, refetch: fetch };
}
