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
    const PLIVO_APP_ID = Deno.env.get("PLIVO_APP_ID");

    console.log("[dialer-browser-token] Env check", {
      hasAuthId: !!PLIVO_AUTH_ID,
      hasAuthToken: !!PLIVO_AUTH_TOKEN,
      hasAppId: !!PLIVO_APP_ID,
      appId: PLIVO_APP_ID,
    });

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN) {
      return jsonRes({ status: "error", error: "Plivo credentials not configured" });
    }

    if (!PLIVO_APP_ID) {
      return jsonRes({ status: "error", error: "PLIVO_APP_ID not configured. Set it in secrets." });
    }

    const plivoAuth = "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`);

    // Check for existing endpoint in DB
    const { data: existing } = await supabase
      .from("dialer_browser_endpoints")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_id", profile.business_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing) {
      console.log("[dialer-browser-token] Found existing endpoint", {
        username: existing.plivo_username,
        endpointId: existing.plivo_endpoint_id,
      });

      // Verify endpoint still exists on Plivo
      if (existing.plivo_endpoint_id) {
        try {
          const checkResp = await fetch(
            `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/${existing.plivo_endpoint_id}/`,
            { headers: { Authorization: plivoAuth } }
          );
          if (checkResp.ok) {
            // Update app_id if it changed
            if (existing.plivo_app_id !== PLIVO_APP_ID) {
              console.log("[dialer-browser-token] Updating endpoint app_id to fixed PLIVO_APP_ID");
              await fetch(
                `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/${existing.plivo_endpoint_id}/`,
                {
                  method: "POST",
                  headers: { Authorization: plivoAuth, "Content-Type": "application/json" },
                  body: JSON.stringify({ app_id: PLIVO_APP_ID }),
                }
              );
              await supabase.from("dialer_browser_endpoints")
                .update({ plivo_app_id: PLIVO_APP_ID } as any)
                .eq("id", existing.id);
            }
            return jsonRes({
              status: "ok",
              username: existing.plivo_username,
              password: existing.plivo_password,
            });
          }
          console.warn("[dialer-browser-token] Endpoint not found on Plivo, will recreate");
          await supabase.from("dialer_browser_endpoints")
            .update({ is_active: false } as any)
            .eq("id", existing.id);
        } catch {
          // Network error — return existing anyway
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

    // Create Plivo Endpoint using fixed PLIVO_APP_ID
    // Plivo requires alphanumeric-only usernames (no underscores/special chars)
    const username = `agent${user.id.replace(/-/g, "").slice(0, 16)}`;
    const password = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const alias = profile.full_name || `Agent ${user.id.slice(0, 8)}`;

    console.log("[dialer-browser-token] Creating Plivo Endpoint", {
      username,
      alias,
      appId: PLIVO_APP_ID,
    });

    // First, check if endpoint with this username already exists on Plivo
    let existingEndpointId: string | null = null;
    try {
      const listResp = await fetch(
        `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/?username=${username}`,
        { headers: { Authorization: plivoAuth } }
      );
      if (listResp.ok) {
        const listData = await listResp.json();
        const endpoints = listData.objects || [];
        if (endpoints.length > 0) {
          existingEndpointId = endpoints[0].endpoint_id;
          console.log("[dialer-browser-token] Found existing Plivo endpoint", {
            username,
            endpointId: existingEndpointId,
          });

          // Update app_id on existing endpoint
          await fetch(
            `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/${existingEndpointId}/`,
            {
              method: "POST",
              headers: { Authorization: plivoAuth, "Content-Type": "application/json" },
              body: JSON.stringify({ app_id: PLIVO_APP_ID, password }),
            }
          );

          // Store/update in DB
          await supabase.from("dialer_browser_endpoints").upsert({
            business_id: profile.business_id,
            user_id: user.id,
            plivo_endpoint_id: existingEndpointId,
            plivo_username: username,
            plivo_password: password,
            plivo_app_id: PLIVO_APP_ID,
            is_active: true,
          } as any, { onConflict: "user_id,business_id" });

          return jsonRes({ status: "ok", username, password });
        }
      }
    } catch (listErr) {
      console.warn("[dialer-browser-token] Error checking existing endpoints:", listErr);
    }

    // No existing endpoint found — create new one
    const endpointResp = await fetch(
      `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/`,
      {
        method: "POST",
        headers: { Authorization: plivoAuth, "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          alias,
          app_id: PLIVO_APP_ID,
        }),
      }
    );

    const endpointData = await endpointResp.json();
    console.log("[dialer-browser-token] Plivo Endpoint response", endpointData);

    if (!endpointResp.ok || !endpointData.endpoint_id) {
      // If error is "already exists", try to list and reuse
      const errStr = JSON.stringify(endpointData);
      if (errStr.includes("already") || errStr.includes("exists") || errStr.includes("duplicate")) {
        console.log("[dialer-browser-token] Endpoint already exists, fetching...");
        try {
          const retryList = await fetch(
            `https://api.plivo.com/v1/Account/${PLIVO_AUTH_ID}/Endpoint/?username=${username}`,
            { headers: { Authorization: plivoAuth } }
          );
          if (retryList.ok) {
            const retryData = await retryList.json();
            const eps = retryData.objects || [];
            if (eps.length > 0) {
              await supabase.from("dialer_browser_endpoints").upsert({
                business_id: profile.business_id,
                user_id: user.id,
                plivo_endpoint_id: eps[0].endpoint_id,
                plivo_username: username,
                plivo_password: password,
                plivo_app_id: PLIVO_APP_ID,
                is_active: true,
              } as any, { onConflict: "user_id,business_id" });
              return jsonRes({ status: "ok", username, password });
            }
          }
        } catch { /* fall through */ }
      }
      return jsonRes({ status: "error", error: "Failed to create Plivo endpoint", details: endpointData });
    }

    // Store in DB
    const { error: insertError } = await supabase.from("dialer_browser_endpoints").upsert({
      business_id: profile.business_id,
      user_id: user.id,
      plivo_endpoint_id: endpointData.endpoint_id,
      plivo_username: username,
      plivo_password: password,
      plivo_app_id: PLIVO_APP_ID,
      is_active: true,
    } as any, { onConflict: "user_id,business_id" });

    if (insertError) {
      console.error("[dialer-browser-token] DB insert error", insertError);
    }

    console.log("[dialer-browser-token] Endpoint provisioned successfully", {
      user_id: user.id,
      username,
      endpoint_id: endpointData.endpoint_id,
      app_id: PLIVO_APP_ID,
    });

    return jsonRes({ status: "ok", username, password });
  } catch (err) {
    console.error("[dialer-browser-token] Error:", err);
    return jsonRes({ status: "error", error: String(err) });
  }
});
