import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientHosting {
  id: string;
  client_id: string | null;
  business_id: string;
  hosting_provider: string;
  hosting_plan: string | null;
  control_panel_type: string | null;
  server_location: string | null;
  ssl_status: string;
  ssl_expiry_date: string | null;
  backup_status: string;
  renewal_date: string | null;
  linked_website_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateHostingInput {
  client_id?: string;
  hosting_provider: string;
  hosting_plan?: string;
  control_panel_type?: string;
  server_location?: string;
  ssl_status?: string;
  ssl_expiry_date?: string;
  backup_status?: string;
  renewal_date?: string;
  linked_website_id?: string;
  notes?: string;
}

export function useHosting() {
  const { profile } = useAuth();
  const [hostingAccounts, setHostingAccounts] = useState<ClientHosting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHosting = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("client_hosting_accounts")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("renewal_date", { ascending: true });
    setHostingAccounts((data as any as ClientHosting[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchHosting(); }, [fetchHosting]);

  const createHosting = async (input: CreateHostingInput) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("client_hosting_accounts")
      .insert({
        business_id: profile.business_id,
        client_id: input.client_id || null,
        hosting_provider: input.hosting_provider,
        hosting_plan: input.hosting_plan || null,
        control_panel_type: input.control_panel_type || null,
        server_location: input.server_location || null,
        ssl_status: input.ssl_status || "unknown",
        ssl_expiry_date: input.ssl_expiry_date || null,
        backup_status: input.backup_status || "unknown",
        renewal_date: input.renewal_date || null,
        linked_website_id: input.linked_website_id || null,
        notes: input.notes || null,
      } as any)
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success("Hosting account added");
    fetchHosting();
    return data as any as ClientHosting;
  };

  const updateHosting = async (id: string, updates: Partial<CreateHostingInput>) => {
    const { error } = await supabase.from("client_hosting_accounts").update(updates as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Hosting account updated");
    fetchHosting();
  };

  const deleteHosting = async (id: string) => {
    const { error } = await supabase.from("client_hosting_accounts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Hosting account deleted");
    fetchHosting();
  };

  return { hostingAccounts, loading, createHosting, updateHosting, deleteHosting, refetch: fetchHosting };
}
