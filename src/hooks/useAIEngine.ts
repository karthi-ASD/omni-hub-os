import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAIEngine() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  const runTask = useCallback(async (task_type: string, payload: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type, payload },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return null;
      }

      // Log the AI task
      if (profile?.business_id) {
        await supabase.from("ai_tasks").insert({
          business_id: profile.business_id,
          task_type,
          input_json: payload,
          output_json: data.result,
          confidence_score: data.result?.confidence || data.result?.score || null,
          status: "completed",
        } as any);
      }

      return data.result;
    } catch (e: any) {
      toast.error(e.message || "AI task failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, [profile?.business_id]);

  const scoreLead = useCallback(async (lead: any) => {
    const result = await runTask("lead_score", lead);
    if (result && lead.id) {
      await supabase.from("leads").update({
        ai_score: result.score,
        ai_priority: result.priority,
        ai_recommended_action: result.recommended_action,
      }).eq("id", lead.id);

      if (profile?.business_id) {
        await supabase.from("system_events").insert({
          business_id: profile.business_id,
          event_type: "AI_LEAD_SCORED",
          payload_json: { lead_id: lead.id, score: result.score, priority: result.priority },
        });
      }
    }
    return result;
  }, [runTask, profile?.business_id]);

  const analyzeSeo = useCallback(async (campaignData: any) => {
    const result = await runTask("seo_analysis", campaignData);
    if (result && profile?.business_id) {
      await supabase.from("seo_ai_recommendations").insert({
        business_id: profile.business_id,
        campaign_id: campaignData.campaign_id || null,
        recommendation_type: "full_analysis",
        recommendations_json: result.recommendations || [],
      } as any);
    }
    return result;
  }, [runTask, profile?.business_id]);

  const forecastSales = useCallback(async (pipelineData: any) => {
    const result = await runTask("sales_forecast", pipelineData);
    if (result && profile?.business_id) {
      await supabase.from("ai_sales_forecasts").insert({
        business_id: profile.business_id,
        period: new Date().toISOString().slice(0, 7),
        projected_revenue: result.projected_revenue || 0,
        confidence: result.confidence || 0,
        factors_json: { factors: result.factors || [], summary: result.summary || "" },
      } as any);
    }
    return result;
  }, [runTask, profile?.business_id]);

  return { scoreLead, analyzeSeo, forecastSales, loading };
}
