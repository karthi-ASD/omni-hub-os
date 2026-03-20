import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";
import { logActivity as logAI } from "@/lib/activity-logger";

export type DealStage = "new" | "contacted" | "meeting_booked" | "needs_analysis" | "proposal_requested" | "negotiation" | "won" | "lost";
export type DealStatus = "open" | "won" | "lost" | "archived";

export interface Deal {
  id: string;
  business_id: string;
  deal_name: string;
  lead_id: string | null;
  inquiry_id: string | null;
  contact_name: string;
  business_name: string | null;
  email: string;
  phone: string | null;
  service_interest: string | null;
  estimated_value: number | null;
  currency: string;
  expected_close_date: string | null;
  owner_user_id: string | null;
  stage: DealStage;
  status: DealStatus;
  lost_reason: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface DealNote {
  id: string;
  deal_id: string;
  author_user_id: string;
  note: string;
  created_at: string;
}

export interface DealStageHistoryEntry {
  id: string;
  deal_id: string;
  from_stage: DealStage | null;
  to_stage: DealStage;
  changed_by_user_id: string;
  notes: string | null;
  created_at: string;
}

export const DEAL_STAGES: DealStage[] = [
  "new",
  "contacted",
  "meeting_booked",
  "needs_analysis",
  "proposal_requested",
  "negotiation",
  "won",
  "lost",
];

export const STAGE_LABELS: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  meeting_booked: "Meeting Booked",
  needs_analysis: "Needs Analysis",
  proposal_requested: "Proposal Requested",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

export function useDeals() {
  const { profile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);
    const { data } = await supabase
      .from("deals")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(500);
    setDeals((data as Deal[]) || []);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  useSalesDataAutoRefresh(fetchDeals, ["all", "deals", "dashboard", "pipeline", "proposals"]);

  const createDeal = async (deal: Partial<Deal>) => {
    if (!profile?.business_id) {
      toast.error("Select a tenant first");
      return null;
    }

    const { data, error } = await supabase
      .from("deals")
      .insert({
        business_id: profile.business_id,
        deal_name: deal.deal_name!,
        contact_name: deal.contact_name!,
        email: deal.email!,
        phone: deal.phone,
        business_name: deal.business_name,
        service_interest: deal.service_interest,
        estimated_value: deal.estimated_value,
        expected_close_date: deal.expected_close_date,
        owner_user_id: deal.owner_user_id || profile.user_id,
        lead_id: deal.lead_id,
        inquiry_id: deal.inquiry_id,
        created_by_user_id: profile.user_id,
      } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to create deal");
      return null;
    }

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "DEAL_CREATED",
        payload_json: {
          entity_type: "deal",
          entity_id: (data as any).id,
          actor_user_id: profile.user_id,
          short_message: `Deal created: ${deal.deal_name}`,
        },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "CREATE_DEAL",
        entity_type: "deal",
        entity_id: (data as any).id,
      }),
    ]);

    toast.success("Deal created");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "create", entityType: "deal", entityId: (data as any).id, description: `Created deal: ${deal.deal_name}` });
    await fetchDeals();
    notifySalesDataChanged(["deals", "dashboard", "pipeline", "proposals"], "deal:create");
    return data as Deal;
  };

  const changeStage = async (dealId: string, fromStage: DealStage, toStage: DealStage, notes?: string) => {
    if (!profile) return;

    await supabase
      .from("deals")
      .update({
        stage: toStage as any,
        status: (toStage === "won" ? "won" : toStage === "lost" ? "lost" : "open") as any,
      } as any)
      .eq("id", dealId);

    await supabase.from("deal_stage_history").insert({
      business_id: profile.business_id,
      deal_id: dealId,
      from_stage: fromStage as any,
      to_stage: toStage as any,
      changed_by_user_id: profile.user_id,
      notes,
    } as any);

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "DEAL_STAGE_CHANGED",
        payload_json: {
          entity_type: "deal",
          entity_id: dealId,
          actor_user_id: profile.user_id,
          from_stage: fromStage,
          to_stage: toStage,
          short_message: `Deal moved to ${STAGE_LABELS[toStage]}`,
        },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "DEAL_STAGE_CHANGE",
        entity_type: "deal",
        entity_id: dealId,
        old_value_json: { stage: fromStage },
        new_value_json: { stage: toStage },
      }),
    ]);

    toast.success(`Deal moved to ${STAGE_LABELS[toStage]}`);
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "update", entityType: "deal", entityId: dealId, description: `Deal stage: ${fromStage} → ${toStage}` });
    await fetchDeals();
    notifySalesDataChanged(["deals", "dashboard", "pipeline", "proposals"], "deal:change-stage");
  };

  const addNote = async (dealId: string, note: string) => {
    if (!profile) return;

    await supabase.from("deal_notes").insert({
      business_id: profile.business_id,
      deal_id: dealId,
      author_user_id: profile.user_id,
      note,
    } as any);

    toast.success("Note added");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "create", entityType: "deal_note", entityId: dealId, description: "Added note to deal" });
    notifySalesDataChanged(["deals", "dashboard", "pipeline"], "deal:add-note");
  };

  const markWon = async (dealId: string) => {
    const deal = deals.find((d) => d.id === dealId);
    if (deal) await changeStage(dealId, deal.stage, "won");
  };

  const markLost = async (dealId: string, reason?: string) => {
    if (!profile) return;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal) return;

    await supabase
      .from("deals")
      .update({ stage: "lost" as any, status: "lost" as any, lost_reason: reason } as any)
      .eq("id", dealId);

    await changeStage(dealId, deal.stage, "lost", reason);
  };

  return { deals, loading, createDeal, changeStage, addNote, markWon, markLost, refetch: fetchDeals };
}
