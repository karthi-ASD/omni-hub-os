import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { logActivity as logAI } from "@/lib/activity-logger";

export type ContractStatus = "draft" | "sent" | "signed" | "rejected";

export interface Contract {
  id: string;
  business_id: string;
  proposal_id: string | null;
  deal_id: string;
  contract_number: number;
  contract_content: string | null;
  status: ContractStatus;
  signed_at: string | null;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export function useContracts() {
  const { profile } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("contracts").select("*").order("created_at", { ascending: false }).limit(500);
    setContracts((data as any as Contract[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);

  const createFromProposal = async (proposalId: string, dealId: string, content: string) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        business_id: profile.business_id,
        proposal_id: proposalId,
        deal_id: dealId,
        contract_content: content,
        created_by_user_id: profile.user_id,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create contract"); return null; }

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "CONTRACT_CREATED",
        payload_json: { entity_type: "contract", entity_id: (data as any).id, actor_user_id: profile.user_id, short_message: "Contract generated from proposal" },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id, actor_user_id: profile.user_id,
        action_type: "CREATE_CONTRACT", entity_type: "contract", entity_id: (data as any).id,
      }),
    ]);

    toast.success("Contract created");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "create", entityType: "contract", entityId: (data as any).id, description: "Contract created from proposal" });
    fetchContracts();
    return data as any as Contract;
  };

  const sendContract = async (contractId: string) => {
    if (!profile) return;
    await supabase.from("contracts").update({ status: "sent" } as any).eq("id", contractId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "CONTRACT_SENT",
      payload_json: { entity_type: "contract", entity_id: contractId, actor_user_id: profile.user_id, short_message: "Contract sent for signing" },
    });
    toast.success("Contract sent");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "submit", entityType: "contract", entityId: contractId, description: "Contract sent for signing" });
    fetchContracts();
  };

  const markSigned = async (contractId: string, dealId: string) => {
    if (!profile) return;
    await supabase.from("contracts").update({ status: "signed", signed_at: new Date().toISOString() } as any).eq("id", contractId);
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "CONTRACT_SIGNED",
      payload_json: { entity_type: "contract", entity_id: contractId, actor_user_id: profile.user_id, deal_id: dealId, short_message: "Contract signed!" },
    });
    toast.success("Contract signed!");
    logAI({ userId: profile.user_id, userRole: "staff", businessId: profile.business_id, module: "crm", actionType: "complete", entityType: "contract", entityId: contractId, description: "Contract signed" });
    fetchContracts();
  };

  return { contracts, loading, createFromProposal, sendContract, markSigned, refetch: fetchContracts };
}
