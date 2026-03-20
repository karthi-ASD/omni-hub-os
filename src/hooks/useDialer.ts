import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  createDialerSession,
  initiateCall,
  hangupCall,
  saveDisposition,
  saveDetailedDisposition,
  addCallTag,
  insertCallEvent,
  updateAgentState,
  fetchLeadCallHistory,
  subscribeToSession,
  type DialerSession,
  type DialerCallStatus,
  type Disposition,
  type AgentState,
  type CallTag,
} from "@/services/dialerService";

const CALL_INIT_TIMEOUT_MS = 30_000;

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
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timer logic
  useEffect(() => {
    if (callStatus === "connected" || callStatus === "bridging") {
      timerRef.current = setInterval(() => setCallTimer((t) => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (callStatus === "idle") setCallTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callStatus]);

  useEffect(() => {
    if (callStatus !== "initiating" && initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
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
      if (["ended", "failed", "busy", "no-answer"].includes(status)) {
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

  const isCallActive = callStatus !== "idle" && callStatus !== "ended" && callStatus !== "failed" && callStatus !== "busy" && callStatus !== "no-answer";

  const startCall = useCallback(async (phoneNumber: string, leadId?: string, clientId?: string) => {
    if (!profile?.business_id || loading || isCallActive) return;

    // Lead context validation: fetch latest phone from DB
    let resolvedPhone = phoneNumber;
    if (leadId) {
      const { data: lead } = await supabase
        .from("leads")
        .select("phone")
        .eq("id", leadId)
        .maybeSingle();
      if (lead?.phone) resolvedPhone = lead.phone;
    }

    setLoading(true);
    try {
      const sess = await createDialerSession({
        businessId: profile.business_id,
        userId: profile.user_id,
        phoneNumber: resolvedPhone,
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

      initTimeoutRef.current = setTimeout(() => {
        setCallStatus((prev) => {
          if (prev === "initiating") {
            toast.info("Connection taking longer than expected");
            insertCallEvent(sess.id, "init_timeout_waiting");
          }
          return prev;
        });
      }, CALL_INIT_TIMEOUT_MS);

      const result = await initiateCall(sess.id);
      if (!result.success) {
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        setCallStatus("failed");
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
  }, [profile, loading, isCallActive]);

  const endCall = useCallback(async () => {
    if (!session?.id) return;
    const success = await hangupCall(session.id);
    if (!success) toast.error("Failed to end call");
  }, [session]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
    if (session?.id) insertCallEvent(session.id, isMuted ? "unmuted" : "muted");
  }, [session, isMuted]);

  const submitDisposition = useCallback(async (disposition: Disposition, notes?: string, followUpDate?: string) => {
    if (!session?.id || !profile) return;

    // Save to dialer_sessions (latest state)
    await saveDisposition(session.id, disposition, notes);

    // Save detailed disposition (audit log)
    await saveDetailedDisposition({
      sessionId: session.id,
      leadId: session.lead_id,
      agentId: profile.user_id,
      dispositionType: disposition,
      notes,
      followUpDate,
    });

    await insertCallEvent(session.id, "disposition_set", { disposition, notes });

    // Follow-up with duplicate check
    if (followUpDate && profile.business_id) {
      const entityId = session.lead_id || session.id;
      const dateOnly = followUpDate.split("T")[0];

      // Check for existing reminder on same date for same entity
      const { count } = await supabase
        .from("reminders")
        .select("id", { count: "exact", head: true })
        .eq("entity_id", entityId)
        .eq("assigned_to_user_id", profile.user_id)
        .gte("due_at", dateOnly)
        .lt("due_at", new Date(new Date(dateOnly).getTime() + 86400000).toISOString().split("T")[0]);

      if ((count || 0) === 0) {
        await supabase.from("reminders").insert({
          business_id: profile.business_id,
          entity_type: "lead" as any,
          entity_id: entityId,
          assigned_to_user_id: profile.user_id,
          created_by_user_id: profile.user_id,
          title: `Follow-up call: ${session.phone_number}`,
          due_at: followUpDate,
          priority: "high" as any,
        });
      }
    }

    toast.success("Disposition saved");
  }, [session, profile]);

  const tagCall = useCallback(async (tag: CallTag) => {
    if (!session?.id || !profile) return;
    await addCallTag(session.id, tag, profile.user_id);
    toast.success(`Tagged as ${tag.replace("_", " ")}`);
  }, [session, profile]);

  const resetDialer = useCallback(() => {
    if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
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
    isCallActive,
    startCall,
    endCall,
    toggleMute,
    submitDisposition,
    tagCall,
    loadLeadHistory,
    resetDialer,
  };
}
