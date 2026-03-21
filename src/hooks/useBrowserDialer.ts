console.log("🔥 DIALER HOOK LOADED - VERSION 2");
import { useCallback, useEffect, useSyncExternalStore } from "react";
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

export interface DialerLogEntry {
  timestamp: string;
  event: string;
  data?: Record<string, unknown>;
}

export interface BrowserDialerDiagnostics {
  sdkLoaded: boolean;
  registered: boolean;
  micPermission: "unknown" | "granted" | "denied" | "prompt";
  callMode: "browser" | "phone_callback";
  currentStatus: BrowserDialerStatus;
  destinationNumber: string;
  selectedCallerId: string;
  selectedInputDevice: string;
  selectedOutputDevice: string;
  voiceClientRegistration: "offline" | "registering" | "ready" | "failed";
  latestProviderStatus: string | null;
  latestBrowserMediaStatus: string | null;
  lastError: string | null;
  lastEvent: string | null;
}

type MicPermissionState = "unknown" | "granted" | "denied" | "prompt";

interface BrowserDialerStoreState {
  status: BrowserDialerStatus;
  micPermission: MicPermissionState;
  callTimer: number;
  isMuted: boolean;
  session: DialerSession | null;
  previousCalls: DialerSession[];
  loading: boolean;
  registered: boolean;
  sdkReady: boolean;
  agentState: AgentState;
  lastError: string | null;
  lastEvent: string | null;
  destinationNumber: string;
  selectedCallerId: string;
  selectedInputDevice: string;
  selectedOutputDevice: string;
  latestProviderStatus: string | null;
  latestBrowserMediaStatus: string | null;
}

const INITIAL_STATE: BrowserDialerStoreState = {
  status: "idle",
  micPermission: "unknown",
  callTimer: 0,
  isMuted: false,
  session: null,
  previousCalls: [],
  loading: false,
  registered: false,
  sdkReady: false,
  agentState: "available",
  lastError: null,
  lastEvent: null,
  destinationNumber: "",
  selectedCallerId: "",
  selectedInputDevice: "System default",
  selectedOutputDevice: "System default",
  latestProviderStatus: null,
  latestBrowserMediaStatus: null,
};

type DialerIdentity = { businessId: string; userId: string } | null;

// ─── Global singletons ───
const listeners = new Set<() => void>();
let storeState: BrowserDialerStoreState = INITIAL_STATE;
let timerRef: ReturnType<typeof setInterval> | null = null;
let sessionUnsubRef: (() => void) | null = null;
let sessionSubId: string | null = null;
let audioContextRef: AudioContext | null = null;
let ringbackRef: { ctx: AudioContext; osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
let plivoInstanceRef: PlivoBrowserSDK | null = null;
let singletonInitialized = false;
let sdkInitStarted = false;
let permissionListenerBound = false;
let visibilityListenerBound = false;
let globalErrorsBound = false;
let authIdentity: DialerIdentity = null;

// ─── LOG RING BUFFER (last 50 entries) ───
const MAX_LOG_ENTRIES = 50;
const logBuffer: DialerLogEntry[] = [];
const logListeners = new Set<() => void>();
let logSnapshot = [...logBuffer];

function emitLogChange() {
  logSnapshot = [...logBuffer];
  logListeners.forEach((l) => l());
}

function subscribeToLogs(listener: () => void) {
  logListeners.add(listener);
  return () => logListeners.delete(listener);
}

function getLogSnapshot() {
  return logSnapshot;
}

// ─── CORE LOGGER ───
function logDialer(event: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.log(`[DIALER][${timestamp}] ${event}`, data || "");

  logBuffer.push({ timestamp, event, data });
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  emitLogChange();

  setStoreState((current) => ({
    ...current,
    lastEvent: event,
    latestProviderStatus: data?.providerStatus ? String(data.providerStatus) : current.latestProviderStatus,
    latestBrowserMediaStatus: data?.mediaStatus ? String(data.mediaStatus) : current.latestBrowserMediaStatus,
  }));
}

// ─── GLOBAL ERROR HANDLERS ───
function bindGlobalErrorHandlers() {
  if (globalErrorsBound || typeof window === "undefined") return;
  globalErrorsBound = true;

  window.addEventListener("error", (e) => {
    logDialer("GLOBAL_ERROR", { message: e.message, filename: e.filename, lineno: e.lineno });
  });

  window.addEventListener("unhandledrejection", (e) => {
    logDialer("PROMISE_REJECTION", { reason: String(e.reason) });
  });
}

// ─── Store plumbing ───
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return storeState;
}

