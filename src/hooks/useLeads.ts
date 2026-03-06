import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadStage = Database["public"]["Enums"]["lead_stage"];
type LeadActivityType = Database["public"]["Enums"]["lead_activity_type"];
type LeadActivity = Database["public"]["Tables"]["lead_activities"]["Row"];

export function useLeads() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setLeads(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const createLead = async (lead: Omit<LeadInsert, "business_id">) => {
    if (!profile?.business_id) { toast.error("Select a tenant first"); return null; }
    const { data, error } = await supabase
      .from("leads")
      .insert({ ...lead, business_id: profile.business_id })
      .select()
      .single();
    if (error) { toast.error("Failed to create lead"); return null; }
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "LEAD_CREATED",
      payload_json: {
        entity_type: "lead", entity_id: data.id,
        actor_user_id: profile.user_id,
        short_message: `New lead: ${data.name}`,
      },
    });
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "CREATE_LEAD",
      entity_type: "lead",
      entity_id: data.id,
    });
    toast.success("Lead created");
    fetchLeads();
    return data;
  };

  const updateStage = async (id: string, stage: LeadStage) => {
    if (!profile) return;
    const updates: Record<string, unknown> = { stage };
    if (["contacted", "meeting_booked"].includes(stage)) {
      updates.last_contacted_at = new Date().toISOString();
    }
    const { error } = await supabase.from("leads").update(updates).eq("id", id);
    if (error) { toast.error("Failed to update stage"); return; }
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "LEAD_STAGE_CHANGED",
      payload_json: {
        entity_type: "lead", entity_id: id,
        actor_user_id: profile.user_id,
        short_message: `Lead stage changed to ${stage}`,
      },
    });
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "UPDATE_LEAD_STAGE",
      entity_type: "lead",
      entity_id: id,
      new_value_json: { stage },
    });
    toast.success("Stage updated");
    fetchLeads();
  };

  const assignLead = async (id: string, userId: string) => {
    if (!profile) return;
    const { error } = await supabase.from("leads").update({ assigned_to_user_id: userId }).eq("id", id);
    if (error) { toast.error("Failed to assign"); return; }
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "LEAD_ASSIGNED",
      payload_json: {
        entity_type: "lead", entity_id: id,
        actor_user_id: profile.user_id,
        assigned_to_user_id: userId,
        short_message: `Lead assigned`,
      },
    });
    toast.success("Lead assigned");
    fetchLeads();
  };

  const logActivity = async (leadId: string, type: LeadActivityType, summary: string, details?: Record<string, unknown>) => {
    if (!profile?.business_id) return;
    const row = {
      business_id: profile.business_id,
      lead_id: leadId,
      actor_user_id: profile.user_id,
      type,
      summary,
      details_json: (details || null) as Database["public"]["Tables"]["lead_activities"]["Insert"]["details_json"],
    };
    const { error } = await supabase.from("lead_activities").insert([row]);
    if (error) { toast.error("Failed to log activity"); return; }
    toast.success("Activity logged");
  };

  const getActivities = async (leadId: string): Promise<LeadActivity[]> => {
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    return data || [];
  };

  const archiveLead = async (id: string) => {
    if (!profile) return;
    await supabase.from("leads").update({ status: "archived" as Database["public"]["Enums"]["lead_status"] }).eq("id", id);
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "ARCHIVE_LEAD",
      entity_type: "lead",
      entity_id: id,
    });
    toast.success("Lead archived");
    fetchLeads();
  };

  const updateLead = async (id: string, updates: Record<string, unknown>) => {
    const { error } = await supabase.from("leads").update(updates).eq("id", id);
    if (error) { toast.error("Failed to update lead"); return; }
    toast.success("Lead updated");
    fetchLeads();
  };

  return { leads, loading, createLead, updateStage, assignLead, logActivity, getActivities, archiveLead, updateLead, refetch: fetchLeads };
}
