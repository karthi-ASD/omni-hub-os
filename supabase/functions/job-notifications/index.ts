import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, job_id, business_id, message, title, target_user_ids } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    let userIds: string[] = target_user_ids || [];
    let notifTitle = title || "Job Update";
    let notifMessage = message || "";

    // If job_id provided, get assigned employees
    if (job_id && userIds.length === 0) {
      const { data: assignments } = await supabase
        .from("job_assignments")
        .select("assigned_employee_user_id")
        .eq("job_id", job_id);

      userIds = (assignments || []).map((a: any) => a.assigned_employee_user_id);
    }

    // Build notification based on type
    if (type === "new_job_assigned" && job_id) {
      const { data: job } = await supabase.from("jobs").select("job_title, scheduled_start_at").eq("id", job_id).maybeSingle();
      notifTitle = "New Job Assigned";
      notifMessage = `You've been assigned: "${job?.job_title}"${job?.scheduled_start_at ? ` on ${new Date(job.scheduled_start_at).toLocaleDateString()}` : ""}`;
    } else if (type === "schedule_change" && job_id) {
      const { data: job } = await supabase.from("jobs").select("job_title, scheduled_start_at").eq("id", job_id).maybeSingle();
      notifTitle = "Schedule Changed";
      notifMessage = `Schedule updated for "${job?.job_title}"${job?.scheduled_start_at ? ` – new time: ${new Date(job.scheduled_start_at).toLocaleString()}` : ""}`;
    } else if (type === "job_reminder" && job_id) {
      const { data: job } = await supabase.from("jobs").select("job_title, scheduled_start_at").eq("id", job_id).maybeSingle();
      notifTitle = "Job Reminder";
      notifMessage = `Upcoming: "${job?.job_title}" at ${job?.scheduled_start_at ? new Date(job.scheduled_start_at).toLocaleTimeString() : "TBD"}`;
    }

    if (userIds.length === 0 || !business_id) {
      return new Response(JSON.stringify({ sent: 0, message: "No targets" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert in-app notifications
    const notifications = userIds.map((uid: string) => ({
      business_id,
      user_id: uid,
      type: type === "schedule_change" ? "warning" : "info",
      title: notifTitle,
      message: notifMessage,
    }));

    await supabase.from("notifications").insert(notifications as any);

    // Get push tokens for these users
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token, platform")
      .in("user_id", userIds);

    // For web push, we'd send via Web Push API here.
    // For native (Capacitor), we'd send via FCM/APNs.
    // Currently logging tokens for future integration.
    const pushCount = tokens?.length || 0;

    console.log(`Sent ${notifications.length} in-app notifications, ${pushCount} push tokens found`);

    return new Response(JSON.stringify({
      sent: notifications.length,
      push_tokens_found: pushCount,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("job-notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
