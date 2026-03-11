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
    const alerts = [
      { days: 30, priority: "info", label: "30 days" },
      { days: 7, priority: "warning", label: "7 days" },
      { days: 1, priority: "warning", label: "1 day" },
    ];

    let totalNotifications = 0;

    for (const alert of alerts) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + alert.days);
      const dateStr = targetDate.toISOString().split("T")[0];

      // Find domains expiring on this exact date
      const { data: domains } = await supabase
        .from("client_domains")
        .select("id, business_id, domain_name, expiry_date, client_id")
        .eq("expiry_date", dateStr);

      if (!domains || domains.length === 0) continue;

      for (const domain of domains) {
        // Get admin users for this business
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("business_id", domain.business_id)
          .in("role", ["super_admin", "business_admin"]);

        if (!admins || admins.length === 0) continue;

        for (const admin of admins) {
          // Check if we already sent this notification today
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", admin.user_id)
            .eq("business_id", domain.business_id)
            .ilike("title", `%${domain.domain_name}%`)
            .gte("created_at", today.toISOString().split("T")[0])
            .limit(1);

          if (existing && existing.length > 0) continue;

          await supabase.from("notifications").insert({
            business_id: domain.business_id,
            user_id: admin.user_id,
            type: alert.priority,
            title: `Domain Expiring: ${domain.domain_name}`,
            message: `${domain.domain_name} expires in ${alert.label} (${dateStr}). Please renew to avoid service disruption.`,
          });
          totalNotifications++;
        }
      }
    }

    // Also check already expired domains
    const { data: expired } = await supabase
      .from("client_domains")
      .select("id, business_id, domain_name, expiry_date")
      .lt("expiry_date", today.toISOString().split("T")[0])
      .not("expiry_date", "is", null);

    if (expired && expired.length > 0) {
      for (const domain of expired) {
        const { data: admins } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("business_id", domain.business_id)
          .in("role", ["super_admin", "business_admin"]);

        if (!admins) continue;

        for (const admin of admins) {
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", admin.user_id)
            .ilike("title", `%${domain.domain_name}%expired%`)
            .gte("created_at", today.toISOString().split("T")[0])
            .limit(1);

          if (existing && existing.length > 0) continue;

          await supabase.from("notifications").insert({
            business_id: domain.business_id,
            user_id: admin.user_id,
            type: "warning",
            title: `Domain Expired: ${domain.domain_name}`,
            message: `${domain.domain_name} has expired (was ${domain.expiry_date}). Renew immediately to restore services.`,
          });
          totalNotifications++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, notifications_sent: totalNotifications }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Domain expiry check error:", e.message);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
