import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { name, email, phone, message, project_id, source, form_id, extra_data, api_key } = body;

    if (!project_id) {
      return json({ error: "project_id is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Lookup project
    const { data: project, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id, api_key")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return json({ error: "Invalid project_id" }, 404);
    }

    // API key validation
    if (!api_key || api_key !== project.api_key) {
      return json({ error: "Unauthorized: invalid or missing api_key" }, 401);
    }

    // Rate limiting: max 20 leads per minute per project
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await supabase
      .from("seo_captured_leads")
      .select("*", { count: "exact", head: true })
      .eq("seo_project_id", project_id)
      .gte("created_at", oneMinAgo);

    if ((count || 0) > 20) {
      return json({ error: "Rate limit exceeded. Try again later." }, 429);
    }

    // Form ID validation
    if (form_id) {
      const { data: form } = await supabase
        .from("seo_lead_forms")
        .select("id")
        .eq("id", form_id)
        .eq("seo_project_id", project_id)
        .single();

      if (!form) {
        return json({ error: "Invalid form_id for this project" }, 400);
      }
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
        return json({ error: "Duplicate lead detected" }, 409);
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
      return json({ error: insertErr.message }, 500);
    }

    // Check automation settings
    const { data: autoSettings } = await supabase
      .from("seo_automation_settings")
      .select("*")
      .eq("seo_project_id", project_id)
      .single();

    const automationResults: Array<{ type: string; status: string }> = [];

    const logAutomation = async (type: string, status: string, execMs: number, errMsg?: string, response?: any) => {
      await supabase.from("seo_automation_logs").insert({
        lead_id: lead.id,
        seo_project_id: project_id,
        business_id: project.business_id,
        automation_type: type,
        status,
        execution_time_ms: execMs,
        error_message: errMsg || null,
        response_json: response || null,
      });
    };

    if (autoSettings) {
      // Email automation
      if (autoSettings.enable_email && email) {
        const start = Date.now();
        try {
          await supabase.functions.invoke("send-email", {
            body: {
              to: email,
              subject: "Thank you for your enquiry",
              message: `Hi ${name || "there"}, we received your enquiry and will contact you shortly.`,
              business_id: project.business_id,
            },
          });
          automationResults.push({ type: "email", status: "success" });
          await logAutomation("email", "success", Date.now() - start);
        } catch (e) {
          console.error("Email automation failed:", e);
          automationResults.push({ type: "email", status: "failed" });
          await logAutomation("email", "failed", Date.now() - start, String(e));
        }
      }

      // WhatsApp automation (requires connection + number + lead phone)
      if (autoSettings.enable_whatsapp && autoSettings.whatsapp_connected && autoSettings.whatsapp_number && phone) {
        const start = Date.now();
        try {
          await supabase.functions.invoke("whatsapp-send-message", {
            body: {
              from: autoSettings.whatsapp_number,
              to: phone,
              message: `Hi ${name || "there"}, thank you for your inquiry! We'll get back to you shortly.`,
              business_id: project.business_id,
            },
          });
          automationResults.push({ type: "whatsapp", status: "success" });
          await logAutomation("whatsapp", "success", Date.now() - start);
        } catch (e) {
          console.error("WhatsApp automation failed:", e);
          automationResults.push({ type: "whatsapp", status: "failed" });
          await logAutomation("whatsapp", "failed", Date.now() - start, String(e));

          // Failsafe: if WhatsApp fails and email exists but wasn't already sent, send email
          if (email && !autoSettings.enable_email) {
            const fbStart = Date.now();
            try {
              await supabase.functions.invoke("send-email", {
                body: {
                  to: email,
                  subject: "Thank you for your enquiry",
                  message: `Hi ${name || "there"}, we received your enquiry and will contact you shortly.`,
                  business_id: project.business_id,
                },
              });
              automationResults.push({ type: "email_fallback", status: "success" });
              await logAutomation("email_fallback", "success", Date.now() - fbStart);
            } catch (fe) {
              await logAutomation("email_fallback", "failed", Date.now() - fbStart, String(fe));
            }
          }
        }
      }

      // Call automation
      if (autoSettings.enable_call && phone) {
        const start = Date.now();
        try {
          await supabase.functions.invoke("trigger-call", {
            body: {
              phone,
              project_id,
              type: "lead_followup",
            },
          });
          automationResults.push({ type: "call", status: "success" });
          await logAutomation("call", "success", Date.now() - start);
        } catch (e) {
          console.error("Call automation failed:", e);
          automationResults.push({ type: "call", status: "failed" });
          await logAutomation("call", "failed", Date.now() - start, String(e));
        }
      }
    }

    return json({
      success: true,
      lead_id: lead.id,
      automations: automationResults,
    }, 200);
  } catch (error) {
    console.error("seo-lead-capture error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    },
  });
}
