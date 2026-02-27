import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, any> = {};

    // 1. Access Reminder: Campaigns onboarding for 5+ days without complete access
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleOnboarding } = await supabase
      .from("seo_campaigns")
      .select("id, business_id, primary_domain, assigned_seo_manager_user_id")
      .eq("onboarding_status", "pending_access")
      .lt("created_at", fiveDaysAgo);

    if (staleOnboarding?.length) {
      for (const campaign of staleOnboarding) {
        if (campaign.assigned_seo_manager_user_id) {
          await supabase.from("notifications").insert({
            business_id: campaign.business_id,
            user_id: campaign.assigned_seo_manager_user_id,
            type: "warning",
            title: "Onboarding Access Overdue",
            message: `Campaign "${campaign.primary_domain}" has pending access for 5+ days.`,
          });
        }
        await supabase.from("system_events").insert({
          business_id: campaign.business_id,
          event_type: "SEO_ACCESS_REMINDER",
          payload_json: { campaign_id: campaign.id, domain: campaign.primary_domain },
        });
      }
      results.access_reminders = staleOnboarding.length;
    }

    // 2. Billing Alert: Campaigns with overdue payment for 7+ days
    const { data: overdueCampaigns } = await supabase
      .from("seo_campaigns")
      .select("id, business_id, primary_domain, assigned_seo_manager_user_id")
      .eq("payment_status", "overdue")
      .eq("status", "active");

    if (overdueCampaigns?.length) {
      for (const campaign of overdueCampaigns) {
        if (campaign.assigned_seo_manager_user_id) {
          await supabase.from("notifications").insert({
            business_id: campaign.business_id,
            user_id: campaign.assigned_seo_manager_user_id,
            type: "warning",
            title: "Billing Overdue Alert",
            message: `SEO campaign "${campaign.primary_domain}" has overdue payment.`,
          });
        }
      }
      results.billing_alerts = overdueCampaigns.length;
    }

    // 3. Monthly Report Reminder: Active campaigns with no report for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const { data: activeCampaigns } = await supabase
      .from("seo_campaigns")
      .select("id, business_id, primary_domain, assigned_seo_executive_user_id")
      .eq("status", "active");

    if (activeCampaigns?.length) {
      for (const campaign of activeCampaigns) {
        const { data: existingReport } = await supabase
          .from("seo_reports")
          .select("id")
          .eq("campaign_id", campaign.id)
          .eq("report_month", currentMonth)
          .maybeSingle();

        if (!existingReport && campaign.assigned_seo_executive_user_id) {
          await supabase.from("notifications").insert({
            business_id: campaign.business_id,
            user_id: campaign.assigned_seo_executive_user_id,
            type: "info",
            title: "Monthly Report Due",
            message: `Generate the ${currentMonth} report for "${campaign.primary_domain}".`,
          });
        }
      }
      results.report_reminders = activeCampaigns.length;
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SEO automation error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
