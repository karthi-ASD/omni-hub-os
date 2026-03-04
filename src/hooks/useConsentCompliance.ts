import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useConsentCompliance() {
  const { user, profile } = useAuth();
  const [consentRecords, setConsentRecords] = useState<any[]>([]);
  const [optOuts, setOptOuts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConsent = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("consent_records")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setConsentRecords(data ?? []);
    setLoading(false);
  }, [profile?.business_id]);

  const fetchOptOuts = useCallback(async () => {
    if (!profile?.business_id) return;
    const { data } = await supabase
      .from("opt_out_registry")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false });
    setOptOuts(data ?? []);
  }, [profile?.business_id]);

  useEffect(() => { fetchConsent(); fetchOptOuts(); }, [fetchConsent, fetchOptOuts]);

  const addConsent = async (values: { person_type: string; consent_type: string; phone?: string; email?: string; source?: string }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("consent_records").insert({
      ...values,
      business_id: profile.business_id,
      status: "GRANTED",
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Consent recorded");
    fetchConsent();
  };

  const revokeConsent = async (id: string) => {
    const { error } = await supabase.from("consent_records").update({ status: "REVOKED" } as any).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Consent revoked");
    fetchConsent();
  };

  const addOptOut = async (values: { channel: string; phone?: string; email?: string; reason?: string }) => {
    if (!profile?.business_id) return;
    const { error } = await supabase.from("opt_out_registry").insert({
      ...values,
      business_id: profile.business_id,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Opt-out registered");
    fetchOptOuts();
  };

  const removeOptOut = async (id: string) => {
    const { error } = await supabase.from("opt_out_registry").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Opt-out removed");
    fetchOptOuts();
  };

  const isOptedOut = useCallback((channel: string, contact: string) => {
    return optOuts.some(o =>
      o.channel === channel && (o.phone === contact || o.email === contact)
    );
  }, [optOuts]);

  return {
    consentRecords, optOuts, loading,
    addConsent, revokeConsent, addOptOut, removeOptOut, isOptedOut,
    refresh: () => { fetchConsent(); fetchOptOuts(); },
  };
}
