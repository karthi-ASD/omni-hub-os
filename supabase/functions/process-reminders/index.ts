import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Find pending reminders that are past due
  const { data: dueReminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "pending")
    .lte("due_at", new Date().toISOString());

  if (!dueReminders || dueReminders.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  let processed = 0;
  for (const reminder of dueReminders) {
    // Mark as overdue
    await supabase.from("reminders").update({ status: "overdue" }).eq("id", reminder.id);

    // Write system event
    await supabase.from("system_events").insert({
      business_id: reminder.business_id,
      event_type: "REMINDER_OVERDUE",
      payload_json: {
        entity_type: reminder.entity_type,
        entity_id: reminder.entity_id,
        reminder_id: reminder.id,
        assigned_to_user_id: reminder.assigned_to_user_id,
        short_message: `Overdue: ${reminder.title}`,
      },
    });

    // Create notification for assigned user
    await supabase.from("notifications").insert({
      business_id: reminder.business_id,
      user_id: reminder.assigned_to_user_id,
      type: "warning",
      title: "Reminder overdue",
      message: reminder.title,
    });

    processed++;
  }

  // Also handle snoozed reminders that have passed their snooze time
  const { data: snoozedReminders } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "snoozed")
    .not("snoozed_until", "is", null)
    .lte("snoozed_until", new Date().toISOString());

  for (const reminder of snoozedReminders || []) {
    await supabase.from("reminders").update({ status: "pending", snoozed_until: null }).eq("id", reminder.id);

    await supabase.from("notifications").insert({
      business_id: reminder.business_id,
      user_id: reminder.assigned_to_user_id,
      type: "reminder",
      title: "Snoozed reminder is due",
      message: reminder.title,
    });
  }

  return new Response(JSON.stringify({ processed, unsnoozed: snoozedReminders?.length || 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
