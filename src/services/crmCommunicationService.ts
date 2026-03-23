import { supabase } from "@/integrations/supabase/client";

// ─── Phone normalization ───────────────────────────────────────
export function normalizePhoneNumber(phone: string): string {
  // Strip everything except digits and leading +
  let norm = phone.replace(/[^0-9+]/g, "");
  // Ensure + is only at start
  if (norm.indexOf("+") > 0) {
    norm = norm.replace(/\+/g, "");
  }
  return norm;
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

// ─── Find entity by phone (uses DB function with strict normalized matching) ──
export async function findEntityByPhone(
  businessId: string,
  phone: string
): Promise<PhoneMatchResult[]> {
  const norm = normalizePhoneNumber(phone);
  if (norm.length < 6) {
    console.log("PHONE_MATCH_SKIPPED_TOO_SHORT", { phone: norm });
    return [];
  }

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

    if (results.length === 0) {
      console.log("PHONE_MATCH_NOT_FOUND", { phone: norm });
    } else if (results.length === 1) {
      console.log("PHONE_MATCH_FOUND", {
        phone: norm,
        entityType: results[0].entity_type,
        entityId: results[0].entity_id,
        name: results[0].matched_name,
      });
    } else {
      console.log("PHONE_MATCH_MULTIPLE", {
        phone: norm,
        matchCount: results.length,
        entities: results.map((r) => `${r.entity_type}:${r.entity_id}`),
      });
    }
    return results;
  } catch (err) {
    console.error("PHONE_MATCH_EXCEPTION", err);
    return [];
  }
}

// ─── Duplicate phone check across all CRM tables ──────────────
export async function checkPhoneExistsInCRM(
  businessId: string,
  phone: string
): Promise<PhoneMatchResult | null> {
  const matches = await findEntityByPhone(businessId, phone);
  return matches.length > 0 ? matches[0] : null;
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
  disposition_subtype: string | null;
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
  callback_status: string | null;
  conversion_status: string | null;
  matched_name: string | null;
  matched_business_name: string | null;
  entity_name_snapshot: string | null;
  entity_type_snapshot: string | null;
  entity_id_snapshot: string | null;
  customer_visibility_level: string;
  customer_safe_summary: string | null;
  visible_to_customer: boolean;
  auto_tags: string[] | null;
  created_at: string;
  updated_at: string;
}

// Helper to access new tables not in generated types
const db = supabase as any;

// ─── Create communication record with entity snapshot ─────────
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
      // Snapshot for historical consistency
      entity_name_snapshot: payload.matched_name || null,
      entity_type_snapshot: payload.entity_type || null,
      entity_id_snapshot: payload.entity_id || null,
    })
    .select()
    .single();

  if (error) {
    console.error("COMMUNICATION_CREATE_FAILED", error);
    return null;
  }
  console.log("COMMUNICATION_CREATED", {
    id: data?.id,
    entityType: payload.entity_type,
    phone: payload.phone_number_normalized,
    userId: payload.user_id,
  });
  return data as CommunicationRecord;
}

// ─── Update on answered ────────────────────────────────────────
export async function updateCommunicationOnAnswered(commId: string) {
  const { error } = await db
    .from("crm_call_communications")
    .update({
      call_status: "connected",
      answer_time: new Date().toISOString(),
      connected: true,
    })
    .eq("id", commId);

  if (error) {
    console.error("COMMUNICATION_ANSWER_UPDATE_FAILED", { commId, error });
  }
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
  const { error } = await db
    .from("crm_call_communications")
    .update({
      call_status: params.call_status || "ended",
      end_time: new Date().toISOString(),
      duration_seconds: params.duration_seconds || 0,
      talk_time_seconds: params.talk_time_seconds || 0,
      recording_url: params.recording_url || null,
    })
    .eq("id", commId);

  if (error) {
    console.error("COMMUNICATION_END_UPDATE_FAILED", { commId, error });
  }
}

// ─── Save disposition (with auto callback trigger) ─────────────
export async function saveCommunicationDisposition(
  commId: string,
  disposition: string,
  notes?: string,
  callbackRequired?: boolean,
  callbackDatetime?: string,
  callbackReason?: string,
  conversionStatus?: string
) {
  const { error } = await db
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

  if (error) {
    console.error("DISPOSITION_SAVE_FAILED", { commId, error });
  } else {
    console.log("DISPOSITION_SAVED", { commId, disposition, callbackRequired });
  }
}

// ─── Attach transcript ────────────────────────────────────────
export async function attachTranscriptToCommunication(
  commId: string,
  transcript: string,
  status: "completed" | "failed" = "completed"
) {
  const { error } = await db
    .from("crm_call_communications")
    .update({
      transcript_text: transcript,
      transcript_status: status,
    })
    .eq("id", commId);

  if (error) {
    console.error("TRANSCRIPT_ATTACH_FAILED", { commId, error });
  } else {
    console.log("TRANSCRIPT_COMPLETED", { commId, status, length: transcript.length });
  }
}

// ─── Attach AI synopsis (structured format) ───────────────────
export async function attachSynopsisToCommunication(
  commId: string,
  internalSynopsis: string,
  customerSafeSynopsis?: string,
  aiScore?: number,
  sentiment?: string
) {
  const customerVisLevel = customerSafeSynopsis ? "summary_only" : "none";

  const { error } = await db
    .from("crm_call_communications")
    .update({
      ai_synopsis_internal: internalSynopsis,
      ai_synopsis_customer_safe: customerSafeSynopsis || null,
      ai_score: aiScore ?? null,
      sentiment: sentiment || null,
      visible_to_customer: !!customerSafeSynopsis,
      customer_safe_summary: customerSafeSynopsis || null,
      customer_visibility_level: customerVisLevel,
    })
    .eq("id", commId);

  if (error) {
    console.error("SYNOPSIS_ATTACH_FAILED", { commId, error });
  } else {
    console.log("AI_SUMMARY_COMPLETED", { commId, sentiment, aiScore });
  }
}

