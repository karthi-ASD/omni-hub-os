import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Phone normalization: strip spaces/dashes, ensure + prefix
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
  if (cleaned.length < 8) return null;
  return cleaned;
}

// Timeout wrapper for automation calls
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

// Origin validation
function validateOrigin(req: Request, allowedDomains: string[] | null): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  return allowedDomains.some((d) => origin.includes(d));
}

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

    // Lookup project (include allowed_domains for origin check)
    const { data: project, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id, api_key, website_domain")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return json({ error: "Invalid project_id" }, 404);
    }

    // API key validation
    if (!api_key || api_key !== project.api_key) {
      return json({ error: "Unauthorized: invalid or missing api_key" }, 401);
    }

    // Origin validation (optional: checks against website_domain if set)
    const allowedDomains = project.website_domain ? [project.website_domain] : null;
    if (!validateOrigin(req, allowedDomains)) {
      return json({ error: "Origin not allowed" }, 403);
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

    // Normalize phone
    const normalizedPhone = normalizePhone(phone);

    const { data: lead, error: insertErr } = await supabase
      .from("seo_captured_leads")
      .insert({
        business_id: project.business_id,
        seo_project_id: project_id,
        client_id: project.client_id,
        name: name || null,
        email: email || null,
        phone: normalizedPhone,
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

    // Check automation settings — support multiple projects per client
    const { data: autoSettings } = await supabase
      .from("seo_automation_settings")
      .select("*")
      .eq("seo_project_id", project_id)
      .maybeSingle();

    const automationResults: Array<{ type: string; status: string }> = [];

    const requestPayload = { name, email, phone: normalizedPhone, message, source, form_id };

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
        request_payload: requestPayload,
      });
    };

    if (autoSettings) {
      // Email automation with 5s timeout
      if (autoSettings.enable_email && email) {
        const start = Date.now();
        try {
          await withTimeout(supabase.functions.invoke("send-email", {
            body: {
              to: email,
              subject: "Thank you for your enquiry",
              message: `Hi ${name || "there"}, we received your enquiry and will contact you shortly.`,
              business_id: project.business_id,
            },
          }));
          automationResults.push({ type: "email", status: "success" });
          await logAutomation("email", "success", Date.now() - start);
        } catch (e) {
          console.error("Email automation failed:", e);
          automationResults.push({ type: "email", status: "failed" });
          await logAutomation("email", "failed", Date.now() - start, String(e));
        }
      }

      // WhatsApp automation with 5s timeout
      if (autoSettings.enable_whatsapp && autoSettings.whatsapp_connected && autoSettings.whatsapp_number && normalizedPhone) {
        const start = Date.now();
        try {
          await withTimeout(supabase.functions.invoke("whatsapp-send-message", {
            body: {
              from: autoSettings.whatsapp_number,
              to: normalizedPhone,
              message: `Hi ${name || "there"}, thank you for your inquiry! We'll get back to you shortly.`,
              business_id: project.business_id,
            },
          }));
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
              await withTimeout(supabase.functions.invoke("send-email", {
                body: {
                  to: email,
                  subject: "Thank you for your enquiry",
                  message: `Hi ${name || "there"}, we received your enquiry and will contact you shortly.`,
                  business_id: project.business_id,
                },
              }));
              automationResults.push({ type: "email_fallback", status: "success" });
              await logAutomation("email_fallback", "success", Date.now() - fbStart);
            } catch (fe) {
              await logAutomation("email_fallback", "failed", Date.now() - fbStart, String(fe));
            }
          }
        }
      }

      // Call automation with 5s timeout
      if (autoSettings.enable_call && normalizedPhone) {
        const start = Date.now();
        try {
          await withTimeout(supabase.functions.invoke("trigger-call", {
            body: {
              phone: normalizedPhone,
              project_id,
              type: "lead_followup",
            },
          }));
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
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
