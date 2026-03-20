import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export interface CRMTab {
  key: string;
  label: string;
  sort_order: number;
  is_visible: boolean;
  icon?: string;
}

export interface PipelineStage {
  key: string;
  label: string;
  sort_order: number;
  is_visible: boolean;
  color?: string;
}

export interface BusinessTheme {
  theme_preset: string;
  custom_colors_json: Record<string, string> | null;
}

export type CRMType = "real_estate" | "service" | "finance" | "generic";

export function useBusinessCRM() {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  // Fetch CRM type dynamically from businesses table
  const { data: businessData } = useQuery({
    queryKey: ["business-crm-type", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data } = await supabase
        .from("businesses")
        .select("id, crm_type")
        .eq("id", businessId)
        .maybeSingle();
      return data;
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });

  const crmType: CRMType | null = (businessData?.crm_type as CRMType) || null;
  const hasCustomCRM = !!crmType && crmType !== "generic";
  const isACE1 = crmType === "real_estate";

  // Fetch CRM tabs (for the CRM page, not sidebar)
  const { data: tabs = [], refetch: refetchTabs } = useQuery({
    queryKey: ["crm-tabs", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      const { data } = await supabase
        .from("business_crm_config")
        .select("*")
        .eq("business_id", businessId)
        .eq("config_type", "tab")
        .eq("module", "crm")
        .order("sort_order");
      return (data || []).map((d: any) => ({
        key: d.key,
        label: d.label,
        sort_order: d.sort_order,
        is_visible: d.is_visible,
        icon: d.options_json?.icon,
      })) as CRMTab[];
    },
    enabled: !!businessId && isACE1,
  });

  // Fetch pipeline stages for a module
  const usePipelineStages = (module: string) =>
    useQuery({
      queryKey: ["crm-pipeline-stages", businessId, module],
      queryFn: async () => {
        if (!businessId) return [];
        const { data } = await supabase
          .from("business_crm_config")
          .select("*")
          .eq("business_id", businessId)
          .eq("config_type", "pipeline_stage")
          .eq("module", module)
          .order("sort_order");
        return (data || []).map((d: any) => ({
          key: d.key,
          label: d.label,
          sort_order: d.sort_order,
          is_visible: d.is_visible,
          color: d.options_json?.color,
        })) as PipelineStage[];
      },
      enabled: !!businessId,
    });

  // Fetch theme
  const { data: theme } = useQuery({
    queryKey: ["business-theme", businessId],
    queryFn: async () => {
      if (!businessId) return null;
      const { data } = await supabase
        .from("business_theme_config")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (!data) return null;
      return {
        theme_preset: data.theme_preset,
        custom_colors_json: data.custom_colors_json as Record<string, string> | null,
      } as BusinessTheme;
    },
    enabled: !!businessId,
  });

  return {
    isACE1,
    hasCustomCRM,
    crmType,
    tabs: tabs.filter(t => t.is_visible),
    theme,
    usePipelineStages,
    refetchTabs,
    businessId,
  };
}