function transitionStatus(nextStatus: BrowserDialerStatus) {
  const previousStatus = storeState.status;

  if (previousStatus !== "connected" && nextStatus === "connected" && !timerRef) {
    timerRef = setInterval(() => {
      storeState = { ...storeState, callTimer: storeState.callTimer + 1 };
      emitChange();
    }, 1000);
  }

  if (previousStatus === "connected" && nextStatus !== "connected" && timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }

  if (["idle", "ended", "failed"].includes(nextStatus)) {
    storeState = { ...storeState, callTimer: 0 };
  }
}

function setStoreState(
  updater:
    | Partial<BrowserDialerStoreState>
    | ((current: BrowserDialerStoreState) => BrowserDialerStoreState),
) {
  const nextState =
    typeof updater === "function"
      ? updater(storeState)
      : { ...storeState, ...updater };

  if (nextState.status !== storeState.status) {
    transitionStatus(nextState.status);
  }

  storeState = nextState;
  emitChange();
}

// ─── Helpers ───
function formatToE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+") && digits.length >= 8) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+61${digits.slice(1)}`;
  if (digits.startsWith("61") && digits.length >= 9 && digits.length <= 11) return `+${digits}`;
  if (digits.startsWith("91") && digits.length >= 10 && digits.length <= 12) return `+${digits}`;
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
  if (digits.startsWith("1") && digits.length === 11) return `+${digits}`;
  if (digits.length >= 8) return `+${digits}`;
  return phone.trim();
}

function getCallerIdForNumber(number: string): string {
  if (number.startsWith("+91")) return "India caller ID";
  if (number.startsWith("+61")) return "Australia caller ID";
  if (number.startsWith("+1")) return "US caller ID";
  return "Default caller ID";
}

function getVoiceRegistrationState(state: BrowserDialerStoreState): BrowserDialerDiagnostics["voiceClientRegistration"] {
  if (state.registered) return "ready";
  if (state.status === "registering") return "registering";
  if (state.status === "failed") return "failed";
  return "offline";
}

// ─── Audio Context ───
function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContextRef) {
    const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return null;
    audioContextRef = new AudioContextCtor();
  }
  return audioContextRef;
}

async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) {
    logDialer("AUDIO_RESUME_FAILED", { reason: "no_audio_context" });
    setStoreState((current) => ({ ...current, latestBrowserMediaStatus: "audio_context_unavailable" }));
    return null;
  }

  logDialer("AUDIO_CONTEXT_STATE", { state: ctx.state });

  if (ctx.state !== "running") {
    logDialer("AUDIO_RESUME_ATTEMPT");
    try {
      await ctx.resume();
      logDialer("AUDIO_RESUME_SUCCESS", { state: ctx.state });
    } catch (err) {
      logDialer("AUDIO_RESUME_FAILED", { reason: String(err) });
    }
  }

  setStoreState((current) => ({ ...current, latestBrowserMediaStatus: `audio_context_${ctx.state}` }));
  return ctx;
}

// ─── Ringback ───
async function playRingback() {
  try {
    if (ringbackRef) return;
    const ctx = await resumeAudioContext();
    if (!ctx) return;

    logDialer("RINGBACK_START");

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.frequency.value = 440;
    osc1.type = "sine";
    osc1.connect(gain);
    osc1.start();

    const osc2 = ctx.createOscillator();
    osc2.frequency.value = 480;
    osc2.type = "sine";
    osc2.connect(gain);
    osc2.start();

    let time = ctx.currentTime;
    for (let i = 0; i < 20; i += 1) {
      gain.gain.setValueAtTime(0.04, time);
      time += 2;
      gain.gain.setValueAtTime(0, time);
      time += 4;
    }

    ringbackRef = { ctx, osc1, osc2, gain };
  } catch (error) {
    logDialer("RINGBACK_START_FAILED", { reason: error instanceof Error ? error.message : String(error) });
    setStoreState((current) => ({
      ...current,
      latestBrowserMediaStatus: "ringback_failed",
      lastError: error instanceof Error ? error.message : String(error),
    }));
  }
}

