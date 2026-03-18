import { supabase } from "@/integrations/supabase/client";

interface CreateClientPortalTicketInput {
  clientId: string;
  requesterUserId: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  subject: string;
  description?: string | null;
  department?: string;
  priority?: string;
  category?: string;
}

export async function createClientPortalTicket({
  clientId,
  requesterUserId,
  requesterName,
  requesterEmail,
  subject,
  description,
  priority = "medium",
  category = "general",
}: CreateClientPortalTicketInput) {
  // STABILIZATION: Force ALL tickets to "support" department
  const forcedDepartment = "support";

  const { data: clientRecord, error: clientError } = await supabase
    .from("clients")
    .select("id, business_id, contact_name")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!clientRecord?.business_id) {
    throw new Error("Client provider mapping not found");
  }

  console.log("[ClientTickets] Resolved clientId:", clientId);
  console.log("[ClientTickets] Resolved provider businessId:", clientRecord.business_id);
  console.log("[ClientTickets] Forced department:", forcedDepartment);

  const payload = {
    business_id: clientRecord.business_id,
    client_id: clientId,
    created_by_user_id: requesterUserId,
    subject,
    description: description || null,
    category,
    priority,
    department: forcedDepartment,
    source_type: "portal",
    channel: "portal",
    client_match_status: "matched",
    sender_name: requesterName || clientRecord.contact_name || null,
    sender_email: requesterEmail || null,
    assigned_to_user_id: null, // Unassigned — support team picks up
  };

  console.log("[ClientTickets] Final payload:", payload);

  const { data: inserted, error } = await supabase
    .from("support_tickets")
    .insert(payload as any)
    .select("*")
    .single();

  if (error) {
    console.error("[ClientTickets] Ticket creation failed:", error);
    throw error;
  }

  console.log("[Tickets] Inserted ticket:", inserted);

  await Promise.allSettled([
    supabase.from("ticket_audit_log" as any).insert({
      business_id: clientRecord.business_id,
      ticket_id: inserted.id,
      user_id: requesterUserId,
      user_name: requesterName || requesterEmail || "Client",
      action_type: "ticket_created",
      details: `Created from client portal. Department forced to support.`,
    } as any),
  ]);

  return inserted;
}
