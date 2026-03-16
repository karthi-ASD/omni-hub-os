import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export interface FollowUp {
  id: string;
  business_id: string;
  lead_id: string | null;
  account_id: string | null;
  contact_id: string | null;
  opportunity_id: string | null;
  assigned_agent_id: string | null;
  created_by: string | null;
  subject: string | null;
  notes: string | null;
  followup_date: string;
  followup_time: string | null;
  followup_type: string | null;
  priority: string | null;
  status: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  lead_name?: string;
  lead_phone?: string;
  lead_email?: string;
  lead_business_name?: string;
  creator_name?: string;
}

export function useFollowUps() {
  const { profile, roles } = useAuth();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.some(r =>
    ["super_admin", "business_admin", "hr_manager", "manager"].includes(r)
  );

  const fetchFollowUps = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    let query = supabase
      .from("followups")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("followup_date", { ascending: true });

    // Scope to assigned agent if not admin
    if (!isAdmin && profile.user_id) {
      query = query.eq("assigned_agent_id", profile.user_id);
    }

    const { data, error } = await query.limit(500);
    if (error) {
      console.error("Follow-ups fetch error:", error);
      setLoading(false);
      return;
    }

    const rows = (data || []) as any[];

    // Enrich with lead info
    const leadIds = [...new Set(rows.map(r => r.lead_id).filter(Boolean))];
    const creatorIds = [...new Set(rows.map(r => r.created_by || r.assigned_agent_id).filter(Boolean))];

    const [leadRes, profileRes] = await Promise.all([
      leadIds.length > 0
        ? supabase.from("leads").select("id, name, phone, email, business_name").in("id", leadIds)
        : { data: [] },
      creatorIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", creatorIds)
        : { data: [] },
    ]);

    const leadMap: Record<string, any> = {};
    (leadRes.data || []).forEach((l: any) => { leadMap[l.id] = l; });

    const profileMap: Record<string, string> = {};
    (profileRes.data || []).forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

    const enriched: FollowUp[] = rows.map(r => ({
      ...r,
      lead_name: leadMap[r.lead_id]?.name || null,
      lead_phone: leadMap[r.lead_id]?.phone || null,
      lead_email: leadMap[r.lead_id]?.email || null,
      lead_business_name: leadMap[r.lead_id]?.business_name || null,
      creator_name: profileMap[r.created_by || r.assigned_agent_id] || "System",
    }));

    setFollowUps(enriched);
    setLoading(false);
  }, [profile?.business_id, profile?.user_id, isAdmin]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);
  useSalesDataAutoRefresh(fetchFollowUps, ["all", "follow-ups", "leads", "dashboard"]);

  const createFollowUp = async (input: {
    lead_id?: string | null;
    subject?: string;
    notes?: string;
    followup_date: string;
    followup_time?: string | null;
    followup_type?: string;
    priority?: string;
  }) => {
    if (!profile?.business_id) return null;

    const { data, error } = await supabase.from("followups").insert({
      business_id: profile.business_id,
      lead_id: input.lead_id || null,
      assigned_agent_id: profile.user_id,
      created_by: profile.user_id,
      subject: input.subject || null,
      notes: input.notes || null,
      followup_date: input.followup_date,
      followup_time: input.followup_time || null,
      followup_type: input.followup_type || "call",
      priority: input.priority || "medium",
      status: "pending",
    }).select().single();

    if (error) { toast.error("Failed to schedule follow-up"); return null; }
    toast.success("Follow-up scheduled");
    await fetchFollowUps();
    notifySalesDataChanged(["follow-ups", "leads", "dashboard"], "followup:create");
    return data;
  };

  const markCompleted = async (id: string) => {
    const { error } = await supabase.from("followups").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Follow-up completed");
    await fetchFollowUps();
    notifySalesDataChanged(["follow-ups", "dashboard"], "followup:complete");
  };

  const markSkipped = async (id: string) => {
    const { error } = await supabase.from("followups").update({
      status: "skipped",
    }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Follow-up skipped");
    await fetchFollowUps();
    notifySalesDataChanged(["follow-ups", "dashboard"], "followup:skip");
  };

  const reschedule = async (id: string, newDate: string, newTime?: string) => {
    const { error } = await supabase.from("followups").update({
      followup_date: newDate,
      followup_time: newTime || null,
      status: "pending",
    }).eq("id", id);
    if (error) { toast.error("Failed to reschedule"); return; }
    toast.success("Follow-up rescheduled");
    await fetchFollowUps();
    notifySalesDataChanged(["follow-ups", "dashboard"], "followup:reschedule");
  };

  return {
    followUps,
    loading,
    createFollowUp,
    markCompleted,
    markSkipped,
    reschedule,
    refetch: fetchFollowUps,
  };
}
