import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, session_id, business_id, history, sender_email, sender_name } = await req.json();

    if (!message || !business_id || !session_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);

    // --- 1. Search KB articles for relevant content ---
    const keywords = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    let kbContext = "";

    if (keywords.length > 0) {
      const { data: articles } = await supabase
        .from("kb_articles")
        .select("title, content, category, tags")
        .eq("business_id", business_id)
        .eq("status", "published")
        .limit(10);

      if (articles && articles.length > 0) {
        // Simple keyword matching to find relevant articles
        const scored = articles.map((a: any) => {
          const text = `${a.title} ${a.content} ${a.category} ${(a.tags || []).join(" ")}`.toLowerCase();
          const score = keywords.reduce((s: number, kw: string) => s + (text.includes(kw) ? 1 : 0), 0);
          return { ...a, score };
        }).filter((a: any) => a.score > 0).sort((a: any, b: any) => b.score - a.score).slice(0, 3);

        if (scored.length > 0) {
          kbContext = "\n\nRelevant knowledge base articles:\n" +
            scored.map((a: any) => `### ${a.title}\n${(a.content || "").substring(0, 800)}`).join("\n\n");
        }
      }
    }

    // --- 2. Check for ticket status lookup ---
    let ticketContext = "";
    const ticketMatch = message.match(/ticket\s*#?\s*(\d+)/i) ||
      message.match(/status.*?(\w{8}-\w{4})/i) ||
      message.match(/check.*?ticket/i);

    if (ticketMatch && sender_email) {
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, status, priority, created_at, updated_at")
        .eq("business_id", business_id)
        .eq("sender_email", sender_email)
        .order("created_at", { ascending: false })
        .limit(5);

      if (tickets && tickets.length > 0) {
        ticketContext = "\n\nCustomer's recent tickets:\n" +
          tickets.map((t: any) =>
            `- #${t.ticket_number || t.id.slice(0, 8)}: "${t.subject}" — Status: ${t.status}, Priority: ${t.priority}, Last updated: ${t.updated_at}`
          ).join("\n");
      }
    } else if (ticketMatch) {
      ticketContext = "\n\nNote: To look up ticket status, the customer needs to provide their email address.";
    }

    // --- 3. Log user message ---
    await supabase.from("ai_chat_logs").insert({
      business_id,
      session_id,
      sender_email: sender_email || null,
      sender_name: sender_name || null,
      role: "user",
      message,
    });

    // --- 4. Build AI prompt and call Lovable AI ---
    const systemPrompt = `You are a helpful customer support AI assistant. You help customers by:
1. Answering questions using the knowledge base articles provided below.
2. Looking up ticket statuses when customers ask.
3. Directing customers to the appropriate support channels when you can't help.

Guidelines:
- Be friendly, professional, and concise.
- If the knowledge base has relevant info, use it to answer. Cite the article title.
- If asked about a ticket, use the ticket data provided. Never fabricate ticket info.
- If you can't answer, suggest the customer email support or call the support team.
- Never make up information. Say "I don't have that information" if unsure.
- Format responses with markdown for readability.
${kbContext}${ticketContext}`;

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-10).map((h: any) => ({ role: h.role, content: h.message })),
      { role: "user", content: message },
    ];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 5. Stream response back, and log the full response after ---
    // We'll collect the full response to log it
    const reader = aiResponse.body!.getReader();
    const decoder = new TextDecoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));

            // Extract content from SSE for logging
            for (const line of chunk.split("\n")) {
              if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
              try {
                const parsed = JSON.parse(line.slice(6));
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) fullResponse += content;
              } catch { /* partial chunk */ }
            }
          }
          controller.close();

          // Log assistant response
          await supabase.from("ai_chat_logs").insert({
            business_id,
            session_id,
            role: "assistant",
            message: fullResponse,
            metadata_json: { kb_used: kbContext.length > 0, ticket_lookup: ticketContext.length > 0 },
          });
        } catch (e) {
          console.error("Stream error:", e);
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chatbot error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
