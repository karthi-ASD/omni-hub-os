import { supabase } from "@/integrations/supabase/client";

// ─── Phone normalization ───────────────────────────────────────
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9+]/g, "");
}

// ─── Entity match result ───────────────────────────────────────
export interface PhoneMatchResult {
  entity_type: string;
  entity_id: string;
  lead_id: string | null;
  contact_id: string | null;
  client_id: string | null;
  account_id: string | null;
  matched_name: string | null;
  matched_business_name: string | null;
}

// ─── Find entity by phone (uses DB function) ──────────────────
export async function findEntityByPhone(
  businessId: string,
  phone: string
): Promise<PhoneMatchResult[]> {
  const norm = normalizePhoneNumber(phone);
  if (norm.length < 6) return [];

  try {
    const { data, error } = await supabase.rpc("find_entity_by_phone" as any, {
      _business_id: businessId,
      _phone: norm,
    });
    if (error) {
      console.error("PHONE_MATCH_ERROR", error);
      return [];
    }
    const results = (data as unknown as PhoneMatchResult[]) || [];
    console.log(results.length > 0 ? "PHONE_MATCH_FOUND" : "PHONE_MATCH_NOT_FOUND", {
      phone: norm,
      matchCount: results.length,
    });
    return results;
  } catch (err) {
    console.error("PHONE_MATCH_EXCEPTION", err);
    return [];
  }
}

// ─── Communication record types ────────────────────────────────
export interface CreateCommunicationPayload {
  business_id: string;
  user_id: string;
  phone_number_raw: string;
  phone_number_normalized: string;
  dialer_session_id?: string;
  entity_type?: string;
  entity_id?: string;
  lead_id?: string;
  contact_id?: string;
  client_id?: string;
  account_id?: string;
  project_id?: string;
  source_type: string;
  call_direction?: string;
  matched_name?: string;
  matched_business_name?: string;
}

export interface CommunicationRecord {
  id: string;
  business_id: string;
  user_id: string;
  phone_number_raw: string;
  phone_number_normalized: string;
  entity_type: string | null;
  entity_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  client_id: string | null;
  account_id: string | null;
  project_id: string | null;
  dialer_session_id: string | null;
  source_type: string;
  call_direction: string;
  call_status: string;
  disposition: string | null;
  disposition_notes: string | null;
  start_time: string;
  answer_time: string | null;
  end_time: string | null;
  duration_seconds: number;
  talk_time_seconds: number;
  connected: boolean;
  recording_url: string | null;
  transcript_status: string;
  transcript_text: string | null;
  ai_synopsis_internal: string | null;
  ai_synopsis_customer_safe: string | null;
  ai_score: number | null;
  sentiment: string | null;
  callback_required: boolean;
  callback_datetime: string | null;
  callback_reason: string | null;
  conversion_status: string | null;
  matched_name: string | null;
  matched_business_name: string | null;
  created_at: string;
  updated_at: string;
}

// Helper to access new tables that aren't in generated types yet
const db = supabase as any;

// ─── Create communication record ──────────────────────────────
export async function createCommunicationRecord(
  payload: CreateCommunicationPayload
): Promise<CommunicationRecord | null> {
  const { data, error } = await db
    .from("crm_call_communications")
    .insert({
      business_id: payload.business_id,
      user_id: payload.user_id,
      phone_number_raw: payload.phone_number_raw,
      phone_number_normalized: payload.phone_number_normalized,
      dialer_session_id: payload.dialer_session_id || null,
      entity_type: payload.entity_type || null,
      entity_id: payload.entity_id || null,
      lead_id: payload.lead_id || null,
      contact_id: payload.contact_id || null,
      client_id: payload.client_id || null,
      account_id: payload.account_id || null,
      project_id: payload.project_id || null,
      source_type: payload.source_type,
      call_direction: payload.call_direction || "outbound",
      matched_name: payload.matched_name || null,
      matched_business_name: payload.matched_business_name || null,
    })
    .select()
    .single();

  if (error) {
    console.error("COMMUNICATION_CREATE_FAILED", error);
    return null;
  }
  console.log("COMMUNICATION_CREATED", { id: data?.id, entity_type: payload.entity_type });
  return data as CommunicationRecord;
}

// ─── Update on answered ────────────────────────────────────────
export async function updateCommunicationOnAnswered(commId: string) {
  await db
    .from("crm_call_communications")
    .update({
      call_status: "connected",
      answer_time: new Date().toISOString(),
      connected: true,
    })
    .eq("id", commId);
}

// ─── Update on ended ──────────────────────────────────────────
export async function updateCommunicationOnEnded(
  commId: string,
  params: {
    duration_seconds?: number;
    talk_time_seconds?: number;
    recording_url?: string;
    call_status?: string;
  }
) {
  await db
    .from("crm_call_communications")
    .update({
      call_status: params.call_status || "ended",
      end_time: new Date().toISOString(),
      duration_seconds: params.duration_seconds || 0,
      talk_time_seconds: params.talk_time_seconds || 0,
      recording_url: params.recording_url || null,
    })
    .eq("id", commId);
}

// ─── Save disposition ──────────────────────────────────────────
export async function saveCommunicationDisposition(
  commId: string,
  disposition: string,
  notes?: string,
  callbackRequired?: boolean,
  callbackDatetime?: string,
  callbackReason?: string,
  conversionStatus?: string
) {
  await db
    .from("crm_call_communications")
    .update({
      disposition,
      disposition_notes: notes || null,
      callback_required: callbackRequired || false,
      callback_datetime: callbackDatetime || null,
      callback_reason: callbackReason || null,
      conversion_status: conversionStatus || null,
    })
    .eq("id", commId);
  console.log("DISPOSITION_SAVED", { commId, disposition });
}

