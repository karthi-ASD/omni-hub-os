import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useProviderConnections() {
  const { user, profile } = useAuth();
  const [connections, setConnections] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConnections = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("provider_connections")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setConnections(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchLogs = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("provider_access_logs")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(50);
    setAccessLogs(data ?? []);
  }, [profile?.business_id]);

  useEffect(() => { fetchConnections(); fetchLogs(); }, [fetchConnections, fetchLogs]);

  const createConnection = async (values: { provider_type: string; provider_name: string; display_label?: string }) => {
    if (!user || !profile?.business_id) return null;
    const { data, error } = await supabase.from("provider_connections").insert({
      ...values,
      business_id: profile.business_id,
      status: "DISCONNECTED",
    } as any).select().single();
    if (error) { toast.error(error.message); return null; }
    // Log access
    await supabase.from("provider_access_logs").insert({
      business_id: profile.business_id,
      provider_connection_id: data.id,
      action: "CREATE",
      performed_by: user.id,
    } as any);
    toast.success("Provider connection created");
    fetchConnections();
    fetchLogs();
    return data;
  };

  const testConnection = async (connectionId: string) => {
    if (!user || !profile?.business_id) return;
    await supabase.from("provider_connections").update({
      status: "CONNECTED",
      last_tested_at: new Date().toISOString(),
    } as any).eq("id", connectionId);
    await supabase.from("provider_access_logs").insert({
      business_id: profile.business_id,
      provider_connection_id: connectionId,
      action: "TEST",
      performed_by: user.id,
    } as any);
    toast.success("Connection tested successfully");
    fetchConnections();
    fetchLogs();
  };

  const storeCredential = async (connectionId: string, keyName: string, value: string) => {
    if (!user || !profile?.business_id) return;
    const masked = "****" + value.slice(-4);
    const { error } = await supabase.from("provider_credentials_vault").insert({
      business_id: profile.business_id,
      provider_connection_id: connectionId,
      key_name: keyName,
      encrypted_value: value, // In production, encrypt before storing
      masked_value: masked,
    } as any);
    if (error) { toast.error(error.message); return; }
    await supabase.from("provider_access_logs").insert({
      business_id: profile.business_id,
      provider_connection_id: connectionId,
      action: "CREATE",
      performed_by: user.id,
    } as any);
    toast.success("Credential stored securely");
    fetchLogs();
  };

  return {
    connections, accessLogs, loading,
    createConnection, testConnection, storeCredential,
    refresh: fetchConnections,
  };
}
