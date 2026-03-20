import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) {
      return new Response(JSON.stringify({ error: "Missing session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("dialer_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch disposition details
    const { data: dispositions } = await supabase
      .from("dialer_dispositions")
      .select("disposition_type, notes")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(1);

    const latestDisp = dispositions?.[0];

    // Build AI prompt
    const userInput = JSON.stringify({
      notes: session.notes || latestDisp?.notes || "No notes provided",
      duration: session.call_duration || 0,
      disposition: session.disposition || latestDisp?.disposition_type || "unknown",
      phone_number: session.phone_number,
    });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a sales analyst. Analyze this call and return structured JSON only. No markdown, no explanation.`,
          },
          { role: "user", content: userInput },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_call",
              description: "Return structured analysis of a sales call",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "2-3 sentence call summary" },
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                  score: { type: "number", description: "Call quality score 0-100" },
                  next_action: { type: "string", description: "Recommended next action" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  auto_tag: { type: "string", enum: ["hot_lead", "warm_lead", "cold_lead"], description: "Suggested lead tag" },
                },
                required: ["summary", "sentiment", "score", "next_action", "priority"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_call" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysis: any;

    if (toolCall?.function?.arguments) {
      analysis = typeof toolCall.function.arguments === "string"
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing content
      const content = aiData.choices?.[0]?.message?.content || "{}";
      try {
        analysis = JSON.parse(content);
      } catch {
        analysis = { summary: "Analysis unavailable", sentiment: "neutral", score: 50, next_action: "Review manually", priority: "medium" };
      }
    }

    // Store AI log
    await supabase.from("dialer_ai_logs").insert({
      session_id,
      summary: analysis.summary,
      sentiment: analysis.sentiment,
      score: analysis.score,
      next_action: analysis.next_action,
      priority: analysis.priority,
      key_points: [],
    });

    // Update session with AI data
    await supabase
      .from("dialer_sessions")
      .update({
        ai_summary: analysis.summary,
        ai_score: analysis.score,
      })
      .eq("id", session_id);

    // Update lead priority_score if lead_id exists
    if (session.lead_id) {
      // Fetch call count for lead
      const { count: callCount } = await supabase
        .from("dialer_sessions")
        .select("id", { count: "exact", head: true })
        .eq("lead_id", session.lead_id);

      const priorityScore = Math.min(100, Math.round(
        (analysis.score * 0.6) + (Math.min((callCount || 0), 10) * 2) + (analysis.priority === "high" ? 20 : analysis.priority === "medium" ? 10 : 0)
      ));

      await supabase
        .from("leads")
        .update({ priority_score: priorityScore })
        .eq("id", session.lead_id);
    }

    // Auto-tag if suggested
    if (analysis.auto_tag && session.user_id) {
      await supabase.from("dialer_call_tags").upsert(
        { session_id, tag: analysis.auto_tag, created_by: session.user_id },
        { onConflict: "session_id,tag", ignoreDuplicates: true }
      );
    }

    // Auto-create follow-up reminder if next_action suggests it
    const nextAction = (analysis.next_action || "").toLowerCase();
    if (
      (nextAction.includes("call again") || nextAction.includes("follow up") || nextAction.includes("follow-up")) &&
      session.lead_id && session.business_id
    ) {
      // Check for existing reminder
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 2);

      const { count: existingReminder } = await supabase
        .from("reminders")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", session.lead_id)
        .eq("assigned_to_user_id", session.user_id)
        .gte("due_at", new Date().toISOString().split("T")[0]);

      if ((existingReminder || 0) === 0) {
        await supabase.from("reminders").insert({
          business_id: session.business_id,
          entity_type: "lead",
          entity_id: session.lead_id,
          assigned_to_user_id: session.user_id,
          created_by_user_id: session.user_id,
          title: `AI Follow-up: ${session.phone_number}`,
          description: analysis.next_action,
          due_at: followUpDate.toISOString(),
          priority: analysis.priority || "medium",
        });
      }
    }

    return new Response(JSON.stringify({ status: "ok", analysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("AI analyze error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
