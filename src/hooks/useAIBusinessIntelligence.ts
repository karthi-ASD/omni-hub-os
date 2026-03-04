import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAIEngine } from "@/hooks/useAIEngine";
import { toast } from "sonner";

export interface LeadScore {
  id: string;
  lead_id: string;
  lead_score: number;
  conversion_probability: number;
  confidence_score: number;
  factors_json: any;
  last_updated: string;
}

export interface MarketingInsight {
  id: string;
  channel: string;
  leads_generated: number;
  conversion_rate: number;
  roi_score: number;
  spend: number;
  revenue_attributed: number;
  recommendations_json: any;
  period: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  impact_score: number;
  status: string;
  entity_type: string | null;
  entity_id: string | null;
  action_url: string | null;
  created_at: string;
}

export interface CustomerHealth {
  id: string;
  client_id: string;
  health_score: number;
  risk_level: string;
  reasons_json: any;
}

export function useAIBusinessIntelligence() {
  const { profile } = useAuth();
  const { loading: aiLoading } = useAIEngine();
  const [loading, setLoading] = useState(false);
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [marketingInsights, setMarketingInsights] = useState<MarketingInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [customerHealth, setCustomerHealth] = useState<CustomerHealth[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);

  const businessId = profile?.business_id;

  const fetchLeadScores = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("ai_lead_scores")
      .select("*")
      .eq("business_id", businessId)
      .order("lead_score", { ascending: false })
      .limit(50);
    setLeadScores((data as any) || []);
  }, [businessId]);

  const fetchMarketingInsights = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("ai_marketing_insights")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(20);
    setMarketingInsights((data as any) || []);
  }, [businessId]);

  const fetchRecommendations = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(30);
    setRecommendations((data as any) || []);
  }, [businessId]);

  const fetchCustomerHealth = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("client_health_scores")
      .select("*")
      .eq("business_id", businessId)
      .order("score", { ascending: true })
      .limit(30);
    setCustomerHealth((data as any) || []);
  }, [businessId]);

  const fetchForecasts = useCallback(async () => {
    if (!businessId) return;
    const { data } = await supabase
      .from("ai_sales_forecasts")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(12);
    setForecasts((data as any) || []);
  }, [businessId]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchLeadScores(),
      fetchMarketingInsights(),
      fetchRecommendations(),
      fetchCustomerHealth(),
      fetchForecasts(),
    ]);
    setLoading(false);
  }, [fetchLeadScores, fetchMarketingInsights, fetchRecommendations, fetchCustomerHealth, fetchForecasts]);

  const runLeadScoring = useCallback(async (leads: any[]) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "lead_score", payload: { leads: leads.slice(0, 10) } },
      });
      if (error) throw error;
      if (data?.result) {
        // Store each scored lead
        for (const lead of leads.slice(0, 10)) {
          await supabase.from("ai_lead_scores").insert({
            business_id: businessId,
            lead_id: lead.id,
            lead_score: data.result.score || 50,
            conversion_probability: data.result.conversion_probability || 50,
            confidence_score: data.result.score || 50,
            factors_json: { reasoning: data.result.reasoning, action: data.result.recommended_action },
          } as any);
        }
        toast.success("Lead scoring complete");
        await fetchLeadScores();
      }
    } catch (e: any) {
      toast.error(e.message || "Lead scoring failed");
    } finally {
      setLoading(false);
    }
  }, [businessId, fetchLeadScores]);

  const runChurnDetection = useCallback(async (clients: any[]) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "churn_detection", payload: { clients: clients.slice(0, 10) } },
      });
      if (error) throw error;
      if (data?.result) {
        for (const client of clients.slice(0, 10)) {
          await supabase.from("client_health_scores").upsert({
            business_id: businessId,
            client_id: client.id,
            score: data.result.health_score || 50,
            risk_level: data.result.risk_level || "MEDIUM",
            reasons_json: { factors: data.result.risk_factors, actions: data.result.recommended_actions },
          } as any, { onConflict: "id" });
        }
        toast.success("Churn detection complete");
        await fetchCustomerHealth();
      }
    } catch (e: any) {
      toast.error(e.message || "Churn detection failed");
    } finally {
      setLoading(false);
    }
  }, [businessId, fetchCustomerHealth]);

  const runMarketingAnalysis = useCallback(async (channelData: any) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "marketing_analysis", payload: channelData },
      });
      if (error) throw error;
      if (data?.result?.channel_analysis) {
        for (const ch of data.result.channel_analysis) {
          await supabase.from("ai_marketing_insights").insert({
            business_id: businessId,
            channel: ch.channel,
            roi_score: ch.roi_score || 0,
            recommendations_json: { rating: ch.performance_rating, budget: ch.budget_recommendation, change: ch.recommended_change_percent },
            period: new Date().toISOString().slice(0, 7),
          } as any);
        }
        toast.success("Marketing analysis complete");
        await fetchMarketingInsights();
      }
    } catch (e: any) {
      toast.error(e.message || "Marketing analysis failed");
    } finally {
      setLoading(false);
    }
  }, [businessId, fetchMarketingInsights]);

  const runRecommendations = useCallback(async (bizData: any) => {
    if (!businessId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "business_recommendations", payload: bizData },
      });
      if (error) throw error;
      if (data?.result?.recommendations) {
        for (const rec of data.result.recommendations) {
          await supabase.from("ai_recommendations").insert({
            business_id: businessId,
            recommendation_type: rec.recommendation_type || "general",
            priority: rec.priority || "MEDIUM",
            title: rec.title,
            description: rec.description,
            impact_score: rec.impact_score || 50,
            entity_type: rec.entity_type || null,
          } as any);
        }
        toast.success("Recommendations generated");
        await fetchRecommendations();
      }
    } catch (e: any) {
      toast.error(e.message || "Recommendations failed");
    } finally {
      setLoading(false);
    }
  }, [businessId, fetchRecommendations]);

  const dismissRecommendation = useCallback(async (id: string) => {
    await supabase.from("ai_recommendations").update({ status: "dismissed" } as any).eq("id", id);
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const completeRecommendation = useCallback(async (id: string) => {
    await supabase.from("ai_recommendations").update({ status: "completed" } as any).eq("id", id);
    setRecommendations((prev) => prev.map((r) => r.id === id ? { ...r, status: "completed" } : r));
  }, []);

  return {
    loading: loading || aiLoading,
    leadScores,
    marketingInsights,
    recommendations,
    customerHealth,
    forecasts,
    fetchAll,
    runLeadScoring,
    runChurnDetection,
    runMarketingAnalysis,
    runRecommendations,
    dismissRecommendation,
    completeRecommendation,
  };
}
