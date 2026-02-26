import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSLAPolicies() {
  const { profile } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("sla_policies")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setPolicies(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: Record<string, any>) => {
    if (!profile?.business_id) return;
    await supabase.from("sla_policies").insert([{ ...values, business_id: profile.business_id } as any]);
    fetch();
  };

  return { policies, loading, create, refresh: fetch };
}

export function useSLAEvents() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("sla_events")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("triggered_at", { ascending: false })
      .limit(50);
    setEvents(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { events, loading, refresh: fetch };
}
