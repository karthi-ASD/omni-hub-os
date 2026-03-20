import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  createDialerSession,
  initiateCall,
  hangupCall,
  updateSessionStatus,
  saveDisposition,
  insertCallEvent,
  updateAgentState,
  fetchLeadCallHistory,
  subscribeToSession,
  type DialerSession,
  type DialerCallStatus,
  type Disposition,
  type AgentState,
} from "@/services/dialerService";

export function useDialer() {
  const { profile } = useAuth();
  const [session, setSession] = useState<DialerSession | null>(null);
  const [callStatus, setCallStatus] = useState<DialerCallStatus>("idle");
  const [agentState, setAgentState] = useState<AgentState>("available");
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [previousCalls, setPreviousCalls] = useState<DialerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Timer logic
  useEffect(() => {
    if (callStatus === "connected") {
      timerRef.current = setInterval(() => setCallTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callStatus === "idle" || callStatus === "ended") setCallTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus]);

  // Realtime subscription
  useEffect(() => {
    if (!session?.id) return;
    unsubRef.current = subscribeToSession(session.id, (updated) => {
      setSession(updated);
      const status = updated.call_status as DialerCallStatus;
      setCallStatus(status);

      if (status === "connected" && agentState !== "on_call") {
        setAgentState("on_call");
        if (profile?.business_id) updateAgentState(profile.business_id, profile.user_id, "on_call");
      }
      if (status === "ended" || status === "failed") {
        setAgentState("available");
        if (profile?.business_id) updateAgentState(profile.business_id, profile.user_id, "available");
      }
    });
    return () => { unsubRef.current?.(); };
  }, [session?.id]);

  const loadLeadHistory = useCallback(async (leadId: string) => {
    const calls = await fetchLeadCallHistory(leadId);
    setPreviousCalls(calls);
  }, []);

  const startCall = useCallback(async (phoneNumber: string, leadId?: string, clientId?: string) => {
    if (!profile?.business_id) return;
    setLoading(true);
    try {
      const sess = await createDialerSession({
        businessId: profile.business_id,
        userId: profile.user_id,
        phoneNumber,
        leadId,
        clientId,
      });
      if (!sess) { toast.error("Failed to create call session"); return; }

      setSession(sess);
      setCallStatus("initiating");
      setIsMuted(false);
      setCallTimer(0);

      await updateAgentState(profile.business_id, profile.user_id, "on_call");
      setAgentState("on_call");

      const result = await initiateCall(sess.id);
      if (!result.success) {
        setCallStatus("failed");
        await updateSessionStatus(sess.id, "failed");
        await insertCallEvent(sess.id, "call_failed", { error: result.error });
        toast.error(result.error || "Call failed");
        await updateAgentState(profile.business_id, profile.user_id, "available");
        setAgentState("available");
      } else {
        setCallStatus("ringing");
        await insertCallEvent(sess.id, "call_initiated", { provider_call_id: result.providerCallId });
      }
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const endCall = useCallback(async () => {
    if (!session?.id) return;
    const success = await hangupCall(session.id);
    if (success) {
      setCallStatus("ended");
      await updateSessionStatus(session.id, "ended", { call_end_time: new Date().toISOString(), call_duration: callTimer });
      await insertCallEvent(session.id, "call_ended", { duration: callTimer });
      if (profile?.business_id) {
        await updateAgentState(profile.business_id, profile.user_id, "available");
        setAgentState("available");
      }
    } else {
      toast.error("Failed to end call");
    }
  }, [session, callTimer, profile]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
    if (session?.id) insertCallEvent(session.id, isMuted ? "unmuted" : "muted");
  }, [session, isMuted]);

  const submitDisposition = useCallback(async (disposition: Disposition, notes?: string, followUpDate?: string) => {
    if (!session?.id) return;
    await saveDisposition(session.id, disposition, notes);
    await insertCallEvent(session.id, "disposition_set", { disposition, notes });

    if (followUpDate && profile?.business_id) {
      const { supabase } = await import("@/integrations/supabase/client");
      await supabase.from("reminders").insert({
        business_id: profile.business_id,
        entity_type: "lead" as any,
        entity_id: session.lead_id || session.id,
        assigned_to_user_id: profile.user_id,
        created_by_user_id: profile.user_id,
        title: `Follow-up call: ${session.phone_number}`,
        due_at: followUpDate,
        priority: "high" as any,
      });
    }

    toast.success("Disposition saved");
  }, [session, profile]);

  const resetDialer = useCallback(() => {
    setSession(null);
    setCallStatus("idle");
    setCallTimer(0);
    setIsMuted(false);
    unsubRef.current?.();
  }, []);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return {
    session,
    callStatus,
    agentState,
    callTimer,
    formattedTimer: formatTimer(callTimer),
    isMuted,
    previousCalls,
    loading,
    startCall,
    endCall,
    toggleMute,
    submitDisposition,
    loadLeadHistory,
    resetDialer,
  };
}
