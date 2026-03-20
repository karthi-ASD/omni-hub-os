import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logActivity as logAI } from "@/lib/activity-logger";

export interface UnifiedTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  channel: string | null;
  department: string | null;
  sender_email: string | null;
  sender_name: string | null;
  source_type: string;
  client_match_status: string;
  client_id: string | null;
  assigned_to_user_id: string | null;
  created_by_user_id: string;
  auto_reply_sent: boolean;
  linked_by_user_id: string | null;
  linked_at: string | null;
  suggested_client_ids: string[] | null;
  ai_summary: string | null;
  ai_tags: string[] | null;
  sentiment: string | null;
  sla_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  escalated_at: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_company?: string;
  assigned_to_name?: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: string;
  sender_user_id: string | null;
  sender_name: string | null;
  sender_email: string | null;
  content: string;
  content_html: string | null;
  is_internal: boolean;
  created_at: string;
}

export interface TicketAuditEntry {
  id: string;
  ticket_id: string;
  user_id: string | null;
  user_name: string | null;
  action_type: string;
  old_value: string | null;
  new_value: string | null;
  details: string | null;
  created_at: string;
}

const TICKET_STATUSES = [
  "open", "assigned", "in_progress", "waiting_for_client",
  "pending_client_mapping", "escalated", "resolved", "closed",
];

