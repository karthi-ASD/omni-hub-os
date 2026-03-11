import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * WhatsApp Automation Trigger
 *
 * Sends automated WhatsApp messages for:
 * - lead_followup: Follow up with new leads
 * - demo_reminder: Remind about upcoming demos
 * - ticket_update: Notify customers about ticket status changes
 * - job_confirmation: Confirm job bookings
 *
 * POST body:
 * {
 *   automation_type: "lead_followup" | "demo_reminder" | "ticket_update" | "job_confirmation",
 *   entity_id: "uuid",  // lead_id, ticket_id, or job_id
 *   business_id: "uuid",
 *   custom_message?: "override message text"
 * }
 */

interface AutomationRequest {
  automation_type: string;
  entity_id: string;
  business_id: string;
  custom_message?: string;
}

const MESSAGE_TEMPLATES: Record<string, (ctx: Record<string, string>) => string> = {
  lead_followup: (ctx) =>
    `Hi ${ctx.name}! 👋\n\nThank you for your interest in ${ctx.service || "our services"}. We'd love to help you achieve your goals.\n\nWould you like to schedule a quick call to discuss your needs?\n\nRegards,\n${ctx.business_name || "The Team"}`,

  demo_reminder: (ctx) =>
    `Hi ${ctx.name}! 📅\n\nJust a friendly reminder about your upcoming demo${ctx.date ? ` on ${ctx.date}` : ""}.\n\nLooking forward to showing you what we can do!\n\nRegards,\n${ctx.business_name || "The Team"}`,

  ticket_update: (ctx) =>
    `Hi ${ctx.name}! 🔔\n\nUpdate on your support ticket #${ctx.ticket_number}:\n\nStatus: ${ctx.status}\n${ctx.message || ""}\n\nReply to this message if you need further assistance.\n\nRegards,\n${ctx.business_name || "Support Team"}`,

  job_confirmation: (ctx) =>
    `Hi ${ctx.name}! ✅\n\nYour booking has been confirmed${ctx.date ? ` for ${ctx.date}` : ""}.\n\n${ctx.details || ""}\n\nIf you need to make any changes, please reply to this message.\n\nRegards,\n${ctx.business_name || "The Team"}`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body: AutomationRequest = await req.json();

    if (!body.automation_type || !body.entity_id || !body.business_id) {
      return new Response(
        JSON.stringify({ error: "Missing automation_type, entity_id, or business_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business name
    const { data: biz } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", body.business_id)
      .single();

    const businessName = biz?.name || "";
    let phone = "";
    let name = "";
    let ctx: Record<string, string> = { business_name: businessName };
    let linkPayload: Record<string, string> = {};

    switch (body.automation_type) {
      case "lead_followup": {
        const { data: lead } = await supabase
          .from("leads")
          .select("name, phone, service_interest")
          .eq("id", body.entity_id)
          .single();
        if (!lead?.phone) {
          return new Response(JSON.stringify({ error: "Lead has no phone number" }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        phone = lead.phone;
        name = lead.name || "there";
        ctx = { ...ctx, name, service: lead.service_interest || "" };
        linkPayload = { lead_id: body.entity_id };
        break;
      }

      case "demo_reminder": {
        const { data: lead } = await supabase
          .from("leads")
          .select("name, phone")
          .eq("id", body.entity_id)
          .single();
        if (!lead?.phone) {
          return new Response(JSON.stringify({ error: "Lead has no phone number" }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Check calendar for upcoming demo
        const { data: event } = await supabase
          .from("calendar_events")
          .select("start_time")
          .eq("lead_id", body.entity_id)
          .gte("start_time", new Date().toISOString())
          .order("start_time", { ascending: true })
          .limit(1)
          .single();
        phone = lead.phone;
        name = lead.name || "there";
        ctx = { ...ctx, name, date: event?.start_time ? new Date(event.start_time).toLocaleDateString("en-AU") : "" };
        linkPayload = { lead_id: body.entity_id };
        break;
      }

      case "ticket_update": {
        const { data: ticket } = await supabase
          .from("support_tickets")
          .select("ticket_number, status, client_id, sender_email")
          .eq("id", body.entity_id)
          .single();
        if (!ticket) {
          return new Response(JSON.stringify({ error: "Ticket not found" }), {
            status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        // Get client phone
        if (ticket.client_id) {
          const { data: client } = await supabase
            .from("clients")
            .select("contact_name, phone")
            .eq("id", ticket.client_id)
            .single();
          phone = client?.phone || "";
          name = client?.contact_name || "there";
        }
        if (!phone) {
          return new Response(JSON.stringify({ error: "No phone number for ticket contact" }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ctx = { ...ctx, name, ticket_number: ticket.ticket_number, status: ticket.status };
        linkPayload = { ticket_id: body.entity_id };
        break;
      }

      case "job_confirmation": {
        const { data: project } = await supabase
          .from("projects")
          .select("name, client_id, start_date")
          .eq("id", body.entity_id)
          .single();
        if (!project?.client_id) {
          return new Response(JSON.stringify({ error: "Project/job not found or no client linked" }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: client } = await supabase
          .from("clients")
          .select("contact_name, phone")
          .eq("id", project.client_id)
          .single();
        phone = client?.phone || "";
        name = client?.contact_name || "there";
        if (!phone) {
          return new Response(JSON.stringify({ error: "Client has no phone number" }), {
            status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        ctx = {
          ...ctx,
          name,
          date: project.start_date ? new Date(project.start_date).toLocaleDateString("en-AU") : "",
          details: `Project: ${project.name}`,
        };
        linkPayload = { client_id: project.client_id, job_id: body.entity_id };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown automation type: ${body.automation_type}` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Build message
    const templateFn = MESSAGE_TEMPLATES[body.automation_type];
    const message = body.custom_message || (templateFn ? templateFn(ctx) : "Hello!");

    // Call whatsapp-send-message function internally
    const sendPayload = {
      to: phone,
      message,
      automation_type: body.automation_type,
      ...linkPayload,
    };

    const sendUrl = `${supabaseUrl}/functions/v1/whatsapp-send-message`;
    const sendRes = await fetch(sendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(sendPayload),
    });

    const sendData = await sendRes.json();

    return new Response(
      JSON.stringify({
        success: sendData.success,
        automation_type: body.automation_type,
        recipient: phone,
        message_preview: message.substring(0, 100),
        ...sendData,
      }),
      { status: sendRes.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("WhatsApp automation error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
