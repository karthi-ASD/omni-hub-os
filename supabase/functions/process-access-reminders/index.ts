import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Refresh all credential statuses
    await supabase.rpc("refresh_credential_statuses");

    // 2. Get credentials that need reminders sent today
    const { data: expiringCreds, error: credErr } = await supabase
      .from("client_access_credentials")
      .select("id, client_id, business_id, credential_type, provider_name, domain_name, expiry_date, reminder_days, reminder_email, status")
      .eq("is_archived", false)
      .in("status", ["expiring_soon", "expired"])
      .not("expiry_date", "is", null);

    if (credErr) throw credErr;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const remindersToSend: any[] = [];
    const notificationsToInsert: any[] = [];

    for (const cred of expiringCreds || []) {
      const expiryDate = new Date(cred.expiry_date);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const reminderDays = cred.reminder_days || 30;

      // Check if we should send reminder today (exact match on reminder days or already expired)
      const shouldRemind = daysUntilExpiry === reminderDays || 
                           daysUntilExpiry === 7 || 
                           daysUntilExpiry === 1 || 
                           daysUntilExpiry === 0 ||
                           daysUntilExpiry < 0;

      if (!shouldRemind) continue;

      // Check if we already sent a reminder today for this credential
      const { data: existingLog } = await supabase
        .from("renewal_reminder_logs")
        .select("id")
        .eq("source_record_id", cred.id)
        .gte("created_at", today.toISOString())
        .limit(1);

      if (existingLog && existingLog.length > 0) continue;

      const itemLabel = cred.provider_name || cred.domain_name || cred.credential_type;
      const statusText = daysUntilExpiry <= 0
        ? `EXPIRED ${Math.abs(daysUntilExpiry)} day(s) ago`
        : `expiring in ${daysUntilExpiry} day(s)`;

      // Log the reminder
      remindersToSend.push({
        client_id: cred.client_id,
        business_id: cred.business_id,
        source_type: cred.credential_type,
        source_record_id: cred.id,
        reminder_email: cred.reminder_email,
        scheduled_date: today.toISOString().split("T")[0],
        sent_at: new Date().toISOString(),
        status: "sent",
      });

      // Create internal notification for business users
      notificationsToInsert.push({
        business_id: cred.business_id,
        type: daysUntilExpiry <= 0 ? "warning" : "info",
        title: `${cred.credential_type.charAt(0).toUpperCase() + cred.credential_type.slice(1)} ${statusText}`,
        message: `${itemLabel} for client project is ${statusText}. Expiry: ${cred.expiry_date}.`,
      });

      // Audit log
      await supabase.from("client_access_audit_logs").insert({
        client_id: cred.client_id,
        business_id: cred.business_id,
        record_type: "credential",
        record_id: cred.id,
        action_type: "reminder_sent",
        action_note: `Auto reminder: ${itemLabel} ${statusText}`,
      });
    }

    // Batch insert reminder logs
    if (remindersToSend.length > 0) {
      await supabase.from("renewal_reminder_logs").insert(remindersToSend);
    }

    // Batch insert notifications (broadcast to all business users)
    if (notificationsToInsert.length > 0) {
      // Get all admin/accounts users for each business
      const businessIds = [...new Set(notificationsToInsert.map(n => n.business_id))];
      
      for (const bizId of businessIds) {
        const { data: users } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("business_id", bizId);

        const bizNotifs = notificationsToInsert.filter(n => n.business_id === bizId);
        
        for (const notif of bizNotifs) {
          // Send to first 10 users (admins/accounts typically)
          const userNotifs = (users || []).slice(0, 10).map(u => ({
            ...notif,
            user_id: u.user_id,
          }));
          if (userNotifs.length > 0) {
            await supabase.from("notifications").insert(userNotifs);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: expiringCreds?.length || 0,
        remindersSent: remindersToSend.length,
        notificationsCreated: notificationsToInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing access reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
