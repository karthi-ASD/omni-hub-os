import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useAIAgencyBrain() {
  const { profile } = useAuth();
  const bid = profile?.business_id;

  const [loading, setLoading] = useState(false);
  const [projectRisks, setProjectRisks] = useState<any[]>([]);
  const [taskSuggestions, setTaskSuggestions] = useState<any[]>([]);
  const [workloadResult, setWorkloadResult] = useState<any>(null);
  const [clientReport, setClientReport] = useState<any>(null);
  const [seoIssues, setSeoIssues] = useState<any>(null);
  const [churnRisks, setChurnRisks] = useState<any[]>([]);

  const invoke = useCallback(async (taskType: string, payload: any) => {
    const { data, error } = await supabase.functions.invoke("ai-engine", {
      body: { task_type: taskType, payload: { business_id: bid, ...payload } },
    });
    if (error) throw error;
    return data?.result;
  }, [bid]);

  const analyzeProjectRisk = useCallback(async (projectData: any) => {
    if (!bid) return;
    setLoading(true);
    try {
      const result = await invoke("agency_project_risk", projectData);
      if (result) {
        setProjectRisks((prev) => [{ ...result, project: projectData.project_name, timestamp: new Date().toISOString() }, ...prev]);
        // Store recommendation
        await supabase.from("ai_recommendations").insert({
          business_id: bid,
          recommendation_type: "project_risk",
          title: `Project Risk: ${projectData.project_name || "Unknown"}`,
          description: result.summary,
          priority: result.risk_status === "critical" ? "CRITICAL" : result.risk_status === "delayed" ? "HIGH" : result.risk_status === "at_risk" ? "MEDIUM" : "LOW",
          impact_score: result.risk_score,
          entity_type: "project",
          entity_id: projectData.project_id,
        } as any);
        toast.success("Project risk analysis complete");
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Analysis failed"); }
    finally { setLoading(false); }
  }, [bid, invoke]);

  const suggestTasks = useCallback(async (contextData: any) => {
    if (!bid) return;
    setLoading(true);
    try {
      const result = await invoke("agency_task_suggest", contextData);
      if (result?.suggestions) {
        setTaskSuggestions(result.suggestions);
        toast.success(`${result.suggestions.length} task suggestions generated`);
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Suggestion failed"); }
    finally { setLoading(false); }
  }, [bid, invoke]);

  const optimizeWorkload = useCallback(async (taskData: any) => {
    if (!bid) return;
    setLoading(true);
    try {
      const result = await invoke("agency_workload_optimize", taskData);
      if (result) {
        setWorkloadResult(result);
        toast.success("Workload optimization complete");
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Optimization failed"); }
    finally { setLoading(false); }
  }, [bid, invoke]);

  const generateClientReport = useCallback(async (reportData: any) => {
    if (!bid) return;
    setLoading(true);
    try {
      const result = await invoke("agency_client_report", reportData);
      if (result) {
        setClientReport(result);
        toast.success("Client report generated");
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Report generation failed"); }
    finally { setLoading(false); }
  }, [bid, invoke]);

  const detectSeoIssues = useCallback(async (seoData: any) => {
    if (!bid) return;
    setLoading(true);
    try {
      const result = await invoke("agency_seo_issues", seoData);
      if (result) {
        setSeoIssues(result);
        // Store as recommendations
        if (result.issues?.length) {
          const recs = result.issues.slice(0, 5).map((issue: any) => ({
            business_id: bid,
            recommendation_type: "seo_issue",
            title: issue.description,
            description: issue.suggested_fix,
            priority: issue.severity,
            entity_type: "seo_project",
            entity_id: seoData.project_id,
          }));
          await supabase.from("ai_recommendations").insert(recs as any);
        }
        toast.success(`${result.issues?.length || 0} SEO issues detected`);
      }
      return result;
    } catch (e: any) { toast.error(e.message || "SEO scan failed"); }
    finally { setLoading(false); }
  }, [bid, invoke]);

  const assessChurnRisk = useCallback(async (clientData: any) => {
    if (!bid) return;
    setLoading(true);
    try {
      const result = await invoke("agency_churn_risk", clientData);
      if (result) {
        setChurnRisks((prev) => [{ ...result, client_name: clientData.client_name, timestamp: new Date().toISOString() }, ...prev]);
        toast.success("Churn risk assessed");
      }
      return result;
    } catch (e: any) { toast.error(e.message || "Churn analysis failed"); }
    finally { setLoading(false); }
  }, [bid, invoke]);

  return {
    loading,
    projectRisks,
    taskSuggestions,
    workloadResult,
    clientReport,
    seoIssues,
    churnRisks,
    analyzeProjectRisk,
    suggestTasks,
    optimizeWorkload,
    generateClientReport,
    detectSeoIssues,
    assessChurnRisk,
  };
}
