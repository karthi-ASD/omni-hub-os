import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { name, email, phone, message, project_id, source, form_id, extra_data } = body;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lookup project to get business_id and client_id
    const { data: project, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Invalid project_id" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Duplicate check: same email + project in last 2 minutes
    if (email) {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: dupes } = await supabase
        .from("seo_captured_leads")
        .select("id")
        .eq("seo_project_id", project_id)
        .eq("email", email)
        .gte("created_at", twoMinAgo)
        .limit(1);
      if (dupes && dupes.length > 0) {
        return new Response(JSON.stringify({ error: "Duplicate lead detected" }), { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    const { data: lead, error: insertErr } = await supabase
      .from("seo_captured_leads")
      .insert({
        business_id: project.business_id,
        seo_project_id: project_id,
        client_id: project.client_id,
        name: name || null,
        email: email || null,
        phone: phone || null,
        message: message || null,
        source: source || "form",
        form_id: form_id || null,
        extra_data: extra_data || null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Lead insert error:", insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check automation settings and trigger if enabled
    const { data: autoSettings } = await supabase
      .from("seo_automation_settings")
      .select("*")
      .eq("seo_project_id", project_id)
      .single();

    const automationTriggered: string[] = [];

    if (autoSettings) {
      // WhatsApp automation
      if (autoSettings.enable_whatsapp && autoSettings.whatsapp_connected && phone) {
        try {
          await supabase.functions.invoke("whatsapp-send-message", {
            body: {
              to: phone,
              message: `Hi ${name || "there"}, thank you for your inquiry! We'll get back to you shortly.`,
              business_id: project.business_id,
            },
          });
          automationTriggered.push("whatsapp");
        } catch (e) { console.error("WhatsApp automation failed:", e); }
      }
    }

    return new Response(JSON.stringify({ success: true, lead_id: lead.id, automations: automationTriggered }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seo-lead-capture error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
