import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface LeadNote {
  id: string;
  lead_id: string;
  business_id: string;
  salesperson_id: string | null;
  user_id: string | null;
  note_content: string | null;
  note_type: string | null;
  contact_method: string;
  next_followup_date: string | null;
  is_archived: boolean;
  created_at: string;
  // joined
  salesperson_name?: string;
}

export function useLeadNotes(leadId: string | undefined) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", leadId)
      .eq("is_archived", false)
      .order("created_at", { ascending: false });

    if (!error) {
      // Fetch salesperson names
      const userIds = [...new Set((data || []).map((n: any) => n.salesperson_id || n.user_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      }
      setNotes((data || []).map((n: any) => ({
        ...n,
        salesperson_name: nameMap[n.salesperson_id || n.user_id] || "Unknown",
      })));
    }
    setLoading(false);
  }, [leadId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (input: {
    note_text: string;
    contact_method: string;
    next_followup_date?: string | null;
  }) => {
    if (!leadId || !profile?.business_id) return;
    const { error } = await supabase.from("lead_notes").insert({
      lead_id: leadId,
      business_id: profile.business_id,
      salesperson_id: profile.user_id,
      user_id: profile.user_id,
      note_content: input.note_text,
      note_type: input.contact_method,
      contact_method: input.contact_method,
      next_followup_date: input.next_followup_date || null,
      internal_only: true,
    } as any);
    if (error) { toast.error("Failed to add note"); return; }

    // Also create a followup record if a follow-up date was set
    if (input.next_followup_date) {
      await supabase.from("followups").insert({
        business_id: profile.business_id,
        lead_id: leadId,
        assigned_agent_id: profile.user_id,
        created_by: profile.user_id,
        followup_date: input.next_followup_date,
        followup_type: input.contact_method,
        subject: `Follow up: ${input.note_text.substring(0, 80)}`,
        notes: input.note_text,
        status: "pending",
        priority: "medium",
      });
    }

    toast.success("Note added");
    fetchNotes();
  };

  return { notes, loading, addNote, refetch: fetchNotes };
}
