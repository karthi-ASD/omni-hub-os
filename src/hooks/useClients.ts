import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";
import { logActivity as logAI } from "@/lib/activity-logger";

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
  sales_owner_id: string | null;
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
  services?: { service_type: string; service_subtype?: string; service_details_json?: Record<string, any>; price_amount?: number; billing_cycle?: string; payment_method?: string; renewal_date?: string; reminder_days_before?: number }[];
  payment_method?: string;
  notes?: string;
}

const PAGE_SIZE = 50;

export interface UseClientsOptions {
  /** Filter clients by sales_owner_id server-side */
  salesOwnerId?: string | null;
  /** Filter clients by status server-side */
  statusFilter?: string | null;
}

export function useClients(options?: UseClientsOptions) {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ active: 0, cancelled: 0, pending: 0, prospect: 0, suspended: 0, reverted: 0 });
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const salesOwnerId = options?.salesOwnerId;
  const statusFilter = options?.statusFilter;

  const fetchClients = useCallback(async (pageNum = 0, searchTerm = "", append = false) => {
    if (!profile?.business_id) return;
    if (!append) setLoading(true);
    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const bid = profile.business_id;

    // Get count first
    let countQuery = supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("business_id", bid)
      .neq("client_status", "reverted")
      .neq("client_status", "deleted")
      .neq("client_status", "merged");

    if (searchTerm) {
      countQuery = countQuery.or(
        `contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }
    if (salesOwnerId && salesOwnerId !== "all") {
      countQuery = countQuery.eq("sales_owner_id", salesOwnerId);
    }
    if (statusFilter && statusFilter !== "all") {
      countQuery = countQuery.eq("client_status", statusFilter);
    }

    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Get server-side status counts (unaffected by status filter)
    const statusValues = ["active", "cancelled", "pending", "prospect", "suspended", "reverted"];
    const statusCountResults: Record<string, number> = {};
    await Promise.all(statusValues.map(async (s) => {
      let sq = supabase.from("clients").select("id", { count: "exact", head: true }).eq("business_id", bid).eq("client_status", s);
      if (searchTerm) {
        sq = sq.or(`contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }
      if (salesOwnerId && salesOwnerId !== "all") {
        sq = sq.eq("sales_owner_id", salesOwnerId);
      }
      const { count: sc } = await sq;
      statusCountResults[s] = sc || 0;
    }));
    setStatusCounts(statusCountResults);

    // Get page of data
    let dataQuery = supabase
      .from("clients")
      .select("*")
      .eq("business_id", bid)
      .neq("client_status", "reverted")
      .neq("client_status", "deleted")
      .neq("client_status", "merged")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (searchTerm) {
      dataQuery = dataQuery.or(
        `contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
      );
    }
    if (salesOwnerId && salesOwnerId !== "all") {
      dataQuery = dataQuery.eq("sales_owner_id", salesOwnerId);
    }
    if (statusFilter && statusFilter !== "all") {
      dataQuery = dataQuery.eq("client_status", statusFilter);
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
  }, [salesOwnerId, statusFilter, profile?.business_id]);

  useEffect(() => {
    fetchClients(0, search);
  }, [fetchClients, search]);

  useSalesDataAutoRefresh(() => fetchClients(0, search), ["all", "clients", "dashboard"]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchClients(page + 1, search, true);
    }
  };

  const setSearchTerm = (term: string) => {
    setSearch(term);
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
        payment_method: input.payment_method || 'eft',
        created_by: profile.user_id,
        sales_owner_id: profile.user_id,
        signup_source: 'sales',
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
        price_amount: s.price_amount || 0,
        billing_cycle: s.billing_cycle || 'one_time',
        payment_method: s.payment_method || input.payment_method || 'eft',
        renewal_date: s.renewal_date || null,
        reminder_days_before: s.reminder_days_before || 30,
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
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "create", entityType: "client", entityId: clientId, description: `Created client: ${input.contact_name}` });
    fetchClients(0, search);
    notifySalesDataChanged(["clients", "dashboard"], "client:create");
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
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "update", entityType: "client", entityId: clientId, description: `Onboarding status → ${status}` });
    fetchClients(page, search);
    notifySalesDataChanged(["clients", "dashboard"], "client:update-onboarding");
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
    notifySalesDataChanged(["clients", "dashboard"], "client:update-status");
  };

  const bulkAssignSalesperson = async (clientIds: string[], userId: string, userName: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from("clients")
      .update({ sales_owner_id: userId, salesperson_owner: userName } as any)
      .in("id", clientIds);
    if (error) { toast.error("Bulk assignment failed"); return; }

    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "BULK_ASSIGN_SALESPERSON",
      entity_type: "client",
      entity_id: clientIds.join(","),
      new_value_json: { sales_owner_id: userId, salesperson_owner: userName, count: clientIds.length },
    } as any);

    toast.success(`Assigned ${clientIds.length} clients to ${userName}`);
    fetchClients(0, search);
    notifySalesDataChanged(["clients", "dashboard"], "client:bulk-assign");
  };

  return {
    clients, loading, totalCount, statusCounts, page, hasMore,
    createClient, updateOnboardingStatus, updateClientStatus, getClientServices,
    loadMore, setSearchTerm, bulkAssignSalesperson,
    refetch: () => fetchClients(0, search),
  };
}