function stopRingback() {
  if (!ringbackRef) return;
  logDialer("RINGBACK_STOP");
  try { ringbackRef.gain.disconnect(); } catch {}
  try { ringbackRef.osc1.stop(); } catch {}
  try { ringbackRef.osc2.stop(); } catch {}
  ringbackRef = null;
}

// ─── Agent state ───
async function setAgentAvailability(state: AgentState) {
  if (!authIdentity) return;
  await updateAgentState(authIdentity.businessId, authIdentity.userId, state);
  setStoreState((current) => ({ ...current, agentState: state }));
}

// ─── Session subscription ───
function bindSession(sessionId: string) {
  if (sessionSubId === sessionId) return;
  sessionUnsubRef?.();
  sessionUnsubRef = null;
  sessionSubId = sessionId;

  logDialer("SESSION_CREATED", { sessionId });

  sessionUnsubRef = subscribeToSession(sessionId, (updated) => {
    const dbStatus = updated.call_status;
    setStoreState((current) => ({ ...current, session: updated }));
    logDialer("SESSION_SUBSCRIPTION_EVENT", { sessionId, dbStatus, providerStatus: dbStatus });

    if (dbStatus === "connected") {
      stopRingback();
      setStoreState((current) => ({ ...current, status: "connected" }));
      return;
    }

    if (dbStatus === "ended") {
      stopRingback();
      setStoreState((current) => ({ ...current, status: "ended" }));
      void setAgentAvailability("available");
      return;
    }

    if (["failed", "busy", "no-answer"].includes(dbStatus)) {
      stopRingback();
      setStoreState((current) => ({ ...current, status: "failed" }));
      void setAgentAvailability("available");
    }
  });
}

// ─── Permission listener ───
function bindPermissionListener() {
  if (permissionListenerBound || !navigator.permissions) return;
  navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
    permissionListenerBound = true;
    setStoreState((current) => ({ ...current, micPermission: result.state as MicPermissionState }));
    result.addEventListener("change", () => {
      logDialer("MIC_PERMISSION_CHANGE", { state: result.state });
      setStoreState((current) => ({ ...current, micPermission: result.state as MicPermissionState }));
    });
  }).catch(() => {});
}

// ─── Visibility recovery ───
function bindVisibilityRecovery() {
  if (visibilityListenerBound || typeof document === "undefined") return;
  const onVisibilityChange = () => {
    logDialer("TAB_VISIBILITY_CHANGE", { visibilityState: document.visibilityState });
    if (document.visibilityState === "visible") {
      void resumeAudioContext();
    }
  };
  document.addEventListener("visibilitychange", onVisibilityChange);
  visibilityListenerBound = true;
}

