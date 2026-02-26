import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type OnboardingStatus = "pending" | "in_progress" | "completed";

export interface Client {
  id: string;
  business_id: string;
  deal_id: string | null;
  company_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  onboarding_status: OnboardingStatus;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const { profile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(500);
    setClients((data as any as Client[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const createClient = async (input: {
    deal_id?: string;
    company_name?: string;
    contact_name: string;
    email: string;
    phone?: string;
    address?: string;
  }) => {
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
        address: input.address,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create client"); return null; }

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "CLIENT_CREATED",
        payload_json: { entity_type: "client", entity_id: (data as any).id, actor_user_id: profile.user_id, short_message: `Client created: ${input.contact_name}` },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "CREATE_CLIENT", entity_type: "client", entity_id: (data as any).id,
      }),
    ]);

    toast.success("Client created");
    fetchClients();
    return data as any as Client;
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
    fetchClients();
  };

  return { clients, loading, createClient, updateOnboardingStatus, refetch: fetchClients };
}
