import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SubCustomer {
  id: string;
  customer_id: string;
  business_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  created_at: string;
}

export const useSubCustomers = (customerId?: string) => {
  const { profile } = useAuth();
  const [subCustomers, setSubCustomers] = useState<SubCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile?.business_id || !customerId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("sub_customers" as any)
      .select("*")
      .eq("business_id", profile.business_id)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load sub-customers");
    setSubCustomers((data as any[]) || []);
    setLoading(false);
  }, [profile?.business_id, customerId]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (data: { name: string; email?: string; phone?: string; role?: string }) => {
    if (!profile?.business_id || !customerId) return;
    const { error } = await supabase.from("sub_customers" as any).insert({
      business_id: profile.business_id,
      customer_id: customerId,
      ...data,
    } as any);
    if (error) { toast.error("Failed to create sub-customer"); return; }
    toast.success("Sub-customer created");
    fetch();
  };

  const update = async (id: string, data: Partial<SubCustomer>) => {
    const { error } = await supabase.from("sub_customers" as any).update(data as any).eq("id", id);
    if (error) { toast.error("Update failed"); return; }
    toast.success("Updated");
    fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("sub_customers" as any).delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Sub-customer removed");
    fetch();
  };

  return { subCustomers, loading, create, update, remove, refetch: fetch };
};
