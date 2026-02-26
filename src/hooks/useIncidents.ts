import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Incident {
  id: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  started_at: string;
  resolved_at: string | null;
  owner_user_id: string | null;
  created_at: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  message: string;
  created_at: string;
  created_by: string | null;
}

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("incidents").select("*").order("created_at", { ascending: false });
    setIncidents((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (incident: { severity: string; title: string; description?: string }) => {
    const { error } = await supabase.from("incidents").insert(incident as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Incident created");
    fetch();
    return true;
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "RESOLVED") updates.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("incidents").update(updates).eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetch();
  };

  const addUpdate = async (incident_id: string, message: string) => {
    const { error } = await supabase.from("incident_updates").insert({ incident_id, message } as any);
    if (error) { toast.error(error.message); return false; }
    toast.success("Update added");
    return true;
  };

  const getUpdates = async (incident_id: string): Promise<IncidentUpdate[]> => {
    const { data } = await supabase.from("incident_updates").select("*").eq("incident_id", incident_id).order("created_at", { ascending: true });
    return (data as any) || [];
  };

  return { incidents, loading, create, updateStatus, addUpdate, getUpdates, refetch: fetch };
}