// ─── Attach transcript ────────────────────────────────────────
export async function attachTranscriptToCommunication(
  commId: string,
  transcript: string,
  status: "completed" | "failed" = "completed"
) {
  await db
    .from("crm_call_communications")
    .update({
      transcript_text: transcript,
      transcript_status: status,
    })
    .eq("id", commId);
  console.log("TRANSCRIPT_ATTACHED", { commId, status });
}

// ─── Attach AI synopsis ───────────────────────────────────────
export async function attachSynopsisToCommunication(
  commId: string,
  internalSynopsis: string,
  customerSafeSynopsis?: string,
  aiScore?: number,
  sentiment?: string
) {
  await db
    .from("crm_call_communications")
    .update({
      ai_synopsis_internal: internalSynopsis,
      ai_synopsis_customer_safe: customerSafeSynopsis || null,
      ai_score: aiScore || null,
      sentiment: sentiment || null,
      visible_to_customer: !!customerSafeSynopsis,
      customer_safe_summary: customerSafeSynopsis || null,
    })
    .eq("id", commId);
  console.log("SYNOPSIS_ATTACHED", { commId });
}

// ─── Create callback ──────────────────────────────────────────
export async function createCallbackFromDisposition(
  businessId: string,
  commId: string,
  assignedUserId: string,
  callbackDatetime: string,
  callbackReason?: string,
  entityType?: string,
  entityId?: string,
  leadId?: string,
  clientId?: string,
  projectId?: string
) {
  const { data, error } = await db
    .from("crm_callbacks")
    .insert({
      business_id: businessId,
      communication_id: commId,
      entity_type: entityType || null,
      entity_id: entityId || null,
      lead_id: leadId || null,
      client_id: clientId || null,
      project_id: projectId || null,
      assigned_user_id: assignedUserId,
      callback_datetime: callbackDatetime,
      callback_reason: callbackReason || null,
    })
    .select()
    .single();

  if (error) {
    console.error("CALLBACK_CREATE_FAILED", error);
    return null;
  }
  console.log("CALLBACK_CREATED", { id: data?.id, commId });
  return data;
}

// ─── Create lead from cold call ────────────────────────────────
export async function createLeadFromColdCall(
  businessId: string,
  userId: string,
  phone: string,
  commId: string,
  name?: string,
  company?: string
) {
  const norm = normalizePhoneNumber(phone);
  const suffix = norm.replace(/[^0-9]/g, "").slice(-9);

  // Duplicate check
  const { data: existing } = await supabase
    .from("leads")
    .select("id, name")
    .eq("business_id", businessId)
    .like("phone", `%${suffix}`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    await db
      .from("crm_call_communications")
      .update({ lead_id: existing.id, entity_type: "lead", entity_id: existing.id })
      .eq("id", commId);
    console.log("EXISTING_ENTITY_ATTACHED", { leadId: existing.id, commId });
    return existing;
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      business_id: businessId,
      name: name || `Cold Call ${phone}`,
      phone: phone,
      company: company || null,
      source: "outbound_cold_call",
      status: "new",
      assigned_to: userId,
    } as any)
    .select()
    .single();

  if (error) {
    console.error("NEW_LEAD_CREATE_FAILED", error);
    return null;
  }

  await db
    .from("crm_call_communications")
    .update({ lead_id: (lead as any).id, entity_type: "lead", entity_id: (lead as any).id })
    .eq("id", commId);

  console.log("NEW_LEAD_CREATED_FROM_CALL", { leadId: (lead as any).id, commId });
  return lead;
}

// ─── Get communication timeline for entity ────────────────────
export async function getCommunicationTimeline(
  entityType: string,
  entityId: string,
  limit = 50
): Promise<CommunicationRecord[]> {
  const field =
    entityType === "lead" ? "lead_id" :
    entityType === "contact" ? "contact_id" :
    entityType === "client" ? "client_id" :
    entityType === "account" ? "account_id" :
    entityType === "project" ? "project_id" :
    "entity_id";

  const { data } = await db
    .from("crm_call_communications")
    .select("*")
    .eq(field, entityId)
    .order("start_time", { ascending: false })
    .limit(limit);

  return (data as CommunicationRecord[]) || [];
}

// ─── Get pending callbacks ────────────────────────────────────
export async function getPendingCallbacks(businessId: string, userId?: string) {
  let query = db
    .from("crm_callbacks")
    .select("*")
    .eq("business_id", businessId)
    .eq("status", "pending")
    .order("callback_datetime", { ascending: true });

  if (userId) {
    query = query.eq("assigned_user_id", userId);
  }

  const { data } = await query;
  return data || [];
}

// ─── Get communication stats for an entity ────────────────────
export async function getEntityCommunicationStats(
  entityType: string,
  entityId: string
) {
  const field =
    entityType === "lead" ? "lead_id" :
    entityType === "client" ? "client_id" :
    entityType === "contact" ? "contact_id" :
    entityType === "account" ? "account_id" :
    "entity_id";

  const { data } = await db
    .from("crm_call_communications")
    .select("id, connected, duration_seconds, talk_time_seconds, disposition, start_time, user_id")
    .eq(field, entityId)
    .order("start_time", { ascending: false });

  const records: any[] = data || [];
  const total = records.length;
  const connected = records.filter((r) => r.connected).length;
  const totalTalkTime = records.reduce((sum: number, r) => sum + (r.talk_time_seconds || 0), 0);
  const lastCall = records[0] || null;

  return {
    totalCalls: total,
    connectedCalls: connected,
    totalTalkTime,
    lastCallDate: lastCall?.start_time || null,
    lastAgentId: lastCall?.user_id || null,
    lastDisposition: lastCall?.disposition || null,
  };
}
