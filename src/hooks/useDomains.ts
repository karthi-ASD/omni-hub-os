import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientDomain {
  id: string;
  client_id: string | null;
  business_id: string;
  domain_name: string;
  registrar_name: string | null;
  registrar_account_reference: string | null;
  registration_date: string | null;
  expiry_date: string | null;
  auto_renew_status: boolean;
  dns_provider: string | null;
  nameservers: string[] | null;
  linked_website_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainInput {
  client_id?: string;
  domain_name: string;
  registrar_name?: string;
  registrar_account_reference?: string;
  registration_date?: string;
  expiry_date?: string;
  auto_renew_status?: boolean;
  dns_provider?: string;
  nameservers?: string[];
  linked_website_id?: string;
  notes?: string;
}

export function useDomains() {
  const { profile } = useAuth();
  const [domains, setDomains] = useState<ClientDomain[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDomains = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("client_domains")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("expiry_date", { ascending: true });
    setDomains((data as any as ClientDomain[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const createDomain = async (input: CreateDomainInput) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("client_domains")
      .insert({
        business_id: profile.business_id,
        client_id: input.client_id || null,
        domain_name: input.domain_name,
        registrar_name: input.registrar_name || null,
        registrar_account_reference: input.registrar_account_reference || null,
        registration_date: input.registration_date || null,
        expiry_date: input.expiry_date || null,
        auto_renew_status: input.auto_renew_status || false,
        dns_provider: input.dns_provider || null,
        nameservers: input.nameservers || null,
        linked_website_id: input.linked_website_id || null,
        notes: input.notes || null,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return null;
    }
    toast.success("Domain added");
    fetchDomains();
    return data as any as ClientDomain;
  };

  const updateDomain = async (id: string, updates: Partial<CreateDomainInput>) => {
    const { error } = await supabase
      .from("client_domains")
      .update(updates as any)
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Domain updated");
    fetchDomains();
  };

  const deleteDomain = async (id: string) => {
    const { error } = await supabase.from("client_domains").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Domain deleted");
    fetchDomains();
  };

  return { domains, loading, createDomain, updateDomain, deleteDomain, refetch: fetchDomains };
}
