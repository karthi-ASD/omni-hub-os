import { supabase } from "@/integrations/supabase/client";

const DEPARTMENT_ASSIGNEE_EMAILS: Record<string, string> = {
  seo: "steve@nextweb.com.au",
  accounts: "finance@nextweb.co.in",
};

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

async function resolveDepartmentAssignee(providerBusinessId: string, department: string) {
  const assigneeEmail = DEPARTMENT_ASSIGNEE_EMAILS[department];
  if (!assigneeEmail) return null;

  const { data } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .eq("business_id", providerBusinessId)
    .eq("email", assigneeEmail)
    .maybeSingle();

  return data;
}

export async function createClientPortalTicket({
  clientId,
  requesterUserId,
  requesterName,
  requesterEmail,
  subject,
  description,
  department = "support",
  priority = "medium",
  category = "general",
}: CreateClientPortalTicketInput) {
  const normalizedDepartment = department.toLowerCase();

  const { data: clientRecord, error: clientError } = await supabase
    .from("clients")
    .select("id, business_id, contact_name")
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) throw clientError;
  if (!clientRecord?.business_id) {
    throw new Error("Client provider mapping not found");
  }

  const assignee = await resolveDepartmentAssignee(clientRecord.business_id, normalizedDepartment);

  const { data: inserted, error } = await supabase
    .from("support_tickets")
    .insert({
      business_id: clientRecord.business_id,
      client_id: clientId,
      created_by_user_id: requesterUserId,
      subject,
      description: description || null,
      category,
      priority,
      department: normalizedDepartment,
      source_type: "portal",
      channel: "portal",
      client_match_status: "matched",
      sender_name: requesterName || clientRecord.contact_name || null,
      sender_email: requesterEmail || null,
      assigned_to_user_id: assignee?.user_id ?? null,
    } as any)
    .select("*")
    .single();

  if (error) throw error;

  await Promise.allSettled([
    supabase.from("ticket_audit_log" as any).insert({
      business_id: clientRecord.business_id,
      ticket_id: inserted.id,
      user_id: requesterUserId,
      user_name: requesterName || requesterEmail || "Client",
      action_type: "ticket_created",
      details: `Created from client portal for ${normalizedDepartment}.`,
    } as any),
    assignee?.user_id
      ? supabase.from("notifications").insert({
          business_id: clientRecord.business_id,
          client_id: clientId,
          user_id: assignee.user_id,
          title: `New ${normalizedDepartment.toUpperCase()} ticket`,
          message: subject,
          type: "info",
        } as any)
      : Promise.resolve(null),
  ]);

  return inserted;
}
