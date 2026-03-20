import { supabase } from "@/integrations/supabase/client";

export type DialerCallStatus = "idle" | "initiating" | "ringing" | "connected" | "ended" | "failed" | "busy" | "no-answer";
export type AgentState = "available" | "on_call" | "offline";
export type Disposition = "interested" | "not_interested" | "callback_later" | "no_answer";

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

// Update session status locally (optimistic)
export async function updateSessionStatus(sessionId: string, status: string, extras?: Record<string, any>) {
  const updates: any = { call_status: status, ...extras };
  await supabase.from("dialer_sessions").update(updates).eq("id", sessionId);
}

// Save disposition and notes
export async function saveDisposition(sessionId: string, disposition: string, notes?: string) {
  await supabase
    .from("dialer_sessions")
    .update({ disposition, notes: notes || null } as any)
    .eq("id", sessionId);
}

// Insert call event
export async function insertCallEvent(sessionId: string, eventType: string, metadata?: any) {
  await supabase.from("dialer_call_events").insert({
    session_id: sessionId,
    event_type: eventType,
    metadata: metadata || null,
  } as any);
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
