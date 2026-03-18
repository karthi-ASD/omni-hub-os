import { supabase } from "@/integrations/supabase/client";

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  support: ["support"],
  seo: ["seo"],
  accounts: ["accounts", "finance", "accounting"],
  development: ["development", "dev", "web"],
  sales: ["sales"],
  general: ["support", "general"],
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

function normalizeTicketDepartment(department?: string) {
  const normalized = (department || "support").trim().toLowerCase();

  if (["accounts", "finance", "accounting"].includes(normalized)) return "accounts";
  if (["development", "dev", "web"].includes(normalized)) return "development";
  if (normalized === "general") return "support";

  return normalized;
}

function scoreDepartmentAssignee(designation?: string | null) {
  const normalizedDesignation = (designation || "").toLowerCase();

  if (normalizedDesignation.includes("manager") || normalizedDesignation.includes("head") || normalizedDesignation.includes("lead")) {
    return 2;
  }

  if (normalizedDesignation.includes("specialist") || normalizedDesignation.includes("executive")) {
    return 1;
  }

  return 0;
}

async function resolveDepartmentAssignee(providerBusinessId: string, department: string) {
  const normalizedDepartment = normalizeTicketDepartment(department);
  const keywords = DEPARTMENT_KEYWORDS[normalizedDepartment] ?? [normalizedDepartment];

  const { data: departments, error: departmentsError } = await supabase
    .from("departments")
    .select("id, name")
    .eq("business_id", providerBusinessId);

  if (departmentsError) throw departmentsError;

  const matchedDepartment = departments?.find((item) => {
    const lowerName = item.name?.toLowerCase() || "";
    return keywords.some((keyword) => lowerName.includes(keyword));
  });

  if (!matchedDepartment?.id) {
    return null;
  }

  const { data: employees, error: employeesError } = await supabase
    .from("hr_employees")
    .select("user_id, email, designation")
    .eq("business_id", providerBusinessId)
    .eq("department_id", matchedDepartment.id)
    .not("user_id", "is", null);

  if (employeesError) throw employeesError;
  if (!employees?.length) return null;

  const candidateUserIds = [...employees]
    .sort((a, b) => scoreDepartmentAssignee(b.designation) - scoreDepartmentAssignee(a.designation))
    .map((employee) => employee.user_id)
    .filter(Boolean);

  if (!candidateUserIds.length) return null;

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, full_name, email")
    .in("user_id", candidateUserIds as string[]);

  if (profilesError) throw profilesError;

  const profilesByUserId = new Map((profiles || []).map((profile) => [profile.user_id, profile]));
  return candidateUserIds.map((userId) => profilesByUserId.get(userId)).find(Boolean) ?? null;
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
  const normalizedDepartment = normalizeTicketDepartment(department);

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

  const assignee = await resolveDepartmentAssignee(clientRecord.business_id, normalizedDepartment);
  const payload = {
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
  };

  console.log("[ClientTickets] Submitting ticket payload:", payload);

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