import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max decrypt calls per minute per user
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Verify the user's JWT
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, value, record_id } = await req.json();
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "encrypt") {
      if (!value || typeof value !== "string" || value.trim() === "") {
        return new Response(JSON.stringify({ error: "Value is required for encryption" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await adminClient.rpc("encrypt_sensitive_field", {
        plain_text: value,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ encrypted: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "decrypt") {
      if (!record_id) {
        return new Response(JSON.stringify({ error: "record_id required for decrypt" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Rate limit decrypt operations
      if (!checkRateLimit(user.id)) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Max 10 decrypt calls per minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Authorization: verify user belongs to the same business as the record
      const { data: userProfile } = await adminClient
        .from("profiles")
        .select("business_id")
        .eq("user_id", user.id)
        .single();

      if (!userProfile?.business_id) {
        return new Response(JSON.stringify({ error: "User profile not found" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check credential belongs to same business
      const { data: credRecord } = await adminClient
        .from("client_access_credentials")
        .select("business_id")
        .eq("id", record_id)
        .single();

      // Also check integrations if not found in credentials
      let authorized = credRecord?.business_id === userProfile.business_id;
      if (!credRecord) {
        const { data: intRecord } = await adminClient
          .from("client_project_integrations")
          .select("business_id")
          .eq("id", record_id)
          .single();
        authorized = intRecord?.business_id === userProfile.business_id;
      }

      if (!authorized) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data, error } = await adminClient.rpc("decrypt_sensitive_field", {
        cipher_text: value,
      });
      if (error) throw error;

      // Update last_decrypted_at on the credential
      await adminClient
        .from("client_access_credentials")
        .update({ last_decrypted_at: new Date().toISOString() } as any)
        .eq("id", record_id);

      // Audit log
      await adminClient.from("client_access_audit_logs").insert({
        client_id: null,
        business_id: userProfile.business_id,
        record_type: "credential",
        record_id: record_id,
        action_type: "decrypt",
        action_by: user.id,
        action_note: `Decrypted sensitive field`,
      });

      return new Response(JSON.stringify({ decrypted: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use 'encrypt' or 'decrypt'." }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Vault crypto error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
