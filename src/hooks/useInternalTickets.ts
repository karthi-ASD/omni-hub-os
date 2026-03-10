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

export function useInternalTickets() {
  const { profile, isSuperAdmin, isBusinessAdmin } = useAuth();
  const bid = profile?.business_id;

  const [tickets, setTickets] = useState<InternalTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!bid) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("internal_tickets")
      .select("*")
      .eq("business_id", bid)
      .order("created_at", { ascending: false });
    if (!error) setTickets((data as any[]) || []);
    setLoading(false);
  }, [bid]);

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

  const createTicket = useCallback(async (data: { title: string; description?: string; department: string; priority: string }) => {
    if (!bid || !profile?.user_id) return;
    const { error } = await supabase.from("internal_tickets").insert({
      business_id: bid,
      created_by_user_id: profile.user_id,
      title: data.title,
      description: data.description || null,
      department: data.department,
      priority: data.priority,
    } as any);
    if (error) { toast.error("Failed to create ticket"); return; }
    toast.success("Internal ticket created");
    fetchTickets();
  }, [bid, profile?.user_id, fetchTickets]);

  const updateTicketStatus = useCallback(async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "resolved" || status === "closed") {
      updates.resolved_by_user_id = profile?.user_id;
      updates.resolved_at = new Date().toISOString();
    }
    await supabase.from("internal_tickets").update(updates).eq("id", id);
    toast.success(`Ticket marked as ${status.replace(/_/g, " ")}`);
    fetchTickets();
  }, [profile?.user_id, fetchTickets]);

  const assignTicket = useCallback(async (id: string, userId: string) => {
    await supabase.from("internal_tickets").update({ assigned_to_user_id: userId, status: "in_progress" } as any).eq("id", id);
    toast.success("Ticket assigned");
    fetchTickets();
  }, [fetchTickets]);

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
    toast.success("Comment added");
  }, [bid, profile]);

  const stats = {
    open: tickets.filter(t => t.status === "open").length,
    under_review: tickets.filter(t => t.status === "under_review").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
    total: tickets.length,
  };

  return {
    tickets, loading, stats, createTicket, updateTicketStatus,
    assignTicket, fetchComments, addComment, fetchTickets,
  };
}
