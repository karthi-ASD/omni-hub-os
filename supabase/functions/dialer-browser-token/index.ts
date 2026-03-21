import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonRes(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });
}

async function plivoFetch(authId: string, plivoAuth: string, path: string, init?: RequestInit) {
  return fetch(`https://api.plivo.com/v1/Account/${authId}${path}`, {
    ...init,
    headers: { Authorization: plivoAuth, "Content-Type": "application/json", ...(init?.headers || {}) },
  });
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
    if (authError || !user) return jsonRes({ status: "error", error: "Invalid token" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.business_id) return jsonRes({ status: "error", error: "No business profile found" });

    const PLIVO_AUTH_ID = Deno.env.get("PLIVO_AUTH_ID");
    const PLIVO_AUTH_TOKEN = Deno.env.get("PLIVO_AUTH_TOKEN");
    const PLIVO_APP_ID = Deno.env.get("PLIVO_APP_ID");

    console.log("[token] Env check", { hasAuthId: !!PLIVO_AUTH_ID, hasAuthToken: !!PLIVO_AUTH_TOKEN, appId: PLIVO_APP_ID });

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN) return jsonRes({ status: "error", error: "Plivo credentials not configured" });
    if (!PLIVO_APP_ID) return jsonRes({ status: "error", error: "PLIVO_APP_ID not configured" });

    const plivoAuth = "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`);
    const username = `agent${user.id.replace(/-/g, "").slice(0, 16)}`;
    const password = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const alias = profile.full_name || `Agent ${user.id.slice(0, 8)}`;

    // Step 1: Delete ALL existing endpoints for this username
    try {
      const listResp = await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/?username=${username}`);
      if (listResp.ok) {
        const listData = await listResp.json();
        const endpoints = listData.objects || [];
        for (const ep of endpoints) {
          const epId = ep.endpoint_id;
          if (epId) {
            console.log("[token] Deleting old endpoint", { username, endpointId: epId });
            await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/${epId}/`, { method: "DELETE" }).catch(() => {});
          }
        }
      } else {
        await listResp.text();
      }
    } catch (e) {
      console.warn("[token] Error listing endpoints for cleanup:", e);
    }

    // Step 2: Mark all DB records inactive
    await supabase.from("dialer_browser_endpoints")
      .update({ is_active: false } as any)
      .eq("user_id", user.id)
      .eq("business_id", profile.business_id);

    // Step 3: Create fresh endpoint
    console.log("[token] Creating fresh endpoint", { username, alias, appId: PLIVO_APP_ID });
    const createResp = await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/`, {
      method: "POST",
      body: JSON.stringify({ username, password, alias, app_id: PLIVO_APP_ID }),
    });

    const createData = await createResp.json();
    console.log("[token] Plivo create response", createData);

    if (!createResp.ok || !createData.endpoint_id) {
      return jsonRes({ status: "error", error: "Failed to create Plivo endpoint", details: createData });
    }

    // Step 4: Persist in DB
    await supabase.from("dialer_browser_endpoints").upsert({
      business_id: profile.business_id,
      user_id: user.id,
      plivo_endpoint_id: createData.endpoint_id,
      plivo_username: username,
      plivo_password: password,
      plivo_app_id: PLIVO_APP_ID,
      is_active: true,
    } as any, { onConflict: "user_id,business_id" });

    console.log("PLIVO TOKEN GENERATED", { username, password, app_id: PLIVO_APP_ID, endpoint_id: createData.endpoint_id });
    return jsonRes({ username, password, app_id: PLIVO_APP_ID });
  } catch (err) {
    console.error("[token] Error:", err);
    return jsonRes({ status: "error", error: String(err) });
  }
});