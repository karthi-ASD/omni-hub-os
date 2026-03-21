import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonRes(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonRes({ status: "error", error: "Unauthorized" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonRes({ status: "error", error: "Invalid token" });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.business_id) {
      return jsonRes({ status: "error", error: "No business profile found" });
    }

    const PLIVO_AUTH_ID = Deno.env.get("PLIVO_AUTH_ID");
    const PLIVO_AUTH_TOKEN = Deno.env.get("PLIVO_AUTH_TOKEN");

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN) {
      return jsonRes({ status: "error", error: "Plivo credentials not configured" });
    }

    const plivoAuth = "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`);

    // Check for existing endpoint
    const { data: existing } = await supabase
      .from("dialer_browser_endpoints")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_id", profile.business_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      console.log("[dialer-browser-token] Returning existing endpoint", {
        username: existing.plivo_username,
        user_id: user.id,
      });

      // Verify endpoint still exists on Plivo
      if (existing.plivo_endpoint_id) {
        try {
          const checkResp = await fetch(
            `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/${existing.plivo_endpoint_id}/`,
            { headers: { Authorization: plivoAuth } }
          );
          if (checkResp.ok) {
            return jsonRes({
              status: "ok",
              username: existing.plivo_username,
              password: existing.plivo_password,
            });
          }
          // Endpoint deleted on Plivo — recreate
          console.warn("[dialer-browser-token] Endpoint not found on Plivo, recreating");
          await supabase.from("dialer_browser_endpoints")
            .update({ is_active: false })
            .eq("id", existing.id);
        } catch {
          // Network error checking — return existing anyway
          return jsonRes({
            status: "ok",
            username: existing.plivo_username,
            password: existing.plivo_password,
          });
        }
      } else {
        return jsonRes({
          status: "ok",
          username: existing.plivo_username,
          password: existing.plivo_password,
        });
      }
    }

    // Find or create Plivo Application for this business
    let appId = "";

    const { data: existingApp } = await supabase
      .from("dialer_browser_endpoints")
      .select("plivo_app_id")
      .eq("business_id", profile.business_id)
      .not("plivo_app_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (existingApp?.plivo_app_id) {
      appId = existingApp.plivo_app_id;
      console.log("[dialer-browser-token] Reusing existing Plivo app", { appId });
    } else {
      // Create new Plivo Application
      const answerUrl = `${supabaseUrl}/functions/v1/dialer-browser-answer`;
      const hangupUrl = `${supabaseUrl}/functions/v1/dialer-webhook`;

      console.log("[dialer-browser-token] Creating Plivo Application", { answerUrl, hangupUrl });

      const appResp = await fetch(
        `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Application/`,
        {
          method: "POST",
          headers: { Authorization: plivoAuth, "Content-Type": "application/json" },
          body: JSON.stringify({
            app_name: `NextWebOS Browser Dialer ${profile.business_id.slice(0, 8)}`,
            answer_url: answerUrl,
            answer_method: "POST",
            hangup_url: hangupUrl,
            hangup_method: "POST",
          }),
        }
      );

      const appData = await appResp.json();
      console.log("[dialer-browser-token] Plivo Application response", appData);

      if (!appResp.ok || !appData.app_id) {
        return jsonRes({ status: "error", error: "Failed to create Plivo application", details: appData });
      }
      appId = appData.app_id;
    }

    // Create Plivo Endpoint for this user
    const username = `agent_${user.id.replace(/-/g, "").slice(0, 16)}`;
    const password = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const alias = profile.full_name || `Agent ${user.id.slice(0, 8)}`;

    console.log("[dialer-browser-token] Creating Plivo Endpoint", { username, alias, appId });

    const endpointResp = await fetch(
      `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/`,
      {
        method: "POST",
        headers: { Authorization: plivoAuth, "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          alias,
          app_id: appId,
        }),
      }
    );

    const endpointData = await endpointResp.json();
    console.log("[dialer-browser-token] Plivo Endpoint response", endpointData);

    if (!endpointResp.ok || !endpointData.endpoint_id) {
      return jsonRes({ status: "error", error: "Failed to create Plivo endpoint", details: endpointData });
    }

    // Store in DB
    const { error: insertError } = await supabase.from("dialer_browser_endpoints").insert({
      business_id: profile.business_id,
      user_id: user.id,
      plivo_endpoint_id: endpointData.endpoint_id,
      plivo_username: username,
      plivo_password: password,
      plivo_app_id: appId,
    } as any);

    if (insertError) {
      console.error("[dialer-browser-token] DB insert error", insertError);
    }

    console.log("[dialer-browser-token] Endpoint provisioned successfully", {
      user_id: user.id,
      username,
      endpoint_id: endpointData.endpoint_id,
    });

    return jsonRes({
      status: "ok",
      username,
      password,
    });
  } catch (err) {
    console.error("[dialer-browser-token] Error:", err);
    return jsonRes({ status: "error", error: String(err) });
  }
});
