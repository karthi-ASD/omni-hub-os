import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useGovernance() {
  const { profile } = useAuth();
  const bizId = profile?.business_id;

  const [healthScores, setHealthScores] = useState<any[]>([]);
  const [leadScores, setLeadScores] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [importJobs, setImportJobs] = useState<any[]>([]);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  const [themeSettings, setThemeSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!bizId) return;
    setLoading(true);
    const [hR, lR, dR, aR, iR, eR, tR] = await Promise.all([
      supabase.from("client_health_scores").select("*").eq("business_id", bizId).order("score", { ascending: true }).limit(100),
      supabase.from("lead_scores").select("*").eq("business_id", bizId).order("score", { ascending: false }).limit(100),
      supabase.from("duplicate_candidates").select("*").eq("business_id", bizId).eq("status", "OPEN").order("match_score", { ascending: false }).limit(50),
      supabase.from("approval_requests").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(100),
      supabase.from("import_jobs").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(50),
      supabase.from("export_jobs").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(50),
      supabase.from("theme_settings").select("*").eq("business_id", bizId).maybeSingle(),
    ]);
    setHealthScores((hR.data as any[]) ?? []);
    setLeadScores((lR.data as any[]) ?? []);
    setDuplicates((dR.data as any[]) ?? []);
    setApprovals((aR.data as any[]) ?? []);
    setImportJobs((iR.data as any[]) ?? []);
    setExportJobs((eR.data as any[]) ?? []);
    setThemeSettings((tR.data as any) ?? null);
    setLoading(false);
  }, [bizId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const decideApproval = async (id: string, status: "APPROVED" | "REJECTED", comment?: string) => {
    await supabase.from("approval_requests").update({ status, decision_comment: comment, decided_at: new Date().toISOString() } as any).eq("id", id);
    toast.success(`Request ${status.toLowerCase()}`);
    fetchAll();
  };

  const createApproval = async (values: Record<string, any>) => {
    if (!bizId) return;
    await supabase.from("approval_requests").insert({ ...values, business_id: bizId, requested_by: profile?.user_id } as any);
    toast.success("Approval request created");
    fetchAll();
  };

  const resolveDuplicate = async (id: string, status: "MERGED" | "IGNORED") => {
    await supabase.from("duplicate_candidates").update({ status } as any).eq("id", id);
    toast.success(`Duplicate ${status.toLowerCase()}`);
    fetchAll();
  };

  const saveTheme = async (values: Record<string, any>) => {
    if (!bizId) return;
    if (themeSettings) {
      await supabase.from("theme_settings").update(values as any).eq("id", themeSettings.id);
    } else {
      await supabase.from("theme_settings").insert({ ...values, business_id: bizId } as any);
    }
    toast.success("Theme saved");
    fetchAll();
  };

  return {
    healthScores, leadScores, duplicates, approvals, importJobs, exportJobs, themeSettings, loading,
    decideApproval, createApproval, resolveDuplicate, saveTheme, refresh: fetchAll,
  };
}
