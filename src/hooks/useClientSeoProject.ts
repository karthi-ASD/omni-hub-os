import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientSeoProject {
  id: string;
  project_name: string;
  service_package: string | null;
  contract_start: string | null;
  project_status: string;
  target_location: string | null;
  website_domain: string | null;
  onboarding_status: string | null;
}

export function useClientSeoProject() {
  const { clientId } = useAuth();
  const [projects, setProjects] = useState<ClientSeoProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    const { data } = await supabase
      .from("seo_projects")
      .select("id, project_name, service_package, contract_start, project_status, target_location, website_domain, onboarding_status")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setProjects((data as any[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { projects, loading, refresh: fetch };
}

export function useClientSeoProjectDetail(projectId: string | undefined) {
  const { clientId } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [workLog, setWorkLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!projectId || !clientId) { setLoading(false); return; }
    setLoading(true);

    const [projRes, kwRes, compRes, workRes] = await Promise.all([
      supabase.from("seo_projects")
        .select("*")
        .eq("id", projectId)
        .eq("client_id", clientId)
        .maybeSingle(),
      supabase.from("seo_keywords")
        .select("id, keyword, current_ranking, previous_ranking, search_volume, keyword_type, status, target_rank, location")
        .eq("seo_project_id", projectId)
        .order("current_ranking", { ascending: true, nullsFirst: false }),
      supabase.from("seo_competitors")
        .select("id, competitor_name, competitor_domain, ranking_position")
        .eq("client_id", clientId)
        .limit(30),
      supabase.from("seo_tasks")
        .select("id, task_title, task_category, status, updated_at, priority")
        .eq("seo_project_id", projectId)
        .eq("is_visible_to_client", true)
        .order("updated_at", { ascending: false })
        .limit(50),
    ]);

    setProject(projRes.data);
    setKeywords((kwRes.data as any[]) ?? []);
    setCompetitors((compRes.data as any[]) ?? []);
    setWorkLog((workRes.data as any[]) ?? []);
    setLoading(false);
  }, [projectId, clientId]);

  useEffect(() => { fetch(); }, [fetch]);
  return { project, keywords, competitors, workLog, loading, refresh: fetch };
}
