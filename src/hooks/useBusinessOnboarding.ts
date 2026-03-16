import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DepartmentTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  default_fields: any[];
  display_order: number;
}

export interface AppModuleSetting {
  id: string;
  business_id: string;
  module_name: string;
  enabled: boolean;
  visible_to_customer: boolean;
  display_order: number;
}

export interface CustomizationRequest {
  id: string;
  business_id: string;
  department: string | null;
  request_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const BUSINESS_MODELS = [
  { value: "service", label: "Service Business", description: "Provide professional services to clients" },
  { value: "product", label: "Product Business", description: "Sell physical or digital products" },
  { value: "hybrid", label: "Hybrid Business", description: "Both products and services" },
  { value: "appointment", label: "Appointment / Booking Business", description: "Schedule-based service delivery" },
  { value: "subscription", label: "Subscription / Membership", description: "Recurring membership or subscription model" },
];

const DEFAULT_APP_MODULES = [
  { name: "Invoices", order: 1 },
  { name: "Payments", order: 2 },
  { name: "Bookings", order: 3 },
  { name: "Support Tickets", order: 4 },
  { name: "Service History", order: 5 },
  { name: "Documents", order: 6 },
  { name: "Profile", order: 7 },
  { name: "Notifications", order: 8 },
];

export { BUSINESS_MODELS, DEFAULT_APP_MODULES };

export function useDepartmentTemplates() {
  const [templates, setTemplates] = useState<DepartmentTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("department_templates" as any)
        .select("*")
        .order("display_order");
      setTemplates((data as any as DepartmentTemplate[]) || []);
      setLoading(false);
    })();
  }, []);

  return { templates, loading };
}

export function useBusinessDeptConfig() {
  const { profile } = useAuth();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("business_department_config" as any)
      .select("*")
      .eq("business_id", profile.business_id);
    setConfigs(data || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleDepartment = async (templateId: string, enabled: boolean) => {
    if (!profile?.business_id) return;
    await supabase
      .from("business_department_config" as any)
      .upsert({
        business_id: profile.business_id,
        department_template_id: templateId,
        is_enabled: enabled,
      } as any, { onConflict: "business_id,department_template_id" });
    fetch();
  };

  return { configs, loading, toggleDepartment, refetch: fetch };
}

export function useAppModuleSettings() {
  const { profile } = useAuth();
  const [modules, setModules] = useState<AppModuleSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("app_module_settings" as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .order("display_order");
    setModules((data as any as AppModuleSetting[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const initDefaults = async () => {
    if (!profile?.business_id) return;
    const inserts = DEFAULT_APP_MODULES.map((m) => ({
      business_id: profile.business_id,
      module_name: m.name,
      enabled: true,
      visible_to_customer: true,
      display_order: m.order,
    }));
    await supabase.from("app_module_settings" as any).upsert(inserts as any, { onConflict: "business_id,module_name" });
    fetch();
  };

  const toggleModule = async (moduleName: string, enabled: boolean) => {
    if (!profile?.business_id) return;
    await supabase
      .from("app_module_settings" as any)
      .upsert({
        business_id: profile.business_id,
        module_name: moduleName,
        enabled,
        visible_to_customer: enabled,
      } as any, { onConflict: "business_id,module_name" });
    fetch();
  };

  return { modules, loading, initDefaults, toggleModule, refetch: fetch };
}

export function useCustomizationRequests() {
  const { profile, user } = useAuth();
  const [requests, setRequests] = useState<CustomizationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("customization_requests" as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRequests((data as any as CustomizationRequest[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const createRequest = async (input: {
    title: string;
    description?: string;
    department?: string;
    request_type?: string;
    priority?: string;
  }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("customization_requests" as any).insert({
      business_id: profile.business_id,
      created_by: user?.id,
      ...input,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Customization request submitted");
    fetch();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("customization_requests" as any).update({ status, updated_at: new Date().toISOString() } as any).eq("id", id);
    fetch();
  };

  return { requests, loading, createRequest, updateStatus, refetch: fetch };
}
