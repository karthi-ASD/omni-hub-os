import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  createDialerSession,
  insertCallEvent,
  updateAgentState,
  fetchLeadCallHistory,
  subscribeToSession,
  saveDisposition,
  saveDetailedDisposition,
  addCallTag,
  type DialerSession,
  type Disposition,
  type CallTag,
  type AgentState,
} from "@/services/dialerService";

export type BrowserDialerStatus =
  | "idle"
  | "registering"
  | "registered"
  | "requesting_permission"
  | "device_ready"
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "failed"
  | "permission_denied";

export interface BrowserDialerDiagnostics {
  sdkLoaded: boolean;
  registered: boolean;
  micPermission: "unknown" | "granted" | "denied" | "prompt";
  callMode: "browser" | "phone_callback";
  currentStatus: BrowserDialerStatus;
  destinationNumber: string;
  selectedCallerId: string;
  lastError: string | null;
  lastEvent: string | null;
}

function formatToE164(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+") && p.length >= 8) return "+" + p;
  if (p.startsWith("0") && p.length === 10) return "+61" + p.slice(1);
  if (p.startsWith("61") && p.length >= 9 && p.length <= 11) return "+" + p;
  if (p.startsWith("91") && p.length >= 10 && p.length <= 12) return "+" + p;
  if (p.length === 10 && /^[6-9]/.test(p)) return "+91" + p;
  if (p.startsWith("1") && p.length === 11) return "+" + p;
  if (p.length >= 8) return "+" + p;
  return phone;
}

