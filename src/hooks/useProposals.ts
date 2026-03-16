import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";

export interface ServiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Proposal {
  id: string;
  business_id: string;
  deal_id: string;
  proposal_number: number;
  title: string;
  description: string | null;
  services_json: ServiceLineItem[];
  pricing_breakdown_json: any[];
  total_amount: number;
  currency: string;
  tax_amount: number;
  discount_amount: number;
  status: ProposalStatus;
  valid_until: string | null;
  payment_required: boolean;
  payment_status: "unpaid" | "paid";
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export function useProposals() {
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("proposals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setProposals((data as any as Proposal[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);
  useSalesDataAutoRefresh(fetchProposals, ["all", "proposals", "dashboard"]);

  const createProposal = async (input: {
    deal_id: string;
    title: string;
    description?: string;
    services: ServiceLineItem[];
    tax_amount?: number;
    discount_amount?: number;
    valid_until?: string;
    payment_required?: boolean;
  }) => {
    if (!profile?.business_id) return null;
    const total = input.services.reduce((sum, s) => sum + s.total, 0);
    const { data, error } = await supabase
      .from("proposals")
      .insert({
        business_id: profile.business_id,
        deal_id: input.deal_id,
        title: input.title,
        description: input.description,
        services_json: input.services as any,
        total_amount: total - (input.discount_amount || 0) + (input.tax_amount || 0),
        tax_amount: input.tax_amount || 0,
        discount_amount: input.discount_amount || 0,
        valid_until: input.valid_until,
        payment_required: input.payment_required || false,
        created_by_user_id: profile.user_id,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create proposal"); return null; }

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "PROPOSAL_CREATED",
        payload_json: { entity_type: "proposal", entity_id: (data as any).id, actor_user_id: profile.user_id, short_message: `Proposal created: ${input.title}` },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "CREATE_PROPOSAL", entity_type: "proposal", entity_id: (data as any).id,
      }),
    ]);

    toast.success("Proposal created");
    await fetchProposals();
    notifySalesDataChanged(["proposals", "dashboard"], "proposal:create");
    return data as any as Proposal;
  };

  const sendProposal = async (proposalId: string) => {
    if (!profile) return;
    await supabase.from("proposals").update({ status: "sent" } as any).eq("id", proposalId);
    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "PROPOSAL_SENT",
        payload_json: { entity_type: "proposal", entity_id: proposalId, actor_user_id: profile.user_id, short_message: "Proposal sent" },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "SEND_PROPOSAL", entity_type: "proposal", entity_id: proposalId,
      }),
    ]);
    toast.success("Proposal sent");
    await fetchProposals();
    notifySalesDataChanged(["proposals", "dashboard"], "proposal:send");
  };

  const acceptProposal = async (proposalId: string) => {
    if (!profile) return;
    await supabase.from("proposals").update({ status: "accepted" } as any).eq("id", proposalId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "PROPOSAL_ACCEPTED",
      payload_json: { entity_type: "proposal", entity_id: proposalId, actor_user_id: profile.user_id, short_message: "Proposal accepted" },
    });
    toast.success("Proposal accepted");
    fetchProposals();
  };

  const rejectProposal = async (proposalId: string) => {
    if (!profile) return;
    await supabase.from("proposals").update({ status: "rejected" } as any).eq("id", proposalId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "PROPOSAL_REJECTED",
      payload_json: { entity_type: "proposal", entity_id: proposalId, actor_user_id: profile.user_id, short_message: "Proposal rejected" },
    });
    toast.success("Proposal rejected");
    fetchProposals();
  };

  const markPaid = async (proposalId: string) => {
    if (!profile) return;
    await supabase.from("proposals").update({ payment_status: "paid" } as any).eq("id", proposalId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "PAYMENT_MARKED_PAID",
      payload_json: { entity_type: "proposal", entity_id: proposalId, actor_user_id: profile.user_id, short_message: "Payment marked as paid" },
    });
    toast.success("Payment marked as paid");
    fetchProposals();
  };

  return { proposals, loading, createProposal, sendProposal, acceptProposal, rejectProposal, markPaid, refetch: fetchProposals };
}
