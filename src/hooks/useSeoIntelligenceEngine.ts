import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SeoDomainAnalysis {
  id: string;
  business_id: string;
  seo_project_id: string | null;
  domain: string;
  status: string;
  seo_score: number;
  estimated_traffic: number;
  total_pages_crawled: number;
  total_keywords: number;
  total_backlinks_est: number;
  analysis_json: any;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface SeoKeywordIntelligence {
  id: string;
  keyword: string;
  keyword_type: string;
  estimated_volume: string;
  difficulty_score: number;
  current_position: number | null;
  ranking_url: string | null;
  intent: string;
  opportunity_score: number;
  is_branded: boolean;
  cluster_group: string | null;
}

export interface SeoRoadmapItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  estimated_impact: string;
  due_date: string | null;
  completed_at: string | null;
}

export interface SeoContentWorkflowItem {
  id: string;
  title: string;
  content_type: string;
  target_keyword: string | null;
  brief: string | null;
  status: string;
  seo_score: number | null;
  published_url: string | null;
}

export interface SeoTrafficEstimate {
  id: string;
  domain: string;
  estimated_monthly_traffic: number;
  estimated_organic_value: number;
  visibility_score: number;
  top_pages_json: any[];
  trend_json: any[];
  estimated_at: string;
}

export function useSeoIntelligenceEngine(projectId?: string) {
  const { profile } = useAuth();
  const [analyses, setAnalyses] = useState<SeoDomainAnalysis[]>([]);
  const [keywords, setKeywords] = useState<SeoKeywordIntelligence[]>([]);
  const [roadmap, setRoadmap] = useState<SeoRoadmapItem[]>([]);
  const [contentWorkflow, setContentWorkflow] = useState<SeoContentWorkflowItem[]>([]);
  const [trafficEstimate, setTrafficEstimate] = useState<SeoTrafficEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (!projectId) {
      setAnalyses([]); setKeywords([]); setRoadmap([]);
      setContentWorkflow([]); setTrafficEstimate(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const [aRes, kRes, rRes, cwRes, tRes] = await Promise.all([
      (supabase.from("seo_domain_analyses") as any).select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false }),
      (supabase.from("seo_keyword_intelligence") as any).select("*").eq("seo_project_id", projectId).order("opportunity_score", { ascending: false }).limit(500),
      (supabase.from("seo_roadmap_items") as any).select("*").eq("seo_project_id", projectId).order("created_at"),
      (supabase.from("seo_content_workflow") as any).select("*").eq("seo_project_id", projectId).order("created_at", { ascending: false }),
      (supabase.from("seo_traffic_estimates") as any).select("*").eq("seo_project_id", projectId).order("estimated_at", { ascending: false }).limit(1),
    ]);

    setAnalyses(aRes.data || []);
    setKeywords(kRes.data || []);
    setRoadmap(rRes.data || []);
    setContentWorkflow(cwRes.data || []);
    setTrafficEstimate(tRes.data?.[0] || null);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const pollForCompletion = useCallback((analysisId: string) => {
    let elapsed = 0;
    pollingRef.current = setInterval(async () => {
      elapsed += 3;
      setAnalysisProgress(Math.min(95, elapsed * 2));

      const { data } = await (supabase.from("seo_domain_analyses") as any)
        .select("status, seo_score, total_keywords")
        .eq("id", analysisId)
        .single();

      if (data?.status === "completed") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setAnalyzing(false);
        setAnalysisProgress(100);
        toast.success(`Analysis complete! SEO Score: ${data.seo_score}/100, ${data.total_keywords} keywords discovered`);
        fetchAll();
      } else if (data?.status === "failed") {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setAnalyzing(false);
        setAnalysisProgress(0);
        toast.error("Analysis failed. Please try again.");
      }

      // Timeout after 3 minutes
      if (elapsed > 180) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        setAnalyzing(false);
        setAnalysisProgress(0);
        toast.error("Analysis timed out. Results may still populate shortly.");
        fetchAll();
      }
    }, 3000);
  }, [fetchAll]);

  const runDomainAnalysis = async (domain: string) => {
    if (!profile?.business_id || !projectId) return;
    setAnalyzing(true);
    setAnalysisProgress(5);
    try {
      const { data, error } = await supabase.functions.invoke("seo-domain-analyze", {
        body: { domain, business_id: profile.business_id, seo_project_id: projectId },
      });
      if (error) throw error;

      const analysisId = data?.analysis_id;
      if (analysisId) {
        toast.info("SEO analysis started. Processing keywords, competitors, audit...");
        pollForCompletion(analysisId);
      } else {
        // Legacy sync response
        setAnalyzing(false);
        setAnalysisProgress(100);
        toast.success(`Analysis complete! SEO Score: ${data?.seo_score || 0}/100`);
        fetchAll();
      }
    } catch (e: any) {
      setAnalyzing(false);
      setAnalysisProgress(0);
      toast.error("Analysis failed: " + (e.message || "Unknown error"));
    }
  };

  const updateRoadmapItem = async (id: string, updates: Partial<SeoRoadmapItem>) => {
    await (supabase.from("seo_roadmap_items") as any).update(updates).eq("id", id);
    toast.success("Roadmap updated");
    fetchAll();
  };

  const updateContentWorkflow = async (id: string, updates: Partial<SeoContentWorkflowItem>) => {
    await (supabase.from("seo_content_workflow") as any).update(updates).eq("id", id);
    toast.success("Content workflow updated");
    fetchAll();
  };

  return {
    analyses, keywords, roadmap, contentWorkflow, trafficEstimate,
    loading, analyzing, analysisProgress, runDomainAnalysis,
    updateRoadmapItem, updateContentWorkflow,
    refetch: fetchAll,
  };
}
