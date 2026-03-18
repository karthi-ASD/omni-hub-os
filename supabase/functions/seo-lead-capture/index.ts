import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Strict origin validation using hostname match
function validateOrigin(req: Request, allowedDomains: string[] | null): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  try {
    const originHost = origin ? new URL(origin).hostname : "";
    const refererHost = referer ? new URL(referer).hostname : "";
    return allowedDomains.some((d) => {
      const clean = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
      return originHost === clean || originHost.endsWith("." + clean) ||
             refererHost === clean || refererHost.endsWith("." + clean);
    });
  } catch {
    return false;
  }
}

// Phone normalization with country code support
function normalizePhone(raw: string | null | undefined, defaultCountryCode: string = "+61"): string | null {
  if (!raw) return null;
  let cleaned = raw.replace(/[\s\-\(\)\.]/g, "");
  if (cleaned.startsWith("00")) cleaned = "+" + cleaned.slice(2);
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("0")) cleaned = defaultCountryCode + cleaned.slice(1);
    else cleaned = defaultCountryCode + cleaned;
  }
  if (cleaned.length < 8 || cleaned.length > 16) return null;
  if (!/^\+\d{7,15}$/.test(cleaned)) return null;
  return cleaned;
}

// Timeout wrapper
function withTimeout<T>(promise: Promise<T>, ms = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Limit payload size (50KB max)
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 50000) return json({ error: "Payload too large" }, 413);

    const body = await req.json();
    const { name, email, phone, message, project_id, source, form_id, extra_data, api_key,
            utm_source, utm_medium, utm_campaign, page_url } = body;

    if (!project_id) return json({ error: "project_id is required" }, 400);

    // Sanitize inputs
    const cleanName = (name || "").toString().trim().replace(/[\u200B\u200C\u200D\uFEFF]/g, "").slice(0, 200);
    const cleanEmail = (email || "").toString().trim().toLowerCase().slice(0, 255);
    const cleanPhone = (phone || "").toString().trim().slice(0, 30);
    const cleanMessage = (message || "").toString().trim().replace(/[\u200B\u200C\u200D\uFEFF]/g, "").slice(0, 5000);

    // Require name and phone for form submissions
    if (source !== "call_click") {
      if (!cleanName) return json({ error: "Name is required" }, 400);
      if (!cleanPhone) return json({ error: "Phone is required" }, 400);
    }

    // Capture IP and User-Agent
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown";
    const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id, api_key, website_domain, default_country_code")
      .eq("id", project_id)
      .single();

    if (projErr || !project) return json({ error: "Invalid project_id" }, 404);

    // API key validation
    if (!api_key || api_key !== project.api_key) {
      return json({ error: "Unauthorized: invalid or missing api_key" }, 401);
    }

    // Validate client_id exists
    if (project.client_id) {
      const { data: clientCheck } = await supabase.from("clients").select("id").eq("id", project.client_id).single();
      if (!clientCheck) return json({ error: "Invalid client mapping" }, 400);
    }

    // Strict origin validation
    const allowedDomains = project.website_domain ? [project.website_domain] : null;
    if (!validateOrigin(req, allowedDomains)) {
      return json({ error: "Origin not allowed" }, 403);
    }

    // Rate limiting (per IP, 20/min)
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await supabase
      .from("seo_captured_leads")
      .select("*", { count: "exact", head: true })
      .eq("seo_project_id", project_id)
      .gte("created_at", oneMinAgo);

    if ((count || 0) > 20) return json({ error: "Rate limit exceeded. Try again later." }, 429);

    // Form ID validation
    if (form_id) {
      const { data: form } = await supabase
        .from("seo_lead_forms").select("id")
        .eq("id", form_id).eq("seo_project_id", project_id).single();
      if (!form) return json({ error: "Invalid form_id for this project" }, 400);
    }

    // Duplicate check: same phone within 60 seconds
    if (cleanPhone) {
      const countryCode = project.default_country_code || "+61";
      const normPhone = normalizePhone(cleanPhone, countryCode);
      if (normPhone) {
        const oneMinAgoDedup = new Date(Date.now() - 60 * 1000).toISOString();
        const { data: phoneDupes } = await supabase
          .from("seo_captured_leads").select("id")
          .eq("seo_project_id", project_id).eq("phone", normPhone)
          .gte("created_at", oneMinAgoDedup).limit(1);
        if (phoneDupes && phoneDupes.length > 0) return json({ error: "Duplicate lead detected" }, 409);
      }
    }

    // Duplicate check: same email within 2 minutes
    if (cleanEmail) {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: dupes } = await supabase
        .from("seo_captured_leads").select("id")
        .eq("seo_project_id", project_id).eq("email", cleanEmail)
        .gte("created_at", twoMinAgo).limit(1);
      if (dupes && dupes.length > 0) return json({ error: "Duplicate lead detected" }, 409);
    }

    // Normalize phone with project country code
    const countryCode = project.default_country_code || "+61";
    const normalizedPhone = normalizePhone(cleanPhone, countryCode);

    const { data: lead, error: insertErr } = await supabase
      .from("seo_captured_leads")
      .insert({
        business_id: project.business_id,
        seo_project_id: project_id,
        client_id: project.client_id,
        name: cleanName || null,
        email: cleanEmail || null,
        phone: normalizedPhone,
        message: cleanMessage || null,
        source: source || "form",
        form_id: form_id || null,
        extra_data: extra_data || null,
        page_url: page_url || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
      })
      .select().single();

    if (insertErr) {
      console.error("Lead insert error:", insertErr);
      return json({ error: insertErr.message }, 500);
    }

    // ── ALWAYS-ON EMAIL NOTIFICATIONS (non-blocking) ──
    const emailResults: Array<{ type: string; status: string }> = [];
    const CC_EMAIL = "reports@nextweb.com.au";

    try {
      // Fetch business info for email context
      const { data: bizInfo } = await supabase
        .from("businesses").select("name, email")
        .eq("id", project.business_id).maybeSingle();

      // Fetch client info for internal notification routing
      const { data: clientInfo } = project.client_id
        ? await supabase.from("clients").select("contact_name, email")
            .eq("id", project.client_id).maybeSingle()
        : { data: null };

      const businessName = bizInfo?.name || "NextWeb";
      const internalEmail = clientInfo?.email || bizInfo?.email || null;

      // 1. CUSTOMER CONFIRMATION EMAIL
      if (cleanEmail) {
        try {
          await withTimeout(supabase.functions.invoke("send-email", {
            body: {
              to: cleanEmail,
              cc: CC_EMAIL,
              subject: "Thank you for your enquiry",
              message: `Hi ${cleanName || "there"},\n\nThank you for reaching out to us. We've received your enquiry and our team will get back to you shortly.\n\nIf your request is urgent, feel free to contact us directly.\n\nBest regards,\n${businessName}`,
              from_name: businessName,
              business_id: project.business_id,
            },
          }), 8000);
          emailResults.push({ type: "customer_email", status: "success" });
        } catch (e) {
          console.error("Customer email failed (non-blocking):", e);
          emailResults.push({ type: "customer_email", status: "failed" });
        }
      }

      // 2. INTERNAL NOTIFICATION EMAIL
      if (internalEmail) {
        try {
          const leadDetails = [
            `Name: ${cleanName || "N/A"}`,
            `Phone: ${normalizedPhone || cleanPhone || "N/A"}`,
            `Email: ${cleanEmail || "N/A"}`,
            `Message: ${cleanMessage || "N/A"}`,
            `Source: ${source || "form"}`,
            `Page: ${page_url || "N/A"}`,
            `Time: ${new Date().toISOString()}`,
          ].join("\n");

          await withTimeout(supabase.functions.invoke("send-email", {
            body: {
              to: internalEmail,
              cc: CC_EMAIL,
              subject: `New Lead Received – ${clientInfo?.contact_name || businessName}`,
              message: `New lead received:\n\n${leadDetails}`,
              from_name: "NextWeb Lead System",
              business_id: project.business_id,
            },
          }), 8000);
          emailResults.push({ type: "internal_email", status: "success" });
        } catch (e) {
          console.error("Internal email failed (non-blocking):", e);
          emailResults.push({ type: "internal_email", status: "failed" });
        }
      }
    } catch (emailErr) {
      console.error("Email notification block failed (non-blocking):", emailErr);
    }

    // ── AUTOMATION SETTINGS (existing logic) ──
    const { data: autoSettings } = await supabase
      .from("seo_automation_settings").select("*")
      .eq("seo_project_id", project_id).maybeSingle();

    const automationResults: Array<{ type: string; status: string }> = [];
    const requestPayload = { name: cleanName, email: cleanEmail, phone: normalizedPhone, message: cleanMessage, source, form_id };

    const logAutomation = async (type: string, status: string, execMs: number, errMsg?: string, response?: any) => {
      await supabase.from("seo_automation_logs").insert({
        lead_id: lead.id, seo_project_id: project_id, business_id: project.business_id,
        automation_type: type, status, execution_time_ms: execMs,
        error_message: errMsg || null, response_json: response || null,
        request_payload: requestPayload,
      });
    };

    const queueRetry = async (type: string, payload: any, error: string) => {
      await supabase.from("seo_automation_queue").insert({
        lead_id: lead.id, seo_project_id: project_id, business_id: project.business_id,
        automation_type: type, payload,
        next_retry_at: new Date(Date.now() + 60 * 1000).toISOString(),
        last_error: error,
      });
    };

    if (autoSettings) {
      // WhatsApp automation
      if (autoSettings.enable_whatsapp && autoSettings.whatsapp_connected && autoSettings.whatsapp_number && normalizedPhone) {
        const start = Date.now();
        const waPayload = {
          from: autoSettings.whatsapp_number,
          to: normalizedPhone,
          message: `Hi ${cleanName || "there"}, thank you for your inquiry! We'll get back to you shortly.`,
          business_id: project.business_id,
        };
        try {
          await withTimeout(supabase.functions.invoke("whatsapp-send-message", { body: waPayload }));
          automationResults.push({ type: "whatsapp", status: "success" });
          await logAutomation("whatsapp", "success", Date.now() - start);
        } catch (e) {
          automationResults.push({ type: "whatsapp", status: "failed" });
          await logAutomation("whatsapp", "failed", Date.now() - start, String(e));
          await queueRetry("whatsapp", waPayload, String(e));
        }
      }

      // Call automation
      if (autoSettings.enable_call && normalizedPhone) {
        const start = Date.now();
        const callPayload = { phone: normalizedPhone, project_id, type: "lead_followup" };
        try {
          await withTimeout(supabase.functions.invoke("trigger-call", { body: callPayload }));
          automationResults.push({ type: "call", status: "success" });
          await logAutomation("call", "success", Date.now() - start);
        } catch (e) {
          automationResults.push({ type: "call", status: "failed" });
          await logAutomation("call", "failed", Date.now() - start, String(e));
          await queueRetry("call", callPayload, String(e));
        }
      }
    }

    return json({
      success: true,
      lead_id: lead.id,
      emails: emailResults,
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
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