// STABILIZATION: All tickets go to support — no department filtering needed
export function useUnifiedTickets(_departmentFilter?: string) {
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const bid = profile?.business_id;
  const [tickets, setTickets] = useState<UnifiedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!bid) return;
    setLoading(true);

    // STABILIZATION: Fetch ALL tickets, no department filter
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[Tickets] Fetch error:", error);
    } else {
      console.log("[AdminTickets] Fetched tickets:", data?.length || 0, "for business:", bid);
      setTickets((data as any[]) || []);
    }
    setLoading(false);
  }, [bid]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (!bid) return;
    const ch = supabase
      .channel("unified-tickets-rt")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_tickets",
      }, (p) => {
        if ((p.new as any)?.business_id === bid) fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bid, fetchTickets]);

  const now = new Date();
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress" || t.status === "assigned").length,
    unmatched: tickets.filter(t => t.client_match_status === "unmatched" || t.client_match_status === "suggested").length,
    escalated: tickets.filter(t => t.status === "escalated").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    closed: tickets.filter(t => t.status === "closed").length,
    sla_breached: tickets.filter(t =>
      t.sla_due_at && new Date(t.sla_due_at) < now &&
      !["resolved", "closed"].includes(t.status)
    ).length,
    unassigned: tickets.filter(t => !t.assigned_to_user_id && !["resolved", "closed"].includes(t.status)).length,
  };

  const createTicket = useCallback(async (data: {
    subject: string;
    description?: string;
    category?: string;
    priority?: string;
    department?: string;
    sender_email?: string;
    sender_name?: string;
    client_id?: string;
    source_type?: string;
  }) => {
    if (!bid || !profile?.user_id) return null;

    // STABILIZATION: Force department to support
    const forcedDepartment = "support";
    console.log("[Tickets] Forced department:", forcedDepartment);

    let effectiveBusinessId = bid;
    let effectiveClientId = data.client_id || null;

    const { data: clientLink } = await supabase
      .from("client_users")
      .select("client_id")
      .eq("user_id", profile.user_id)
      .eq("is_primary", true)
      .maybeSingle();

    if (clientLink?.client_id) {
      const { data: clientRecord } = await supabase
        .from("clients")
        .select("business_id")
        .eq("id", clientLink.client_id)
        .maybeSingle();
      if (clientRecord?.business_id) {
        effectiveBusinessId = clientRecord.business_id;
        effectiveClientId = effectiveClientId || clientLink.client_id;
      }
    }

    // Duplicate prevention
    const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data: dupes } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("business_id", effectiveBusinessId)
      .eq("subject", data.subject)
      .gte("created_at", twoMinAgo)
      .limit(1);
    if (dupes && dupes.length > 0) {
      toast.error("Duplicate ticket detected — same subject within 2 minutes");
      return null;
    }

    const payload = {
      business_id: effectiveBusinessId,
      created_by_user_id: profile.user_id,
      subject: data.subject,
      description: data.description || null,
      category: data.category || "general",
      priority: data.priority || "medium",
      department: forcedDepartment,
      sender_email: data.sender_email || null,
      sender_name: data.sender_name || null,
      client_id: effectiveClientId,
      source_type: data.source_type || "manual",
      client_match_status: effectiveClientId ? "matched" : "unmatched",
      channel: "portal",
      status: "open",
      assigned_to_user_id: null,
    };
    console.log("[Tickets] Final payload:", payload);

    const { data: inserted, error } = await supabase
      .from("support_tickets")
      .insert(payload as any)
      .select()
      .single();
    if (error) { toast.error("Failed to create ticket"); return null; }

    const ticket = inserted as any;
    console.log("[Tickets] Created:", ticket.ticket_number, ticket.id);

    await supabase.from("ticket_audit_log").insert({
      business_id: bid,
      ticket_id: ticket.id,
      user_id: profile.user_id,
      user_name: profile.full_name || profile.email,
      action_type: "ticket_created",
      details: `Created. Department forced to support.`,
    } as any);

    try {
      await supabase.functions.invoke("ticket-auto-reply", {
        body: {
          ticket_id: ticket.id,
          ticket_number: ticket.ticket_number,
          recipient_email: data.sender_email,
          recipient_name: data.sender_name,
          channel: data.source_type || "manual",
          business_id: bid,
          client_id: data.client_id,
        },
      });
    } catch { /* non-critical */ }

    toast.success("Ticket created");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: bid, module: "tickets", actionType: "create", entityType: "ticket", entityId: ticket.id, description: `Created ticket: ${ticket.ticket_number} - ${data.subject}` });
    fetchTickets();
    return inserted;
  }, [bid, profile, fetchTickets]);

  const updateStatus = useCallback(async (id: string, newStatus: string) => {
    const current = tickets.find(t => t.id === id);
    const updates: any = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === "resolved") updates.resolved_at = new Date().toISOString();
    if (newStatus === "closed") updates.closed_at = new Date().toISOString();
    if (newStatus === "escalated") updates.escalated_at = new Date().toISOString();

    await supabase.from("support_tickets").update(updates).eq("id", id);
    await supabase.from("ticket_audit_log").insert({
      business_id: bid, ticket_id: id,
      user_id: profile?.user_id, user_name: profile?.full_name || profile?.email,
      action_type: "status_changed", old_value: current?.status, new_value: newStatus,
    } as any);
    toast.success(`Status → ${newStatus.replace(/_/g, " ")}`);
    logAI({ userId: profile?.user_id || "", userRole: "staff", businessId: bid, module: "tickets", actionType: "update", entityType: "ticket", entityId: id, description: `Ticket status: ${current?.status} → ${newStatus}` });
    fetchTickets();
  }, [bid, profile, tickets, fetchTickets]);

  const assignTicket = useCallback(async (id: string, userId: string, userName?: string) => {
    await supabase.from("support_tickets").update({
      assigned_to_user_id: userId, status: "assigned", updated_at: new Date().toISOString(),
    }).eq("id", id);
    await supabase.from("ticket_audit_log").insert({
      business_id: bid, ticket_id: id,
      user_id: profile?.user_id, user_name: profile?.full_name || profile?.email,
      action_type: "assigned", new_value: userName || userId,
    } as any);
    toast.success("Ticket assigned");
    fetchTickets();
  }, [bid, profile, fetchTickets]);

  const linkToClient = useCallback(async (ticketId: string, clientId: string, saveAlternateEmail?: boolean) => {
    const ticket = tickets.find(t => t.id === ticketId);
    await supabase.from("support_tickets").update({
      client_id: clientId, client_match_status: "matched",
      linked_by_user_id: profile?.user_id, linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any).eq("id", ticketId);

    if (saveAlternateEmail && ticket?.sender_email && bid) {
      await supabase.from("client_alternate_emails" as any).insert({
        business_id: bid, client_id: clientId, email: ticket.sender_email,
        label: "alternate", added_by_user_id: profile?.user_id,
      }).then(({ error }) => {
        if (error && !error.message.includes("duplicate")) console.warn("Could not save alternate email:", error);
      });
    }

    await supabase.from("ticket_audit_log").insert({
      business_id: bid, ticket_id: ticketId,
      user_id: profile?.user_id, user_name: profile?.full_name || profile?.email,
      action_type: "client_linked", new_value: clientId,
      details: saveAlternateEmail ? `Alternate email saved: ${ticket?.sender_email}` : undefined,
    } as any);
    toast.success("Ticket linked to client");
    fetchTickets();
  }, [bid, profile, tickets, fetchTickets]);

  const changeDepartment = useCallback(async (id: string, dept: string) => {
    const current = tickets.find(t => t.id === id);
    await supabase.from("support_tickets").update({
      department: dept, updated_at: new Date().toISOString(),
    }).eq("id", id);
    await supabase.from("ticket_audit_log").insert({
      business_id: bid, ticket_id: id,
      user_id: profile?.user_id, user_name: profile?.full_name || profile?.email,
      action_type: "department_changed", old_value: current?.department, new_value: dept,
    } as any);
    toast.success(`Routed to ${dept}`);
    fetchTickets();
  }, [bid, profile, tickets, fetchTickets]);

  const changePriority = useCallback(async (id: string, priority: string) => {
    const current = tickets.find(t => t.id === id);
    await supabase.from("support_tickets").update({
      priority, updated_at: new Date().toISOString(),
    }).eq("id", id);
    await supabase.from("ticket_audit_log").insert({
      business_id: bid, ticket_id: id,
      user_id: profile?.user_id, user_name: profile?.full_name || profile?.email,
      action_type: "priority_changed", old_value: current?.priority, new_value: priority,
    } as any);
    toast.success(`Priority → ${priority}`);
    fetchTickets();
  }, [bid, profile, tickets, fetchTickets]);

  const fetchMessages = useCallback(async (ticketId: string): Promise<TicketMessage[]> => {
    const { data } = await supabase
      .from("ticket_messages").select("*")
      .eq("ticket_id", ticketId).order("created_at", { ascending: true });
    return (data as any[]) || [];
  }, []);

  const addMessage = useCallback(async (ticketId: string, content: string, isInternal: boolean) => {
    if (!bid || !profile?.user_id) return;
    await supabase.from("ticket_messages").insert({
      business_id: bid, ticket_id: ticketId, sender_type: "agent",
      sender_user_id: profile.user_id, sender_name: profile.full_name || profile.email,
      content, is_internal: isInternal,
    });

    if (!isInternal) {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket && !ticket.first_response_at) {
        await supabase.from("support_tickets").update({
          first_response_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }).eq("id", ticketId);
      }
    }

    await supabase.from("ticket_audit_log").insert({
      business_id: bid, ticket_id: ticketId,
      user_id: profile.user_id, user_name: profile.full_name || profile.email,
      action_type: isInternal ? "internal_note" : "reply_sent", details: content.slice(0, 200),
    } as any);
    toast.success(isInternal ? "Internal note added" : "Reply sent");
  }, [bid, profile, tickets]);

  const fetchAuditLog = useCallback(async (ticketId: string): Promise<TicketAuditEntry[]> => {
    const { data } = await supabase
      .from("ticket_audit_log").select("*")
      .eq("ticket_id", ticketId).order("created_at", { ascending: true });
    return (data as any[]) || [];
  }, []);

  return {
    tickets, loading, stats, TICKET_STATUSES,
    fetchTickets, createTicket, updateStatus,
    assignTicket, linkToClient, changeDepartment, changePriority,
    fetchMessages, addMessage, fetchAuditLog,
  };
}
