import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export interface DealRoomProposal {
  id: string;
  business_id: string;
  lead_id: string | null;
  client_id: string | null;
  proposal_request_id: string | null;
  proposal_title: string;
  proposal_version: number;
  uploaded_by_user_id: string | null;
  pdf_file_path: string | null;
  expiry_date: string | null;
  proposal_status: string;
  is_latest: boolean;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
}

export interface ProposalEngagement {
  id: string;
  proposal_id: string;
  activity_type: string;
  section_viewed: string | null;
  duration_seconds: number;
  device_type: string | null;
  created_at: string;
}

export function useDealRoomProposals() {
  const { profile } = useAuth();
  const [proposals, setProposals] = useState<DealRoomProposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deal_room_proposals")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      const userIds = [...new Set(data.map((p: any) => p.uploaded_by_user_id).filter(Boolean))];
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]));
      }
      setProposals(data.map((p: any) => ({ ...p, uploader_name: nameMap[p.uploaded_by_user_id] || "System" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProposals(); }, [fetchProposals]);
  useSalesDataAutoRefresh(fetchProposals, ["all", "proposals", "dashboard"]);

  const createProposal = async (input: {
    proposal_title: string;
    lead_id?: string | null;
    client_id?: string | null;
    proposal_request_id?: string | null;
    expiry_date?: string | null;
    pdf_file_path?: string | null;
  }) => {
    if (!profile?.business_id) return;

    // Mark previous versions as not latest
    if (input.lead_id) {
      await supabase.from("deal_room_proposals")
        .update({ is_latest: false } as any)
        .eq("lead_id", input.lead_id)
        .eq("is_latest", true);
    }

    // Get next version number
    let version = 1;
    if (input.lead_id) {
      const { data: existing } = await supabase
        .from("deal_room_proposals")
        .select("proposal_version")
        .eq("lead_id", input.lead_id)
        .order("proposal_version", { ascending: false })
        .limit(1);
      if (existing && existing.length > 0) version = (existing[0] as any).proposal_version + 1;
    }

    const { error } = await supabase.from("deal_room_proposals").insert({
      business_id: profile.business_id,
      uploaded_by_user_id: profile.user_id,
      proposal_title: input.proposal_title,
      lead_id: input.lead_id || null,
      client_id: input.client_id || null,
      proposal_request_id: input.proposal_request_id || null,
      expiry_date: input.expiry_date || null,
      pdf_file_path: input.pdf_file_path || null,
      proposal_version: version,
      is_latest: true,
    } as any);
    if (error) { toast.error("Failed to create proposal"); return; }
    toast.success(`Proposal v${version} created`);
    await fetchProposals();
    notifySalesDataChanged(["proposals", "dashboard"], "deal-room-proposal:create");
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("deal_room_proposals").update({ proposal_status: status } as any).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }

    // Auto-create lead conversion request when deal room proposal is accepted
    if (status === "accepted") {
      const proposal = proposals.find(p => p.id === id);
      const leadId = proposal?.lead_id;

      if (leadId) {
        // Check no pending request exists
        const { data: existing } = await supabase
          .from("lead_conversion_requests")
          .select("id")
          .eq("lead_id", leadId)
          .eq("request_status", "pending")
          .maybeSingle();

        if (!existing && profile?.business_id) {
          await supabase.from("lead_conversion_requests").insert({
            business_id: profile.business_id,
            lead_id: leadId,
            requested_by_user_id: proposal?.uploaded_by_user_id || profile.user_id,
            services: proposal?.proposal_title || "",
            contract_value: 0,
          } as any);

          await supabase.from("leads").update({ stage: "conversion_requested" as any }).eq("id", leadId);

          await supabase.from("system_events").insert({
            business_id: profile.business_id,
            event_type: "CONVERSION_REQUEST_CREATED",
            payload_json: {
              entity_type: "lead",
              entity_id: leadId,
              proposal_id: id,
              short_message: "Auto conversion request from accepted deal room proposal",
            },
          });

          // Notify accounts/admin + assigned salesperson
          const { data: notifyUsers } = await supabase
            .from("user_roles")
            .select("user_id")
            .eq("business_id", profile.business_id)
            .in("role", ["business_admin", "super_admin"] as any[]);

          const recipientIds = new Set<string>(
            (notifyUsers || []).map((u: any) => u.user_id)
          );
          if (proposal?.uploaded_by_user_id) recipientIds.add(proposal.uploaded_by_user_id);

          if (recipientIds.size > 0) {
            await supabase.from("notifications").insert(
              [...recipientIds].map(uid => ({
                business_id: profile.business_id,
                user_id: uid,
                type: "info" as const,
                title: "Proposal Accepted — Conversion Required",
                message: `Deal Room proposal "${proposal?.proposal_title}" accepted. Conversion approval required.`,
              }))
            );
          }

          notifySalesDataChanged(["leads", "pipeline"], "deal-room-proposal:auto-conversion");
        }
      }

      // Log acceptance event
      if (profile?.business_id) {
        await supabase.from("system_events").insert({
          business_id: profile.business_id,
          event_type: "PROPOSAL_ACCEPTED",
          payload_json: { entity_type: "deal_room_proposal", entity_id: id, short_message: "Deal room proposal accepted" },
        });
      }
    }

    await fetchProposals();
    notifySalesDataChanged(["proposals", "dashboard"], "deal-room-proposal:update-status");
  };

  const uploadPdf = async (file: File, proposalId: string) => {
    if (!profile?.business_id) return null;
    const path = `${profile.business_id}/${proposalId}/${file.name}`;
    const { error } = await supabase.storage.from("proposal-files").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed"); return null; }
    await supabase.from("deal_room_proposals").update({ pdf_file_path: path } as any).eq("id", proposalId);
    toast.success("PDF uploaded");
    await fetchProposals();
    notifySalesDataChanged(["proposals", "dashboard"], "deal-room-proposal:upload-pdf");
    return path;
  };

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("proposal-files").createSignedUrl(path, 300); // 5 min expiry
    return data?.signedUrl || null;
  };

  // Engagement tracking
  const trackActivity = async (proposalId: string, activityType: string, sectionViewed?: string, durationSeconds?: number) => {
    if (!profile?.business_id) return;
    await supabase.from("proposal_activity").insert({
      business_id: profile.business_id,
      proposal_id: proposalId,
      customer_user_id: profile.user_id,
      activity_type: activityType,
      section_viewed: sectionViewed || null,
      duration_seconds: durationSeconds || 0,
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
    } as any);
  };

  const getEngagement = async (proposalId: string): Promise<ProposalEngagement[]> => {
    const { data } = await supabase
      .from("proposal_activity")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false });
    return (data as any) || [];
  };

  return {
    proposals, loading, createProposal, updateStatus,
    uploadPdf, getSignedUrl, trackActivity, getEngagement,
    refetch: fetchProposals,
  };
}