// ─── Plivo event binding ───
function bindPlivoEvents(instance: PlivoBrowserSDK) {
  instance.client.on("onWebrtcNotSupported", () => {
    setStoreState((current) => ({
      ...current,
      status: "failed",
      lastError: "Your browser does not support WebRTC calling",
      latestBrowserMediaStatus: "webrtc_not_supported",
    }));
    logDialer("PLIVO_CLIENT_INIT_FAILED", { reason: "webrtc_not_supported" });
  });

  instance.client.on("onLogin", () => {
    setStoreState((current) => ({
      ...current,
      registered: true,
      status: current.micPermission === "granted" ? "device_ready" : "registered",
      lastError: null,
    }));
    logDialer("VOICE_REGISTERED", { providerStatus: "registered" });
  });

  instance.client.on("onLoginFailed", (cause: string) => {
    setStoreState((current) => ({
      ...current,
      registered: false,
      status: "failed",
      lastError: `Voice registration failed: ${cause}`,
      latestProviderStatus: "registration_failed",
    }));
    logDialer("VOICE_REGISTRATION_FAILED", { reason: cause, providerStatus: cause });
  });

  instance.client.on("onConnectionChange", (connection) => {
    logDialer("PLIVO_CONNECTION_CHANGE", { state: connection?.state || "unknown", providerStatus: connection?.state || "unknown" });
  });

  instance.client.on("onMediaPermission", (result: { status: boolean }) => {
    const mediaStatus = result.status ? "media_permission_granted" : "media_permission_denied";
    logDialer(result.status ? "MIC_PERMISSION_GRANTED" : "MIC_PERMISSION_DENIED", { mediaStatus });
    setStoreState((current) => ({
      ...current,
      micPermission: result.status ? "granted" : "denied",
      status: result.status
        ? current.registered && ["registered", "requesting_permission", "permission_denied"].includes(current.status)
          ? "device_ready"
          : current.status
        : "permission_denied",
      lastError: result.status ? null : "Microphone permission denied. Please allow microphone access in your browser settings.",
      latestBrowserMediaStatus: mediaStatus,
    }));
  });

  instance.client.on("onCallRemoteRinging", async (callInfo: Plivo.CallInfo) => {
    logDialer("CALL_REMOTE_RINGING", { callInfoState: callInfo.state || "ringing", providerStatus: callInfo.state || "ringing" });
    setStoreState((current) => ({ ...current, status: "ringing", latestProviderStatus: callInfo.state || "ringing" }));
    await playRingback();
  });

  instance.client.on("onCallAnswered", async (callInfo: Plivo.CallInfo) => {
    logDialer("CALL_ANSWERED", { callInfoState: callInfo.state || "answered", providerStatus: callInfo.state || "answered" });
    stopRingback();
    await resumeAudioContext();
    setStoreState((current) => ({
      ...current,
      status: "connected",
      latestProviderStatus: callInfo.state || "answered",
      latestBrowserMediaStatus: "media_connected",
    }));
    logDialer("CALL_CONNECTED", { mediaStatus: "media_connected" });
    void setAgentAvailability("on_call");
  });

  instance.client.on("onCallTerminated", (callInfo: Plivo.CallInfo) => {
    logDialer("CALL_TERMINATED", { callInfoState: callInfo.state || "terminated", providerStatus: callInfo.state || "terminated" });
    stopRingback();
    setStoreState((current) => ({
      ...current,
      status: "ended",
      latestProviderStatus: callInfo.state || "terminated",
      latestBrowserMediaStatus: "media_disconnected",
    }));
    void setAgentAvailability("available");
  });

  instance.client.on("onCallFailed", (cause: string) => {
    logDialer("CALL_FAILED", { reason: cause, providerStatus: cause, mediaStatus: "media_failed" });
    stopRingback();
    setStoreState((current) => ({
      ...current,
      status: "failed",
      lastError: `Call failed: ${cause}`,
      latestProviderStatus: cause,
      latestBrowserMediaStatus: "media_failed",
    }));
    void setAgentAvailability("available");
  });

  // Attempt to bind a catch-all for raw events
  try {
    const rawHandler = (eventName: string, ...args: unknown[]) => {
      logDialer("PLIVO_RAW_EVENT", { eventName, args: args.length > 0 ? args : undefined });
    };
    // Plivo SDK may not support wildcard, wrap safely
    if (typeof instance.client.on === "function") {
      for (const evt of [
        "onCalling", "onMediaConnected", "onCallRinging",
        "onIncomingCall", "onIncomingCallCanceled", "onIncomingCallIgnored",
      ]) {
        try {
          instance.client.on(evt, (...args: unknown[]) => rawHandler(evt, ...args));
        } catch {}
      }
    }
  } catch {}
}

