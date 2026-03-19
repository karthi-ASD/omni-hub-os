import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DropdownClient {
  id: string;
  contact_name: string;
  company_name: string | null;
  email: string | null;
  client_status: string;
  has_seo_service: boolean;
}

/**
 * Fetches ALL clients for dropdown use — no pagination, no status filtering.
 * Single source of truth matching the Clients tab visibility rules.
 * Excludes only: reverted, deleted, merged.
 * Also fetches SEO service status for categorization.
 * Cached in-memory to avoid refetching on every render.
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

    const { data, error } = await supabase
      .from("clients")
      .select("id, contact_name, company_name, email, client_status")
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

    // Batch fetch SEO services for all clients
    const clientIds = clientRows.map(c => c.id);
    let seoClientIds = new Set<string>();

    if (clientIds.length > 0) {
      const { data: services } = await supabase
        .from("client_services")
        .select("client_id")
        .eq("business_id", profile.business_id)
        .eq("service_type", "seo")
        .eq("service_status", "active")
        .in("client_id", clientIds);

      if (services) {
        seoClientIds = new Set(services.map((s: any) => s.client_id));
      }
    }

    const result: DropdownClient[] = clientRows.map(c => ({
      id: c.id,
      contact_name: c.contact_name,
      company_name: c.company_name,
      email: c.email,
      client_status: c.client_status,
      has_seo_service: seoClientIds.has(c.id),
    }));

    console.log("[Dropdown Clients] Loaded:", result.length, "with SEO:", seoClientIds.size);
    cacheRef.current = { businessId: profile.business_id, data: result };
    setClients(result);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const refetch = useCallback(() => fetchClients(true), [fetchClients]);

  return { clients, loading, refetch };
}
