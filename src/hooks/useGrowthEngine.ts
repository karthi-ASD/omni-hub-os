import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useGrowthEngine() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [experiments, setExperiments] = useState<any[]>([]);
  const [landingPages, setLandingPages] = useState<any[]>([]);
  const [seoTasks, setSeoTasks] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);

  const businessId = profile?.business_id;

  const fetchCampaigns = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase.from("growth_campaigns").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setCampaigns((data as any) || []);
  }, [businessId]);

  const fetchExperiments = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase.from("growth_experiments").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setExperiments((data as any) || []);
  }, [businessId]);

  const fetchLandingPages = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase.from("ai_landing_pages").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setLandingPages((data as any) || []);
  }, [businessId]);

  const fetchSeoTasks = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase.from("seo_autopilot_tasks").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(50);
    setSeoTasks((data as any) || []);
  }, [businessId]);

  const fetchProposals = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase.from("proposal_automations").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    setProposals((data as any) || []);
  }, [businessId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCampaigns(), fetchExperiments(), fetchLandingPages(), fetchSeoTasks(), fetchProposals()]);
    setLoading(false);
  }, [fetchCampaigns, fetchExperiments, fetchLandingPages, fetchSeoTasks, fetchProposals]);

  const optimizeBudgets = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const campaignData = campaigns.map((c) => ({ channel: c.channel, budget: c.budget, spend: c.current_spend, conversion_rate: c.conversion_rate, leads: c.leads_generated }));
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { task_type: "budget_optimizer", payload: { campaigns: campaignData } } });
      if (error) throw error;
      if (data?.result?.adjustments) {
        for (const adj of data.result.adjustments) {
          const match = campaigns.find((c) => c.channel.toLowerCase() === adj.channel.toLowerCase());
          if (match) {
            await supabase.from("growth_campaigns").update({
              budget: adj.recommended_budget,
              last_adjustment: new Date().toISOString(),
              adjustment_history_json: [...(match.adjustment_history_json || []), { date: new Date().toISOString(), old: match.budget, new: adj.recommended_budget, reason: adj.reasoning }],
            } as any).eq("id", match.id);
          }
        }
        toast.success("Budget optimization complete");
        await fetchCampaigns();
      }
    } catch (e: any) { toast.error(e.message || "Budget optimization failed"); }
    finally { setLoading(false); }
  }, [businessId, campaigns, fetchCampaigns]);

  const generateLandingPage = useCallback(async (keyword: string, industry: string, location: string) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { task_type: "generate_landing_page", payload: { keyword, industry, location } } });
      if (error) throw error;
      if (data?.result) {
        await supabase.from("ai_landing_pages").insert({
          business_id: businessId, keyword, title: data.result.headline || keyword,
          headline: data.result.headline, meta_description: data.result.meta_description,
          content_json: data.result,
        } as any);
        toast.success("Landing page generated");
        await fetchLandingPages();
      }
    } catch (e: any) { toast.error(e.message || "Landing page generation failed"); }
    finally { setLoading(false); }
  }, [businessId, fetchLandingPages]);

  const runSeoAutopilot = useCallback(async (keyword: string, location: string, industry: string) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { task_type: "seo_autopilot", payload: { keyword, location, industry } } });
      if (error) throw error;
      if (data?.result?.tasks) {
        for (const task of data.result.tasks) {
          await supabase.from("seo_autopilot_tasks").insert({
            business_id: businessId, task_type: task.task_type, keyword: task.keyword, title: task.title, description: task.description,
          } as any);
        }
        toast.success(`${data.result.tasks.length} SEO tasks generated`);
        await fetchSeoTasks();
      }
    } catch (e: any) { toast.error(e.message || "SEO autopilot failed"); }
    finally { setLoading(false); }
  }, [businessId, fetchSeoTasks]);

  const generateProposal = useCallback(async (leadData: any) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { task_type: "auto_proposal", payload: leadData } });
      if (error) throw error;
      if (data?.result) {
        await supabase.from("proposal_automations").insert({
          business_id: businessId, lead_id: leadData.lead_id || null, lead_name: leadData.name || "Unknown",
          service_type: data.result.service_type, proposed_price: data.result.proposed_price || 0,
          proposal_content_json: data.result,
        } as any);
        toast.success("Proposal generated");
        await fetchProposals();
      }
    } catch (e: any) { toast.error(e.message || "Proposal generation failed"); }
    finally { setLoading(false); }
  }, [businessId, fetchProposals]);

  const createExperiment = useCallback(async (name: string, type: string, varA: string, varB: string) => {
    if (!businessId) return;
    await supabase.from("growth_experiments").insert({
      business_id: businessId, experiment_name: name, experiment_type: type, variant_a: varA, variant_b: varB,
    } as any);
    toast.success("Experiment created");
    await fetchExperiments();
  }, [businessId, fetchExperiments]);

  const analyzeExperiment = useCallback(async (exp: any) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", { body: { task_type: "ab_experiment", payload: exp } });
      if (error) throw error;
      if (data?.result) {
        await supabase.from("growth_experiments").update({
          winner: data.result.winner, status: "completed", ended_at: new Date().toISOString(),
        } as any).eq("id", exp.id);
        toast.success(`Winner: Variant ${data.result.winner}`);
        await fetchExperiments();
      }
    } catch (e: any) { toast.error(e.message || "Experiment analysis failed"); }
    finally { setLoading(false); }
  }, [businessId, fetchExperiments]);

  const addCampaign = useCallback(async (channel: string, budget: number) => {
    if (!businessId) return;
    await supabase.from("growth_campaigns").insert({ business_id: businessId, channel, budget } as any);
    toast.success("Campaign added");
    await fetchCampaigns();
  }, [businessId, fetchCampaigns]);

  return {
    loading, campaigns, experiments, landingPages, seoTasks, proposals,
    fetchAll, optimizeBudgets, generateLandingPage, runSeoAutopilot,
    generateProposal, createExperiment, analyzeExperiment, addCampaign,
  };
}
