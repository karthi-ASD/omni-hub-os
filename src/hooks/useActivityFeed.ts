import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityItem {
  id: string;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
  source: "audit" | "event";
}

export function useActivityFeed(limit = 20) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    const [auditRes, eventsRes] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("id, action_type, entity_type, entity_id, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
      supabase
        .from("system_events")
        .select("id, event_type, created_at")
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    const auditItems: ActivityItem[] = (auditRes.data || []).map((a) => ({
      id: a.id,
      event_type: a.action_type,
      entity_type: a.entity_type,
      entity_id: a.entity_id,
      created_at: a.created_at,
      source: "audit" as const,
    }));

    const eventItems: ActivityItem[] = (eventsRes.data || []).map((e) => ({
      id: e.id,
      event_type: e.event_type,
      entity_type: null,
      entity_id: null,
      created_at: e.created_at,
      source: "event" as const,
    }));

    const combined = [...auditItems, ...eventItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    setItems(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, [limit]);

  return { items, loading, refresh: fetchFeed };
}
