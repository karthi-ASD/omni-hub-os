import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Plugin {
  id: string;
  name: string;
  developer_name: string;
  description: string | null;
  version: string;
  pricing_type: string;
  price: number;
  rating_avg: number;
  install_count: number;
  status: string;
  created_at: string;
}

export interface TenantPlugin {
  id: string;
  business_id: string;
  plugin_id: string;
  enabled: boolean;
  configuration_json: any;
  installed_at: string;
}

export function useMarketplace() {
  const { profile } = useAuth();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [installed, setInstalled] = useState<TenantPlugin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("plugins").select("*").order("install_count", { ascending: false });
    setPlugins((data as any) || []);
    setLoading(false);
  }, []);

  const fetchInstalled = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase.from("tenant_plugins").select("*").eq("business_id", profile.business_id);
    setInstalled((data as any) || []);
  }, [profile?.business_id]);

  useEffect(() => { fetchPlugins(); fetchInstalled(); }, [fetchPlugins, fetchInstalled]);

  const installPlugin = async (pluginId: string) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("tenant_plugins").insert({ business_id: profile.business_id, plugin_id: pluginId } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Plugin installed");
    fetchInstalled();
  };

  const togglePlugin = async (id: string, enabled: boolean) => {
    const { error } = await supabase.from("tenant_plugins").update({ enabled } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(enabled ? "Plugin enabled" : "Plugin disabled");
    fetchInstalled();
  };

  const uninstallPlugin = async (id: string) => {
    const { error } = await supabase.from("tenant_plugins").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Plugin uninstalled");
    fetchInstalled();
  };

  const isInstalled = (pluginId: string) => installed.some(i => i.plugin_id === pluginId);

  return { plugins, installed, loading, installPlugin, togglePlugin, uninstallPlugin, isInstalled, refetch: fetchPlugins };
}
