import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_ANALYSIS = {
  summary: "Analysis unavailable",
  sentiment: "neutral",
  score: 50,
  next_action: "Review manually",
  priority: "medium",
  auto_tag: null,
};

async function callAIWithRetry(
  apiKey: string,
  userInput: string,
  maxRetries = 1,
  delayMs = 2000,
): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are a sales analyst. Analyze this call and return structured JSON only. No markdown, no explanation.",
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
        console.error(`AI gateway error (attempt ${attempt + 1}):`, aiResponse.status, errText);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        return null;
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

      if (toolCall?.function?.arguments) {
        return typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      }

      // Fallback: try parsing content
      const content = aiData.choices?.[0]?.message?.content || "{}";
      try {
        return JSON.parse(content);
      } catch {
        console.warn("AI returned unparseable content:", content);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        return null;
      }
    } catch (err) {
      console.error(`AI call exception (attempt ${attempt + 1}):`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      return null;
    }
  }
  return null;
}

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

    // Fetch transcript if available
    const { data: transcriptData } = await supabase
      .from("dialer_call_transcripts")
      .select("full_transcript")
      .eq("session_id", session_id)
      .maybeSingle();

    const transcriptText = (transcriptData as any)?.full_transcript || "";

    // Build AI prompt — uses transcript when available for much better analysis
    const userInput = JSON.stringify({
      transcript: transcriptText || "No transcript available",
      notes: session.notes || latestDisp?.notes || "No notes provided",
      duration: session.call_duration || 0,
      disposition: session.disposition || latestDisp?.disposition_type || "unknown",
      phone_number: session.phone_number,
    });

    // Call AI with retry (1 retry after 2s)
    let analysis = await callAIWithRetry(LOVABLE_API_KEY, userInput);

    // Fallback if AI completely failed
    if (!analysis) {
      console.warn(`[dialer-ai-analyze] AI failed for session ${session_id}, using default analysis`);
      analysis = { ...DEFAULT_ANALYSIS };

      // Log to system_logs
      try {
        await supabase.from("system_logs").insert({
          type: "DIALER_AI_FAILURE",
          message: `AI analysis failed for dialer session ${session_id} after retries`,
          metadata: { session_id, phone_number: session.phone_number },
          business_id: session.business_id,
        });
      } catch (_) {}
    }

    // Clamp score to 0-100
    analysis.score = Math.max(0, Math.min(100, Number(analysis.score) || 50));

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

    // ── CRITICAL: Update crm_call_communications with AI results ──
    const { data: crmComm } = await supabase
      .from("crm_call_communications")
      .select("id")
      .eq("dialer_session_id", session_id)
      .maybeSingle();

    if (crmComm?.id) {
      const crmAiUpdates: Record<string, any> = {
        ai_synopsis_internal: analysis.summary,
        ai_synopsis_customer_safe: `Call quality: ${analysis.sentiment}. ${analysis.next_action}`,
        ai_score: analysis.score,
        sentiment: analysis.sentiment,
        processing_status: "completed",
        transcript_status: "completed",
        customer_visibility_level: "summary_only",
        visible_to_customer: true,
        customer_safe_summary: `Call quality: ${analysis.sentiment}. ${analysis.next_action}`,
      };
      if (analysis.auto_tag) {
        crmAiUpdates.auto_tags = [analysis.auto_tag];
      }

      const { error: crmErr } = await supabase
        .from("crm_call_communications")
        .update(crmAiUpdates)
        .eq("id", crmComm.id);

      if (crmErr) {
        console.error("CRM_AI_UPDATE_FAILED", { communication_id: crmComm.id, error: crmErr });
      } else {
        console.log("AI_SUMMARY_COMPLETED", {
          communication_id: crmComm.id,
          session_id,
          sentiment: analysis.sentiment,
          score: analysis.score,
        });
      }
    } else {
      console.warn("CRM_COMM_NOT_FOUND_FOR_AI", { session_id });
    }

    // Update lead priority_score if lead_id exists
    if (session.lead_id) {
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

    // Auto-tag if suggested (upsert prevents duplicates)
    if (analysis.auto_tag && session.user_id) {
      await supabase.from("dialer_call_tags").upsert(
        { session_id, tag: analysis.auto_tag, created_by: session.user_id },
        { onConflict: "session_id,tag", ignoreDuplicates: true }
      );
    }

    // Auto-create follow-up reminder if next_action suggests it (duplicate-safe)
    const nextAction = (analysis.next_action || "").toLowerCase();
    if (
      (nextAction.includes("call again") || nextAction.includes("follow up") || nextAction.includes("follow-up")) &&
      session.lead_id && session.business_id
    ) {
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

    // Log critical errors to system_logs
    try {
      const supabaseUrl2 = Deno.env.get("SUPABASE_URL")!;
      const serviceKey2 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sb2 = createClient(supabaseUrl2, serviceKey2);
      await sb2.from("system_logs").insert({
        type: "DIALER_AI_CRASH",
        message: String(err),
        metadata: { stack: err instanceof Error ? err.stack : null },
      });
    } catch (_) {}

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
