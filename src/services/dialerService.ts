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
  call_cost: number | null;
  bill_duration: number | null;
  recording_url: string | null;
  notes: string | null;
  disposition: string | null;
  ai_summary: string | null;
  ai_score: number | null;
  agent_connected: boolean;
  customer_connected: boolean;
  created_at: string;
}

export interface DialerAILog {
  id: string;
  session_id: string;
  summary: string | null;
  sentiment: string | null;
  score: number | null;
  next_action: string | null;
  priority: string | null;
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

    console.log("Dialer API Response:", { data, error });

    // Supabase client wraps non-2xx as error, but check data first
    if (data?.status === "ok" || data?.success === true || data?.session_id || data?.provider_call_id) {
      return { success: true, providerCallId: data?.provider_call_id };
    }

    if (error) {
      // FunctionsHttpError includes a response — check if it actually succeeded
      const errData = typeof error === "object" && "context" in error ? (error as any).context : null;
      if (errData?.provider_call_id || errData?.session_id || errData?.status === "ok") {
        return { success: true, providerCallId: errData?.provider_call_id };
      }
      return { success: false, error: error.message || "Dialer request failed" };
    }

    // No explicit error and no recognized success — treat as success if data exists
    if (data && typeof data === "object") {
      return { success: true, providerCallId: data?.provider_call_id };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Dialer initiate exception:", err);
    return { success: false, error: err.message || "Call initiation failed" };
  }
}

// Hangup call
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

// Save disposition and notes
export async function saveDisposition(sessionId: string, disposition: string, notes?: string) {
  await supabase
    .from("dialer_sessions")
    .update({ disposition, notes: notes || null } as any)
    .eq("id", sessionId);
}

// Save detailed disposition
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

// Add call tag (with upsert for duplicate safety)
export async function addCallTag(sessionId: string, tag: CallTag, userId: string) {
  const { error } = await supabase
    .from("dialer_call_tags")
    .upsert(
      { session_id: sessionId, tag, created_by: userId } as any,
      { onConflict: "session_id,tag", ignoreDuplicates: true }
    );
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

// Fetch dialer dashboard metrics via SQL function (optimized)
export async function fetchDialerDashboardMetrics(businessId: string) {
  const { data, error } = await supabase.rpc("get_dialer_metrics", {
    _business_id: businessId,
  });

  if (error) {
    console.error("Failed to fetch dialer metrics:", error);
    return {
      totalCalls: 0,
      connectedCalls: 0,
      failedCalls: 0,
      conversionRate: 0,
      avgDuration: 0,
      agentPerformance: [],
    };
  }

  const metrics = data as any;
  const totalCalls = metrics.total_calls || 0;
  const conversionCount = metrics.conversion_count || 0;

  return {
    totalCalls,
    connectedCalls: metrics.connected_calls || 0,
    failedCalls: metrics.failed_calls || 0,
    conversionRate: totalCalls > 0 ? Math.round((conversionCount / totalCalls) * 100) : 0,
    avgDuration: metrics.avg_duration || 0,
    agentPerformance: (metrics.agent_performance || []).map((a: any) => ({
      userId: a.userId,
      agentName: a.agentName,
      calls: a.calls,
      connected: a.connected,
      connectRate: a.connectRate,
      conversions: a.conversions,
      followUps: a.followUps,
    })),
  };
}

// Fetch AI analysis for a session
export async function fetchSessionAILog(sessionId: string): Promise<DialerAILog | null> {
  const { data } = await supabase
    .from("dialer_ai_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as unknown as DialerAILog;
}

// Subscribe to session updates (realtime)
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
