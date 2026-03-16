import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { notifySalesDataChanged, useSalesDataAutoRefresh } from "@/lib/salesDataSync";

export interface ConversionRequest {
  id: string;
  business_id: string;
  lead_id: string;
  requested_by_user_id: string;
  request_status: string;
  accounts_user_id: string | null;
  decision_notes: string | null;
  services: string | null;
  contract_value: number;
  created_at: string;
  approved_at: string | null;
  updated_at: string;
  // Joined
  lead_name?: string;
  lead_email?: string;
  lead_phone?: string;
  lead_business_name?: string;
  lead_services_needed?: string;
  requester_name?: string;
}

export function useLeadConversions() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<ConversionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!profile?.business_id) return;
    setLoading(true);

    const { data: rawRequests } = await supabase
      .from("lead_conversion_requests")
      .select("*")
      .eq("business_id", profile.business_id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!rawRequests || rawRequests.length === 0) {
      setRequests([]);
      setLoading(false);
      return;
    }

    // Fetch related leads
    const leadIds = [...new Set((rawRequests as any[]).map(r => r.lead_id))];
    const { data: leads } = await supabase
      .from("leads")
      .select("id, name, email, phone, business_name, services_needed")
      .in("id", leadIds);

    const leadMap: Record<string, any> = {};
    (leads || []).forEach(l => { leadMap[l.id] = l; });

    // Fetch requester names
    const userIds = [...new Set((rawRequests as any[]).map(r => r.requested_by_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);

    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.user_id] = p.full_name || "Unknown"; });

    const enriched: ConversionRequest[] = (rawRequests as any[]).map(r => ({
      ...r,
      lead_name: leadMap[r.lead_id]?.name || "Unknown",
      lead_email: leadMap[r.lead_id]?.email || "",
      lead_phone: leadMap[r.lead_id]?.phone || "",
      lead_business_name: leadMap[r.lead_id]?.business_name || "",
      lead_services_needed: leadMap[r.lead_id]?.services_needed || "",
      requester_name: profileMap[r.requested_by_user_id] || "Unknown",
    }));

    setRequests(enriched);
    setLoading(false);
  }, [profile?.business_id]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useSalesDataAutoRefresh(fetchRequests, ["all", "leads", "clients", "dashboard", "pipeline"]);

  const requestConversion = async (leadId: string, services?: string, contractValue?: number) => {
    if (!profile?.business_id) { toast.error("Select a tenant first"); return null; }

    const { data, error } = await supabase
      .from("lead_conversion_requests")
      .insert({
        business_id: profile.business_id,
        lead_id: leadId,
        requested_by_user_id: profile.user_id,
        services: services || null,
        contract_value: contractValue || 0,
      } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to submit conversion request"); return null; }

    // Update lead stage
    await supabase.from("leads").update({ stage: "conversion_requested" as any }).eq("id", leadId);

    // Log system event
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "LEAD_CONVERSION_REQUESTED",
      payload_json: { lead_id: leadId, requested_by: profile.user_id },
    });

    // Notify accounts team
    const { data: accountsUsers } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("business_id", profile.business_id)
      .in("role", ["business_admin", "super_admin"] as any[]);

    if (accountsUsers && accountsUsers.length > 0) {
      const notifications = accountsUsers.map(u => ({
        business_id: profile.business_id,
        user_id: u.user_id,
        type: "info" as const,
        title: "Lead Conversion Request",
        message: `A salesperson has requested to convert a lead to client. Please review.`,
      }));
      await supabase.from("notifications").insert(notifications);
    }

    toast.success("Conversion request submitted for approval");
    await fetchRequests();
    notifySalesDataChanged(["leads", "dashboard", "pipeline"], "lead-conversion:request");
    return data;
  };

  const approveConversion = async (requestId: string, decisionNotes?: string) => {
    if (!profile?.business_id) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) { toast.error("Request not found"); return; }

    // Update request status
    await supabase.from("lead_conversion_requests").update({
      request_status: "approved",
      accounts_user_id: profile.user_id,
      decision_notes: decisionNotes || null,
      approved_at: new Date().toISOString(),
    } as any).eq("id", requestId);

    // Get lead data
    const { data: lead } = await supabase
      .from("leads")
      .select("*")
      .eq("id", request.lead_id)
      .single();

    if (lead) {
      // Create client from lead
      const { data: client } = await supabase.from("clients").insert({
        business_id: profile.business_id,
        contact_name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.business_name,
        lead_id: lead.id,
        client_status: "active",
        onboarding_status: "pending",
        created_by: profile.user_id,
        sales_owner_id: lead.assigned_to_user_id,
        signup_source: "sales",
      } as any).select().single();

      // Update lead status
      await supabase.from("leads").update({ stage: "won" as any }).eq("id", request.lead_id);

      // Log events
      await Promise.all([
        supabase.from("system_events").insert({
          business_id: profile.business_id,
          event_type: "LEAD_CONVERSION_APPROVED",
          payload_json: {
            lead_id: request.lead_id,
            client_id: (client as any)?.id,
            approved_by: profile.user_id,
          },
        }),
        supabase.from("audit_logs").insert({
          business_id: profile.business_id,
          actor_user_id: profile.user_id,
          action_type: "APPROVE_LEAD_CONVERSION",
          entity_type: "lead",
          entity_id: request.lead_id,
        }),
      ]);

      // Notify requester
      await supabase.from("notifications").insert({
        business_id: profile.business_id,
        user_id: request.requested_by_user_id,
        type: "info" as const,
        title: "Conversion Approved ✅",
        message: `Lead "${lead.name}" has been approved and is now a client.`,
      });
    }

    toast.success("Lead approved and converted to client");
    fetchRequests();
  };

  const rejectConversion = async (requestId: string, decisionNotes: string) => {
    if (!profile?.business_id) return;

    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    await supabase.from("lead_conversion_requests").update({
      request_status: "rejected",
      accounts_user_id: profile.user_id,
      decision_notes: decisionNotes,
    } as any).eq("id", requestId);

    // Revert lead stage to negotiation
    await supabase.from("leads").update({ stage: "negotiation" as any }).eq("id", request.lead_id);

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "LEAD_CONVERSION_REJECTED",
      payload_json: { lead_id: request.lead_id, rejected_by: profile.user_id, reason: decisionNotes },
    });

    // Notify requester
    await supabase.from("notifications").insert({
      business_id: profile.business_id,
      user_id: request.requested_by_user_id,
      type: "warning" as const,
      title: "Conversion Rejected",
      message: `Lead conversion was rejected. Reason: ${decisionNotes}`,
    });

    toast.success("Conversion request rejected");
    fetchRequests();
  };

  const revertClientToLead = async (clientId: string, reason: string) => {
    if (!profile?.business_id) return;

    // Get client data
    const { data: client } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (!client) { toast.error("Client not found"); return; }

    const c = client as any;

    // If there's a linked lead, revert its stage
    if (c.lead_id) {
      await supabase.from("leads").update({ stage: "negotiation" as any, status: "active" as any }).eq("id", c.lead_id);
    } else {
      // Create a new lead from the client data
      await supabase.from("leads").insert({
        business_id: profile.business_id,
        name: c.contact_name,
        email: c.email,
        phone: c.phone,
        business_name: c.company_name,
        stage: "negotiation",
        assigned_to_user_id: c.sales_owner_id,
      });
    }

    // Update client status to indicate reverted
    await supabase.from("clients").update({ client_status: "reverted" as any }).eq("id", clientId);

    await Promise.all([
      supabase.from("system_events").insert({
        business_id: profile.business_id,
        event_type: "CLIENT_REVERTED_TO_LEAD",
        payload_json: { client_id: clientId, reason, reverted_by: profile.user_id },
      }),
      supabase.from("audit_logs").insert({
        business_id: profile.business_id,
        actor_user_id: profile.user_id,
        action_type: "REVERT_CLIENT_TO_LEAD",
        entity_type: "client",
        entity_id: clientId,
        new_value_json: { reason } as any,
      }),
    ]);

    toast.success("Client reverted to lead");
    fetchRequests();
  };

  const pendingRequests = requests.filter(r => r.request_status === "pending");

  return {
    requests,
    pendingRequests,
    loading,
    requestConversion,
    approveConversion,
    rejectConversion,
    revertClientToLead,
    refetch: fetchRequests,
  };
}
