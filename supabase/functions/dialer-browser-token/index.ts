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

    if (!PLIVO_AUTH_ID || !PLIVO_AUTH_TOKEN) return jsonRes({ status: "error", error: "Plivo credentials not configured" });
    if (!PLIVO_APP_ID) return jsonRes({ status: "error", error: "PLIVO_APP_ID not configured" });

    const plivoAuth = "Basic " + btoa(`${PLIVO_AUTH_ID}:${PLIVO_AUTH_TOKEN}`);
    const username = `agent${user.id.replace(/-/g, "").slice(0, 12)}${Date.now().toString(36)}`;
    const password = crypto.randomUUID().replace(/-/g, "");
    const alias = profile.full_name || `Agent ${user.id.slice(0, 8)}`;

    // Delete ALL existing endpoints for this user (any username pattern)
    try {
      const baseUsername = `agent${user.id.replace(/-/g, "").slice(0, 12)}`;
      const listResp = await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/`);
      if (listResp.ok) {
        const listData = await listResp.json();
        const endpoints = listData.objects || [];
        for (const endpoint of endpoints) {
          if (endpoint?.username?.startsWith(baseUsername) && endpoint?.endpoint_id) {
            console.log("[token] Deleting old endpoint", { username: endpoint.username, id: endpoint.endpoint_id });
            await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/${endpoint.endpoint_id}/`, { method: "DELETE" }).catch(() => undefined);
          }
        }
      } else {
        await listResp.text();
      }
    } catch {
      // ignore cleanup errors
    }

    await supabase
      .from("dialer_browser_endpoints")
      .update({ is_active: false } as any)
      .eq("user_id", user.id)
      .eq("business_id", profile.business_id);

    console.log("PLIVO APP CHECK", { app_id: "45801072070731068" });

    const createPayload = { username, password, alias, app_id: "45801072070731068" };
    console.log("PLIVO CREATE PAYLOAD", createPayload);

    const createResp = await plivoFetch(PLIVO_AUTH_ID, plivoAuth, `/Endpoint/`, {
      method: "POST",
      body: JSON.stringify(createPayload),
    });

    const createData = await createResp.json();
    console.log("PLIVO CREATE ENDPOINT RESPONSE", { status: createResp.status, ok: createResp.ok, data: createData });

    if (!createResp.ok || !createData.endpoint_id) {
      return jsonRes({ status: "error", error: "Failed to create Plivo endpoint", plivoError: createData });
    }

    await supabase.from("dialer_browser_endpoints").upsert({
      business_id: profile.business_id,
      user_id: user.id,
      plivo_endpoint_id: createData.endpoint_id,
      plivo_username: username,
      plivo_password: password,
      plivo_app_id: "45801072070731068",
      is_active: true,
    } as any, { onConflict: "user_id,business_id" });

    console.log("FINAL TOKEN RESPONSE RAW", { username, password, app_id: "45801072070731068" });
    return jsonRes({ username, password, app_id: "45801072070731068" });
  } catch (err) {
    console.error("[token] Error:", err);
    return jsonRes({ status: "error", error: String(err) });
  }
});