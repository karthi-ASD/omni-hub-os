import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface IntegrityRecord {
  id: string;
  business_id: string;
  contact_name: string;
  email: string;
  phone: string | null;
  xero_contact_id: string | null;
  client_status: string;
  duplicate_email_count: number;
  duplicate_phone_count: number;
  ticket_count: number;
  seo_project_count: number;
  invoice_count: number;
  project_count: number;
}

interface UnmatchedRecord {
  id: string;
  source_table: string;
  source_record_id: string;
  match_email: string | null;
  match_phone: string | null;
  resolution_status: string;
  suggested_client_id: string | null;
  match_confidence: string | null;
  suggested_match_method: string | null;
  created_at: string;
}

interface ModuleSummary {
  [table: string]: { orphans: number; total: number };
}

interface BackfillResult {
  mode: string;
  total_matched: number;
  total_unmatched: number;
  details: any[];
}

interface PreConstraintReport {
  unmatched_by_table: Record<string, number>;
  duplicate_emails: number;
  duplicate_phones: number;
  auto_linked: number;
  pending_manual: number;
}

interface ClientDebug {
  client: any;
  modules: Record<string, number>;
  email_duplicates: any[];
  phone_duplicates: any[];
  unmatched_records: any[];
  health_status: string;
}

export function useClientIntegrity() {
  const { profile } = useAuth();
  const [duplicates, setDuplicates] = useState<IntegrityRecord[]>([]);
  const [unmatchedRecords, setUnmatchedRecords] = useState<UnmatchedRecord[]>([]);
  const [moduleSummary, setModuleSummary] = useState<ModuleSummary>({});
  const [preReport, setPreReport] = useState<PreConstraintReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);
  const [clientDebug, setClientDebug] = useState<ClientDebug | null>(null);

  const invoke = useCallback(async (body: any) => {
    const { data, error } = await supabase.functions.invoke("client-identity-resolver", { body });
    if (error) throw error;
    return data;
  }, []);

  const fetchDuplicates = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    try {
      const data = await invoke({ action: "integrity_report" });
      setDuplicates((data?.records as IntegrityRecord[]) || []);
    } catch { /* silent */ }
    setLoading(false);
  }, [profile?.business_id, invoke]);

  const fetchUnmatched = useCallback(async () => {
    if (!profile?.business_id) return;
    try {
      const data = await invoke({ action: "unmatched_list" });
      setUnmatchedRecords((data?.records as UnmatchedRecord[]) || []);
    } catch { /* silent */ }
  }, [profile?.business_id, invoke]);

  const fetchModuleSummary = useCallback(async () => {
    if (!profile?.business_id) return;
    try {
      const data = await invoke({ action: "module_summary" });
      setModuleSummary(data?.summary || {});
    } catch { /* silent */ }
  }, [profile?.business_id, invoke]);

  const fetchPreReport = useCallback(async () => {
    if (!profile?.business_id) return;
    try {
      const data = await invoke({ action: "pre_constraint_report" });
      setPreReport(data as PreConstraintReport);
    } catch { /* silent */ }
  }, [profile?.business_id, invoke]);

  const scanOrphans = useCallback(async () => {
    setScanning(true);
    try {
      const data = await invoke({ action: "scan_orphans" });
      toast.success(`Scan complete: ${data?.new_orphans_found || 0} new orphan records found`);
      await fetchUnmatched();
      await fetchModuleSummary();
    } catch {
      toast.error("Scan failed");
    }
    setScanning(false);
  }, [invoke, fetchUnmatched, fetchModuleSummary]);

  const linkRecord = useCallback(async (recordId: string, clientId: string) => {
    try {
      const data = await invoke({ action: "link_record", record_id: recordId, client_id: clientId });
      if (data?.error) { toast.error(data.error); return false; }
      toast.success("Record linked successfully");
      await fetchUnmatched();
      return true;
    } catch {
      toast.error("Failed to link record");
      return false;
    }
  }, [invoke, fetchUnmatched]);

  const runBackfill = useCallback(async (dryRun: boolean, table?: string) => {
    try {
      const data = await invoke({ action: dryRun ? "backfill_dry_run" : "backfill_apply", table });
      setBackfillResult(data as BackfillResult);
      toast.success(`${dryRun ? "Dry run" : "Backfill"} complete: ${data.total_matched} matched, ${data.total_unmatched} unmatched`);
      if (!dryRun) {
        await fetchUnmatched();
        await fetchModuleSummary();
      }
      return data;
    } catch {
      toast.error("Backfill failed");
      return null;
    }
  }, [invoke, fetchUnmatched, fetchModuleSummary]);

  const getClientDebug = useCallback(async (clientId: string) => {
    try {
      const data = await invoke({ action: "client_debug", client_id: clientId });
      setClientDebug(data as ClientDebug);
      return data;
    } catch {
      toast.error("Failed to load client debug info");
      return null;
    }
  }, [invoke]);

  const resolveClient = useCallback(async (email?: string, phone?: string, externalId?: string) => {
    try {
      const data = await invoke({ action: "resolve", email, phone, external_id: externalId });
      return data?.client_id || null;
    } catch { return null; }
  }, [invoke]);

  useEffect(() => {
    fetchDuplicates();
    fetchUnmatched();
    fetchModuleSummary();
  }, [fetchDuplicates, fetchUnmatched, fetchModuleSummary]);

  return {
    duplicates,
    unmatchedRecords,
    moduleSummary,
    preReport,
    backfillResult,
    clientDebug,
    loading,
    scanning,
    scanOrphans,
    linkRecord,
    runBackfill,
    getClientDebug,
    resolveClient,
    fetchPreReport,
    refetch: () => { fetchDuplicates(); fetchUnmatched(); fetchModuleSummary(); },
  };
}
