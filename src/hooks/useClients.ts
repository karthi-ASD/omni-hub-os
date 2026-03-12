import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type OnboardingStatus = "pending" | "in_progress" | "completed";
export type ClientStatus = "active" | "cancelled" | "pending" | "prospect" | "suspended";

export interface Client {
  id: string;
  business_id: string;
  deal_id: string | null;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  onboarding_status: OnboardingStatus;
  client_status: ClientStatus;
  client_start_date: string | null;
  salesperson_owner: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientService {
  id: string;
  client_id: string;
  business_id: string;
  service_type: string;
  service_subtype: string | null;
  service_details_json: Record<string, any>;
  created_at: string;
}

export interface CreateClientInput {
  deal_id?: string;
  company_name?: string;
  contact_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  services?: { service_type: string; service_subtype?: string; service_details_json?: Record<string, any> }[];
  notes?: string;
}

const PAGE_SIZE = 50;

export function useClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const fetchClients = useCallback(async (pageNum = 0, searchTerm = "", append = false) => {
    if (!append) setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Get count first
    let countQuery = supabase
      .from("clients")
      .select("id", { count: "exact", head: true });

    if (searchTerm) {
      countQuery = countQuery.or(
        `contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }

    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Get page of data
    let dataQuery = supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (searchTerm) {
      dataQuery = dataQuery.or(
        `contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }

    const { data } = await dataQuery;
    const batch = (data as any as Client[]) || [];

    if (append) {
      setClients(prev => [...prev, ...batch]);
    } else {
      setClients(batch);
    }

    setHasMore(batch.length === PAGE_SIZE);
    setPage(pageNum);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients(0, search);
  }, [fetchClients, search]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchClients(page + 1, search, true);
    }
  };

  const setSearchTerm = (term: string) => {
    setSearch(term);
    // Reset to page 0 on search change — fetchClients will trigger via useEffect
  };

  const createClient = async (input: CreateClientInput) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("clients")
      .insert({
        business_id: profile.business_id,
        deal_id: input.deal_id,
        company_name: input.company_name,
        contact_name: input.contact_name,
        email: input.email,
        phone: input.phone,
        mobile: input.mobile,
        website: input.website,
        address: input.address,
        city: input.city,
        state: input.state,
        country: input.country,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create client"); return null; }

    const clientId = (data as any).id;

    if (input.services && input.services.length > 0) {
      const serviceRows = input.services.map(s => ({
        client_id: clientId,
        business_id: profile.business_id,
        service_type: s.service_type,
        service_subtype: s.service_subtype || null,
        service_details_json: s.service_details_json || {},
      }));
      await supabase.from("client_services").insert(serviceRows as any);
    }

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "CLIENT_CREATED",
        payload_json: {
          entity_type: "client",
          entity_id: clientId,
          actor_user_id: profile.user_id,
          short_message: `Client created: ${input.contact_name}`,
          services: input.services?.map(s => s.service_type) || [],
        },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "CREATE_CLIENT",
        entity_type: "client",
        entity_id: clientId,
      }),
    ]);

    toast.success("Client created");
    fetchClients(0, search);
    return data as any as Client;
  };

  const getClientServices = async (clientId: string): Promise<ClientService[]> => {
    const { data } = await supabase
      .from("client_services")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true });
    return (data as any as ClientService[]) || [];
  };

  const updateOnboardingStatus = async (clientId: string, status: OnboardingStatus) => {
    if (!profile) return;
    await supabase.from("clients").update({ onboarding_status: status } as any).eq("id", clientId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "CLIENT_ONBOARDING_UPDATED",
      payload_json: { entity_type: "client", entity_id: clientId, actor_user_id: profile.user_id, short_message: `Onboarding: ${status}` },
    });
    toast.success("Onboarding status updated");
    fetchClients(page, search);
  };

  const updateClientStatus = async (clientId: string, status: ClientStatus) => {
    if (!profile) return;
    await supabase.from("clients").update({ client_status: status } as any).eq("id", clientId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "CLIENT_STATUS_UPDATED",
      payload_json: { entity_type: "client", entity_id: clientId, actor_user_id: profile.user_id, short_message: `Status: ${status}` },
    });
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "UPDATE_CLIENT_STATUS",
      entity_type: "client",
      entity_id: clientId,
    });
    toast.success("Client status updated");
    fetchClients(page, search);
  };

  return {
    clients, loading, totalCount, page, hasMore,
    createClient, updateOnboardingStatus, updateClientStatus, getClientServices,
    loadMore, setSearchTerm,
    refetch: () => fetchClients(0, search),
  };
}
