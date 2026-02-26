import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUsageAnalytics() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id) return;
    const [sessRes, evtRes] = await Promise.all([
      supabase.from("usage_sessions").select("*").eq("business_id", profile.business_id).order("started_at", { ascending: false }).limit(100),
      supabase.from("usage_events").select("*").eq("business_id", profile.business_id).order("created_at", { ascending: false }).limit(200),
    ]);
    setSessions(sessRes.data ?? []);
    setEvents(evtRes.data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessions, events, loading, refresh: fetch };
}
