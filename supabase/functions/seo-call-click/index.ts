import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Origin validation
function validateOrigin(req: Request, allowedDomains: string[] | null): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  const origin = req.headers.get("origin") || req.headers.get("referer") || "";
  return allowedDomains.some((d) => origin.includes(d));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { project_id, page_url, api_key } = body;

    if (!project_id) {
      return json({ error: "project_id is required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id, api_key, website_domain")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return json({ error: "Invalid project_id" }, 404);
    }

    // API key validation
    if (!api_key || api_key !== project.api_key) {
      return json({ error: "Unauthorized: invalid or missing api_key" }, 401);
    }

    // Origin validation
    const allowedDomains = project.website_domain ? [project.website_domain] : null;
    if (!validateOrigin(req, allowedDomains)) {
      return json({ error: "Origin not allowed" }, 403);
    }

    // Rate limiting: max 20 call clicks per minute per project
    const oneMinAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count } = await supabase
      .from("seo_captured_leads")
      .select("*", { count: "exact", head: true })
      .eq("seo_project_id", project_id)
      .eq("source", "call_click")
      .gte("created_at", oneMinAgo);

    if ((count || 0) > 20) {
      return json({ error: "Rate limit exceeded" }, 429);
    }

    // Spam protection: ignore duplicate clicks within 30 seconds
    const thirtySecAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: recent } = await supabase
      .from("seo_captured_leads")
      .select("id")
      .eq("seo_project_id", project_id)
      .eq("source", "call_click")
      .gte("created_at", thirtySecAgo)
      .limit(1);

    if (recent && recent.length > 0) {
      return json({ message: "Duplicate click ignored" }, 200);
    }

    const { data: lead, error: insertErr } = await supabase
      .from("seo_captured_leads")
      .insert({
        business_id: project.business_id,
        seo_project_id: project_id,
        client_id: project.client_id,
        source: "call_click",
        page_url: page_url || null,
        status: "new",
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Call click insert error:", insertErr);
      return json({ error: insertErr.message }, 500);
    }

    return json({ success: true, lead_id: lead.id }, 200);
  } catch (error) {
    console.error("seo-call-click error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
