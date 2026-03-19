import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function validateOrigin(req: Request, allowedDomains: string[] | null): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";
  if (origin.includes("localhost") || referer.includes("localhost")) return true;
  try {
    const originHost = origin ? new URL(origin).hostname : "";
    const refererHost = referer ? new URL(referer).hostname : "";
    return allowedDomains.some((domain) => {
      const clean = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
      return originHost === clean || originHost.endsWith("." + clean) || refererHost === clean || refererHost.endsWith("." + clean);
    });
  } catch { return false; }
}

function normalizePhone(raw: string | null | undefined, defaultCountryCode = "+61"): string | null {
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

function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);
}

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── SPAM SCORING ──
function calculateSpamScore(
  name: string,
  email: string,
  phone: string,
  message: string,
  submissionTimestamp: number,
  isDuplicate: boolean
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Suspicious email patterns (random strings like xkjf28@...)
  if (email) {
    const localPart = email.split("@")[0] || "";
    const consonantRatio = (localPart.replace(/[aeiou0-9_.\-+]/gi, "").length) / Math.max(localPart.length, 1);
    if (consonantRatio > 0.8 && localPart.length > 5) {
      score += 30;
      reasons.push("suspicious_email_pattern");
    }
    // Disposable email domains
    const disposable = ["tempmail.com", "throwaway.email", "guerrillamail.com", "mailinator.com", "yopmail.com", "sharklasers.com"];
    const domain = email.split("@")[1]?.toLowerCase() || "";
    if (disposable.includes(domain)) {
      score += 20;
      reasons.push("disposable_email");
    }
  }

  // Too fast submission (< 2 seconds from page load — approximated by timestamp proximity)
  // We check if the submission came suspiciously fast
  if (submissionTimestamp && (Date.now() - submissionTimestamp) < 2000) {
    score += 20;
    reasons.push("too_fast_submission");
  }

  // Duplicate submission (same IP within 1 min)
  if (isDuplicate) {
    score += 20;
    reasons.push("duplicate_ip");
  }

  // Spam keywords in message
  if (message) {
    const spamKeywords = ["buy now", "click here", "free money", "congratulations", "winner", "bitcoin", "crypto", "viagra", "casino", "lottery", "prize"];
    const lowerMsg = message.toLowerCase();
    if (spamKeywords.some(kw => lowerMsg.includes(kw))) {
      score += 10;
      reasons.push("spam_keywords");
    }
    // Excessive URLs
    const urlCount = (message.match(/https?:\/\//g) || []).length;
    if (urlCount > 2) {
      score += 15;
      reasons.push("excessive_urls");
    }
  }

  // Invalid phone pattern
  if (phone && !/^\+?\d{7,15}$/.test(phone.replace(/[\s\-\(\)\.]/g, ""))) {
    score += 20;
    reasons.push("invalid_phone_pattern");
  }

  // All same character name
  if (name && /^(.)\1+$/.test(name.replace(/\s/g, ""))) {
    score += 25;
    reasons.push("gibberish_name");
  }

  return { score: Math.min(score, 100), reasons };
}

// ── GEO LOOKUP (ipapi.co free tier) ──
async function lookupGeo(ip: string): Promise<{
  country: string | null; city: string | null; region: string | null;
  latitude: number | null; longitude: number | null;
}> {
  const empty = { country: null, city: null, region: null, latitude: null, longitude: null };
  if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.")) return empty;
  try {
    const res = await withTimeout(fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "NextWebOS/1.0" },
    }), 3000);
    if (!res.ok) return empty;
    const data = await res.json();
    if (data.error) return empty;
    return {
      country: data.country_name || null,
      city: data.city || null,
      region: data.region || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    };
  } catch (e) {
    console.warn("[geo-lookup] Failed:", e);
    return empty;
  }
}

// ── DEVICE INFO PARSER ──
function parseDeviceInfo(userAgent: string): { device_type: string; browser: string; os: string } {
  const ua = userAgent.toLowerCase();
  let device_type = "desktop";
  if (/mobile|android|iphone|ipod/.test(ua)) device_type = "mobile";
  else if (/tablet|ipad/.test(ua)) device_type = "tablet";

  let browser = "unknown";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera") || ua.includes("opr")) browser = "Opera";

  let os = "unknown";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  return { device_type, browser, os };
}

