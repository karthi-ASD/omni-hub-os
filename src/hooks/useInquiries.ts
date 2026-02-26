import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Inquiry = Database["public"]["Tables"]["inquiries"]["Row"];
type InquiryInsert = Database["public"]["Tables"]["inquiries"]["Insert"];
type InquiryStatus = Database["public"]["Enums"]["inquiry_status"];

export function useInquiries() {
  const { profile } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error) setInquiries(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  const createInquiry = async (inquiry: Omit<InquiryInsert, "business_id">) => {
    if (!profile?.business_id) return null;
    const { data, error } = await supabase
      .from("inquiries")
      .insert({ ...inquiry, business_id: profile.business_id })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create inquiry");
      return null;
    }
    // Write system event
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "INQUIRY_CREATED",
      payload_json: {
        entity_type: "inquiry",
        entity_id: data.id,
        actor_user_id: profile.user_id,
        short_message: `New inquiry from ${data.name}`,
      },
    });
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "CREATE_INQUIRY",
      entity_type: "inquiry",
      entity_id: data.id,
    });
    toast.success("Inquiry created");
    fetchInquiries();
    return data;
  };

  const updateStatus = async (id: string, status: InquiryStatus) => {
    if (!profile) return;
    const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "INQUIRY_STATUS_CHANGED",
      payload_json: {
        entity_type: "inquiry", entity_id: id,
        actor_user_id: profile.user_id,
        short_message: `Inquiry status changed to ${status}`,
      },
    });
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "UPDATE_INQUIRY_STATUS",
      entity_type: "inquiry",
      entity_id: id,
      new_value_json: { status },
    });
    toast.success("Status updated");
    fetchInquiries();
  };

  const assignInquiry = async (id: string, userId: string) => {
    if (!profile) return;
    const { error } = await supabase.from("inquiries").update({ assigned_to_user_id: userId, status: "assigned" as InquiryStatus }).eq("id", id);
    if (error) { toast.error("Failed to assign"); return; }
    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "INQUIRY_ASSIGNED",
      payload_json: {
        entity_type: "inquiry", entity_id: id,
        actor_user_id: profile.user_id,
        assigned_to_user_id: userId,
        short_message: `Inquiry assigned`,
      },
    });
    toast.success("Inquiry assigned");
    fetchInquiries();
  };

  const convertToLead = async (inquiry: Inquiry) => {
    if (!profile?.business_id) return null;
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        business_id: profile.business_id,
        source: "inquiry" as Database["public"]["Enums"]["lead_source"],
        inquiry_id: inquiry.id,
        assigned_to_user_id: inquiry.assigned_to_user_id || profile.user_id,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        suburb: inquiry.suburb,
        services_needed: inquiry.service_interest,
      })
      .select()
      .single();
    if (error) { toast.error("Failed to convert"); return null; }

    await supabase.from("inquiries").update({
      status: "converted_to_lead" as InquiryStatus,
      lead_id: lead.id,
    }).eq("id", inquiry.id);

    await supabase.from("system_events").insert({
      business_id: profile.business_id,
      event_type: "INQUIRY_CONVERTED_TO_LEAD",
      payload_json: {
        entity_type: "inquiry", entity_id: inquiry.id,
        actor_user_id: profile.user_id,
        lead_id: lead.id,
        short_message: `Inquiry from ${inquiry.name} converted to lead`,
      },
    });
    await supabase.from("audit_logs").insert({
      business_id: profile.business_id,
      actor_user_id: profile.user_id,
      action_type: "CONVERT_INQUIRY_TO_LEAD",
      entity_type: "inquiry",
      entity_id: inquiry.id,
      new_value_json: { lead_id: lead.id },
    });
    toast.success("Converted to lead");
    fetchInquiries();
    return lead;
  };

  return { inquiries, loading, createInquiry, updateStatus, assignInquiry, convertToLead, refetch: fetchInquiries };
}