// ─── Create callback (auto-triggered from disposition) ────────
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
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("CALLBACK_CREATE_FAILED", { commId, error });
    return null;
  }
  console.log("CALLBACK_CREATED", {
    id: data?.id,
    commId,
    datetime: callbackDatetime,
    assignedTo: assignedUserId,
  });
  return data;
}

// ─── Create lead from cold call (with strict duplicate prevention) ─
export async function createLeadFromColdCall(
  businessId: string,
  userId: string,
  phone: string,
  commId: string,
  name?: string,
  company?: string
) {
  const norm = normalizePhoneNumber(phone);

  // STRICT duplicate check: use the same DB function for consistency
  const existing = await checkPhoneExistsInCRM(businessId, phone);
  if (existing) {
    // Attach to existing entity instead of creating duplicate
    await db
      .from("crm_call_communications")
      .update({
        lead_id: existing.lead_id || null,
        contact_id: existing.contact_id || null,
        client_id: existing.client_id || null,
        account_id: existing.account_id || null,
        entity_type: existing.entity_type,
        entity_id: existing.entity_id,
      })
      .eq("id", commId);

    console.log("EXISTING_ENTITY_ATTACHED", {
      entityType: existing.entity_type,
      entityId: existing.entity_id,
      name: existing.matched_name,
      commId,
    });
    return { id: existing.entity_id, name: existing.matched_name, existing: true };
  }

  // No match — create new lead
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
    console.error("NEW_LEAD_CREATE_FAILED", { error, phone: norm });
    return null;
  }

  const leadId = (lead as any).id;
  await db
    .from("crm_call_communications")
    .update({
      lead_id: leadId,
      entity_type: "lead",
      entity_id: leadId,
      entity_name_snapshot: name || `Cold Call ${phone}`,
      entity_type_snapshot: "lead",
      entity_id_snapshot: leadId,
    })
    .eq("id", commId);

  console.log("NEW_LEAD_CREATED", {
    leadId,
    phone: norm,
    commId,
    name: name || `Cold Call ${phone}`,
  });
  return { id: leadId, name: (lead as any).name, existing: false };
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

  const { data, error } = await db
    .from("crm_call_communications")
    .select("*")
    .eq(field, entityId)
    .order("start_time", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("TIMELINE_FETCH_FAILED", { entityType, entityId, error });
    return [];
  }
  return (data as CommunicationRecord[]) || [];
}

// ─── Get pending callbacks ────────────────────────────────────
export async function getPendingCallbacks(
  businessId: string,
  userId?: string,
  filters?: { status?: string; dateFrom?: string; dateTo?: string }
) {
  let query = db
    .from("crm_callbacks")
    .select("*, crm_call_communications(*)")
    .eq("business_id", businessId)
    .order("callback_datetime", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "pending");
  }

  if (userId) {
    query = query.eq("assigned_user_id", userId);
  }
  if (filters?.dateFrom) {
    query = query.gte("callback_datetime", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("callback_datetime", filters.dateTo);
  }

  const { data, error } = await query;
  if (error) {
    console.error("CALLBACKS_FETCH_FAILED", { error });
    return [];
  }
  return data || [];
}

// ─── Update callback status ──────────────────────────────────
export async function updateCallbackStatus(
  callbackId: string,
  status: "completed" | "missed" | "rescheduled" | "cancelled",
  completedCommunicationId?: string
) {
  const updates: any = { status };
  if (completedCommunicationId) {
    updates.completed_communication_id = completedCommunicationId;
  }

  const { error } = await db
    .from("crm_callbacks")
    .update(updates)
    .eq("id", callbackId);

  if (error) {
    console.error("CALLBACK_STATUS_UPDATE_FAILED", { callbackId, error });
  }
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

  const { data, error } = await db
    .from("crm_call_communications")
    .select("id, connected, duration_seconds, talk_time_seconds, disposition, start_time, user_id, call_status")
    .eq(field, entityId)
    .order("start_time", { ascending: false });

  if (error) {
    console.error("ENTITY_STATS_FETCH_FAILED", { entityType, entityId, error });
  }

  const records: any[] = data || [];
  const total = records.length;
  const connected = records.filter((r) => r.connected).length;
  const failed = records.filter((r) => r.call_status === "failed").length;
  const totalTalkTime = records.reduce((sum: number, r) => sum + (r.talk_time_seconds || 0), 0);
  const totalDuration = records.reduce((sum: number, r) => sum + (r.duration_seconds || 0), 0);
  const lastCall = records[0] || null;
  const connectRate = total > 0 ? Math.round((connected / total) * 100) : 0;
  const avgDuration = connected > 0 ? Math.round(totalDuration / connected) : 0;

  return {
    totalCalls: total,
    connectedCalls: connected,
    failedCalls: failed,
    totalTalkTime,
    totalDuration,
    connectRate,
    avgDuration,
    lastCallDate: lastCall?.start_time || null,
    lastAgentId: lastCall?.user_id || null,
    lastDisposition: lastCall?.disposition || null,
  };
}

// ─── Update auto-tags on communication ────────────────────────
export async function updateCommunicationTags(commId: string, tags: string[]) {
  const { error } = await db
    .from("crm_call_communications")
    .update({ auto_tags: tags })
    .eq("id", commId);

  if (error) {
    console.error("AUTO_TAGS_UPDATE_FAILED", { commId, error });
  }
}