async function sendEmailWithRetry(
  supabase: any, payload: any, retries = 1, timeoutMs = 8000
): Promise<{ success: boolean; error?: string }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { error } = await withTimeout(supabase.functions.invoke("send-email", { body: payload }), timeoutMs);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      console.error(`Email attempt ${attempt + 1} failed:`, e);
      if (attempt === retries) return { success: false, error: String(e) };
    }
  }
  return { success: false, error: "Max retries exceeded" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentLength = parseInt(req.headers.get("content-length") || "0");
    if (contentLength > 50000) return json({ error: "Payload too large" }, 413);

    const body = await req.json();
    const { name, email, phone, message, domain, project_id, source, form_id, extra_data, api_key,
            utm_source, utm_medium, utm_campaign, page_url, _submission_ts } = body;

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

    // Email format validation
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return json({ error: "Invalid email format" }, 400);
    }

    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("cf-connecting-ip")
      || req.headers.get("x-real-ip")
      || "unknown";
    const userAgent = (req.headers.get("user-agent") || "").slice(0, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === AUTO PROJECT DETECTION ===
    let project: any = null;

    if (domain && !project_id) {
      const cleanDomain = domain.toLowerCase().replace(/^www\./, "");
      console.log("[Auto Project Detection] Looking up domain:", cleanDomain);

      const { data: matchedProject, error: domainErr } = await supabase
        .from("seo_projects")
        .select("id, business_id, client_id, api_key, website_domain, default_country_code")
        .or(`website_domain.ilike.%${cleanDomain}%,website_domain.ilike.%www.${cleanDomain}%`)
        .limit(1)
        .maybeSingle();

      if (domainErr || !matchedProject) {
        console.error("[Auto Project Detection] No project found for domain:", cleanDomain);
        return json({ error: "No project found for this domain", debug: { domain: cleanDomain } }, 404);
      }

      project = matchedProject;
      console.log("[Auto Project Detection] Matched project:", project.id);
    } else if (project_id) {
      const { data: legacyProject, error: projErr } = await supabase
        .from("seo_projects")
        .select("id, business_id, client_id, api_key, website_domain, default_country_code")
        .eq("id", project_id)
        .single();

      if (projErr || !legacyProject) return json({ error: "Invalid project_id" }, 404);

      if (!api_key || api_key !== legacyProject.api_key) {
        return json({ error: "Unauthorized: invalid or missing api_key" }, 401);
      }

      project = legacyProject;
    } else {
      return json({ error: "Either domain or project_id is required" }, 400);
    }

    // Origin validation
    let allowedDomains: string[] | null = null;
    if (project.website_domain) {
      const projectDomain = project.website_domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
      allowedDomains = [projectDomain];
    } else {
      console.warn("[seo-lead-capture] No domain configured for project — allowing request");
    }

    const origin = req.headers.get("origin") || "";
    const referer = req.headers.get("referer") || "";
    console.log("[Origin Check]", { origin, referer, allowedDomains });

    if (!validateOrigin(req, allowedDomains)) {
      return json({
        error: "Origin not allowed",
        debug: { received_origin: origin, received_referer: referer, allowed_domains: allowedDomains }
      }, 403);
    }

    // Rate limiting (per IP, 20/min)
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: rateCount } = await supabase
      .from("seo_captured_leads")
      .select("*", { count: "exact", head: true })
      .eq("seo_project_id", project.id)
      .gte("created_at", oneMinAgo);

    if ((rateCount || 0) > 20) return json({ error: "Rate limit exceeded. Try again later." }, 429);

    // Form ID validation + fetch email routing config
    let formConfig: { to_emails: string[]; cc_emails: string[] } | null = null;
    if (form_id) {
      const { data: form } = await supabase
        .from("seo_lead_forms").select("*")
        .eq("id", form_id).eq("seo_project_id", project.id).single();
      if (!form) return json({ error: "Invalid form_id for this project" }, 400);
      formConfig = {
        to_emails: (form.to_emails as string[]) || [],
        cc_emails: (form.cc_emails as string[]) || [],
      };
    }

    // Normalize phone
    const countryCode = project.default_country_code || "+61";
    const normalizedPhone = normalizePhone(cleanPhone, countryCode);

    // Duplicate check: same phone within 60 seconds
    if (normalizedPhone) {
      const oneMinAgoDedup = new Date(Date.now() - 60 * 1000).toISOString();
      const { data: phoneDupes } = await supabase
        .from("seo_captured_leads").select("id")
        .eq("seo_project_id", project.id).eq("phone", normalizedPhone)
        .gte("created_at", oneMinAgoDedup).limit(1);
      if (phoneDupes && phoneDupes.length > 0) return json({ error: "Duplicate lead detected" }, 409);
    }

    // Duplicate check: same email within 2 minutes
    if (cleanEmail) {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: dupes } = await supabase
        .from("seo_captured_leads").select("id")
        .eq("seo_project_id", project.id).eq("email", cleanEmail)
        .gte("created_at", twoMinAgo).limit(1);
      if (dupes && dupes.length > 0) return json({ error: "Duplicate lead detected" }, 409);
    }

    // Check IP duplicate for spam scoring
    let isDuplicateIp = false;
    if (ipAddress !== "unknown") {
      const oneMinIp = new Date(Date.now() - 60 * 1000).toISOString();
      const { count: ipCount } = await supabase
        .from("seo_captured_leads").select("*", { count: "exact", head: true })
        .eq("seo_project_id", project.id).eq("ip_address", ipAddress)
        .gte("created_at", oneMinIp);
      isDuplicateIp = (ipCount || 0) > 0;
    }

    // ── SPAM SCORING ──
    const { score: spamScore, reasons: spamReasons } = calculateSpamScore(
      cleanName, cleanEmail, cleanPhone, cleanMessage,
      _submission_ts || 0, isDuplicateIp
    );
    const isSpam = spamScore >= 50;
    console.log("[seo-lead-capture] Spam:", { score: spamScore, isSpam, reasons: spamReasons });

    // ── GEO LOOKUP (non-blocking but awaited for data enrichment) ──
    const geo = await lookupGeo(ipAddress);
    const deviceInfo = parseDeviceInfo(userAgent);
    console.log("[seo-lead-capture] Geo:", geo, "Device:", deviceInfo);

    // INSERT LEAD
    console.log("[seo-lead-capture] Saving lead...");
    const { data: lead, error: insertErr } = await supabase
      .from("seo_captured_leads")
      .insert({
        business_id: project.business_id,
        seo_project_id: project.id,
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
        // New fields
        country: geo.country,
        city: geo.city,
        region: geo.region,
        latitude: geo.latitude,
        longitude: geo.longitude,
        device_info: deviceInfo,
        spam_score: spamScore,
        is_spam: isSpam,
      })
      .select().single();

    if (insertErr) {
      console.error("[seo-lead-capture] Lead insert error:", insertErr);
      return json({ error: insertErr.message }, 500);
    }
    console.log("[seo-lead-capture] Lead saved:", lead.id);

    // ── EMAIL NOTIFICATIONS (non-blocking, with retry) ──
    const emailResults: Array<{ type: string; status: string; error?: string }> = [];
    const CC_EMAIL = "reports@nextweb.com.au";

    // Skip email for spam leads
    if (!isSpam) {
      try {
        const { data: bizInfo } = await supabase
          .from("businesses").select("name, email")
          .eq("id", project.business_id).maybeSingle();

        const { data: clientInfo } = project.client_id
          ? await supabase.from("clients").select("contact_name, email")
              .eq("id", project.client_id).maybeSingle()
          : { data: null };

        const businessName = bizInfo?.name || "NextWeb";

        // Build recipient lists from form config or fallback
        const toRecipients = formConfig?.to_emails?.length
          ? formConfig.to_emails
          : [clientInfo?.email || bizInfo?.email].filter(Boolean) as string[];
        const ccRecipients = [
          ...(formConfig?.cc_emails || []),
          CC_EMAIL,
        ].filter((v, i, a) => v && a.indexOf(v) === i); // deduplicate

        // 1. CUSTOMER CONFIRMATION EMAIL
        if (cleanEmail) {
          console.log("[seo-lead-capture] Sending customer email to:", cleanEmail);
          const result = await sendEmailWithRetry(supabase, {
            to: cleanEmail,
            cc: CC_EMAIL,
            subject: "Thank you for your enquiry",
            message: `Hi ${cleanName || "there"},\n\nThank you for reaching out to us. We've received your enquiry and our team will get back to you shortly.\n\nIf your request is urgent, feel free to contact us directly.\n\nBest regards,\n${businessName}`,
            from_name: businessName,
            business_id: project.business_id,
          });
          emailResults.push({ type: "customer_email", status: result.success ? "success" : "failed", error: result.error });
          console.log("[seo-lead-capture] Customer email:", result.success ? "success" : "failed");
        }

        // 2. INTERNAL NOTIFICATION EMAIL — send to all configured To + CC recipients
        if (toRecipients.length > 0) {
          const leadDetails = [
            `Name: ${cleanName || "N/A"}`,
            `Phone: ${normalizedPhone || cleanPhone || "N/A"}`,
            `Email: ${cleanEmail || "N/A"}`,
            `Message: ${cleanMessage || "N/A"}`,
            `Source: ${source || "form"}`,
            `Page: ${page_url || "N/A"}`,
            `Location: ${[geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "N/A"}`,
            `Device: ${deviceInfo.device_type} / ${deviceInfo.browser} / ${deviceInfo.os}`,
            `Spam Score: ${spamScore}/100`,
            `Time: ${new Date().toISOString()}`,
          ].join("\n");

          for (const recipient of toRecipients) {
            console.log("[seo-lead-capture] Sending internal email to:", recipient);
            const result = await sendEmailWithRetry(supabase, {
              to: recipient,
              cc: ccRecipients.filter(c => c !== recipient).join(","),
              subject: `New Lead Received – ${clientInfo?.contact_name || businessName}`,
              message: `New lead received:\n\n${leadDetails}`,
              from_name: "NextWeb Lead System",
              business_id: project.business_id,
            });
            emailResults.push({ type: `internal_email_${recipient}`, status: result.success ? "success" : "failed", error: result.error });
            console.log("[seo-lead-capture] Internal email to", recipient, ":", result.success ? "success" : "failed");
          }
        }
      } catch (emailErr) {
        console.error("[seo-lead-capture] Email block failed (non-blocking):", emailErr);
      }
    } else {
      console.log("[seo-lead-capture] Skipping emails for spam lead (score:", spamScore, ")");
    }

    // ── AUTOMATION SETTINGS ──
    const { data: autoSettings } = await supabase
      .from("seo_automation_settings").select("*")
      .eq("seo_project_id", project.id).maybeSingle();

    const automationResults: Array<{ type: string; status: string }> = [];
    const requestPayload = { name: cleanName, email: cleanEmail, phone: normalizedPhone, message: cleanMessage, source, form_id };

    const logAutomation = async (type: string, status: string, execMs: number, errMsg?: string, response?: any) => {
      await supabase.from("seo_automation_logs").insert({
        lead_id: lead.id, seo_project_id: project.id, business_id: project.business_id,
        automation_type: type, status, execution_time_ms: execMs,
        error_message: errMsg || null, response_json: response || null,
        request_payload: requestPayload,
      });
    };

    const queueRetry = async (type: string, payload: any, error: string) => {
      await supabase.from("seo_automation_queue").insert({
        lead_id: lead.id, seo_project_id: project.id, business_id: project.business_id,
        automation_type: type, payload,
        next_retry_at: new Date(Date.now() + 60 * 1000).toISOString(),
        last_error: error,
      });
    };

    // Skip automations for spam
    if (autoSettings && !isSpam) {
      if (autoSettings.enable_whatsapp && autoSettings.whatsapp_connected && autoSettings.whatsapp_number && normalizedPhone) {
        const start = Date.now();
        const waPayload = {
          from: autoSettings.whatsapp_number, to: normalizedPhone,
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

      if (autoSettings.enable_call && normalizedPhone) {
        const start = Date.now();
        const callPayload = { phone: normalizedPhone, project_id: project.id, type: "lead_followup" };
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
      spam: { score: spamScore, is_spam: isSpam },
      emails: emailResults,
      automations: automationResults,
    }, 200);
  } catch (error) {
    console.error("[seo-lead-capture] Unhandled error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
