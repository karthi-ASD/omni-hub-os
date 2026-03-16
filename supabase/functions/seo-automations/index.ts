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

    // 1. Access Reminder: Projects onboarding for 5+ days without complete access
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: staleOnboarding } = await supabase
      .from("seo_projects")
      .select("id, business_id, website_domain, seo_manager_id")
      .eq("onboarding_status", "pending")
      .lt("created_at", fiveDaysAgo);

    if (staleOnboarding?.length) {
      for (const project of staleOnboarding) {
        if (project.seo_manager_id) {
          await supabase.from("notifications").insert({
            business_id: project.business_id,
            user_id: project.seo_manager_id,
            type: "warning",
            title: "Onboarding Access Overdue",
            message: `SEO project "${project.website_domain}" has pending access for 5+ days.`,
          });
        }
        await supabase.from("system_events").insert({
          business_id: project.business_id,
          event_type: "SEO_ACCESS_REMINDER",
          payload_json: { seo_project_id: project.id, domain: project.website_domain },
        });
      }
      results.access_reminders = staleOnboarding.length;
    }

    // 2. Billing Alert: Projects with overdue payment
    const { data: overdueProjects } = await supabase
      .from("seo_projects")
      .select("id, business_id, website_domain, seo_manager_id")
      .eq("payment_status", "overdue")
      .eq("project_status", "active");

    if (overdueProjects?.length) {
      for (const project of overdueProjects) {
        if (project.seo_manager_id) {
          await supabase.from("notifications").insert({
            business_id: project.business_id,
            user_id: project.seo_manager_id,
            type: "warning",
            title: "Billing Overdue Alert",
            message: `SEO project "${project.website_domain}" has overdue payment.`,
          });
        }
      }
      results.billing_alerts = overdueProjects.length;
    }

    // 3. Monthly Report Reminder: Active projects with no report for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: activeProjects } = await supabase
      .from("seo_projects")
      .select("id, business_id, website_domain, seo_specialist_id")
      .eq("project_status", "active");

    if (activeProjects?.length) {
      for (const project of activeProjects) {
        const { data: existingReport } = await supabase
          .from("seo_reports")
          .select("id")
          .eq("seo_project_id", project.id)
          .gte("report_month", currentMonth + "-01")
          .maybeSingle();

        if (!existingReport && project.seo_specialist_id) {
          await supabase.from("notifications").insert({
            business_id: project.business_id,
            user_id: project.seo_specialist_id,
            type: "info",
            title: "Monthly Report Due",
            message: `Generate the ${currentMonth} report for "${project.website_domain}".`,
          });
        }
      }
      results.report_reminders = activeProjects.length;
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
