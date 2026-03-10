import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoAiRecommendation {
  id: string;
  business_id: string;
  seo_project_id: string;
  recommendation_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export function useSeoAiRecommendations(projectId?: string) {
  const { profile } = useAuth();
  const [recommendations, setRecommendations] = useState<SeoAiRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetch = useCallback(async () => {
    if (!projectId) { setRecommendations([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("seo_ai_recommendations")
      .select("*")
      .eq("seo_project_id", projectId)
      .order("created_at", { ascending: false });
    setRecommendations((data as any as SeoAiRecommendation[]) || []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetch(); }, [fetch]);

  const generateRecommendations = async (projectData: any) => {
    if (!profile?.business_id || !projectId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: {
          task_type: "seo_advisor",
          business_id: profile.business_id,
          project_id: projectId,
          project_data: projectData,
        },
      });
      if (error) throw error;

      // Parse and insert recommendations
      const recs = data?.recommendations || [];
      for (const rec of recs) {
        await supabase.from("seo_ai_recommendations").insert({
          business_id: profile.business_id,
          seo_project_id: projectId,
          recommendation_type: rec.type || "OPTIMIZATION",
          title: rec.title,
          description: rec.description,
          priority: rec.priority || "MEDIUM",
        } as any);
      }
      toast.success(`${recs.length} AI recommendations generated`);
      fetch();
    } catch (e) {
      toast.error("Failed to generate recommendations");
    }
    setGenerating(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("seo_ai_recommendations").update({ status } as any).eq("id", id);
    fetch();
  };

  return { recommendations, loading, generating, generateRecommendations, updateStatus, refetch: fetch };
}
