import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientIntegration {
  id: string;
  client_id: string;
  business_id: string;
  ga_property_id: string | null;
  gsc_property: string | null;
  google_ads_id: string | null;
  facebook_ads_id: string | null;
  website_url: string | null;
  hosting_details: string | null;
  webhook_url: string | null;
  call_tracking_number: string | null;
  whatsapp_number: string | null;
  status: string;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientIntegrations(clientId: string | undefined) {
  const { profile } = useAuth();
  const [integration, setIntegration] = useState<ClientIntegration | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const { data } = await supabase
      .from("client_integrations")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();
    setIntegration(data as any);
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (updates: Partial<Omit<ClientIntegration, "id" | "client_id" | "business_id" | "created_at" | "updated_at">>) => {
    if (!clientId || !profile?.business_id) return;

    // Determine status based on filled fields
    const fields = ["ga_property_id", "gsc_property", "google_ads_id", "facebook_ads_id", "website_url", "call_tracking_number", "whatsapp_number"];
    const merged = { ...integration, ...updates };
    const hasAny = fields.some(f => !!(merged as any)[f]);
    const status = hasAny ? "connected" : "not_connected";

    if (integration) {
      const { error } = await supabase
        .from("client_integrations")
        .update({ ...updates, status, updated_at: new Date().toISOString() } as any)
        .eq("id", integration.id);
      if (error) { toast.error("Failed to save integrations"); return; }
    } else {
      const { error } = await supabase
        .from("client_integrations")
        .insert({ client_id: clientId, business_id: profile.business_id, ...updates, status } as any);
      if (error) { toast.error("Failed to save integrations"); return; }
    }
    toast.success("Integrations saved");
    fetch();
  };

  return { integration, loading, save, refetch: fetch };
}
