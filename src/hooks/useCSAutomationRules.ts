import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCSAutomationRules() {
  const { profile } = useAuth();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("cs_automation_rules")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setRules(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("cs_automation_rules").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    await supabase.from("cs_automation_rules").update({ is_enabled: enabled } as any).eq("id", id);
    fetch();
  };

  return { rules, loading, create, toggleRule, refresh: fetch };
}
