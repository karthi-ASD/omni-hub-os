import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAILearning() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const [learningEvents, setLearningEvents] = useState<any[]>([]);
  const [modelTraining, setModelTraining] = useState<any[]>([]);
  const [behaviorPatterns, setBehaviorPatterns] = useState<any[]>([]);
  const [workflowAdaptations, setWorkflowAdaptations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    const [le, mt, bp, wa] = await Promise.all([
      supabase.from("ai_learning_events").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_model_training").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_behavior_patterns").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(30),
      supabase.from("ai_workflow_adaptations").select("*").eq("business_id", bid).order("created_at", { ascending: false }).limit(30),
    ]);
    setLearningEvents(le.data ?? []);
    setModelTraining(mt.data ?? []);
    setBehaviorPatterns(bp.data ?? []);
    setWorkflowAdaptations(wa.data ?? []);
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const runBehaviorAnalysis = useCallback(async () => {
    if (!bid) return;
    toast.info("Analyzing behavior patterns…");
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "behavior_analysis", payload: { business_id: bid } },
      });
      if (error) throw error;
      const patterns = data?.result?.patterns;
      if (patterns?.length) {
        for (const p of patterns) {
          await supabase.from("ai_behavior_patterns").insert({
            business_id: bid, pattern_type: p.pattern_type || "general",
            description: p.description, confidence_score: p.confidence_score ?? 0,
            recommendation: p.recommendation,
          });
        }
        toast.success(`${patterns.length} behavior patterns identified`);
        fetchAll();
      }
    } catch (e: any) { toast.error(e.message || "Analysis failed"); }
  }, [bid, fetchAll]);

  const runWorkflowOptimization = useCallback(async () => {
    if (!bid) return;
    toast.info("Optimizing workflows…");
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "workflow_optimization", payload: { business_id: bid } },
      });
      if (error) throw error;
      const adaptations = data?.result?.adaptations;
      if (adaptations?.length) {
        for (const a of adaptations) {
          await supabase.from("ai_workflow_adaptations").insert({
            business_id: bid, workflow_type: a.workflow_type || "general",
            adaptation_reason: a.reason, applied_changes: a.changes,
          });
        }
        toast.success(`${adaptations.length} workflow adaptations suggested`);
        fetchAll();
      }
    } catch (e: any) { toast.error(e.message || "Optimization failed"); }
  }, [bid, fetchAll]);

  const triggerModelTraining = useCallback(async (modelType: string) => {
    if (!bid) return;
    toast.info(`Training ${modelType} model…`);
    try {
      const { data, error } = await supabase.functions.invoke("ai-engine", {
        body: { task_type: "model_training", payload: { business_id: bid, model_type: modelType } },
      });
      if (error) throw error;
      const r = data?.result;
      await supabase.from("ai_model_training").insert({
        business_id: bid, model_type: modelType,
        training_data_size: r?.data_size ?? 0, accuracy_score: r?.accuracy ?? 0,
        status: "completed", summary: r?.summary, trained_at: new Date().toISOString(),
      });
      toast.success(`${modelType} model trained successfully`);
      fetchAll();
    } catch (e: any) { toast.error(e.message || "Training failed"); }
  }, [bid, fetchAll]);

  const applyAdaptation = useCallback(async (id: string) => {
    await supabase.from("ai_workflow_adaptations").update({ status: "applied" }).eq("id", id);
    setWorkflowAdaptations((prev) => prev.map((a) => a.id === id ? { ...a, status: "applied" } : a));
    toast.success("Adaptation applied");
  }, []);

  return {
    learningEvents, modelTraining, behaviorPatterns, workflowAdaptations,
    loading, fetchAll, runBehaviorAnalysis, runWorkflowOptimization,
    triggerModelTraining, applyAdaptation,
  };
}
