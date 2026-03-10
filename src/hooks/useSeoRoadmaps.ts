import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoRoadmap {
  id: string;
  business_id: string;
  client_id: string | null;
  seo_project_id: string | null;
  roadmap_type: string;
  roadmap_title: string;
  roadmap_content_json: any;
  generated_by: string;
  created_at: string;
}

export const ROADMAP_TYPES = ["30_DAY", "90_DAY", "180_DAY"] as const;

export function useSeoRoadmaps(projectId?: string) {
  const { profile } = useAuth();
  const [roadmaps, setRoadmaps] = useState<SeoRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setRoadmaps([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase.from("seo_roadmaps") as any)
      .select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false });
    setRoadmaps((data as SeoRoadmap[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const generate = async (roadmapType: string, projectData: any) => {
    if (!profile?.business_id || !projectId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "seo_roadmap_generate", payload: { roadmap_type: roadmapType, ...projectData } },
      });
      if (error) throw error;
      const r = data?.result || {};
      await (supabase.from("seo_roadmaps") as any).insert({
        business_id: profile.business_id,
        seo_project_id: projectId,
        client_id: projectData.client_id,
        roadmap_type: roadmapType,
        roadmap_title: r.title || `${roadmapType.replace("_", " ")} SEO Roadmap`,
        roadmap_content_json: r.roadmap || r,
      });
      toast.success("Roadmap generated");
      fetch();
    } catch {
      toast.error("Failed to generate roadmap");
    }
    setGenerating(false);
  };

  return { roadmaps, loading, generating, generate, refetch: fetch };
}
