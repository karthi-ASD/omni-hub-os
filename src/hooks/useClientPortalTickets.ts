import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { createClientPortalTicket } from "@/lib/client-ticket-utils";

export interface ClientPortalTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  department: string | null;
  priority: string;
  status: string;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientPortalTickets() {
  const { clientId, user, profile } = useAuth();
  const [tickets, setTickets] = useState<ClientPortalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!clientId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: clientRecord } = await supabase
      .from("clients")
      .select("business_id")
      .eq("id", clientId)
      .maybeSingle();

    if (!clientRecord?.business_id) {
      console.warn("[ClientTickets] No business_id for client:", clientId);
      setTickets([]);
      setLoading(false);
      return;
    }

    // CRITICAL: Use client_id (profile/client record id), NOT auth.user.id
    const { data, error } = await supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, description, department, priority, status, sla_due_at, created_at, updated_at")
      .eq("business_id", clientRecord.business_id)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[ClientTickets] Fetch error:", error);
    } else {
      console.log("[ClientTickets] Fetched:", data?.length, "tickets for client:", clientId);
    }

    setTickets((data as ClientPortalTicket[]) ?? []);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  // Realtime for client tickets
  useEffect(() => {
    if (!clientId) return;
    const ch = supabase
      .channel("client-tickets-rt")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "support_tickets",
      }, () => {
        fetchTickets();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [clientId, fetchTickets]);

  const submitTicket = useCallback(async (input: {
    subject: string;
    description?: string;
    department?: string;
    priority?: string;
    category?: string;
  }) => {
    if (!clientId || !user?.id) return null;

    // Duplicate prevention: same subject within 2 minutes
    const recentDupe = tickets.find(t =>
      t.subject === input.subject &&
      (Date.now() - new Date(t.created_at).getTime()) < 2 * 60 * 1000
    );
    if (recentDupe) {
      throw new Error("Duplicate ticket detected — please wait before resubmitting");
    }

    console.log("[ClientTickets] Submitting ticket:", { clientId, subject: input.subject, department: input.department });

    setSubmitting(true);
    try {
      const inserted = await createClientPortalTicket({
        clientId,
        requesterUserId: user.id,
        requesterName: profile?.full_name,
        requesterEmail: profile?.email,
        subject: input.subject,
        description: input.description,
        department: input.department,
        priority: input.priority,
        category: input.category,
      });
      console.log("[ClientTickets] Ticket created:", inserted);
      await fetchTickets();
      return inserted;
    } finally {
      setSubmitting(false);
    }
  }, [clientId, user?.id, profile?.full_name, profile?.email, fetchTickets, tickets]);

  return {
    tickets,
    loading,
    submitting,
    fetchTickets,
    submitTicket,
  };
}
