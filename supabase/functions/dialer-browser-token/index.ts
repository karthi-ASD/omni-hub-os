import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonRes(body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status: 200, headers: corsHeaders });
}

type EndpointRecord = {
  endpoint_id?: string;
  endpointId?: string;
  username?: string;
  alias?: string;
  password?: string;
};

async function plivoRequest(
  authId: string,
  plivoAuth: string,
  path: string,
  init?: RequestInit,
) {
  return fetch(`https://api.plivo.com/v1/Account/${authId}${path}`, {
    ...init,
    headers: {
      Authorization: plivoAuth,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

async function listEndpointByUsername(authId: string, plivoAuth: string, username: string) {
  const response = await plivoRequest(
    authId,
    plivoAuth,
    `/Endpoint/?username=${encodeURIComponent(username)}`,
    { headers: { Authorization: plivoAuth } },
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const endpoint = (data.objects || [])[0] as EndpointRecord | undefined;
  return endpoint || null;
}

async function getEndpointById(authId: string, plivoAuth: string, endpointId: string) {
  const response = await plivoRequest(authId, plivoAuth, `/Endpoint/${endpointId}/`, {
    headers: { Authorization: plivoAuth },
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

async function updateEndpointPassword(authId: string, plivoAuth: string, endpointId: string, password: string) {
  return plivoRequest(authId, plivoAuth, `/Endpoint/${endpointId}/`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

async function deleteEndpoint(authId: string, plivoAuth: string, endpointId: string) {
  return plivoRequest(authId, plivoAuth, `/Endpoint/${endpointId}/`, {
    method: "DELETE",
  });
}

async function createEndpoint(
  authId: string,
  plivoAuth: string,
  username: string,
  password: string,
  alias: string,
  appId: string,
) {
  const response = await plivoRequest(authId, plivoAuth, `/Endpoint/`, {
    method: "POST",
    body: JSON.stringify({
      username,
      password,
      alias,
      app_id: appId,
    }),
  });

  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

async function verifyEndpointSync(
  authId: string,
  plivoAuth: string,
  endpointId: string,
  expectedUsername: string,
  expectedPassword: string,
) {
  const verification = await getEndpointById(authId, plivoAuth, endpointId);
  const endpoint = verification.data as EndpointRecord;
  const actualUsername = endpoint.username || expectedUsername;
  const passwordMatches = typeof endpoint.password === "undefined"
    ? true
    : endpoint.password === expectedPassword;

  console.log("PLIVO ENDPOINT VERIFY", {
    username: actualUsername,
    password: expectedPassword,
  });

  return verification.ok && actualUsername === expectedUsername && passwordMatches;
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

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
    const username = `agent${user.id.replace(/-/g, "").slice(0, 16)}`;
    const password = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const alias = profile.full_name || `Agent ${user.id.slice(0, 8)}`;

    console.log("USERNAME:", username);
    console.log("PASSWORD:", password);

    const persistEndpoint = async (endpointId: string) => {
      await supabase.from("dialer_browser_endpoints").upsert({
        business_id: profile.business_id,
        user_id: user.id,
        plivo_endpoint_id: endpointId,
        plivo_username: username,
        plivo_password: password,
        plivo_app_id: PLIVO_APP_ID,
        is_active: true,
      } as any, { onConflict: "user_id,business_id" });
    };

    const finish = async (endpointId: string) => {
      await persistEndpoint(endpointId);
      console.log("PLIVO TOKEN GENERATED", { username, password, app_id: PLIVO_APP_ID });
      return jsonRes({ username, password, app_id: PLIVO_APP_ID });
    };

    const syncExistingEndpoint = async (endpointId: string) => {
      console.log("Reusing endpoint:", username);

      const firstUpdate = await updateEndpointPassword(PLIVO_AUTH_ID, plivoAuth, endpointId, password);
      if (!firstUpdate.ok) {
        console.warn("[dialer-browser-token] First password update failed", { endpointId, status: firstUpdate.status });
      }

      let isVerified = await verifyEndpointSync(PLIVO_AUTH_ID, plivoAuth, endpointId, username, password);
      if (!isVerified) {
        console.warn("[dialer-browser-token] Endpoint verify failed, retrying once", { endpointId, username });
        const retryUpdate = await updateEndpointPassword(PLIVO_AUTH_ID, plivoAuth, endpointId, password);
        if (!retryUpdate.ok) {
          console.warn("[dialer-browser-token] Retry password update failed", { endpointId, status: retryUpdate.status });
        }
        isVerified = await verifyEndpointSync(PLIVO_AUTH_ID, plivoAuth, endpointId, username, password);
      }

      if (isVerified) {
        return finish(endpointId);
      }

      console.warn("[dialer-browser-token] Endpoint still unsynced, deleting and recreating", { endpointId, username });
      await deleteEndpoint(PLIVO_AUTH_ID, plivoAuth, endpointId).catch((err) => {
        console.warn("[dialer-browser-token] Delete endpoint failed", err);
      });

      return null;
    };

    const createFreshEndpoint = async () => {
      console.log("Creating endpoint:", username);
      const created = await createEndpoint(PLIVO_AUTH_ID, plivoAuth, username, password, alias, PLIVO_APP_ID);
      console.log("[dialer-browser-token] Plivo Endpoint response", created.data);

      if (created.ok && created.data?.endpoint_id) {
        return finish(created.data.endpoint_id);
      }

      const errStr = JSON.stringify(created.data);
      if (errStr.includes("already") || errStr.includes("exists") || errStr.includes("duplicate")) {
        const listed = await listEndpointByUsername(PLIVO_AUTH_ID, plivoAuth, username);
        const listedId = listed?.endpoint_id || listed?.endpointId;
        if (listedId) {
          return syncExistingEndpoint(listedId);
        }
      }

      return jsonRes({ status: "error", error: "Failed to create Plivo endpoint", details: created.data });
    };

    const { data: existing } = await supabase
      .from("dialer_browser_endpoints")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_id", profile.business_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existing?.plivo_endpoint_id) {
      console.log("[dialer-browser-token] Found existing endpoint", {
        username: existing.plivo_username,
        endpointId: existing.plivo_endpoint_id,
      });

      const reused = await syncExistingEndpoint(existing.plivo_endpoint_id);
      if (reused) {
        return reused;
      }
    }

    const listed = await listEndpointByUsername(PLIVO_AUTH_ID, plivoAuth, username).catch((err) => {
      console.warn("[dialer-browser-token] Error checking existing endpoints:", err);
      return null;
    });

    const listedId = listed?.endpoint_id || listed?.endpointId;
    if (listedId) {
      const reused = await syncExistingEndpoint(listedId);
      if (reused) {
        return reused;
      }
    }

    return await createFreshEndpoint();
  } catch (err) {
    console.error("[dialer-browser-token] Error:", err);
    return jsonRes({ status: "error", error: String(err) });
  }
});