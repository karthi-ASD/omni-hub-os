import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useClientProfiles() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("client_profiles")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setProfiles(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("client_profiles").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  return { profiles, loading, create, refresh: fetch };
}
