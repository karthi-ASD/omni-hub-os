import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TenantWebsite {
  id: string;
  business_id: string;
  website_name: string;
  domain: string;
  status: string;
  api_key_hash: string | null;
  api_key_last4: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  call_allowed_start_time: string | null;
  call_allowed_end_time: string | null;
  timezone: string | null;
  default_lead_owner_employee_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WebsiteService {
  id: string;
  business_id: string;
  website_id: string;
  service_name: string;
  service_category: string | null;
  service_description: string | null;
  is_active: boolean;
  created_at: string;
}

export function useWebsites() {
  const { profile, isSuperAdmin } = useAuth();
  const [websites, setWebsites] = useState<TenantWebsite[]>([]);
  const [services, setServices] = useState<WebsiteService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWebsites = useCallback(async (businessId?: string) => {
    setLoading(true);
    let query = supabase.from("tenant_websites").select("*").order("created_at", { ascending: false });
    if (businessId) query = query.eq("business_id", businessId);
    const { data } = await query;
    setWebsites((data as TenantWebsite[]) || []);
    setLoading(false);
  }, []);

  const fetchServices = useCallback(async (websiteId: string) => {
    const { data } = await supabase
      .from("website_services")
      .select("*")
      .eq("website_id", websiteId)
      .order("service_name");
    setServices((data as WebsiteService[]) || []);
  }, []);

  useEffect(() => {
    if (profile?.business_id) fetchWebsites(isSuperAdmin ? undefined : profile.business_id);
  }, [profile?.business_id, isSuperAdmin, fetchWebsites]);

  const requestWebsite = async (websiteName: string, domain: string) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("tenant_websites")
      .insert({
        business_id: profile.business_id,
        website_name: websiteName,
        domain,
        status: "pending",
        created_by: profile.user_id,
      })
      .select()
      .single();
    if (error) { toast.error(error.message); return null; }
    toast.success("Website submitted for approval");
    fetchWebsites(isSuperAdmin ? undefined : profile.business_id);
    return data;
  };

  const approveWebsite = async (websiteId: string): Promise<string | null> => {
    if (!profile) return null;
    // Generate API key
    const rawKey = crypto.randomUUID() + "-" + crypto.randomUUID();
    const last4 = rawKey.slice(-4);

    // Hash API key client-side using SubtleCrypto
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase
      .from("tenant_websites")
      .update({
        status: "approved",
        api_key_hash: keyHash,
        api_key_last4: last4,
        approved_by: profile.user_id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", websiteId);

    if (error) { toast.error("Failed to approve"); return null; }

    await supabase.from("system_events").insert({
      business_id: (websites.find(w => w.id === websiteId))?.business_id || profile.business_id,
      event_type: "WEBSITE_APPROVED",
      payload_json: { entity_type: "tenant_website", entity_id: websiteId, short_message: "Website domain approved" },
    });

    toast.success("Website approved! Copy the API key now — it won't be shown again.");
    fetchWebsites(isSuperAdmin ? undefined : profile.business_id);
    return rawKey; // Return once for display
  };

  const disableWebsite = async (websiteId: string) => {
    const { error } = await supabase.from("tenant_websites").update({ status: "disabled" }).eq("id", websiteId);
    if (error) { toast.error("Failed to disable"); return; }
    toast.success("Website disabled");
    fetchWebsites(isSuperAdmin ? undefined : profile?.business_id || undefined);
  };

  const updateWebsite = async (websiteId: string, updates: Partial<TenantWebsite>) => {
    const { error } = await supabase.from("tenant_websites").update(updates as any).eq("id", websiteId);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Website updated");
    fetchWebsites(isSuperAdmin ? undefined : profile?.business_id || undefined);
  };

  // Services CRUD
  const addService = async (websiteId: string, serviceName: string, category?: string, description?: string) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("website_services").insert({
      business_id: profile.business_id,
      website_id: websiteId,
      service_name: serviceName,
      service_category: category || null,
      service_description: description || null,
    });
    if (error) { toast.error("Failed to add service"); return; }
    toast.success("Service added");
    fetchServices(websiteId);
  };

  const removeService = async (serviceId: string, websiteId: string) => {
    await supabase.from("website_services").delete().eq("id", serviceId);
    fetchServices(websiteId);
  };

  return {
    websites, services, loading,
    fetchWebsites, fetchServices,
    requestWebsite, approveWebsite, disableWebsite, updateWebsite,
    addService, removeService,
  };
}