export function useBrowserDialer() {
  const { profile } = useAuth();
  const clientRef = useRef<any>(null);
  const [status, setStatus] = useState<BrowserDialerStatus>("idle");
  const [micPermission, setMicPermission] = useState<"unknown" | "granted" | "denied" | "prompt">("unknown");
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [session, setSession] = useState<DialerSession | null>(null);
  const [previousCalls, setPreviousCalls] = useState<DialerSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>("available");
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<string | null>(null);
  const [destinationNumber, setDestinationNumber] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringbackRef = useRef<{ ctx: AudioContext; osc1: OscillatorNode; osc2: OscillatorNode } | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Timer
  useEffect(() => {
    if (status === "connected") {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (status === "idle" || status === "ended" || status === "failed") setCallTimer(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Ringback audio using Web Audio API (US standard: 440Hz + 480Hz, 2s on / 4s off)
  const playRingback = useCallback(() => {
    try {
      if (ringbackRef.current) return; // Already playing

      const ctx = new AudioContext();
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      gainNode.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.frequency.value = 440;
      osc1.type = "sine";
      osc1.connect(gainNode);
      osc1.start();

      const osc2 = ctx.createOscillator();
      osc2.frequency.value = 480;
      osc2.type = "sine";
      osc2.connect(gainNode);
      osc2.start();

      // Schedule 2s on, 4s off pattern for 2 minutes
      let time = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        gainNode.gain.setValueAtTime(0.04, time);
        time += 2;
        gainNode.gain.setValueAtTime(0, time);
        time += 4;
      }

      ringbackRef.current = { ctx, osc1, osc2 };
      console.log("[useBrowserDialer] Ringback started");
    } catch (err) {
      console.error("[useBrowserDialer] Ringback error:", err);
    }
  }, []);

  const stopRingback = useCallback(() => {
    if (ringbackRef.current) {
      const { osc1, osc2, ctx } = ringbackRef.current;
      try { osc1.stop(); } catch {}
      try { osc2.stop(); } catch {}
      try { ctx.close(); } catch {}
      ringbackRef.current = null;
      console.log("[useBrowserDialer] Ringback stopped");
    }
  }, []);

  // Check mic permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then(result => {
        setMicPermission(result.state as any);
        result.addEventListener("change", () => {
          setMicPermission(result.state as any);
        });
      }).catch(() => {});
    }
  }, []);

  // Initialize Plivo SDK
  useEffect(() => {
    // Wait for SDK to load
    const checkSDK = () => {
      if (typeof window !== "undefined" && window.Plivo) {
        return true;
      }
      return false;
    };

    if (!checkSDK()) {
      // Retry a few times
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkSDK()) {
          clearInterval(interval);
          initSDK();
        } else if (attempts > 20) {
          clearInterval(interval);
          console.error("[useBrowserDialer] Plivo SDK failed to load after 10s");
          setLastError("Voice SDK failed to load. Check your internet connection.");
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      initSDK();
    }

    function initSDK() {
      setSdkReady(true);
      console.log("[useBrowserDialer] Plivo SDK detected, initializing...");

      const plivoInstance = new window.Plivo({ debug: "INFO", permOnClick: true });
      clientRef.current = plivoInstance;

      plivoInstance.client.on("onWebrtcNotSupported", () => {
        console.error("[useBrowserDialer] WebRTC not supported");
        setLastError("Your browser does not support WebRTC calling");
        setLastEvent("webrtc_not_supported");
      });

      plivoInstance.client.on("onLogin", () => {
        console.log("[useBrowserDialer] ✅ Registered with Plivo");
        setRegistered(true);
        setStatus("registered");
        setLastEvent("login_success");
        setLastError(null);
      });

      plivoInstance.client.on("onLoginFailed", (cause: string) => {
        console.error("[useBrowserDialer] ❌ Registration failed:", cause);
        setLastError(`Voice registration failed: ${cause}`);
        setRegistered(false);
        setStatus("failed");
        setLastEvent("login_failed");
      });

      plivoInstance.client.on("onCallRemoteRinging", (callInfo: any) => {
        console.log("[useBrowserDialer] 📞 Remote ringing", callInfo);
        setStatus("ringing");
        setLastEvent("remote_ringing");
        playRingback();
      });

      plivoInstance.client.on("onCallAnswered", (callInfo: any) => {
        console.log("[useBrowserDialer] ✅ Call answered", callInfo);
        setStatus("connected");
        setLastEvent("call_answered");
        stopRingback();

        if (profile?.business_id) {
          updateAgentState(profile.business_id, profile.user_id, "on_call");
          setAgentState("on_call");
        }
      });

      plivoInstance.client.on("onCallTerminated", (callInfo: any) => {
        console.log("[useBrowserDialer] 📴 Call terminated", callInfo);
        setStatus("ended");
        setLastEvent("call_terminated");
        stopRingback();

        if (profile?.business_id) {
          updateAgentState(profile.business_id, profile.user_id, "available");
          setAgentState("available");
        }
      });

      plivoInstance.client.on("onCallFailed", (cause: string) => {
        console.error("[useBrowserDialer] ❌ Call failed:", cause);
        setStatus("failed");
        setLastError(`Call failed: ${cause}`);
        setLastEvent("call_failed");
        stopRingback();

        if (profile?.business_id) {
          updateAgentState(profile.business_id, profile.user_id, "available");
          setAgentState("available");
        }
      });

      plivoInstance.client.on("onMediaPermission", (result: { status: boolean }) => {
        console.log("[useBrowserDialer] 🎤 Media permission:", result.status);
        setMicPermission(result.status ? "granted" : "denied");
        setLastEvent(`media_permission_${result.status ? "granted" : "denied"}`);

        if (!result.status) {
          setLastError("Microphone permission denied. Please allow microphone access in your browser settings.");
          toast.error("Microphone permission denied. Please allow access to make calls.");
        }
      });

      // Get credentials and login
      (async () => {
        try {
          setStatus("registering");
          console.log("[useBrowserDialer] Fetching browser token...");

          const { data, error } = await supabase.functions.invoke("dialer-browser-token");

          if (error || data?.status === "error" || !data?.username) {
            const errMsg = data?.error || error?.message || "Failed to get voice credentials";
            console.error("[useBrowserDialer] Token error:", errMsg);
            setLastError(errMsg);
            setStatus("failed");
            return;
          }

          console.log("[useBrowserDialer] Got credentials, logging in as:", data.username);
          plivoInstance.client.login(data.username, data.password);
        } catch (err: any) {
          console.error("[useBrowserDialer] Init error:", err);
          setLastError(String(err.message || err));
          setStatus("failed");
        }
      })();
    }

    return () => {
      try { clientRef.current?.client?.logout(); } catch {}
      stopRingback();
    };
  }, []);

  // Subscribe to session updates
  useEffect(() => {
    if (!session?.id) return;
    unsubRef.current = subscribeToSession(session.id, (updated) => {
      setSession(updated);
      // Update status based on DB state for customer-side events
      const dbStatus = updated.call_status;
      if (dbStatus === "connected" && status === "ringing") {
        setStatus("connected");
        stopRingback();
      }
    });
    return () => { unsubRef.current?.(); };
  }, [session?.id]);

  const loadLeadHistory = useCallback(async (leadId: string) => {
    const calls = await fetchLeadCallHistory(leadId);
    setPreviousCalls(calls);
  }, []);

  const isCallActive = status === "calling" || status === "ringing" || status === "connected";

  const startCall = useCallback(async (phoneNumber: string, leadId?: string, clientId?: string) => {
    if (!profile?.business_id || loading || isCallActive) return;

    const client = clientRef.current;
    if (!client || !registered) {
      toast.error("Voice client not ready. Please wait for registration.");
      return;
    }

    // Check mic permission
    if (micPermission === "denied") {
      toast.error("Microphone access is required for browser calling. Please enable it in browser settings.");
      setStatus("permission_denied");
      return;
    }

    setLoading(true);

    try {
      // Resolve phone from lead if available
      let resolvedPhone = phoneNumber;
      if (leadId) {
        const { data: lead } = await supabase
          .from("leads")
          .select("phone")
          .eq("id", leadId)
          .maybeSingle();
        if (lead?.phone) resolvedPhone = lead.phone;
      }

      // Normalize to E.164
      const normalizedPhone = formatToE164(resolvedPhone);
      setDestinationNumber(normalizedPhone);

      console.log("[useBrowserDialer] Starting call", {
        original: phoneNumber,
        resolved: resolvedPhone,
        normalized: normalizedPhone,
        leadId,
        clientId,
      });

      // Create session in DB
      const sess = await createDialerSession({
        businessId: profile.business_id,
        userId: profile.user_id,
        phoneNumber: normalizedPhone,
        leadId,
        clientId,
      });

      if (!sess) {
        toast.error("Failed to create call session");
        setLoading(false);
        return;
      }

      // Update session with browser mode
      await supabase.from("dialer_sessions").update({
        call_mode: "browser",
        call_status: "initiating",
      } as any).eq("id", sess.id);

      setSession(sess);
      setStatus("calling");
      setIsMuted(false);
      setCallTimer(0);

      await updateAgentState(profile.business_id, profile.user_id, "on_call");
      setAgentState("on_call");

      // Place call via Plivo Browser SDK
      // Pass session_id as custom SIP header for server-side tracking
      console.log("[useBrowserDialer] Calling via SDK:", normalizedPhone);
      client.client.call(normalizedPhone, {
        "X-PH-SessionId": sess.id,
      });

      await insertCallEvent(sess.id, "browser_call_initiated", {
        destination: normalizedPhone,
        call_mode: "browser",
      });

      toast.info("Calling " + normalizedPhone);
    } catch (err: any) {
      console.error("[useBrowserDialer] startCall error:", err);
      setStatus("failed");
      setLastError(err.message || "Call initiation failed");
      toast.error("Failed to start call");
    } finally {
      setLoading(false);
    }
  }, [profile, loading, isCallActive, registered, micPermission]);

  const endCall = useCallback(async () => {
    console.log("[useBrowserDialer] Ending call");
    try {
      clientRef.current?.client?.hangup();
    } catch (err) {
      console.error("[useBrowserDialer] Hangup error:", err);
    }

    // Also update DB
    if (session?.id) {
      await supabase.from("dialer_sessions").update({
        call_status: "ended",
        call_end_time: new Date().toISOString(),
      } as any).eq("id", session.id);

      await insertCallEvent(session.id, "browser_call_ended", { ended_by: "agent" });
    }

    stopRingback();
    setStatus("ended");

    if (profile?.business_id) {
      await updateAgentState(profile.business_id, profile.user_id, "available");
      setAgentState("available");
    }
  }, [session, profile, stopRingback]);

  const toggleMute = useCallback(() => {
    const client = clientRef.current?.client;
    if (!client) return;

    if (isMuted) {
      client.unmute();
      setIsMuted(false);
      console.log("[useBrowserDialer] Unmuted");
    } else {
      client.mute();
      setIsMuted(true);
      console.log("[useBrowserDialer] Muted");
    }

    if (session?.id) {
      insertCallEvent(session.id, isMuted ? "browser_unmuted" : "browser_muted");
    }
  }, [isMuted, session]);

  const submitDisposition = useCallback(async (disposition: Disposition, notes?: string, followUpDate?: string) => {
    if (!session?.id || !profile) return;

    await saveDisposition(session.id, disposition, notes);
    await saveDetailedDisposition({
      sessionId: session.id,
      leadId: session.lead_id,
      agentId: profile.user_id,
      dispositionType: disposition,
      notes,
      followUpDate,
    });

    await insertCallEvent(session.id, "disposition_set", { disposition, notes });

    // Follow-up reminder
    if (followUpDate && profile.business_id) {
      const entityId = session.lead_id || session.id;
      const dateOnly = followUpDate.split("T")[0];

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
    setSession(null);
    setCallTimer(0);
    setIsMuted(false);
    setDestinationNumber("");
    setLastError(null);
    stopRingback();
    unsubRef.current?.();

    // Don't reset status to idle if registered
    if (registered) {
      setStatus("registered");
    } else {
      setStatus("idle");
    }
  }, [registered, stopRingback]);

  const requestMicPermission = useCallback(async () => {
    try {
      setStatus("requesting_permission");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop()); // Release immediately
      setMicPermission("granted");
      setStatus(registered ? "registered" : "idle");
      console.log("[useBrowserDialer] Mic permission granted");
      return true;
    } catch (err: any) {
      console.error("[useBrowserDialer] Mic permission error:", err);
      setMicPermission("denied");
      setStatus("permission_denied");
      setLastError("Microphone access denied: " + (err.message || err.name));
      return false;
    }
  }, [registered]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const diagnostics: BrowserDialerDiagnostics = {
    sdkLoaded: sdkReady,
    registered,
    micPermission,
    callMode: "browser",
    currentStatus: status,
    destinationNumber,
    selectedCallerId: "",
    lastError,
    lastEvent,
  };

  return {
    // State
    session,
    callStatus: status,
    agentState,
    callTimer,
    formattedTimer: formatTimer(callTimer),
    isMuted,
    previousCalls,
    loading,
    isCallActive,
    registered,
    sdkReady,
    micPermission,
    lastError,
    diagnostics,

    // Actions
    startCall,
    endCall,
    toggleMute,
    submitDisposition,
    tagCall,
    loadLeadHistory,
    resetDialer,
    requestMicPermission,
  };
}
