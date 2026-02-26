import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useActivityTimeline() {
  const { profile } = useAuth();
  const bizId = profile?.business_id;
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    if (!bizId) return;
    setLoading(true);
    // Merge audit_logs + system_events as a unified timeline
    const [auditR, sysR] = await Promise.all([
      supabase.from("audit_logs").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(100),
      supabase.from("system_events").select("*").eq("business_id", bizId).order("created_at", { ascending: false }).limit(100),
    ]);

    const merged = [
      ...(auditR.data ?? []).map((a: any) => ({
        id: a.id, module: a.entity_type || "SYSTEM", event_type: a.action_type,
        title: a.action_type, description: a.entity_type ? `${a.entity_type} ${a.entity_id || ""}` : "",
        severity: "INFO", created_at: a.created_at, actor_user_id: a.actor_user_id, source: "audit",
      })),
      ...(sysR.data ?? []).map((s: any) => ({
        id: s.id, module: (s.payload_json as any)?.entity_type || "SYSTEM", event_type: s.event_type,
        title: s.event_type, description: (s.payload_json as any)?.short_message || "",
        severity: "INFO", created_at: s.created_at, actor_user_id: null, source: "system",
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 200);

    setEvents(merged);
    setLoading(false);
  }, [bizId]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  return { events, loading, refresh: fetchEvents };
}
