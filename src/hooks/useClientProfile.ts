import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ClientWebsite {
  id: string;
  client_id: string;
  business_id: string;
  website_url: string;
  cms_type: string | null;
  hosting_provider: string | null;
  domain_provider: string | null;
  website_status: string;
  notes: string | null;
  created_at: string;
}

export interface ClientMobileApp {
  id: string;
  client_id: string;
  business_id: string;
  app_name: string;
  platform: string;
  app_status: string;
  app_store_link: string | null;
  play_store_link: string | null;
  app_category: string | null;
  features_json: any[];
  notes: string | null;
  created_at: string;
}

export interface ClientServiceRow {
  id: string;
  client_id: string;
  service_type: string;
  service_subtype: string | null;
  service_category: string | null;
  service_status: string;
  assigned_department: string | null;
  service_details_json: Record<string, any>;
  created_at: string;
}

export interface ClientProfileData {
  services: ClientServiceRow[];
  websites: ClientWebsite[];
  apps: ClientMobileApp[];
  seoProjects: any[];
  invoices: any[];
  contracts: any[];
  tickets: any[];
  timeline: any[];
}

export function useClientProfile(clientId: string | undefined) {
  const { profile } = useAuth();
  const [data, setData] = useState<ClientProfileData>({
    services: [], websites: [], apps: [], seoProjects: [],
    invoices: [], contracts: [], tickets: [], timeline: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);

    const [services, websites, apps, seo, inv, con, tix, tl] = await Promise.all([
      supabase.from("client_services").select("*").eq("client_id", clientId).order("created_at"),
      supabase.from("client_websites").select("*").eq("client_id", clientId).order("created_at"),
      supabase.from("client_mobile_apps").select("*").eq("client_id", clientId).order("created_at"),
      supabase.from("seo_projects").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("contracts").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("support_tickets").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
      supabase.from("account_timeline").select("*").eq("client_id", clientId).order("created_at", { ascending: false }).limit(50),
    ]);

    setData({
      services: (services.data as any) || [],
      websites: (websites.data as any) || [],
      apps: (apps.data as any) || [],
      seoProjects: (seo.data as any) || [],
      invoices: (inv.data as any) || [],
      contracts: (con.data as any) || [],
      tickets: (tix.data as any) || [],
      timeline: (tl.data as any) || [],
    });
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addWebsite = async (input: { website_url: string; cms_type?: string; hosting_provider?: string; domain_provider?: string }) => {
    if (!profile?.business_id || !clientId) return;
    const { error } = await supabase.from("client_websites").insert({
      client_id: clientId,
      business_id: profile.business_id,
      ...input,
    } as any);
    if (error) { toast.error("Failed to add website"); return; }
    toast.success("Website added");
    fetchAll();
  };

  const addApp = async (input: { app_name: string; platform: string; app_category?: string }) => {
    if (!profile?.business_id || !clientId) return;
    const { error } = await supabase.from("client_mobile_apps").insert({
      client_id: clientId,
      business_id: profile.business_id,
      ...input,
    } as any);
    if (error) { toast.error("Failed to add app"); return; }
    toast.success("App added");
    fetchAll();
  };

  const addService = async (input: {
    service_type: string;
    service_name?: string;
    price_amount?: number;
    billing_cycle?: string;
    payment_method?: string;
    billing_date?: number;
    next_billing_date?: string;
    payment_status?: string;
  }) => {
    if (!profile?.business_id || !clientId) return;
    const { error } = await supabase.from("client_services").insert({
      client_id: clientId,
      business_id: profile.business_id,
      service_type: input.service_type,
      service_name: input.service_name || null,
      price_amount: input.price_amount || 0,
      billing_cycle: input.billing_cycle || "monthly",
      payment_method: input.payment_method || "eft",
      billing_date: input.billing_date || 1,
      next_billing_date: input.next_billing_date || null,
      payment_status: input.payment_status || "pending",
      service_status: "active",
    });
    if (error) { toast.error("Failed to add service"); return; }
    toast.success("Service added");
    fetchAll();
  };

  const updateServiceStatus = async (serviceId: string, status: string) => {
    const { error } = await supabase.from("client_services").update({ service_status: status } as any).eq("id", serviceId);
    if (error) { toast.error("Failed to update service"); return; }
    toast.success("Service updated");
    fetchAll();
  };

  return { ...data, loading, refetch: fetchAll, addWebsite, addApp, addService, updateServiceStatus };
}
