import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface InternalTicket {
  id: string;
  ticket_number: string;
  title: string;
  description: string | null;
  department: string;
  assigned_to_department: string | null;
  source_department: string | null;
  source_type: string;
  priority: string;
  status: string;
  created_by_user_id: string;
  assigned_to_user_id: string | null;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  business_id: string;
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  created_at: string;
}

export interface TicketActivity {
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

export const DEPARTMENTS = [
  { key: "general", label: "General" },
  { key: "seo", label: "SEO" },
  { key: "development", label: "Development" },
  { key: "design", label: "Design" },
  { key: "content", label: "Content" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "HR" },
  { key: "sales", label: "Sales" },
  { key: "support", label: "Support" },
  { key: "accounts", label: "Accounts" },
];

export const TICKET_STATUSES = [
  { key: "open", label: "Open" },
  { key: "need_extra_time", label: "Need Extra Time" },
  { key: "closed", label: "Closed" },
];

export function useInternalTickets(departmentFilter?: string) {
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const bid = profile?.business_id;

  const [tickets, setTickets] = useState<InternalTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    let query = supabase
      .from("internal_tickets")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });

    // Department-scoped filtering: show tickets assigned TO this department
    // or created BY this department. Admins see all.
    if (departmentFilter && !isSuperAdmin && !isBusinessAdmin) {
      query = query.or(`assigned_to_department.eq.${departmentFilter},source_department.eq.${departmentFilter},department.eq.${departmentFilter}`);
    }

    const { data, error } = await query;
    if (!error) setTickets((data as any[]) || []);
    setLoading(false);
  }, [bid, departmentFilter, isSuperAdmin, isBusinessAdmin]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Realtime
  useEffect(() => {
    if (!bid) return;
    const ch = supabase
      .channel("internal-tickets-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "internal_tickets" }, (p) => {
        if ((p.new as any)?.business_id === bid) fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [bid, fetchTickets]);

  const logActivity = useCallback(async (ticketId: string, actionType: string, oldValue?: string, newValue?: string, details?: string) => {
    if (!bid || !profile?.user_id) return;
    await supabase.from("internal_ticket_activity").insert({
      ticket_id: ticketId,
      business_id: bid,
      user_id: profile.user_id,
      user_name: profile.full_name || profile.email,
      action_type: actionType,
      old_value: oldValue || null,
      new_value: newValue || null,
      details: details || null,
    } as any);
  }, [bid, profile]);

  const createTicket = useCallback(async (data: {
    title: string;
    description?: string;
    department: string;
    assigned_to_department: string;
    source_department?: string;
    priority: string;
    source_type?: string;
  }) => {
    if (!bid || !profile?.user_id) return;
    const { data: inserted, error } = await supabase.from("internal_tickets").insert({
      business_id: bid,
      created_by_user_id: profile.user_id,
      title: data.title,
      description: data.description || null,
      department: data.assigned_to_department,
      assigned_to_department: data.assigned_to_department,
      source_department: data.source_department || data.department || null,
      source_type: data.source_type || "internal",
      priority: data.priority,
      status: "open",
    } as any).select().single();
    if (error) { toast.error("Failed to create ticket"); return; }
    if (inserted) {
      await logActivity((inserted as any).id, "created", undefined, undefined,
        `Ticket created from ${data.source_department || "unknown"} → ${data.assigned_to_department}`);
    }
    toast.success("Internal ticket created");
    fetchTickets();
  }, [bid, profile?.user_id, fetchTickets, logActivity]);

  const updateTicketStatus = useCallback(async (id: string, status: string) => {
    // Find current ticket for logging
    const current = tickets.find(t => t.id === id);
    const updates: any = { status };
    if (status === "closed") {
      updates.resolved_by_user_id = profile?.user_id;
      updates.resolved_at = new Date().toISOString();
    }
    await supabase.from("internal_tickets").update(updates).eq("id", id);
    await logActivity(id, "status_changed", current?.status, status);
    toast.success(`Ticket marked as ${status.replace(/_/g, " ")}`);
    fetchTickets();
  }, [profile?.user_id, fetchTickets, logActivity, tickets]);

  const reassignDepartment = useCallback(async (id: string, newDept: string) => {
    const current = tickets.find(t => t.id === id);
    await supabase.from("internal_tickets").update({
      assigned_to_department: newDept,
      department: newDept,
    } as any).eq("id", id);
    await logActivity(id, "reassigned", current?.assigned_to_department || current?.department, newDept,
      `Reassigned from ${current?.assigned_to_department || current?.department} to ${newDept}`);
    toast.success(`Ticket reassigned to ${newDept}`);
    fetchTickets();
  }, [fetchTickets, logActivity, tickets]);

  const assignTicket = useCallback(async (id: string, userId: string) => {
    await supabase.from("internal_tickets").update({ assigned_to_user_id: userId, status: "open" } as any).eq("id", id);
    await logActivity(id, "assigned_user", undefined, userId);
    toast.success("Ticket assigned");
    fetchTickets();
  }, [fetchTickets, logActivity]);

  // Comments
  const fetchComments = useCallback(async (ticketId: string) => {
    if (!bid) return [];
    const { data } = await supabase
      .from("internal_ticket_comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    return (data as any[]) || [];
  }, [bid]);

  const addComment = useCallback(async (ticketId: string, content: string) => {
    if (!bid || !profile?.user_id) return;
    const { error } = await supabase.from("internal_ticket_comments").insert({
      ticket_id: ticketId,
      business_id: bid,
      user_id: profile.user_id,
      user_name: profile.full_name || profile.email,
      content,
    } as any);
    if (error) { toast.error("Failed to add comment"); return; }
    await logActivity(ticketId, "comment_added", undefined, undefined, content.slice(0, 100));
    toast.success("Comment added");
  }, [bid, profile, logActivity]);

  // Activity log
  const fetchActivity = useCallback(async (ticketId: string) => {
    if (!bid) return [];
    const { data } = await supabase
      .from("internal_ticket_activity")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    return (data as any[]) || [];
  }, [bid]);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    need_extra_time: tickets.filter(t => t.status === "need_extra_time").length,
    closed: tickets.filter(t => t.status === "closed").length,
    total: tickets.length,
  };

  return {
    tickets, loading, stats, createTicket, updateTicketStatus,
    assignTicket, reassignDepartment, fetchComments, addComment,
    fetchTickets, fetchActivity, logActivity,
  };
}
