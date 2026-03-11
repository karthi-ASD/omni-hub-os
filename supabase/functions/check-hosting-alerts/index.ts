import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    let totalNotifications = 0;

    const alertWindows = [
      { days: 30, label: "30 days" },
      { days: 7, label: "7 days" },
      { days: 1, label: "1 day" },
    ];

    // --- SSL Expiry Alerts ---
    for (const window of alertWindows) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + window.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      const { data: sslExpiring } = await supabase
        .from("client_hosting_accounts")
        .select("id, business_id, hosting_provider, ssl_expiry_date, linked_website_id")
        .eq("ssl_expiry_date", dateStr);

      if (sslExpiring) {
        for (const h of sslExpiring) {
          const { data: admins } = await supabase
            .from("user_roles").select("user_id")
            .eq("business_id", h.business_id)
            .in("role", ["super_admin", "business_admin"]);

          for (const admin of admins || []) {
            const { data: existing } = await supabase
              .from("notifications").select("id")
              .eq("user_id", admin.user_id)
              .ilike("title", `%SSL%${h.hosting_provider}%`)
              .gte("created_at", todayStr)
              .limit(1);
            if (existing && existing.length > 0) continue;

            await supabase.from("notifications").insert({
              business_id: h.business_id,
              user_id: admin.user_id,
              type: window.days <= 7 ? "warning" : "info",
              title: `SSL Expiring: ${h.hosting_provider}`,
              message: `SSL certificate on ${h.hosting_provider} expires in ${window.label} (${dateStr}). Renew to avoid downtime.`,
            });
            totalNotifications++;
          }
        }
      }
    }

    // --- Hosting Renewal Alerts ---
    for (const window of alertWindows) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + window.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      const { data: renewals } = await supabase
        .from("client_hosting_accounts")
        .select("id, business_id, hosting_provider, renewal_date")
        .eq("renewal_date", dateStr);

      if (renewals) {
        for (const h of renewals) {
          const { data: admins } = await supabase
            .from("user_roles").select("user_id")
            .eq("business_id", h.business_id)
            .in("role", ["super_admin", "business_admin"]);

          for (const admin of admins || []) {
            const { data: existing } = await supabase
              .from("notifications").select("id")
              .eq("user_id", admin.user_id)
              .ilike("title", `%Hosting Renewal%${h.hosting_provider}%`)
              .gte("created_at", todayStr)
              .limit(1);
            if (existing && existing.length > 0) continue;

            await supabase.from("notifications").insert({
              business_id: h.business_id,
              user_id: admin.user_id,
              type: window.days <= 7 ? "warning" : "info",
              title: `Hosting Renewal: ${h.hosting_provider}`,
              message: `Hosting on ${h.hosting_provider} renews in ${window.label} (${dateStr}). Ensure payment is ready.`,
            });
            totalNotifications++;
          }
        }
      }
    }

    // --- Backup Failure Alerts ---
    const { data: failedBackups } = await supabase
      .from("client_hosting_accounts")
      .select("id, business_id, hosting_provider")
      .eq("backup_status", "failed");

    if (failedBackups) {
      for (const h of failedBackups) {
        const { data: admins } = await supabase
          .from("user_roles").select("user_id")
          .eq("business_id", h.business_id)
          .in("role", ["super_admin", "business_admin"]);

        for (const admin of admins || []) {
          const { data: existing } = await supabase
            .from("notifications").select("id")
            .eq("user_id", admin.user_id)
            .ilike("title", `%Backup Failed%${h.hosting_provider}%`)
            .gte("created_at", todayStr)
            .limit(1);
          if (existing && existing.length > 0) continue;

          await supabase.from("notifications").insert({
            business_id: h.business_id,
            user_id: admin.user_id,
            type: "warning",
            title: `Backup Failed: ${h.hosting_provider}`,
            message: `Backup is failing on ${h.hosting_provider}. Check hosting dashboard immediately.`,
          });
          totalNotifications++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, notifications_sent: totalNotifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Hosting alert check error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
