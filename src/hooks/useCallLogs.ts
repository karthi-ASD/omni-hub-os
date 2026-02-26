import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CallOutcome = "no_answer" | "left_voicemail" | "spoke" | "follow_up_required" | "not_interested" | "qualified";

export interface CallLog {
  id: string;
  business_id: string;
  related_entity_type: string;
  related_entity_id: string;
  caller_user_id: string;
  call_type: "outbound" | "inbound";
  outcome: CallOutcome;
  duration_seconds: number | null;
  notes: string | null;
  call_time: string;
  created_at: string;
}

export function useCallLogs(entityType?: string, entityId?: string) {
  const { profile } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("call_logs").select("*").order("call_time", { ascending: false });
    if (entityType && entityId) {
      query = query.eq("related_entity_type", entityType).eq("related_entity_id", entityId);
    }
    const { data } = await query.limit(200);
    setCallLogs((data as CallLog[]) || []);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => { fetchCallLogs(); }, [fetchCallLogs]);

  const logCall = async (log: {
    related_entity_type: string;
    related_entity_id: string;
    call_type: "outbound" | "inbound";
    outcome: CallOutcome;
    duration_seconds?: number;
    notes?: string;
  }) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase.from("call_logs").insert({
      business_id: profile.business_id,
      caller_user_id: profile.user_id,
      related_entity_type: log.related_entity_type,
      related_entity_id: log.related_entity_id,
      call_type: log.call_type as any,
      outcome: log.outcome as any,
      duration_seconds: log.duration_seconds,
      notes: log.notes,
    } as any).select().single();

    if (error) { toast.error("Failed to log call"); return null; }

    // System event
    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "CALL_LOGGED",
        payload_json: {
          entity_type: log.related_entity_type,
          entity_id: log.related_entity_id,
          actor_user_id: profile.user_id,
          outcome: log.outcome,
          short_message: `Call logged: ${log.outcome.replace(/_/g, " ")}`,
        },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "LOG_CALL",
        entity_type: log.related_entity_type,
        entity_id: log.related_entity_id,
      }),
    ]);

    // Auto follow-up reminder if outcome is follow_up_required
    if (log.outcome === "follow_up_required") {
      const dueAt = new Date(Date.now() + 24 * 60 * 60000).toISOString();
      await supabase.from("reminders").insert({
        business_id: profile.business_id,
        entity_type: log.related_entity_type === "deal" ? "lead" as any : log.related_entity_type as any,
        entity_id: log.related_entity_id,
        assigned_to_user_id: profile.user_id,
        created_by_user_id: profile.user_id,
        title: "Follow-up required after call",
        due_at: dueAt,
        priority: "high" as any,
      });
      await supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "FOLLOWUP_CREATED",
        payload_json: {
          entity_type: log.related_entity_type,
          entity_id: log.related_entity_id,
          actor_user_id: profile.user_id,
          short_message: "Auto follow-up reminder created after call",
        },
      });
    }

    toast.success("Call logged");
    fetchCallLogs();
    return data as CallLog;
  };

  return { callLogs, loading, logCall, refetch: fetchCallLogs };
}
