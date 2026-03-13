import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmailConfig {
  id: string;
  business_id: string;
  config_name: string;
  provider_type: string;
  email_address: string;
  default_department: string | null;
  monitored: boolean;
  polling_interval_seconds: number;
  last_polled_at: string | null;
  is_active: boolean;
  created_at: string;
}

export function useEmailConfigurations() {
  const { profile } = useAuth();
  const bid = profile?.business_id;
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!bid) return;
    const { data } = await supabase
      .from("email_configurations")
      .select("*")
      .eq("business_id", bid)
      .eq("provider_type", "gmail")
      .order("created_at", { ascending: false });
    setConfigs((data as any[]) || []);
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetch(); }, [fetch]);

  const createConfig = useCallback(async (data: Partial<EmailConfig>) => {
    if (!bid) return;
    const { error } = await supabase.from("email_configurations").insert({
      ...data,
      business_id: bid,
      provider_type: "gmail",
    } as any);
    if (error) { toast.error("Failed to create email config"); return; }
    toast.success("Gmail mailbox added");
    fetch();
  }, [bid, fetch]);

  const updateConfig = useCallback(async (id: string, data: Partial<EmailConfig>) => {
    await supabase.from("email_configurations").update(data as any).eq("id", id);
    toast.success("Email configuration updated");
    fetch();
  }, [fetch]);

  const deleteConfig = useCallback(async (id: string) => {
    await supabase.from("email_configurations").delete().eq("id", id);
    toast.success("Email configuration deleted");
    fetch();
  }, [fetch]);

  return { configs, loading, createConfig, updateConfig, deleteConfig, refresh: fetch };
}
