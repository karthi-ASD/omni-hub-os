import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { project_id, page_url } = body;

    if (!project_id) {
      return new Response(JSON.stringify({ error: "project_id is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: project, error: projErr } = await supabase
      .from("seo_projects")
      .select("id, business_id, client_id")
      .eq("id", project_id)
      .single();

    if (projErr || !project) {
      return new Response(JSON.stringify({ error: "Invalid project_id" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ message: "Duplicate click ignored" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, lead_id: lead.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("seo-call-click error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
