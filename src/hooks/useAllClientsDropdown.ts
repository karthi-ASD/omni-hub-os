import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DropdownClient {
  id: string;
  contact_name: string;
  client_status: string;
}

/**
 * Fetches ALL clients for dropdown use — no pagination, no status filtering.
 * Single source of truth matching the Clients tab visibility rules.
 * Excludes only: reverted, deleted, merged.
 */
export function useAllClientsDropdown() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<DropdownClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("id, contact_name, client_status")
      .eq("business_id", profile.business_id)
      .not("client_status", "in", '("reverted","deleted","merged")')
      .order("contact_name", { ascending: true });

    if (error) {
      console.warn("[Dropdown Clients] Query failed:", error.message);
    }
    const result = (data as any as DropdownClient[]) || [];
    console.log("[Dropdown Clients] Loaded:", result.length);
    setClients(result);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { clients, loading, refetch: fetch };
}
