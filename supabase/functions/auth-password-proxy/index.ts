import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonHeaders = {
  ...corsHeaders,
  "Content-Type": "application/json",
};

const AUTH_TIMEOUT_MS = 10000;

const withTimeout = async <T>(operation: () => Promise<T>, timeoutMs: number) => {
  let timeoutId: number | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("AUTH_PROXY_TIMEOUT")), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const publishableKey =
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !publishableKey) {
      return new Response(JSON.stringify({ error: "Backend auth configuration is missing" }), {
        status: 500,
        headers: jsonHeaders,
      });
    }

    const supabase = createClient(supabaseUrl, publishableKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          "x-client-info": "auth-password-proxy",
        },
      },
    });

    const { data, error } = await withTimeout(
      () => supabase.auth.signInWithPassword({ email, password }),
      AUTH_TIMEOUT_MS
    );

    if (error) {
      return new Response(
        JSON.stringify({
          error: error.message,
          error_description: error.message,
          msg: error.message,
        }),
        {
          status: Number(error.status) || 400,
          headers: jsonHeaders,
        }
      );
    }

    return new Response(
      JSON.stringify({
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        token_type: data.session?.token_type,
        expires_in: data.session?.expires_in,
        user: data.user,
      }),
      {
        status: 200,
        headers: jsonHeaders,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth proxy request failed";
    console.error("auth-password-proxy error", message);

    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: jsonHeaders,
      }
    );
  }
});
