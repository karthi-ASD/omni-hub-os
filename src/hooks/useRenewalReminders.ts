import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RenewalReminder {
  id: string;
  business_id: string;
  client_id: string;
  contract_id: string | null;
  reminder_type: string;
  reminder_date: string;
  status: string;
  assigned_sales_rep_id: string | null;
  assigned_accounts_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RenewalWithClient extends RenewalReminder {
  client_name?: string;
  client_email?: string;
  contract_value?: number;
  service_category?: string;
}

export function useRenewalReminders() {
  const { profile } = useAuth();
  const [reminders, setReminders] = useState<RenewalWithClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("renewal_reminders")
      .select("*")
      .order("reminder_date", { ascending: true })
      .limit(500);

    if (data) {
      // Fetch client names for each reminder
      const clientIds = [...new Set((data as any[]).map((r) => r.client_id))];
      const { data: clients } = await supabase
        .from("clients")
        .select("id, contact_name, email, contract_value, service_category")
        .in("id", clientIds);

      const clientMap = new Map(
        (clients as any[] || []).map((c) => [c.id, c])
      );

      const enriched: RenewalWithClient[] = (data as any[]).map((r) => {
        const client = clientMap.get(r.client_id);
        return {
          ...r,
          client_name: client?.contact_name || "Unknown",
          client_email: client?.email,
          contract_value: client?.contract_value,
          service_category: client?.service_category,
        };
      });
      setReminders(enriched);
    } else {
      setReminders([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const createReminder = async (input: {
    client_id: string;
    reminder_type: string;
    reminder_date: string;
    assigned_sales_rep_id?: string;
    notes?: string;
  }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("renewal_reminders").insert({
      business_id: profile.business_id,
      client_id: input.client_id,
      reminder_type: input.reminder_type,
      reminder_date: input.reminder_date,
      assigned_sales_rep_id: input.assigned_sales_rep_id,
      assigned_accounts_user_id: profile.user_id,
      notes: input.notes,
    } as any);
    if (error) {
      toast.error("Failed to create reminder");
      return;
    }
    toast.success("Renewal reminder created");
    fetchReminders();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("renewal_reminders")
      .update({ status } as any)
      .eq("id", id);
    toast.success("Reminder updated");
    fetchReminders();
  };

  return { reminders, loading, createReminder, updateStatus, refetch: fetchReminders };
}
