import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CredentialExpiry {
  id: string;
  client_id: string;
  business_id: string;
  credential_type: string;
  provider_name: string | null;
  domain_name: string | null;
  expiry_date: string;
  reminder_days: number;
  reminder_email: string | null;
  auto_renew_status: string;
  status: string;
  notes: string | null;
  is_archived: boolean;
  updated_at: string;
  client_name?: string;
}

export function useAccessRenewalsDashboard() {
  const { profile } = useAuth();
  const [credentials, setCredentials] = useState<CredentialExpiry[]>([]);
  const [reminderLogs, setReminderLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const [credRes, logRes] = await Promise.all([
      supabase
        .from("client_access_credentials")
        .select("id, client_id, business_id, credential_type, provider_name, domain_name, expiry_date, reminder_days, reminder_email, auto_renew_status, status, notes, is_archived, updated_at")
        .eq("business_id", profile.business_id)
        .eq("is_archived", false)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true }),
      supabase
        .from("renewal_reminder_logs")
        .select("*")
        .eq("business_id", profile.business_id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    // Fetch client names for display
    const clientIds = [...new Set((credRes.data || []).map((c: any) => c.client_id))];
    let clientMap: Record<string, string> = {};
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, contact_name")
        .in("id", clientIds);
      clientMap = Object.fromEntries((clients || []).map((c: any) => [c.id, c.contact_name]));
    }

    const enriched = (credRes.data || []).map((c: any) => ({
      ...c,
      client_name: clientMap[c.client_id] || "Unknown",
    }));

    setCredentials(enriched);
    setReminderLogs(logRes.data || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { credentials, reminderLogs, loading, refresh: fetchData };
}
