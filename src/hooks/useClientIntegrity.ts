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
  created_at: string;
}

export function useClientIntegrity() {
  const { profile } = useAuth();
  const [duplicates, setDuplicates] = useState<IntegrityRecord[]>([]);
  const [unmatchedRecords, setUnmatchedRecords] = useState<UnmatchedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const fetchDuplicates = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase.functions.invoke("client-identity-resolver", {
      body: { action: "integrity_report" },
    });
    setDuplicates((data?.records as IntegrityRecord[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchUnmatched = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase.functions.invoke("client-identity-resolver", {
      body: { action: "unmatched_list" },
    });
    setUnmatchedRecords((data?.records as UnmatchedRecord[]) || []);
  }, [profile?.business_id]);

  const scanOrphans = useCallback(async () => {
    setScanning(true);
    const { data, error } = await supabase.functions.invoke("client-identity-resolver", {
      body: { action: "scan_orphans" },
    });
    if (error) {
      toast.error("Scan failed");
    } else {
      toast.success(`Scan complete: ${data?.new_orphans_found || 0} new orphan records found`);
      await fetchUnmatched();
    }
    setScanning(false);
  }, [fetchUnmatched]);

  const linkRecord = useCallback(async (recordId: string, clientId: string) => {
    const { data, error } = await supabase.functions.invoke("client-identity-resolver", {
      body: { action: "link_record", record_id: recordId, client_id: clientId },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Failed to link record");
      return false;
    }
    toast.success("Record linked successfully");
    await fetchUnmatched();
    return true;
  }, [fetchUnmatched]);

  const resolveClient = useCallback(async (email?: string, phone?: string, externalId?: string) => {
    const { data } = await supabase.functions.invoke("client-identity-resolver", {
      body: { action: "resolve", email, phone, external_id: externalId },
    });
    return data?.client_id || null;
  }, []);

  useEffect(() => {
    fetchDuplicates();
    fetchUnmatched();
  }, [fetchDuplicates, fetchUnmatched]);

  return {
    duplicates,
    unmatchedRecords,
    loading,
    scanning,
    scanOrphans,
    linkRecord,
    resolveClient,
    refetch: () => { fetchDuplicates(); fetchUnmatched(); },
  };
}
