import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface SuperAdminClient {
  id: string;
  business_id: string;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  client_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  merged_into: string | null;
  merged_at: string | null;
  sales_owner_id: string | null;
  salesperson_owner: string | null;
  assigned_seo_manager_id: string | null;
}

export function useSuperAdminClients() {
  const { profile, isSuperAdmin } = useAuth();
  const [allClients, setAllClients] = useState<SuperAdminClient[]>([]);
  const [deletedClients, setDeletedClients] = useState<SuperAdminClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoading(true);

    const { data: active } = await supabase
      .from("clients")
      .select("id, business_id, company_name, contact_name, email, phone, client_status, created_at, updated_at, deleted_at, deleted_by, merged_into, merged_at, sales_owner_id, salesperson_owner, assigned_seo_manager_id")
      .not("client_status", "in", '("deleted","merged")')
      .order("created_at", { ascending: false }) as any;

    const { data: deleted } = await supabase
      .from("clients")
      .select("id, business_id, company_name, contact_name, email, phone, client_status, created_at, updated_at, deleted_at, deleted_by, merged_into, merged_at, sales_owner_id, salesperson_owner, assigned_seo_manager_id")
      .eq("client_status", "deleted")
      .order("deleted_at", { ascending: false }) as any;

    setAllClients((active || []) as SuperAdminClient[]);
    setDeletedClients((deleted || []) as SuperAdminClient[]);
    setLoading(false);
  }, [isSuperAdmin]);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const softDeleteClient = async (clientId: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from("clients")
      .update({
        client_status: "deleted",
        deleted_at: new Date().toISOString(),
        deleted_by: profile.user_id,
      } as any)
      .eq("id", clientId);

    if (error) { toast.error("Delete failed"); return; }

    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "CLIENT_SOFT_DELETE",
      entity_type: "client",
      entity_id: clientId,
    });

    toast.success("Client deleted (soft)");
    fetchClients();
  };

  const restoreClient = async (clientId: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from("clients")
      .update({
        client_status: "active",
        deleted_at: null,
        deleted_by: null,
      } as any)
      .eq("id", clientId);

    if (error) { toast.error("Restore failed"); return; }

    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "CLIENT_RESTORE",
      entity_type: "client",
      entity_id: clientId,
    });

    toast.success("Client restored");
    fetchClients();
  };

  const permanentDeleteClient = async (clientId: string) => {
    const { data, error } = await supabase.functions.invoke("super-admin-client-ops", {
      body: { action: "permanent_delete", client_id: clientId },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Permanent delete failed");
      return;
    }
    toast.success("Client permanently deleted");
    fetchClients();
  };

  const mergeClients = async (primaryId: string, secondaryId: string) => {
    const { data, error } = await supabase.functions.invoke("super-admin-client-ops", {
      body: { action: "merge", primary_id: primaryId, secondary_id: secondaryId },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Merge failed");
      return;
    }
    toast.success("Clients merged successfully");
    fetchClients();
  };

  const getClientStats = async (clientId: string) => {
    const [projects, keywords, tickets] = await Promise.all([
      supabase.from("seo_projects").select("id", { count: "exact", head: true }).eq("client_id", clientId),
      supabase.from("seo_keywords" as any).select("id", { count: "exact", head: true }).eq("client_id", clientId),
      supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("client_id", clientId),
    ]);
    return {
      projects: projects.count || 0,
      keywords: keywords.count || 0,
      tickets: tickets.count || 0,
    };
  };

  return {
    allClients,
    deletedClients,
    loading,
    softDeleteClient,
    restoreClient,
    permanentDeleteClient,
    mergeClients,
    getClientStats,
    refetch: fetchClients,
  };
}
