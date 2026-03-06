import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCustomerPortalSettings() {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("customer_portal_settings")
      .select("*")
      .eq("business_id", profile.business_id)
      .maybeSingle();
    setSettings(data);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const upsert = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("customer_portal_settings").upsert({ ...values, business_id: profile.business_id } as any, { onConflict: "business_id" });
    fetch();
  };

  return { settings, loading, upsert, refresh: fetch };
}
