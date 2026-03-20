import { supabase } from "@/integrations/supabase/client";

export type DialerCallStatus = "idle" | "initiating" | "ringing" | "connected" | "ended" | "failed" | "busy" | "no-answer";
export type AgentState = "available" | "on_call" | "offline";
export type Disposition = "interested" | "not_interested" | "callback_later" | "no_answer" | "wrong_number" | "converted";
export type CallTag = "hot_lead" | "warm_lead" | "cold_lead" | "spam";

export interface DialerSession {
  id: string;
  business_id: string;
  user_id: string;
  lead_id: string | null;
  client_id: string | null;
  phone_number: string;
  provider: string;
  provider_call_id: string | null;
  call_status: string;
  call_start_time: string | null;
  call_end_time: string | null;
  call_duration: number | null;
  recording_url: string | null;
  notes: string | null;
  disposition: string | null;
  ai_summary: string | null;
  ai_score: number | null;
  created_at: string;
}

// Create a dialer session (pre-call)
export async function createDialerSession(params: {
  businessId: string;
  userId: string;
  phoneNumber: string;
  leadId?: string;
  clientId?: string;
}): Promise<DialerSession | null> {
  const { data, error } = await supabase
    .from("dialer_sessions")
    .insert({
      business_id: params.businessId,
      user_id: params.userId,
      phone_number: params.phoneNumber,
      lead_id: params.leadId || null,
      client_id: params.clientId || null,
      call_status: "idle",
    } as any)
    .select()
    .single();

  if (error) {
    console.error("Failed to create dialer session:", error);
    return null;
  }
  return data as unknown as DialerSession;
}

// Initiate call via edge function
export async function initiateCall(sessionId: string): Promise<{ success: boolean; providerCallId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("dialer-initiate", {
      body: { session_id: sessionId },
    });
    if (error) return { success: false, error: error.message };
    return { success: true, providerCallId: data?.provider_call_id };
  } catch (err: any) {
    return { success: false, error: err.message || "Call initiation failed" };
  }
}

// Hangup call — tells backend to send hangup to Plivo; webhook handles status
export async function hangupCall(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("dialer-initiate", {
      body: { session_id: sessionId, action: "hangup" },
    });
    if (error) {
      console.error("Hangup failed:", error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Save disposition and notes — ALLOWED frontend DB write (non-status field)
export async function saveDisposition(sessionId: string, disposition: string, notes?: string) {
  await supabase
    .from("dialer_sessions")
    .update({ disposition, notes: notes || null } as any)
    .eq("id", sessionId);
}

// Save detailed disposition to dialer_dispositions table
export async function saveDetailedDisposition(params: {
  sessionId: string;
  leadId?: string | null;
  agentId: string;
  dispositionType: Disposition;
  notes?: string;
  followUpDate?: string;
}) {
  const { error } = await supabase
    .from("dialer_dispositions")
    .insert({
      session_id: params.sessionId,
      lead_id: params.leadId || null,
      agent_id: params.agentId,
      disposition_type: params.dispositionType,
      notes: params.notes || null,
      follow_up_date: params.followUpDate || null,
    } as any);

  if (error) console.error("Failed to save disposition:", error);
  return !error;
}

// Add call tag
export async function addCallTag(sessionId: string, tag: CallTag, userId: string) {
  const { error } = await supabase
    .from("dialer_call_tags")
    .insert({
      session_id: sessionId,
      tag,
      created_by: userId,
    } as any);
  if (error) console.error("Failed to add call tag:", error);
  return !error;
}

// Fetch call tags for a session
export async function fetchCallTags(sessionId: string): Promise<{ tag: string; created_at: string }[]> {
  const { data } = await supabase
    .from("dialer_call_tags")
    .select("tag, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  return (data as any[]) || [];
}

// Insert call event (duplicate-safe via DB constraint)
export async function insertCallEvent(sessionId: string, eventType: string, metadata?: any) {
  try {
    await supabase.from("dialer_call_events").insert({
      session_id: sessionId,
      event_type: eventType,
      metadata: metadata || null,
    } as any);
  } catch {
    // Duplicate or failure — non-blocking
  }
}

// Update agent state
export async function updateAgentState(businessId: string, userId: string, state: AgentState) {
  await supabase
    .from("dialer_agent_states")
    .upsert({
      business_id: businessId,
      user_id: userId,
      state,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: "business_id,user_id" });
}

// Fetch previous calls for a lead
export async function fetchLeadCallHistory(leadId: string): Promise<DialerSession[]> {
  const { data } = await supabase
    .from("dialer_sessions")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data as unknown as DialerSession[]) || [];
}

// Fetch dialer dashboard metrics for a business
export async function fetchDialerDashboardMetrics(businessId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // All sessions today
  const { data: todaySessions } = await supabase
    .from("dialer_sessions")
    .select("id, call_status, call_duration, disposition, user_id")
    .eq("business_id", businessId)
    .gte("created_at", todayISO);

  const sessions = (todaySessions as any[]) || [];
  const totalCalls = sessions.length;
  const connectedCalls = sessions.filter(s => ["connected", "ended"].includes(s.call_status) || s.call_duration > 0).length;
  const failedCalls = sessions.filter(s => ["failed", "busy", "no-answer"].includes(s.call_status)).length;
  const conversions = sessions.filter(s => s.disposition === "converted" || s.disposition === "interested").length;
  const durations = sessions.filter(s => s.call_duration && s.call_duration > 0).map(s => s.call_duration);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length) : 0;
  const conversionRate = totalCalls > 0 ? Math.round((conversions / totalCalls) * 100) : 0;

  // Agent performance
  const agentMap = new Map<string, { calls: number; connected: number; conversions: number; followUps: number }>();
  for (const s of sessions) {
    if (!agentMap.has(s.user_id)) {
      agentMap.set(s.user_id, { calls: 0, connected: 0, conversions: 0, followUps: 0 });
    }
    const a = agentMap.get(s.user_id)!;
    a.calls++;
    if (["connected", "ended"].includes(s.call_status) || s.call_duration > 0) a.connected++;
    if (s.disposition === "converted" || s.disposition === "interested") a.conversions++;
    if (s.disposition === "callback_later") a.followUps++;
  }

  return {
    totalCalls,
    connectedCalls,
    failedCalls,
    conversionRate,
    avgDuration,
    agentPerformance: Array.from(agentMap.entries()).map(([userId, stats]) => ({
      userId,
      ...stats,
      connectRate: stats.calls > 0 ? Math.round((stats.connected / stats.calls) * 100) : 0,
    })),
  };
}

// Subscribe to session updates (realtime) — this is how frontend gets status changes
export function subscribeToSession(sessionId: string, callback: (session: DialerSession) => void) {
  const channel = supabase
    .channel(`dialer-session-${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "dialer_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new as unknown as DialerSession);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
