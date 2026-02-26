import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FundraisingRound {
  id: string;
  round_type: string;
  target_amount: number;
  valuation_target: number;
  status: string;
  opened_at: string;
}

export interface InvestorContact {
  id: string;
  round_id: string | null;
  firm_name: string;
  contact_name: string;
  email: string | null;
  stage: string;
  notes: string | null;
  probability: number;
  next_followup_date: string | null;
  created_at: string;
}

export function useFundraising() {
  const [rounds, setRounds] = useState<FundraisingRound[]>([]);
  const [contacts, setContacts] = useState<InvestorContact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("fundraising_rounds").select("*").order("opened_at", { ascending: false });
    setRounds((data as any) || []);
    setLoading(false);
  }, []);

  const fetchContacts = useCallback(async () => {
    const { data } = await supabase.from("investor_contacts").select("*").order("created_at", { ascending: false });
    setContacts((data as any) || []);
  }, []);

  useEffect(() => { fetchRounds(); fetchContacts(); }, [fetchRounds, fetchContacts]);

  const createRound = async (round: { round_type: string; target_amount: number; valuation_target: number }) => {
    const { error } = await supabase.from("fundraising_rounds").insert(round as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Round created");
    fetchRounds();
    return true;
  };

  const createContact = async (contact: { firm_name: string; contact_name: string; email?: string; round_id?: string; probability?: number }) => {
    const { error } = await supabase.from("investor_contacts").insert(contact as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Contact added");
    fetchContacts();
    return true;
  };

  const updateContactStage = async (id: string, stage: string) => {
    const { error } = await supabase.from("investor_contacts").update({ stage } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchContacts();
  };

  return { rounds, contacts, loading, createRound, createContact, updateContactStage, refetch: fetchRounds };
}