// ─── SDK init ───
async function initializeVoiceClient() {
  if (sdkInitStarted || typeof window === "undefined") return;
  sdkInitStarted = true;
  bindPermissionListener();
  bindVisibilityRecovery();
  bindGlobalErrorHandlers();

  logDialer("PLIVO_CLIENT_INIT_START");

  const createClient = async () => {
    if (!window.Plivo) {
      sdkInitStarted = false;
      logDialer("PLIVO_CLIENT_INIT_FAILED", { reason: "SDK_not_loaded" });
      setStoreState((current) => ({
        ...current,
        status: "failed",
        lastError: "Voice SDK failed to load. Check your internet connection.",
      }));
      return;
    }

    const instance = new window.Plivo({ debug: "INFO", permOnClick: true });
    plivoInstanceRef = instance;
    bindPlivoEvents(instance);

    setStoreState((current) => ({ ...current, sdkReady: true, status: "registering" }));
    logDialer("PLIVO_CLIENT_INIT_SUCCESS");
    logDialer("VOICE_REGISTERING");

    try {
      const { data, error } = await supabase.functions.invoke("dialer-browser-token");
      if (error || data?.status === "error" || !data?.username || !data?.password) {
        throw new Error(data?.error || error?.message || "Failed to get voice credentials (missing username or password)");
      }
      logDialer("TOKEN_RECEIVED", { username: data.username, hasPassword: !!data.password, app_id: data.app_id });
      console.log("[DIALER] TOKEN RECEIVED FULL", { username: data.username, passwordLength: data.password?.length, app_id: data.app_id });
      instance.client.login(data.username, data.password);
    } catch (error) {
      logDialer("TOKEN_FETCH_FAILED", { reason: error instanceof Error ? error.message : String(error) });
      setStoreState((current) => ({
        ...current,
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
      }));
      sdkInitStarted = false;
    }
  };

  if (window.Plivo) {
    await createClient();
    return;
  }

  let attempts = 0;
  const interval = window.setInterval(() => {
    attempts += 1;
    if (window.Plivo) {
      clearInterval(interval);
      void createClient();
    } else if (attempts > 20) {
      clearInterval(interval);
      sdkInitStarted = false;
      logDialer("PLIVO_CLIENT_INIT_FAILED", { reason: "SDK_load_timeout_10s" });
      setStoreState((current) => ({
        ...current,
        status: "failed",
        lastError: "Voice SDK failed to load. Check your internet connection.",
      }));
    }
  }, 500);
}

// ─── Mic permission ───
async function requestMicrophonePermissionInternal() {
  try {
    logDialer("MIC_PERMISSION_REQUEST");
    setStoreState((current) => ({ ...current, status: "requesting_permission", lastError: null }));
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    await resumeAudioContext();

    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings();
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const inputDevice = devices.find((device) => device.kind === "audioinput" && device.deviceId === settings.deviceId);
    const outputDevice = devices.find((device) => device.kind === "audiooutput");

    stream.getTracks().forEach((trackItem) => trackItem.stop());

    const inputLabel = inputDevice?.label || track?.label || "Default microphone";
    const outputLabel = outputDevice?.label || "System default speaker";

    logDialer("MIC_PERMISSION_GRANTED", { inputDevice: inputLabel, outputDevice: outputLabel });

    setStoreState((current) => ({
      ...current,
      micPermission: "granted",
      status: current.registered ? "device_ready" : "idle",
      selectedInputDevice: inputLabel,
      selectedOutputDevice: outputLabel,
      latestBrowserMediaStatus: "device_ready",
      lastError: null,
    }));

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logDialer("MIC_PERMISSION_DENIED", { reason: message });
    setStoreState((current) => ({
      ...current,
      micPermission: "denied",
      status: "permission_denied",
      lastError: `Microphone access denied: ${message}`,
      latestBrowserMediaStatus: "permission_denied",
    }));
    toast.error("Microphone permission denied. Please allow access to make calls.");
    return false;
  }
}

