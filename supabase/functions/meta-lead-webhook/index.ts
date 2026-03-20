import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // ── Meta Webhook Verification (GET) ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("META_LEAD_VERIFY_TOKEN") || Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "nextweb-meta-verify";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Meta webhook verified");
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  // ── Process Lead (POST) ──
  try {
    const body = await req.json();
    console.log("📥 Meta webhook payload:", JSON.stringify(body));

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: any[] = [];

    // Meta sends { entry: [ { changes: [ { value: { leadgen_id, ... } } ] } ] }
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const value = change.value;
        const leadgenId = value.leadgen_id;
        const formId = value.form_id;
        const pageId = value.page_id;
        const adId = value.ad_id;
        const createdTime = value.created_time;

        // Try to fetch lead data from Meta Graph API if access token is available
        let leadData: Record<string, string> = {};
        const accessToken = Deno.env.get("META_PAGE_ACCESS_TOKEN") || Deno.env.get("WHATSAPP_ACCESS_TOKEN");

        if (accessToken && leadgenId) {
          try {
            const res = await fetch(
              `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${accessToken}`
            );
            if (res.ok) {
              const ld = await res.json();
              // Parse field_data array into key-value
              for (const field of ld.field_data || []) {
                const key = field.name?.toLowerCase() || "";
                const val = (field.values || [])[0] || "";
                leadData[key] = val;
              }
              console.log("📊 Lead data fetched:", JSON.stringify(leadData));
            }
          } catch (e) {
            console.error("⚠️ Could not fetch lead data from Meta:", e);
          }
        }

        // Resolve business_id from page_id mapping or fallback
        // First try meta_page_mappings table, then fallback to first active business
        let businessId: string | null = null;

        const { data: pageMapping } = await supabase
          .from("meta_page_mappings")
          .select("business_id")
          .eq("page_id", String(pageId))
          .eq("is_active", true)
          .single();

        if (pageMapping?.business_id) {
          businessId = pageMapping.business_id;
        } else {
          // Fallback: use the first active business (for single-tenant setups like ACE1)
          const { data: biz } = await supabase
            .from("businesses")
            .select("id")
            .eq("status", "active")
            .order("created_at", { ascending: true })
            .limit(1)
            .single();
          businessId = biz?.id || null;
        }

        if (!businessId) {
          console.error("❌ No business found for page_id:", pageId);
          continue;
        }

        // Extract fields with flexible naming
        const fullName =
          leadData.full_name || leadData.name || leadData.full_name ||
          [leadData.first_name, leadData.last_name].filter(Boolean).join(" ") ||
          "Facebook Lead";

        const phone = leadData.phone_number || leadData.phone || leadData.mobile || null;
        const email = leadData.email || leadData.email_address || null;
        const budget = leadData.budget || leadData.budget_range || null;
        const notes = leadData.message || leadData.comments || leadData.notes || null;
        const city = leadData.city || leadData.suburb || leadData.location || null;
        const interest = leadData.property_type || leadData.interest || leadData.property_interest || null;

        // Check for duplicate by meta_lead_id
        const { data: existing } = await supabase
          .from("crm_leads")
          .select("id")
          .eq("meta_lead_id", String(leadgenId))
          .eq("business_id", businessId)
          .limit(1)
          .single();

        if (existing) {
          console.log("⚠️ Duplicate meta lead, skipping:", leadgenId);
          results.push({ leadgen_id: leadgenId, status: "duplicate" });
          continue;
        }

        // Insert lead
        const { data: newLead, error: insertError } = await supabase
          .from("crm_leads")
          .insert({
            business_id: businessId,
            full_name: fullName,
            mobile: phone,
            email: email,
            source: "meta",
            budget_range: budget,
            notes: notes ? `[Meta Lead] ${notes}` : `[Meta Lead] Form: ${formId || "unknown"}`,
            city: city,
            property_interest_type: interest,
            meta_lead_id: String(leadgenId),
            stage: "new",
            lead_temperature: "hot",
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("❌ Insert error:", insertError.message);
          results.push({ leadgen_id: leadgenId, status: "error", error: insertError.message });
          continue;
        }

        // Log system event
        await supabase.from("system_events").insert({
          business_id: businessId,
          event_type: "META_LEAD_RECEIVED",
          payload_json: {
            lead_id: newLead?.id,
            leadgen_id: leadgenId,
            form_id: formId,
            page_id: pageId,
            ad_id: adId,
            source: "facebook",
          },
        });

        console.log("✅ Lead created:", newLead?.id);
        results.push({ leadgen_id: leadgenId, status: "created", lead_id: newLead?.id });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
