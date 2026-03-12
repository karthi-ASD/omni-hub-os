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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ticket_id, business_id, comment_text, reply_by } = await req.json();

    if (!ticket_id || !business_id) {
      return new Response(JSON.stringify({ error: "Missing ticket_id or business_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch ticket
    const { data: ticket } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticket_id)
      .eq("business_id", business_id)
      .single();

    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create notification for relevant users
    if (action === "ticket_created") {
      // Notify business admins
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("business_id", business_id)
        .in("role", ["business_admin", "super_admin"]);

      if (admins && admins.length > 0) {
        const notifications = admins.map((admin: any) => ({
          business_id,
          user_id: admin.user_id,
          type: "info" as const,
          title: `New Ticket: #${ticket.ticket_number || ticket_id.slice(0, 8)}`,
          message: `${ticket.sender_name || "A client"} created a ticket: "${ticket.subject}"`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Log system event
      await supabase.from("system_events").insert({
        business_id,
        event_type: "TICKET_CREATED_NOTIFICATION",
        payload_json: {
          ticket_id,
          ticket_number: ticket.ticket_number,
          subject: ticket.subject,
          sender_email: ticket.sender_email,
          short_message: `New support ticket: ${ticket.subject}`,
        },
      });

    } else if (action === "ticket_replied") {
      // Notify ticket creator or assigned agent
      const notifyUsers: string[] = [];

      if (ticket.assigned_to_user_id && ticket.assigned_to_user_id !== reply_by) {
        notifyUsers.push(ticket.assigned_to_user_id);
      }

      // Notify admins too
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("business_id", business_id)
        .in("role", ["business_admin"])
        .limit(5);

      if (admins) {
        admins.forEach((a: any) => {
          if (a.user_id !== reply_by && !notifyUsers.includes(a.user_id)) {
            notifyUsers.push(a.user_id);
          }
        });
      }

      if (notifyUsers.length > 0) {
        const notifications = notifyUsers.map(uid => ({
          business_id,
          user_id: uid,
          type: "info" as const,
          title: `Reply on Ticket #${ticket.ticket_number || ticket_id.slice(0, 8)}`,
          message: comment_text ? comment_text.slice(0, 120) + "..." : "A new reply was added.",
        }));

        await supabase.from("notifications").insert(notifications);
      }

      // Log event
      await supabase.from("system_events").insert({
        business_id,
        event_type: "TICKET_REPLY_NOTIFICATION",
        payload_json: {
          ticket_id,
          reply_by,
          short_message: `Reply on ticket: ${ticket.subject}`,
        },
      });

    } else if (action === "ticket_status_changed") {
      // Notify assigned user
      if (ticket.assigned_to_user_id) {
        await supabase.from("notifications").insert({
          business_id,
          user_id: ticket.assigned_to_user_id,
          type: "info",
          title: `Ticket #${ticket.ticket_number || ticket_id.slice(0, 8)} Updated`,
          message: `Status changed to: ${ticket.status}`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ticket-notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