// ─── Hook ───
export function useBrowserDialer() {
  const { profile } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const logs = useSyncExternalStore(subscribeToLogs, getLogSnapshot, getLogSnapshot);

  useEffect(() => {
    authIdentity = profile?.business_id ? { businessId: profile.business_id, userId: profile.user_id } : null;
    if (!singletonInitialized) {
      singletonInitialized = true;
      logDialer("TEST_LOG_ACTIVE");
      void initializeVoiceClient();
    }
  }, [profile?.business_id, profile?.user_id]);

  const loadLeadHistory = useCallback(async (leadId: string) => {
    const calls = await fetchLeadCallHistory(leadId);
    setStoreState((current) => ({ ...current, previousCalls: calls }));
  }, []);

  const requestMicPermission = useCallback(async () => {
    return requestMicrophonePermissionInternal();
  }, []);

  const startCall = useCallback(async (phoneNumber: string, leadId?: string, clientId?: string) => {
    console.log("🔥 START CALL TRIGGERED");
    logDialer("USER_CLICK_CALL", { destination: phoneNumber, leadId, clientId });

    if (!profile?.business_id || storeState.loading || ["calling", "ringing", "connected"].includes(storeState.status)) {
      logDialer("CALL_BLOCKED", { reason: "busy_or_no_profile", currentStatus: storeState.status });
      return;
    }
    if (!plivoInstanceRef?.client || !storeState.registered) {
      logDialer("CALL_BLOCKED", { reason: "voice_client_not_ready", registered: storeState.registered });
      toast.error("Voice client not ready. Please wait for registration.");
      return;
    }
    if (storeState.micPermission !== "granted") {
      const granted = await requestMicrophonePermissionInternal();
      if (!granted) return;
    }

    setStoreState((current) => ({ ...current, loading: true, lastError: null }));

    try {
      await resumeAudioContext();

      let resolvedPhone = phoneNumber;
      if (leadId) {
        const { data: lead } = await supabase.from("leads").select("phone").eq("id", leadId).maybeSingle();
        if (lead?.phone) resolvedPhone = lead.phone;
      }

      const normalizedPhone = formatToE164(resolvedPhone);
      logDialer("DESTINATION_NORMALIZED", { raw: resolvedPhone, normalized: normalizedPhone });

      if (!normalizedPhone.startsWith("+") || normalizedPhone.replace(/\D/g, "").length < 8) {
        logDialer("INVALID_DESTINATION", { normalized: normalizedPhone });
        setStoreState((current) => ({ ...current, status: "failed", loading: false, lastError: "Invalid destination number", latestProviderStatus: "invalid_destination" }));
        toast.error("Please enter a valid phone number.");
        return;
      }

      const selectedCallerId = getCallerIdForNumber(normalizedPhone);
      logDialer("CALLER_ID_SELECTED", { callerId: selectedCallerId, destination: normalizedPhone });

      setStoreState((current) => ({
        ...current,
        destinationNumber: normalizedPhone,
        selectedCallerId,
        status: "calling",
        isMuted: false,
        callTimer: 0,
        latestProviderStatus: "calling",
        latestBrowserMediaStatus: "audio_context_ready",
      }));

      const sess = await createDialerSession({
        businessId: profile.business_id,
        userId: profile.user_id,
        phoneNumber: normalizedPhone,
        leadId,
        clientId,
      });

      if (!sess) throw new Error("Failed to create call session");

      logDialer("SESSION_CREATED", { sessionId: sess.id });
      await supabase.from("dialer_sessions").update({ call_mode: "browser", call_status: "initiating" } as never).eq("id", sess.id);

      bindSession(sess.id);
      setStoreState((current) => ({ ...current, session: sess }));
      await setAgentAvailability("on_call");

      logDialer("CALL_DIAL_START", { destination: normalizedPhone, sessionId: sess.id });
      plivoInstanceRef.client.call(normalizedPhone, { "X-PH-SessionId": sess.id });

      await insertCallEvent(sess.id, "browser_call_initiated", { destination: normalizedPhone, call_mode: "browser" });
      toast.info(`Calling ${normalizedPhone}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Call initiation failed";
      logDialer("CALL_START_ERROR", { reason: message });
      setStoreState((current) => ({ ...current, status: "failed", lastError: message, latestProviderStatus: "call_start_failed" }));
      await setAgentAvailability("available");
      toast.error(message);
    } finally {
      setStoreState((current) => ({ ...current, loading: false }));
    }
  }, [profile]);

  const endCall = useCallback(async () => {
    logDialer("HANGUP_REQUESTED");
    try { plivoInstanceRef?.client?.hangup(); } catch {}

    if (storeState.session?.id) {
      await supabase.from("dialer_sessions").update({ call_status: "ended", call_end_time: new Date().toISOString() } as never).eq("id", storeState.session.id);
      await insertCallEvent(storeState.session.id, "browser_call_ended", { ended_by: "agent" });
    }

    stopRingback();
    logDialer("CALL_CLEANUP_START");
    setStoreState((current) => ({ ...current, status: "ended", latestProviderStatus: "hangup_requested", latestBrowserMediaStatus: "media_disconnected" }));
    await setAgentAvailability("available");
    logDialer("CALL_CLEANUP_DONE");
  }, []);

  const toggleMute = useCallback(() => {
    const client = plivoInstanceRef?.client;
    if (!client) return;

    if (storeState.isMuted) {
      client.unmute();
      setStoreState((current) => ({ ...current, isMuted: false }));
      logDialer("BROWSER_UNMUTED", { mediaStatus: "microphone_live" });
    } else {
      client.mute();
      setStoreState((current) => ({ ...current, isMuted: true }));
      logDialer("BROWSER_MUTED", { mediaStatus: "microphone_muted" });
    }

    if (storeState.session?.id) {
      void insertCallEvent(storeState.session.id, storeState.isMuted ? "browser_unmuted" : "browser_muted");
    }
  }, []);

  const submitDisposition = useCallback(async (disposition: Disposition, notes?: string, followUpDate?: string) => {
    if (!storeState.session?.id || !profile) return;

    await saveDisposition(storeState.session.id, disposition, notes);
    await saveDetailedDisposition({
      sessionId: storeState.session.id,
      leadId: storeState.session.lead_id,
      agentId: profile.user_id,
      dispositionType: disposition,
      notes,
      followUpDate,
    });

    await insertCallEvent(storeState.session.id, "disposition_set", { disposition, notes });

    if (followUpDate && profile.business_id) {
      const entityId = storeState.session.lead_id || storeState.session.id;
      const dateOnly = followUpDate.split("T")[0];
      const { count } = await supabase.from("reminders").select("id", { count: "exact", head: true }).eq("entity_id", entityId).eq("assigned_to_user_id", profile.user_id).gte("due_at", dateOnly).lt("due_at", new Date(new Date(dateOnly).getTime() + 86400000).toISOString().split("T")[0]);

      if ((count || 0) === 0) {
        await supabase.from("reminders").insert({
          business_id: profile.business_id,
          entity_type: "lead" as never,
          entity_id: entityId,
          assigned_to_user_id: profile.user_id,
          created_by_user_id: profile.user_id,
          title: `Follow-up call: ${storeState.session.phone_number}`,
          due_at: followUpDate,
          priority: "high" as never,
        });
      }
    }

    toast.success("Disposition saved");
  }, [profile]);

  const tagCall = useCallback(async (tag: CallTag) => {
    if (!storeState.session?.id || !profile) return;
    await addCallTag(storeState.session.id, tag, profile.user_id);
    toast.success(`Tagged as ${tag.replace("_", " ")}`);
  }, [profile]);

  const resetDialer = useCallback(() => {
    logDialer("DIALER_RESET");
    stopRingback();
    sessionUnsubRef?.();
    sessionUnsubRef = null;
    sessionSubId = null;
    setStoreState((current) => ({
      ...current,
      session: null,
      callTimer: 0,
      isMuted: false,
      destinationNumber: "",
      selectedCallerId: "",
      lastError: null,
      latestProviderStatus: null,
      latestBrowserMediaStatus: current.registered ? "idle_ready" : null,
      status: current.registered ? (current.micPermission === "granted" ? "device_ready" : "registered") : "idle",
    }));
  }, []);

  const diagnostics: BrowserDialerDiagnostics = {
    sdkLoaded: state.sdkReady,
    registered: state.registered,
    micPermission: state.micPermission,
    callMode: "browser",
    currentStatus: state.status,
    destinationNumber: state.destinationNumber,
    selectedCallerId: state.selectedCallerId,
    selectedInputDevice: state.selectedInputDevice,
    selectedOutputDevice: state.selectedOutputDevice,
    voiceClientRegistration: getVoiceRegistrationState(state),
    latestProviderStatus: state.latestProviderStatus,
    latestBrowserMediaStatus: state.latestBrowserMediaStatus,
    lastError: state.lastError,
    lastEvent: state.lastEvent,
  };

  const formatTimer = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;

  return {
    session: state.session,
    callStatus: state.status,
    agentState: state.agentState,
    callTimer: state.callTimer,
    formattedTimer: formatTimer(state.callTimer),
    isMuted: state.isMuted,
    previousCalls: state.previousCalls,
    loading: state.loading,
    isCallActive: ["calling", "ringing", "connected"].includes(state.status),
    registered: state.registered,
    sdkReady: state.sdkReady,
    micPermission: state.micPermission,
    lastError: state.lastError,
    diagnostics,
    debugLogs: logs,
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
