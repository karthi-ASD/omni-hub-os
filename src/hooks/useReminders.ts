import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Reminder = Database["public"]["Tables"]["reminders"]["Row"];
type ReminderInsert = Database["public"]["Tables"]["reminders"]["Insert"];
type ReminderStatus = Database["public"]["Enums"]["reminder_status"];

export function useReminders(entityType?: string, entityId?: string) {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("reminders").select("*").order("due_at", { ascending: true });
    if (entityType && entityId) {
      query = query.eq("entity_type", entityType as "inquiry" | "lead").eq("entity_id", entityId);
    }
    const { data } = await query.limit(200);
    setReminders(data || []);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const createReminder = async (reminder: Omit<ReminderInsert, "business_id" | "created_by_user_id">) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("reminders")
      .insert({
        ...reminder,
        business_id: profile.business_id,
        created_by_user_id: profile.user_id,
      })
      .select()
      .single();
    if (error) { toast.error("Failed to create reminder"); return null; }

    // Create calendar event for reminder
    await supabase.from("calendar_events").insert({
      business_id: profile.business_id,
      title: `⏰ ${reminder.title}`,
      start_datetime: reminder.due_at,
      end_datetime: new Date(new Date(reminder.due_at).getTime() + 15 * 60000).toISOString(),
      created_by_user_id: profile.user_id,
      visibility: "private" as Database["public"]["Enums"]["calendar_visibility"],
    });

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "REMINDER_CREATED",
      payload_json: {
        entity_type: reminder.entity_type, entity_id: reminder.entity_id,
        actor_user_id: profile.user_id,
        reminder_id: data.id,
        short_message: `Reminder: ${reminder.title}`,
      },
    });
    toast.success("Reminder created");
    fetchReminders();
    return data;
  };

  const markDone = async (id: string) => {
    if (!profile) return;
    await supabase.from("reminders").update({ status: "done" as ReminderStatus }).eq("id", id);
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "MARK_REMINDER_DONE",
      entity_type: "reminder",
      entity_id: id,
    });
    toast.success("Reminder done");
    fetchReminders();
  };

  const snooze = async (id: string, minutes: number = 30) => {
    if (!profile) return;
    const snoozedUntil = new Date(Date.now() + minutes * 60000).toISOString();
    await supabase.from("reminders").update({
      status: "snoozed" as ReminderStatus,
      snoozed_until: snoozedUntil,
    }).eq("id", id);
    toast.success(`Snoozed for ${minutes} min`);
    fetchReminders();
  };

  const cancel = async (id: string) => {
    await supabase.from("reminders").update({ status: "cancelled" as ReminderStatus }).eq("id", id);
    toast.success("Reminder cancelled");
    fetchReminders();
  };

  return { reminders, loading, createReminder, markDone, snooze, cancel, refetch: fetchReminders };
}
