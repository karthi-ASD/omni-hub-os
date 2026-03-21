import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLIVO_WEBRTC_APP_ID = "45801072070731068";

function jsonRes(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN) return jsonRes({ status: "error", error: "Plivo credentials not configured" });

    const plivoAuth = "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`);
    const username = `agent${user.id.replace(/-/g, "").slice(0, 6)}${Date.now()}`;
    const password = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const alias = profile.full_name || `Agent ${user.id.slice(0, 8)}`;

    await supabase
      .from("dialer_browser_endpoints")
      .update({ is_active: false } as any)
      .eq("user_id", user.id)
      .eq("business_id", profile.business_id);

    console.log("PLIVO_APP_ID_USED", PLIVO_WEBRTC_APP_ID);

    const createPayload = { username, password, alias, app_id: PLIVO_WEBRTC_APP_ID };

    const createResp = await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/`, {
      method: "POST",
      body: JSON.stringify(createPayload),
    });

    const createData = await createResp.json().catch(() => ({}));
    console.log("PLIVO_CREATE_ENDPOINT_FULL", { status: createResp.status, ok: createResp.ok, data: createData });

    if (!createResp.ok || !createData.endpoint_id) {
      return jsonRes({ status: "error", error: "Failed to create Plivo endpoint", plivoError: createData });
    }

    const endpointId = createData.endpoint_id;
    const endpointUsername = createData.username || username;

    await supabase.from("dialer_browser_endpoints").upsert({
      business_id: profile.business_id,
      user_id: user.id,
      plivo_endpoint_id: endpointId,
      plivo_username: endpointUsername,
      plivo_password: password,
      plivo_app_id: PLIVO_WEBRTC_APP_ID,
      is_active: true,
    } as any, { onConflict: "user_id,business_id" });

    console.log("PLIVO_TOKEN_GENERATED_FINAL", {
      endpoint_id: endpointId,
      username: endpointUsername,
      password,
      app_id: PLIVO_WEBRTC_APP_ID,
    });

    return jsonRes({
      username: endpointUsername,
      password,
      app_id: PLIVO_WEBRTC_APP_ID,
      endpoint_id: endpointId,
    });
  } catch (err) {
    console.error("[token] Error:", err);
    return jsonRes({ status: "error", error: String(err) });
  }
});