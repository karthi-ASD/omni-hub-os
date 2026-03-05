import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      api_key, name, email, phone, service_requested, message,
      page_url, utm_source, utm_medium, utm_campaign, gclid, is_demo,
    } = body;

    if (!api_key || !name || !email) {
      return new Response(
        JSON.stringify({ error: "api_key, name, and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Hash the provided API key and find matching website
    const keyHash = await hashApiKey(api_key);

    const { data: website, error: wErr } = await supabase
      .from("tenant_websites")
      .select("id, business_id, status, default_lead_owner_employee_id, timezone, call_allowed_start_time, call_allowed_end_time")
      .eq("api_key_hash", keyHash)
      .eq("status", "approved")
      .single();

    if (wErr || !website) {
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const business_id = website.business_id;
    const website_id = website.id;

    // Determine assignment via lead_assignment_rules
    let assigned_to_user_id = website.default_lead_owner_employee_id || null;
    let assignment_mode = "manual";
    let assignment_reason = "Default website owner";

    // Try to find active assignment rule for this website or business
    const { data: rules } = await supabase
      .from("lead_assignment_rules")
      .select("*")
      .eq("business_id", business_id)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (rules && rules.length > 0) {
      // Prefer website-specific rule
      const rule = rules.find((r: any) => r.website_id === website_id) || rules[0];
      
      if (rule.mode === "round_robin") {
        const config = rule.config_json as any;
        const employeeIds = config?.employee_ids || [];
        
        if (employeeIds.length > 0) {
          // Get capacity records, reset if needed
          const { data: caps } = await supabase
            .from("employee_capacity")
            .select("*")
            .eq("business_id", business_id)
            .in("employee_id", employeeIds)
            .eq("is_active", true);

          const today = new Date().toISOString().split("T")[0];
          const available = (caps || []).filter((c: any) => {
            const resetNeeded = c.last_reset_date !== today;
            const count = resetNeeded ? 0 : c.current_assigned_today;
            return count < (c.daily_lead_limit || 30);
          });

          if (available.length > 0) {
            // Pick least loaded
            const sorted = available.sort((a: any, b: any) => {
              const aCount = a.last_reset_date !== today ? 0 : a.current_assigned_today;
              const bCount = b.last_reset_date !== today ? 0 : b.current_assigned_today;
              return aCount - bCount;
            });
            const pick = sorted[0];
            assigned_to_user_id = pick.employee_id;
            assignment_mode = "round_robin";
            assignment_reason = `Round-robin: least loaded employee`;

            // Update capacity
            await supabase
              .from("employee_capacity")
              .update({
                current_assigned_today: pick.last_reset_date !== today ? 1 : pick.current_assigned_today + 1,
                last_reset_date: today,
              })
              .eq("id", pick.id);
          }
        }
      } else if (rule.mode === "territory") {
        const config = rule.config_json as any;
        const routes = config?.routes || [];
        const leadSuburb = (body.suburb || "").toLowerCase();
        const leadPostcode = (body.postcode || "").toLowerCase();
        
        const match = routes.find((r: any) =>
          (r.suburb && r.suburb.toLowerCase() === leadSuburb) ||
          (r.postcode && r.postcode.toLowerCase() === leadPostcode)
        );

        if (match) {
          assigned_to_user_id = match.employee_id;
          assignment_mode = "territory";
          assignment_reason = `Territory match: ${match.suburb || match.postcode}`;
        } else if (config?.fallback_employee_id) {
          assigned_to_user_id = config.fallback_employee_id;
          assignment_mode = "territory";
          assignment_reason = "Territory fallback";
        }
      }
    }

    // Create lead
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        business_id,
        website_id,
        name,
        email,
        phone: phone || null,
        services_needed: service_requested || null,
        service_detected: service_requested || null,
        notes: message || null,
        landing_page_url: page_url || null,
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        gclid: gclid || null,
        source: "website_form",
        assigned_to_user_id,
        assignment_mode,
        assignment_reason,
        locked_fields: { name: true, phone: true, email: true, notes: true },
      })
      .select("id")
      .single();

    if (leadErr) {
      return new Response(JSON.stringify({ error: leadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log assignment
    if (assigned_to_user_id) {
      await supabase.from("lead_assignment_logs").insert({
        business_id,
        lead_id: lead.id,
        to_employee_id: assigned_to_user_id,
        assigned_by: "SYSTEM",
        reason: assignment_reason,
      });
    }

    // System event
    await supabase.from("system_events").insert({
      business_id,
      event_type: "LEAD_CAPTURED_FROM_WEBSITE",
      payload_json: {
        entity_type: "lead",
        entity_id: lead.id,
        website_id,
        short_message: `New lead from website: ${name}`,
        assigned_to: assigned_to_user_id,
      },
    });

    // Audit log
    await supabase.from("audit_logs").insert({
      business_id,
      action_type: "WEBSITE_LEAD_CAPTURE",
      entity_type: "lead",
      entity_id: lead.id,
    });

    return new Response(
      JSON.stringify({ id: lead.id, assigned_to: assigned_to_user_id, status: "created" }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
