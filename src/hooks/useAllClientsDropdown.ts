import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export interface DropdownClient {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  client_status: string;
  has_seo_service: boolean;
}

/**
 * Fetches ALL clients for dropdown use — single JOIN query, no pagination.
 * Single source of truth matching the Clients tab visibility rules.
 * Excludes only: reverted, deleted, merged.
 * Fetches SEO service status via embedded join for categorization.
 * Cached in-memory; auto-invalidates on client create/update/service changes.
 */
export function useAllClientsDropdown() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<DropdownClient[]>([]);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef<{ businessId: string; data: DropdownClient[] } | null>(null);

  const fetchClients = useCallback(async (skipCache = false) => {
    if (!profile?.business_id) return;

    // Return cached data if available for same business
    if (!skipCache && cacheRef.current?.businessId === profile.business_id) {
      setClients(cacheRef.current.data);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Single JOIN query — replaces the old dual-query approach
    const { data, error } = await supabase
      .from("clients")
      .select("id, contact_name, company_name, email, client_status, client_services(service_type, service_status)")
      .eq("business_id", profile.business_id)
      .not("client_status", "in", '("reverted","deleted","merged")')
      .order("contact_name", { ascending: true })
      .limit(1000);

    if (error) {
      console.warn("[Dropdown Clients] Query failed:", error.message);
      setClients([]);
      setLoading(false);
      return;
    }

    const clientRows = (data as any[]) || [];

    const result: DropdownClient[] = clientRows.map(c => {
      const status = (c.client_status || "").toLowerCase();
      const services = Array.isArray(c.client_services) ? c.client_services : [];
      const hasSeo = services.some(
        (s: any) => s.service_type === "seo" && s.service_status === "active"
      );

      return {
        id: c.id,
        contact_name: c.contact_name,
        company_name: c.company_name,
        email: c.email,
        client_status: status,
        has_seo_service: hasSeo,
      };
    });

    console.log("[Dropdown Clients] Loaded:", result.length, "with SEO:", result.filter(r => r.has_seo_service).length);
    cacheRef.current = { businessId: profile.business_id, data: result };
    setClients(result);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const refetch = useCallback(() => fetchClients(true), [fetchClients]);

  // Auto-invalidate cache when clients or dashboard data changes
  useSalesDataAutoRefresh(refetch, ["clients", "all"]);

  return { clients, loading, refetch };
}
