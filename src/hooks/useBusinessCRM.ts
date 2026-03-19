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

// ACE1 business ID
const ACE1_BUSINESS_ID = "fcd55dac-804b-462f-8a95-1d49cdd0b03d";

export function useBusinessCRM() {
  const { profile } = useAuth();
  const businessId = profile?.business_id;

  // Check if current user is ACE1
  const isACE1 = businessId === ACE1_BUSINESS_ID;

  // Fetch CRM tabs
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
    hasCustomCRM: isACE1 && tabs.length > 0,
    tabs: tabs.filter(t => t.is_visible),
    theme,
    usePipelineStages,
    refetchTabs,
    businessId,
  };
}
