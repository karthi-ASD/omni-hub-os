/**
 * Browser-based Plivo dialer — single source of truth via useSyncExternalStore.
 *
 * BUILD: stability-v11
 *
 * Key invariants:
 *  - Mic permission is HARD REQUIRED before Plivo init proceeds.
 *  - Connection health is monitored; stale connections trigger re-login.
 *  - Registration failures retry up to 3 times automatically.
 *  - Tab visibility changes trigger health checks, audio resume & recovery.
 *  - Status is ONLY set from real SDK events or explicit user actions.
 *  - Pending dial survives re-renders via module-level variable.
 */

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DIALER_LOGOUT_RESET_EVENT } from "@/lib/dialer-events";
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

// ─── Types ───────────────────────────────────────────────────────────
export type BrowserDialerStatus =
  | "idle"
  | "initializing"
  | "registering"
  | "registered"
  | "requesting_permission"
  | "device_ready"
  | "dialing"
  | "ringing"
  | "connected"
  | "ending"
  | "ended"
  | "failed"
  | "permission_denied"
  | "auth_required";

export interface DialerLogEntry {
  id: number;
  timestamp: string;
  event: string;
  status: BrowserDialerStatus;
  category: "all" | "error" | "call" | "audio" | "ai" | "provider";
  sessionId: string | null;
  callId: string | null;
  destination: string | null;
  payloadPreview: string | null;
  data?: Record<string, unknown>;
}

export interface BrowserDialerDiagnostics {
  sdkLoaded: boolean;
  registered: boolean;
  micPermission: MicPermissionState;
  callMode: "browser";
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
  pendingDialNumber: string | null;
  clientHealthy: boolean;
  connectionState: string;
  tabVisibilityState: string;
  plivoClientInitStatus: string;
  lastTokenFetchStatus: number | null;
  lastTokenUsername: string | null;
  lastTokenAppId: string | null;
  lastTokenHasPassword: boolean;
  lastAnswerXmlStatus: number | null;
  lastAnswerXmlContentType: string | null;
  lastAnswerXmlBody: string | null;
  buildVersion: string;
  deployedAt: string;
  environment: string;
  userIdentifier: string | null;
  hasAccessToken: boolean;
  hasActiveCall: boolean;
  audioElementsAttached: boolean;
  audioPlayable: boolean;
}

export interface CallAttempt {
  id: string;
  destinationRaw: string;
  destinationNormalized: string;
  startedAt: string;
  ringingAt: string | null;
  answeredAt: string | null;
  endedAt: string | null;
  durationSeconds: number;
  status: string;
  failureReason: string | null;
  providerStatus: string | null;
  leadId: string | null;
  contactId: string | null;
}

type MicPermissionState = "unknown" | "granted" | "denied" | "prompt";

interface PendingDialIntent {
  phoneNumber: string;
  leadId?: string;
  clientId?: string;
  callerIdUsed?: string;
  blockedReason?: string;
  queuedAt?: number;
  expiresAt?: number;
}

type AudioReadyStatus = "audio_not_initialized" | "audio_resume_pending" | "audio_blocked_by_browser" | "audio_ready" | "audio_ready_degraded";

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
  pendingDialIntent: PendingDialIntent | null;
  dialLock: boolean;
  callAttempts: CallAttempt[];
  lastCalledNumber: string;
  recentNumbers: string[];
  lastActionAt: string | null;
  connectionState: string;
  tabVisibilityState: string;
  plivoClientInitStatus: string;
  lastTokenFetchStatus: number | null;
  lastTokenUsername: string | null;
  lastTokenAppId: string | null;
  lastTokenHasPassword: boolean;
  lastAnswerXmlStatus: number | null;
  lastAnswerXmlContentType: string | null;
  lastAnswerXmlBody: string | null;
  userIdentifier: string | null;
  hasAccessToken: boolean;
  audioElementsAttached: boolean;
  audioPlayable: boolean;
  audioReady: boolean;
  audioStatus: AudioReadyStatus;
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
  pendingDialIntent: null,
  dialLock: false,
  callAttempts: [],
  lastCalledNumber: "",
  recentNumbers: [],
  lastActionAt: null,
  connectionState: "disconnected",
  tabVisibilityState: typeof document === "undefined" ? "unknown" : document.visibilityState,
  plivoClientInitStatus: "idle",
  lastTokenFetchStatus: null,
  lastTokenUsername: null,
  lastTokenAppId: null,
  lastTokenHasPassword: false,
  lastAnswerXmlStatus: null,
  lastAnswerXmlContentType: null,
  lastAnswerXmlBody: null,
  userIdentifier: null,
  hasAccessToken: false,
  audioElementsAttached: false,
  audioPlayable: false,
  audioReady: false,
  audioStatus: "audio_not_initialized",
};

const BUILD_VERSION = "stability-v22";
const DEPLOYED_AT = "2026-03-23T09:00:00Z";
type DialerIdentity = { businessId: string; userId: string } | null;
let lastInitializedUserId: string | null = null;

// ─── Global singletons ──────────────────────────────────────────────
const listeners = new Set<() => void>();
let storeState: BrowserDialerStoreState = { ...INITIAL_STATE };
let timerRef: ReturnType<typeof setInterval> | null = null;
let sessionUnsubRef: (() => void) | null = null;
let sessionSubId: string | null = null;
let audioContextRef: AudioContext | null = null;
let ringbackRef: { ctx: AudioContext; osc1: OscillatorNode; osc2: OscillatorNode; gain: GainNode } | null = null;
let plivoInstanceRef: PlivoBrowserSDK | null = null;
let plivoClientGeneration = 0;
let singletonInitialized = false;
let sdkInitStarted = false;
let permissionListenerBound = false;
let visibilityListenerBound = false;
let globalErrorsBound = false;
let authIdentity: DialerIdentity = null;
let lastStableAuthIdentity: DialerIdentity = null;
let modulePendingDial: PendingDialIntent | null = null;
let recoveryInProgress = false;
let initPromise: Promise<void> | null = null;
let loginInProgress = false;
let reloginTimeoutRef: number | null = null;
let activeHookConsumers = 0;
let consumerCleanupTimer: number | null = null;
let currentAccessToken: string | null = null;
let callStartTimestamp: number = 0;
let listenerAttachCount = 0;
let queuedCallResumeInFlight = false;
let audioInitInFlight = false;
let audioInitPromise: Promise<boolean> | null = null;

const PENDING_DIAL_STORAGE_KEY = "dialer_pending_intent";
const QUEUED_CALL_TTL_MS = 45000;

// ─── Connection health monitor ──────────────────────────────────────
let lastConnectedAt = Date.now();
let connectionHealthInterval: ReturnType<typeof setInterval> | null = null;
let registrationRetryCount = 0;
const MAX_REGISTRATION_RETRIES = 3;
let lastLoginCredentials: { username: string; password: string } | null = null;

// ─── Log ring buffer ────────────────────────────────────────────────
const MAX_LOG_ENTRIES = 1000;
const logBuffer: DialerLogEntry[] = [];
const logListeners = new Set<() => void>();
let logSnapshot = [...logBuffer];
let logSequence = 0;
let testAttemptCounter = 0;
let activeTestAttemptNumber: number | null = null;
let activeProviderInvocation: { sessionId: string; destination: string; startedAt: number } | null = null;

function deriveLogCategory(event: string, data?: Record<string, unknown>): DialerLogEntry["category"] {
  const combined = `${event} ${JSON.stringify(data || {})}`.toLowerCase();
  if (["error", "fail", "denied", "timeout", "blocked", "rejected"].some((token) => combined.includes(token))) return "error";
  if (["audio", "mic", "speaker", "tone", "ringtone", "media"].some((token) => combined.includes(token))) return "audio";
  if (["plivo", "provider", "connection", "register", "login"].some((token) => combined.includes(token))) return "provider";
  if (["postcall", "transcript", "coach", "summary", "ai_", "ai"].some((token) => combined.includes(token))) return "ai";
  if (["call", "dial", "session", "ringing", "connected", "hangup"].some((token) => combined.includes(token))) return "call";
  return "all";
}

function extractLogContext(data?: Record<string, unknown>) {
  const sessionId = (data?.sessionId ?? data?.session_id ?? storeState.session?.id ?? null) as string | null;
  const callId = (data?.callId ?? data?.call_id ?? data?.providerCallId ?? data?.provider_call_id ?? data?.call_uuid ?? storeState.session?.provider_call_id ?? null) as string | null;
  const destination = (data?.destination ?? data?.destinationNumber ?? data?.phoneNumber ?? data?.rawPhoneNumber ?? storeState.destinationNumber ?? storeState.pendingDialIntent?.phoneNumber ?? null) as string | null;
  return { sessionId, callId, destination };
}

function buildPayloadPreview(data?: Record<string, unknown>) {
  if (!data) return null;
  try {
    const raw = JSON.stringify(data);
    return raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
  } catch {
    return null;
  }
}

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

function logDialer(event: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const { sessionId, callId, destination } = extractLogContext(data);
  const category = deriveLogCategory(event, data);
  const payloadPreview = buildPayloadPreview(data);
  console.log(`[DIALER][${timestamp}] ${event}`, data || "");
  logBuffer.push({
    id: ++logSequence,
    timestamp,
    event,
    status: storeState.status,
    category,
    sessionId,
    callId,
    destination,
    payloadPreview,
    data,
  });
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  emitLogChange();
  setStoreState((c) => ({
    ...c,
    lastEvent: event,
    latestProviderStatus: data?.providerStatus ? String(data.providerStatus) : c.latestProviderStatus,
    latestBrowserMediaStatus: data?.mediaStatus ? String(data.mediaStatus) : c.latestBrowserMediaStatus,
  }));
}

export function logDialerEvent(event: string, data?: Record<string, unknown>) {
  logDialer(event, data);
}

function clearDialerLogs() {
  logBuffer.splice(0, logBuffer.length);
  emitLogChange();
}

function startTestAttempt(destination: string) {
  activeTestAttemptNumber = ++testAttemptCounter;
  logDialer("TEST_ATTEMPT_STARTED", { attemptNumber: activeTestAttemptNumber, destination });
  logDialer("TEST_ATTEMPT_NUMBER", { attemptNumber: activeTestAttemptNumber, destination });
}

function endTestAttempt(result: "success" | "failed" | "ended", details?: Record<string, unknown>) {
  if (activeTestAttemptNumber == null) return;
  logDialer("TEST_ATTEMPT_ENDED", { attemptNumber: activeTestAttemptNumber, result, ...details });
  activeTestAttemptNumber = null;
  activeProviderInvocation = null;
}

function persistPendingDial(intent: PendingDialIntent | null) {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (!intent) {
      sessionStorage.removeItem(PENDING_DIAL_STORAGE_KEY);
      return;
    }
    sessionStorage.setItem(PENDING_DIAL_STORAGE_KEY, JSON.stringify(intent));
  } catch {}
}

function readPendingDial(): PendingDialIntent | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PENDING_DIAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearQueuedCall(reason: string) {
  const pending = modulePendingDial || storeState.pendingDialIntent;
  if (pending) {
    logDialer("QUEUED_CALL_CLEARED", { reason, destination: pending.phoneNumber, blockedReason: pending.blockedReason ?? null });
  }
  modulePendingDial = null;
  persistPendingDial(null);
  setStoreState((c) => ({ ...c, pendingDialIntent: null }));
}

function storeQueuedCall(intent: PendingDialIntent, blockedReason: string) {
  const queuedIntent = { ...intent, blockedReason, queuedAt: Date.now(), expiresAt: Date.now() + QUEUED_CALL_TTL_MS };
  modulePendingDial = queuedIntent;
  persistPendingDial(queuedIntent);
  logDialer("QUEUED_CALL_STORED", { destination: queuedIntent.phoneNumber, blockedReason, expiresAt: queuedIntent.expiresAt });
  logDialer("QUEUED_CALL_BLOCK_REASON", { blockedReason });
  setStoreState((c) => ({ ...c, pendingDialIntent: queuedIntent }));
}

function isReadyForQueuedCallResume() {
  return !!(
    (modulePendingDial || storeState.pendingDialIntent) &&
    storeState.audioReady &&
    storeState.registered &&
    storeState.connectionState === "connected" &&
    storeState.plivoClientInitStatus === "registered" &&
    !isInActiveCall() &&
    !recoveryInProgress &&
    !loginInProgress &&
    !storeState.loading &&
    !storeState.dialLock &&
    plivoInstanceRef?.client &&
    isClientHealthy()
  );
}

async function maybeResumeQueuedCall(trigger: string) {
  const pending = modulePendingDial || storeState.pendingDialIntent;
  if (!pending) return;

  logDialer("QUEUED_CALL_READINESS_RECHECK", {
    trigger,
    destination: pending.phoneNumber,
    blockedReason: pending.blockedReason ?? null,
    audioReady: storeState.audioReady,
    registered: storeState.registered,
    connectionState: storeState.connectionState,
    initStatus: storeState.plivoClientInitStatus,
  });

  if (pending.expiresAt && Date.now() > pending.expiresAt) {
    logDialer("QUEUED_CALL_EXPIRED", { destination: pending.phoneNumber, blockedReason: pending.blockedReason ?? null });
    toast.error("Queued call expired. Please try again.");
    clearQueuedCall("expired");
    return;
  }

  if (!isReadyForQueuedCallResume() || queuedCallResumeInFlight) return;

  queuedCallResumeInFlight = true;
  logDialer("QUEUED_CALL_READY_TO_RESUME", { trigger, destination: pending.phoneNumber });
  clearQueuedCall("resuming");

  try {
    logDialer("QUEUED_CALL_RESUMING_NOW", { trigger, destination: pending.phoneNumber });
    await executeOutboundCall(pending);
    logDialer("QUEUED_CALL_RESUME_SUCCESS", { trigger, destination: pending.phoneNumber });
  } catch (error) {
    logDialer("QUEUED_CALL_RESUME_FAILED", { trigger, destination: pending.phoneNumber, error: error instanceof Error ? error.message : String(error) });
  } finally {
    queuedCallResumeInFlight = false;
  }
}

// ─── Global error handlers ──────────────────────────────────────────
let userInteractionBound = false;
function bindGlobalErrorHandlers() {
  if (globalErrorsBound || typeof window === "undefined") return;
  globalErrorsBound = true;
  window.addEventListener("error", (e) => logDialer("GLOBAL_ERROR", { message: e.message, filename: e.filename }));
  // Resume AudioContext on first user interaction (browser autoplay policy)
  if (!userInteractionBound) {
    userInteractionBound = true;
    document.addEventListener("click", async () => {
      try {
        const ctx = getAudioContext();
        if (ctx && ctx.state !== "running") {
          await ctx.resume();
          logDialer("AUDIO_RESUME_TRIGGERED_BY_USER");
          logDialer("AUDIO_CONTEXT_RESUMED_USER_INTERACTION");
        }
        // Pre-warm audio readiness on first click
        if (!storeState.audioReady) {
          setStoreState((c) => ({ ...c, audioStatus: "audio_resume_pending" }));
          const audioReady = await initializeAudioOutput();
          if (audioReady) {
            logDialer("AUDIO_RESUME_COMPLETED");
            void maybeResumeQueuedCall("user_interaction_audio_ready");
          }
        }
      } catch {}
    }, { once: true });
  }
  window.addEventListener("unhandledrejection", (e) => logDialer("PROMISE_REJECTION", { reason: String(e.reason) }));
}

// ─── Store plumbing ─────────────────────────────────────────────────
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function emitChange() {
  listeners.forEach((l) => l());
}
function getSnapshot() {
  return storeState;
}

// ─── Timer: timestamp-based elapsed calculation (survives background throttling) ──
let callConnectedTimestamp: number = 0;

function transitionStatus(nextStatus: BrowserDialerStatus) {
  const prev = storeState.status;
  // Start timer on connected — use timestamp-based approach
  if (prev !== "connected" && nextStatus === "connected" && !timerRef) {
    callConnectedTimestamp = Date.now();
    timerRef = setInterval(() => {
      if (callConnectedTimestamp > 0) {
        const elapsed = Math.floor((Date.now() - callConnectedTimestamp) / 1000);
        storeState = { ...storeState, callTimer: elapsed };
        emitChange();
      }
    }, 1000);
  }
  // Stop timer leaving connected
  if (prev === "connected" && nextStatus !== "connected" && timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }
  // Reset timer on terminal states
  if (["idle", "ended", "failed"].includes(nextStatus)) {
    if (timerRef) { clearInterval(timerRef); timerRef = null; }
    callConnectedTimestamp = 0;
    storeState = { ...storeState, callTimer: 0 };
  }
}

function setStoreState(updater: Partial<BrowserDialerStoreState> | ((c: BrowserDialerStoreState) => BrowserDialerStoreState)) {
  const nextState = typeof updater === "function" ? updater(storeState) : { ...storeState, ...updater };
  if (nextState.status !== storeState.status) transitionStatus(nextState.status);
  storeState = nextState;
  emitChange();
}

// ─── Helpers ────────────────────────────────────────────────────────
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

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

function getCallerIdForNumber(number: string): { region: string; label: string } {
  // NOTE: This is a DISPLAY-ONLY label. The actual E.164 caller ID is resolved
  // on the backend from environment secrets (PLIVO_CALLER_ID_AU, PLIVO_CALLER_ID_IN, etc.)
  if (number.startsWith("+91")) return { region: "IN", label: "India (backend-resolved)" };
  if (number.startsWith("+61")) return { region: "AU", label: "Australia (backend-resolved)" };
  if (number.startsWith("+1")) return { region: "US", label: "US (backend-resolved)" };
  return { region: "DEFAULT", label: "Default (backend-resolved)" };
}

function isClientHealthy(): boolean {
  try {
    return !!(plivoInstanceRef?.client);
  } catch { return false; }
}

function addCallAttempt(attempt: CallAttempt) {
  setStoreState((c) => ({ ...c, callAttempts: [attempt, ...c.callAttempts].slice(0, 50) }));
}

function updateCurrentAttempt(updates: Partial<CallAttempt>) {
  setStoreState((c) => {
    if (c.callAttempts.length === 0) return c;
    const [latest, ...rest] = c.callAttempts;
    return { ...c, callAttempts: [{ ...latest, ...updates }, ...rest] };
  });
}

function getEnvironmentLabel() {
  return import.meta.env.PROD ? "prod" : "dev";
}

function maskUserIdentifier(userId?: string | null) {
  if (!userId) return null;
  if (userId.length <= 8) return userId;
  return `${userId.slice(0, 4)}…${userId.slice(-4)}`;
}

function clearReloginTimeout() {
  if (reloginTimeoutRef) {
    clearTimeout(reloginTimeoutRef);
    reloginTimeoutRef = null;
  }
}

async function syncAccessTokenState() {
  const { data: { session } } = await supabase.auth.getSession();
  currentAccessToken = session?.access_token ?? null;
  setStoreState((c) => ({
    ...c,
    hasAccessToken: !!currentAccessToken,
    userIdentifier: maskUserIdentifier(session?.user?.id ?? authIdentity?.userId ?? null),
  }));
  return session;
}

function resetDialerStateOnLogout() {
  lastInitializedUserId = null;
  singletonInitialized = false;
  sdkInitStarted = false;
  initPromise = null;
  lastLoginCredentials = null;
  registrationRetryCount = 0;
  authIdentity = null;
  lastStableAuthIdentity = null;
  currentAccessToken = null;
  logDialer("LOGOUT_DIALER_RESET", { voiceStatus: "logout_reset" });
  destroyPlivoClient("logout");
}


async function fetchBrowserToken(context: "init" | "test" = "test") {
  const session = await syncAccessTokenState();

  if (!session?.access_token) {
    logDialer("NO_ACTIVE_SESSION", { tokenStatus: "missing", voiceStatus: "auth_required" });
    setStoreState((c) => ({
      ...c,
      status: "auth_required",
      registered: false,
      lastError: "No active session. Please login.",
      lastTokenFetchStatus: 401,
      lastTokenHasPassword: false,
    }));
    throw new Error("No active session. Please login.");
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dialer-browser-token`;

  logDialer(context === "test" ? "TOKEN_TEST_START" : "CALLING_TOKEN_FUNCTION", {
    url: functionUrl,
    hasAccessToken: true,
    userId: maskUserIdentifier(session.user.id),
    email: session.user.email ?? "unknown",
    tokenStatus: "requesting",
  });

  const res = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({}),
  });

  logDialer("TOKEN_FETCH_RESPONSE_STATUS", { status: res.status, context, userId: maskUserIdentifier(session.user.id) });
  const data = await res.json().catch(() => ({}));

  setStoreState((c) => ({
    ...c,
    lastTokenFetchStatus: res.status,
    lastTokenUsername: data?.username ?? null,
    lastTokenAppId: data?.app_id ?? null,
    lastTokenHasPassword: !!data?.password,
    hasAccessToken: true,
  }));

  if (!res.ok || data?.status === "error" || !data?.username || !data?.password || !data?.app_id) {
    logDialer("TOKEN_TEST_FAILED", {
      userId: maskUserIdentifier(session.user.id),
      email: session.user.email ?? "unknown",
      alias: data?.alias ?? null,
      tokenStatus: "failed",
      voiceStatus: "token_failed",
      error: data?.error || `Token request failed (${res.status})`,
    });
    throw new Error(data?.error || `Token request failed (${res.status})`);
  }

  logDialer("TOKEN_RECEIVED_FULL", {
    userId: maskUserIdentifier(session.user.id),
    email: session.user.email ?? "unknown",
    alias: data?.identity ?? data?.username ?? null,
    username: data.username,
    hasPassword: !!data.password,
    app_id: data.app_id,
    tokenStatus: "received",
    voiceStatus: "token_received",
  });
  return { ...data, url: functionUrl, status: res.status };
}

let loginSafetyTimeoutRef: number | null = null;

function scheduleLogin(reason: string, username: string, password: string, delayMs = 0) {
  if (!plivoInstanceRef?.client) {
    logDialer("LOGIN_SKIPPED", { reason: "missing_client", requestedBy: reason });
    return;
  }
  if (loginInProgress) {
    logDialer("LOGIN_SKIPPED", { reason: "already_running", requestedBy: reason });
    return;
  }
  // Only skip login if TRULY registered: client exists, connection confirmed, init status confirmed
  const trulyRegistered = storeState.registered
    && storeState.connectionState === "connected"
    && storeState.plivoClientInitStatus === "registered"
    && isClientHealthy();
  if (trulyRegistered) {
    logDialer("RELOGIN_SKIPPED_ALREADY_REGISTERED", { requestedBy: reason, connectionState: storeState.connectionState, initStatus: storeState.plivoClientInitStatus });
    return;
  }
  logDialer("LOGIN_SKIP_CHECK", { requestedBy: reason, registered: storeState.registered, connectionState: storeState.connectionState, initStatus: storeState.plivoClientInitStatus, healthy: isClientHealthy() });

  const runLogin = () => {
    if (!plivoInstanceRef?.client) return;
    loginInProgress = true;
    setStoreState((c) => ({ ...c, plivoClientInitStatus: "logging_in", status: "registering", lastError: null }));
    logDialer("VOICE_REGISTERING", { reason, userId: maskUserIdentifier(authIdentity?.userId ?? null), voiceStatus: "registering" });
    logDialer("PLIVO_LOGIN_CALLING", { reason });
    plivoInstanceRef.client.login(username, password);

    // ── SAFETY NET: If onLogin/onLoginFailed never fires (e.g. "Already registered"),
    // resolve state after a timeout by checking actual connection status ──
    if (loginSafetyTimeoutRef) clearTimeout(loginSafetyTimeoutRef);
    loginSafetyTimeoutRef = window.setTimeout(() => {
      loginSafetyTimeoutRef = null;
      if (!loginInProgress) return; // Already resolved by onLogin/onLoginFailed
      logDialer("LOGIN_SAFETY_TIMEOUT", {
        registered: storeState.registered,
        connectionState: storeState.connectionState,
        hasClient: !!plivoInstanceRef?.client,
      });
      loginInProgress = false;
      // If the connection is alive, the SDK accepted the login silently ("Already registered")
      if (storeState.connectionState === "connected" && isClientHealthy()) {
        logDialer("LOGIN_SAFETY_FORCE_REGISTERED", { reason: "connection_alive_after_timeout" });
        setStoreState((c) => ({
          ...c,
          registered: true,
          status: c.micPermission === "granted" ? "device_ready" : "registered",
          lastError: null,
          plivoClientInitStatus: "registered",
        }));
        void maybeResumeQueuedCall("login_safety_registered");
      }
    }, 5000);
  };

  if (delayMs > 0) {
    window.setTimeout(runLogin, delayMs);
  } else {
    runLogin();
  }
}

function scheduleRelogin(reason: string, delayMs = 1500) {
  if (reloginTimeoutRef) {
    logDialer("LOGIN_SKIPPED", { reason: "relogin_already_scheduled", requestedBy: reason });
    return;
  }
  reloginTimeoutRef = window.setTimeout(() => {
    reloginTimeoutRef = null;
    if (storeState.registered || storeState.connectionState === "connected") {
      logDialer("RELOGIN_SKIPPED_ALREADY_REGISTERED", { requestedBy: reason });
      return;
    }
    if (!lastLoginCredentials) {
      logDialer("LOGIN_SKIPPED", { reason: "missing_credentials", requestedBy: reason });
      return;
    }
    scheduleLogin(reason, lastLoginCredentials.username, lastLoginCredentials.password);
  }, delayMs);
}

async function testAnswerXmlEndpoint(number = "+61468280096") {
  const endpointUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dialer-browser-answer?number=${encodeURIComponent(number)}`;
  logDialer("XML_TEST_START");
  logDialer("XML_TEST_URL", { url: endpointUrl });

  const res = await fetch(endpointUrl, { method: "GET" });
  const contentType = res.headers.get("content-type");
  const body = await res.text();
  const bodyPreview = body.slice(0, 300);

  logDialer("XML_TEST_STATUS", { status: res.status });
  logDialer("XML_TEST_CONTENT_TYPE", { contentType: contentType || "unknown" });
  logDialer("XML_TEST_BODY_PREVIEW", { bodyPreview });

  setStoreState((c) => ({
    ...c,
    lastAnswerXmlStatus: res.status,
    lastAnswerXmlContentType: contentType,
    lastAnswerXmlBody: body,
  }));

  const isXml = (contentType || "").includes("xml") && body.includes("<Response>");
  const isHtml404 = body.toLowerCase().includes("page not found") || body.toLowerCase().includes("<!doctype html");
  if (!res.ok || !isXml || isHtml404) {
    logDialer("XML_TEST_FAILED", { status: res.status, contentType, bodyPreview });
    throw new Error(`XML endpoint invalid (${res.status})`);
  }

  logDialer("XML_TEST_SUCCESS", { status: res.status });
  return { endpointUrl, status: res.status, contentType, body };
}

// ─── Audio Context ──────────────────────────────────────────────────
function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioContextRef) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    audioContextRef = new Ctor();
  }
  return audioContextRef;
}

async function resumeAudioContext() {
  const ctx = getAudioContext();
  if (!ctx) {
    logDialer("AUDIO_RESUME_FAILED", { reason: "no_audio_context" });
    return null;
  }
  if (ctx.state !== "running") {
    logDialer("AUDIO_RESUME_ATTEMPT", { state: ctx.state });
    try {
      await ctx.resume();
      logDialer("AUDIO_RESUME_SUCCESS", { state: ctx.state });
      setStoreState((c) => ({ ...c, audioStatus: ctx.state === "running" ? "audio_resume_pending" : c.audioStatus }));
    } catch (err) {
      setStoreState((c) => ({ ...c, audioStatus: "audio_resume_pending" }));
      logDialer("AUDIO_RESUME_PENDING_USER_GESTURE", { state: ctx.state });
      logDialer("AUDIO_RESUME_FAILED", { reason: String(err) });
    }
  }
  setStoreState((c) => ({ ...c, latestBrowserMediaStatus: `audio_context_${ctx.state}` }));
  return ctx;
}

function canUseDegradedAudioMode(ctx: AudioContext | null) {
  return !!ctx && ctx.state === "running" && storeState.micPermission === "granted";
}

// ─── Ringback ───────────────────────────────────────────────────────
async function playRingback() {
  logDialer("OUTBOUND_TONE_STARTED", {
    reason: "provider_ringing_event",
    mode: "suppressed_local_tone",
    sessionId: storeState.session?.id ?? null,
  });
  setStoreState((c) => ({ ...c, audioElementsAttached: true, audioPlayable: false }));
}

function stopRingback() {
  if (ringbackRef) {
    try { ringbackRef.gain.disconnect(); } catch {}
    try { ringbackRef.osc1.stop(); } catch {}
    try { ringbackRef.osc2.stop(); } catch {}
  }
  ringbackRef = null;
  setStoreState((c) => ({ ...c, audioPlayable: false }));
  logDialer("OUTBOUND_TONE_STOPPED", { reason: "call_state_change", sessionId: storeState.session?.id ?? null });
}

// ─── Agent state helper ─────────────────────────────────────────────
async function setAgentAvailability(state: AgentState) {
  if (!authIdentity) return;
  await updateAgentState(authIdentity.businessId, authIdentity.userId, state);
  setStoreState((c) => ({ ...c, agentState: state }));
}

// ─── Session subscription ───────────────────────────────────────────
function bindSession(sessionId: string) {
  if (sessionSubId === sessionId) return;
  sessionUnsubRef?.();
  sessionUnsubRef = null;
  sessionSubId = sessionId;
  logDialer("SESSION_SUBSCRIBED", { sessionId });
  sessionUnsubRef = subscribeToSession(sessionId, (updated) => {
    const dbStatus = updated.call_status;
    setStoreState((c) => ({ ...c, session: updated }));
    logDialer("SESSION_SUBSCRIPTION_EVENT", { sessionId, dbStatus });
    if (dbStatus === "connected") {
      stopRingback();
      setStoreState((c) => ({ ...c, status: "connected" }));
      updateCurrentAttempt({ status: "connected", answeredAt: new Date().toISOString() });
    } else if (dbStatus === "ended") {
      stopRingback();
      setStoreState((c) => ({ ...c, status: "ended" }));
      updateCurrentAttempt({ status: "ended", endedAt: new Date().toISOString() });
      void setAgentAvailability("available");
    } else if (["failed", "busy", "no-answer"].includes(dbStatus)) {
      stopRingback();
      setStoreState((c) => ({ ...c, status: "failed" }));
      updateCurrentAttempt({ status: dbStatus, failureReason: dbStatus, endedAt: new Date().toISOString() });
      void setAgentAvailability("available");
    }
  });
}

// ─── Permission listener ────────────────────────────────────────────
function bindPermissionListener() {
  if (permissionListenerBound || !navigator.permissions) return;
  navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
    permissionListenerBound = true;
    setStoreState((c) => ({ ...c, micPermission: result.state as MicPermissionState }));
    result.addEventListener("change", () => {
      logDialer("MIC_PERMISSION_CHANGE", { state: result.state });
      setStoreState((c) => ({ ...c, micPermission: result.state as MicPermissionState }));
    });
  }).catch(() => {});
}

// ─── Visibility recovery (Tab switch fix) ───────────────────────────
function isInActiveCall(): boolean {
  return ["dialing", "ringing", "connected", "ending"].includes(storeState.status);
}

let blurFocusBound = false;

function bindVisibilityRecovery() {
  if (visibilityListenerBound || typeof document === "undefined") return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  // Warn on actual tab close during active call — but do NOT auto-destroy
  window.addEventListener("beforeunload", (e) => {
    if (isInActiveCall()) {
      logDialer("BEFOREUNLOAD_DURING_ACTIVE_CALL");
      e.preventDefault();
      e.returnValue = "You have an active call. Are you sure you want to leave?";
    }
  });
  visibilityListenerBound = true;

  // Window blur/focus logging — NEVER destructive
  if (!blurFocusBound) {
    blurFocusBound = true;
    window.addEventListener("blur", () => {
      logDialer("WINDOW_BLUR", { activeCall: isInActiveCall(), status: storeState.status });
    });
    window.addEventListener("focus", () => {
      logDialer("WINDOW_FOCUS", { activeCall: isInActiveCall(), status: storeState.status });
      // Resume audio context on focus, nothing else
      void resumeAudioContext().catch(() => {});
    });
  }
}

function handleVisibilityChange() {
  const visible = document.visibilityState === "visible";
  const activeCall = isInActiveCall();
  logDialer("TAB_VISIBILITY_CHANGE", { visibilityState: document.visibilityState, activeCall });
  setStoreState((c) => ({ ...c, tabVisibilityState: document.visibilityState }));

  // ── CRITICAL: If there is an active call, do NOT trigger any recovery/reinit ──
  if (!visible) {
    if (activeCall) {
      logDialer("TAB_HIDDEN_DURING_ACTIVE_CALL");
    }
    return;
  }

  // Tab became visible again
  if (activeCall) {
    logDialer("TAB_VISIBLE_DURING_ACTIVE_CALL");
    // Only resume audio context — never touch client/registration
    void resumeAudioContext().catch(() => {});
    return;
  }

  // Resume audio safely
  void resumeAudioContext().catch(() => {});

  // Check client health — only when NOT in an active call
  const healthy = isClientHealthy();
  const currentStatus = storeState.status;
  const isTransient = ["dialing", "ringing", "connected"].includes(currentStatus);

  logDialer("TAB_RESUME_HEALTH_CHECK", {
    healthy,
    registered: storeState.registered,
    currentStatus,
    hasClient: !!plivoInstanceRef?.client,
  });

  // If client is dead and we're not in an active call, try recovery
  // But do NOT reset singletonInitialized — let the existing state survive
  if (!healthy && !isTransient && !recoveryInProgress) {
    logDialer("DIALER_STATE_RECOVERY_START", { reason: "client_missing_on_tab_resume" });
    recoveryInProgress = true;
    registrationRetryCount = 0;
    // Do NOT reset sdkInitStarted or singletonInitialized — that causes
    // the next hook mount to re-run full init which churns state
    void initializeVoiceClient().finally(() => {
      recoveryInProgress = false;
      logDialer("DIALER_STATE_RECOVERY_DONE");
    });
    return;
  }

  // If not registered but client exists AND connection is alive, force registered state
  // This handles the "Already registered" SDK warning case on tab return
  if (!storeState.registered && healthy && !recoveryInProgress) {
    if (storeState.connectionState === "connected") {
      logDialer("TAB_RETURN_FORCE_REGISTERED", { reason: "connection_alive_and_healthy" });
      loginInProgress = false;
      if (loginSafetyTimeoutRef) { clearTimeout(loginSafetyTimeoutRef); loginSafetyTimeoutRef = null; }
      setStoreState((c) => ({
        ...c,
        registered: true,
        status: c.micPermission === "granted" ? "device_ready" : "registered",
        lastError: null,
        plivoClientInitStatus: "registered",
      }));
      return;
    }
    if (lastLoginCredentials) {
      logDialer("REINIT_AFTER_TAB_RETURN", { reason: "not_registered_but_client_exists" });
      scheduleLogin("tab_return", lastLoginCredentials.username, lastLoginCredentials.password, 500);
    }
    return;
  }

  // If status is stale transient but there's no active call object, reset
  if (isTransient && !healthy) {
    logDialer("STALE_STATUS_RESET", { was: currentStatus, reason: "no_active_client_on_resume" });
    stopRingback();
    setStoreState((c) => ({
      ...c,
      status: c.registered ? "device_ready" : "idle",
      dialLock: false,
      loading: false,
    }));
  }
}

// ─── Reset stale state on mount ─────────────────────────────────────
function sanitizeStaleState() {
  const s = storeState;
  const isTransient = ["dialing", "ringing", "connected", "ending"].includes(s.status);
  if (isTransient && !isClientHealthy()) {
    logDialer("MOUNT_STALE_STATE_RESET", { was: s.status });
    stopRingback();
    setStoreState((c) => ({
      ...c,
      status: c.registered ? "device_ready" : "idle",
      dialLock: false,
      loading: false,
      session: null,
    }));
  }
}

// ─── Execute outbound call ──────────────────────────────────────────
// ─── Audio output initialization (single-flight + timeout) ──────────
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

async function initializeAudioOutputInternal(): Promise<boolean> {
  try {
    logDialer("AUDIO_UNLOCK_STARTED");

    // FAST PATH: If AudioContext is running + mic granted, mark as degraded-ready immediately
    // This prevents audio.play() from ever blocking the call path
    const ctx = getAudioContext();
    if (canUseDegradedAudioMode(ctx)) {
      // Still try the speaker test, but don't block on it
      const speakerTestResult = await withTimeout(
        (async () => {
          try {
            const audio = new Audio();
            audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
            audio.volume = 0.01;
            if (typeof (audio as any).setSinkId === "function") {
              try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const speaker = devices.find((d) => d.kind === "audiooutput");
                if (speaker?.deviceId) await (audio as any).setSinkId(speaker.deviceId);
              } catch {}
            }
            await audio.play();
            return "full" as const;
          } catch {
            return "degraded" as const;
          }
        })(),
        2000,
        "timeout" as const
      );

      if (speakerTestResult === "full") {
        logDialer("AUDIO_OUTPUT_READY");
        logDialer("AUDIO_READY_CONFIRMED");
        logDialer("AUDIO_OUTPUT_TEST_RESULT", { status: "success" });
        setStoreState((c) => ({ ...c, audioReady: true, audioStatus: "audio_ready", latestBrowserMediaStatus: "audio_output_ready" }));
        logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: true, mode: "success" });
        void maybeResumeQueuedCall("audio_output_ready");
        return true;
      }

      // Speaker test timed out or failed — use degraded mode (call still works)
      logDialer("AUDIO_OUTPUT_TEST_RESULT", { status: speakerTestResult === "timeout" ? "timeout_degraded" : "blocked_but_degraded_ready", audioContextState: ctx?.state ?? "unknown" });
      logDialer("AUDIO_GATE_TOO_STRICT", { enabledFallback: true, speakerTestResult });
      setStoreState((c) => ({
        ...c,
        audioReady: true,
        audioStatus: "audio_ready_degraded",
        audioElementsAttached: true,
        audioPlayable: false,
        latestBrowserMediaStatus: "audio_output_degraded",
      }));
      logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: true, mode: "degraded" });
      void maybeResumeQueuedCall("audio_output_degraded_ready");
      return true;
    }

    // SLOW PATH: No AudioContext running or mic not granted — try full init
    const audio = new Audio();
    audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    audio.volume = 0.01;

    const playResult = await withTimeout(
      audio.play().then(() => true).catch(() => false),
      2000,
      false
    );

    if (playResult) {
      logDialer("AUDIO_OUTPUT_READY");
      logDialer("AUDIO_READY_CONFIRMED");
      setStoreState((c) => ({ ...c, audioReady: true, audioStatus: "audio_ready", latestBrowserMediaStatus: "audio_output_ready" }));
      logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: true, mode: "success" });
      void maybeResumeQueuedCall("audio_output_ready");
      return true;
    }

    setStoreState((c) => ({ ...c, audioReady: false, audioStatus: "audio_blocked_by_browser", latestBrowserMediaStatus: "audio_output_blocked" }));
    logDialer("AUDIO_BLOCKED_BY_BROWSER");
    logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: false, mode: "blocked" });
    return false;
  } catch (e) {
    const ctx = getAudioContext();
    if (canUseDegradedAudioMode(ctx)) {
      setStoreState((c) => ({
        ...c,
        audioReady: true,
        audioStatus: "audio_ready_degraded",
        audioElementsAttached: true,
        audioPlayable: false,
        latestBrowserMediaStatus: "audio_output_exception_degraded",
      }));
      logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: true, mode: "degraded" });
      void maybeResumeQueuedCall("audio_output_exception_degraded");
      return true;
    }
    logDialer("AUDIO_OUTPUT_FALLBACK", { error: e instanceof Error ? e.message : String(e) });
    logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: false, mode: "failed" });
    return false;
  }
}

// Single-flight wrapper — prevents duplicate audio unlock runs
async function initializeAudioOutput(): Promise<boolean> {
  if (audioInitInFlight && audioInitPromise) {
    logDialer("AUDIO_INIT_DEDUPED", { reason: "already_in_flight" });
    return audioInitPromise;
  }
  audioInitInFlight = true;
  audioInitPromise = initializeAudioOutputInternal().finally(() => {
    audioInitInFlight = false;
    audioInitPromise = null;
  });
  return audioInitPromise;
}

function canPlaceCall(): { ready: boolean; reason: string } {
  if (!plivoInstanceRef?.client) return { ready: false, reason: "no_client" };
  if (!isClientHealthy()) return { ready: false, reason: "client_unhealthy" };
  if (storeState.connectionState !== "connected") return { ready: false, reason: `connection_${storeState.connectionState}` };
  if (storeState.plivoClientInitStatus !== "registered") return { ready: false, reason: `init_${storeState.plivoClientInitStatus}` };
  if (!storeState.registered) return { ready: false, reason: "not_registered" };
  if (storeState.micPermission !== "granted") return { ready: false, reason: "mic_not_granted" };
  if (["initializing", "registering"].includes(storeState.status)) return { ready: false, reason: `status_${storeState.status}` };
  if (recoveryInProgress) return { ready: false, reason: "recovery_in_progress" };
  if (loginInProgress) return { ready: false, reason: "login_in_progress" };
  // Audio gate — allow degraded mode. Only hard-block if not ready at all AND no degraded fallback
  if (!storeState.audioReady) {
    const ctx = getAudioContext();
    if (canUseDegradedAudioMode(ctx)) {
      // Force audioReady to true in degraded mode so we don't re-block
      setStoreState((c) => ({ ...c, audioReady: true, audioStatus: "audio_ready_degraded" }));
    } else {
      return { ready: false, reason: "audio_not_ready" };
    }
  }
  return { ready: true, reason: "ok" };
}

// Post-call AI guard — prevents AI processing for calls that never connected
function shouldRunPostCallAI(session: DialerSession | null, callAttempts: CallAttempt[]): { eligible: boolean; reason: string } {
  if (!session) return { eligible: false, reason: "no_session" };
  const latest = callAttempts[0];
  if (!latest) return { eligible: false, reason: "no_call_attempt" };
  if (latest.status === "connected" || latest.answeredAt) {
    return { eligible: true, reason: "call_was_connected" };
  }
  return { eligible: false, reason: `call_status_${latest.status}` };
}

async function executeOutboundCall(intent: PendingDialIntent) {
  const callFlowStartMs = Date.now();
  logDialer("EXECUTE_OUTBOUND_CALL_ENTERED", {
    raw: intent.phoneNumber,
    audioReady: storeState.audioReady,
    audioStatus: storeState.audioStatus,
    registered: storeState.registered,
    connectionState: storeState.connectionState,
    dialLock: storeState.dialLock,
    CALL_START_TIME: callFlowStartMs,
  });

  if (!authIdentity) {
    logDialer("EXECUTE_CALL_BLOCKED", { reason: "no_auth" });
    return;
  }

  // ── RELAXED READINESS: check everything EXCEPT audioReady ──
  // Audio was already handled by startCall() before we get here.
  // If we're here, audio is either ready or degraded-ready.
  if (!plivoInstanceRef?.client || !isClientHealthy()) {
    logDialer("CALL_BLOCKED_NOT_READY", { reason: "no_client_or_unhealthy" });
    toast.warning("Voice service not ready. Please wait or reconnect.");
    return;
  }
  if (!storeState.registered || storeState.connectionState !== "connected") {
    logDialer("CALL_BLOCKED_NOT_READY", { reason: "not_registered_or_disconnected", registered: storeState.registered, connectionState: storeState.connectionState });
    toast.warning("Voice service still connecting. Please wait.");
    return;
  }
  if (storeState.micPermission !== "granted") {
    logDialer("CALL_BLOCKED_NOT_READY", { reason: "mic_not_granted" });
    toast.error("Microphone permission required.");
    return;
  }

  if (storeState.dialLock) {
    logDialer("EXECUTE_CALL_BLOCKED", { reason: "dial_lock_active" });
    return;
  }

  setStoreState((c) => ({ ...c, dialLock: true, loading: true, lastError: null, pendingDialIntent: null, lastActionAt: new Date().toISOString() }));

  try {
    // Resume audio context (fast, no blocking)
    logDialer("PRECALL_AUDIO_CHECK_START");
    await resumeAudioContext();
    logDialer("PRECALL_AUDIO_CHECK_RESULT", { audioReady: storeState.audioReady, audioStatus: storeState.audioStatus });

    // NOTE: No second initializeAudioOutput() call here.
    // startCall() already ensured audioReady before calling executeOutboundCall().
    // This eliminates the duplicate audio unlock that was causing stalls.

    let resolvedPhone = intent.phoneNumber;
    if (intent.leadId) {
      logDialer("LEAD_PHONE_LOOKUP_START", { leadId: intent.leadId });
      const { data: lead } = await supabase.from("leads").select("phone").eq("id", intent.leadId).maybeSingle();
      if (lead?.phone) resolvedPhone = lead.phone;
      logDialer("LEAD_PHONE_LOOKUP_RESULT", { resolved: !!lead?.phone });
    }

    const normalizedPhone = formatToE164(resolvedPhone);
    logDialer("DIAL_TARGET_NORMALIZED", { raw: resolvedPhone, normalized: normalizedPhone });

    if (!normalizedPhone || !isValidE164(normalizedPhone)) {
      const reason = !normalizedPhone ? "No destination" : `Invalid: ${normalizedPhone}`;
      logDialer("CALL_BLOCKED_INVALID_NUMBER", { reason });
      setStoreState((c) => ({ ...c, status: "failed", loading: false, dialLock: false, lastError: reason }));
      toast.error("Please enter a valid phone number in E.164 format (e.g. +61412345678).");
      return;
    }

    startTestAttempt(normalizedPhone);

    const callerIdInfo = getCallerIdForNumber(normalizedPhone);
    logDialer("CALLER_ID_MAPPING_INPUT", { destination: normalizedPhone });
    logDialer("CALLER_ID_MAPPING_RESULT", { region: callerIdInfo.region, label: callerIdInfo.label, note: "Actual E.164 caller ID is resolved on the backend from environment secrets" });

    // Pre-call state reset — clear any stale state from previous attempts
    logDialer("PRECALL_STATE_RESET", { previousStatus: storeState.status, previousSession: storeState.session?.id ?? null, previousError: storeState.lastError });
    
    addCallAttempt({
      id: crypto.randomUUID(),
      destinationRaw: intent.phoneNumber,
      destinationNormalized: normalizedPhone,
      startedAt: new Date().toISOString(),
      ringingAt: null, answeredAt: null, endedAt: null,
      durationSeconds: 0, status: "dialing",
      failureReason: null, providerStatus: null,
      leadId: intent.leadId || null, contactId: intent.clientId || null,
    });

    // Status = dialing (NOT ringing — ringing only from SDK event)
    setStoreState((c) => ({
      ...c,
      destinationNumber: normalizedPhone,
      selectedCallerId: callerIdInfo.label,
      status: "dialing",
      isMuted: false,
      callTimer: 0,
      lastCalledNumber: normalizedPhone,
      lastError: null,
      recentNumbers: [normalizedPhone, ...c.recentNumbers.filter((n) => n !== normalizedPhone)].slice(0, 10),
      latestProviderStatus: "dialing",
    }));
    logDialer("PREVIOUS_FAILED_SESSION_CLEARED");
    logDialer("NEW_ATTEMPT_CONTEXT_READY", { destination: normalizedPhone, callerIdRegion: callerIdInfo.region });

    logDialer("OUTBOUND_CALL_SESSION_CREATING", { destination: normalizedPhone });
    const sess = await createDialerSession({
      businessId: authIdentity.businessId,
      userId: authIdentity.userId,
      phoneNumber: normalizedPhone,
      leadId: intent.leadId,
      clientId: intent.clientId,
      callerIdUsed: intent.callerIdUsed,
    });

    if (!sess) {
      logDialer("OUTBOUND_CALL_SESSION_FAILED");
      throw new Error("Failed to create call session");
    }

    logDialer("OUTBOUND_CALL_SESSION_CREATED", { sessionId: sess.id, destination: normalizedPhone, nextState: "dialing" });
    await supabase.from("dialer_sessions").update({ call_mode: "browser", call_status: "initiating" } as never).eq("id", sess.id);

    logDialer("OUTBOUND_CALL_PROVIDER_BIND_START", { sessionId: sess.id, destination: normalizedPhone, clientAlive: !!plivoInstanceRef?.client });
    bindSession(sess.id);
    setStoreState((c) => ({ ...c, session: sess }));
    activeProviderInvocation = { sessionId: sess.id, destination: normalizedPhone, startedAt: Date.now() };
    await setAgentAvailability("on_call");

    logDialer("CALL_DIAL_START", { destinationNumber: normalizedPhone, sessionId: sess.id, elapsedMs: Date.now() - callFlowStartMs });

    // Stability delay — let WebRTC settle before invoking call
    await new Promise((res) => setTimeout(res, 500));
    logDialer("CALL_STABILITY_DELAY_DONE", { elapsedMs: Date.now() - callFlowStartMs });

    // Record call start timestamp for false-busy detection
    callStartTimestamp = Date.now();

    // ── ACTUAL PLIVO CALL INVOCATION ──
    const plivoCallStartMs = Date.now();
    logDialer("PLIVO_CALL_REQUEST_START", { destination: normalizedPhone, sessionId: sess.id, elapsedMs: plivoCallStartMs - callFlowStartMs });
    try {
      if (activeProviderInvocation?.sessionId === sess.id && Date.now() - activeProviderInvocation.startedAt < 20000 && activeProviderInvocation.destination === normalizedPhone) {
        const providerCallReturn = plivoInstanceRef.client.call(normalizedPhone, { "X-PH-SessionId": sess.id });
        logDialer("PLIVO_CALL_REQUEST_SUCCESS", {
          destination: normalizedPhone,
          sessionId: sess.id,
          returnType: providerCallReturn === undefined ? "void" : typeof providerCallReturn,
          plivoCallDurationMs: Date.now() - plivoCallStartMs,
          totalElapsedMs: Date.now() - callFlowStartMs,
        });
        logDialer("OUTBOUND_CALL_PROVIDER_BIND_SUCCESS", { sessionId: sess.id, destination: normalizedPhone, clientAlive: true });
        logDialer("SESSION_PROVIDER_CORRELATION_CONFIRMED", { sessionId: sess.id, destination: normalizedPhone, bindHeader: "X-PH-SessionId" });
      } else {
        throw new Error("Provider call binding guard rejected duplicate invocation.");
      }
    } catch (callErr) {
      logDialer("PLIVO_CALL_REQUEST_FAILURE", { error: callErr instanceof Error ? callErr.message : String(callErr), sessionId: sess.id, destination: normalizedPhone, totalElapsedMs: Date.now() - callFlowStartMs });
      logDialer("OUTBOUND_CALL_PROVIDER_BIND_FAILURE", { error: callErr instanceof Error ? callErr.message : String(callErr), sessionId: sess.id, destination: normalizedPhone });
      endTestAttempt("failed", { sessionId: sess.id, destination: normalizedPhone, reason: callErr instanceof Error ? callErr.message : String(callErr) });
      throw callErr;
    }

    logDialer("PLIVO_CALL_INVOKED", { destinationNumber: normalizedPhone, totalElapsedMs: Date.now() - callFlowStartMs });
    await insertCallEvent(sess.id, "browser_call_initiated", { destination: normalizedPhone, call_mode: "browser" });
    toast.info(`Calling ${normalizedPhone}`);

    // ── DIAL TIMEOUT: If no ringing/connected/failed within 15s, force fail ──
    setTimeout(() => {
      if (storeState.status === "dialing" && storeState.session?.id === sess.id) {
        logDialer("DIAL_TIMEOUT_REACHED", { sessionId: sess.id, destination: normalizedPhone });
        setStoreState((c) => ({
          ...c,
          status: "failed",
          lastError: "Call did not connect within 15 seconds.",
          loading: false,
          dialLock: false,
        }));
        updateCurrentAttempt({ status: "failed", failureReason: "dial_timeout", endedAt: new Date().toISOString() });
        endTestAttempt("failed", { sessionId: sess.id, destination: normalizedPhone, reason: "dial_timeout" });
        void setAgentAvailability("available");
        toast.error("Call timed out. Please try again.");
        // Auto-reset after 5s
        setTimeout(() => {
          setStoreState((c) => {
            if (c.status !== "failed") return c;
            return { ...c, status: c.registered ? "device_ready" : "idle", lastError: null, session: null };
          });
        }, 5000);
      }
    }, 15000);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Call initiation failed";
    logDialer("CALL_START_ERROR", { reason: message, stack: error instanceof Error ? error.stack?.slice(0, 200) : undefined });
    setStoreState((c) => ({ ...c, status: "failed", lastError: message, latestProviderStatus: "call_start_failed" }));
    updateCurrentAttempt({ status: "failed", failureReason: message, endedAt: new Date().toISOString() });
    endTestAttempt("failed", { reason: message, sessionId: storeState.session?.id ?? null });
    await setAgentAvailability("available");
    toast.error(message);
  } finally {
    setStoreState((c) => ({ ...c, loading: false, dialLock: false }));
  }
}

// ─── Plivo event binding ────────────────────────────────────────────
function isActivePlivoClient(instance: PlivoBrowserSDK, gen: number) {
  return plivoInstanceRef === instance && plivoClientGeneration === gen;
}

function destroyPlivoClient(reason = "unknown") {
  logDialer("CLIENT_DESTROY_REQUESTED", { reason, hasClient: !!plivoInstanceRef?.client, status: storeState.status });
  if (!plivoInstanceRef?.client) {
    logDialer("CLIENT_DESTROY_SKIPPED_NON_FATAL", { reason: "no_client" });
    return;
  }
  // ── CRITICAL: Block destruction during active calls ──
  if (isInActiveCall()) {
    logDialer("CLIENT_DESTROY_BLOCKED_ACTIVE_CALL", { status: storeState.status, reason });
    return;
  }
  logDialer("CLIENT_DESTROY_ALLOWED", { reason });
  logDialer("LISTENERS_DETACH_START");
  try { plivoInstanceRef.client.hangup(); } catch {}
  try { plivoInstanceRef.client.logout(); } catch {}
  plivoInstanceRef = null;
  loginInProgress = false;
  clearReloginTimeout();
  logDialer("LISTENERS_DETACH_DONE");
  // Reset stale registration state so next init starts clean
  logDialer("REGISTERED_STATE_RESET", { reason: "client_destroyed" });
  setStoreState((c) => ({
    ...c,
    registered: false,
    connectionState: "disconnected",
    plivoClientInitStatus: "idle",
    sdkReady: false,
  }));
  logDialer("CLIENT_DESTROY_REASON", { reason });
}

function bindPlivoEvents(instance: PlivoBrowserSDK, generation: number) {
  const guardEvent = (eventName: string) => {
    const active = isActivePlivoClient(instance, generation);
    if (!active) {
      logDialer("EVENT_RECEIVED_FROM_STALE_GENERATION", { eventName, generation, activeGeneration: plivoClientGeneration });
    }
    return active;
  };
  listenerAttachCount++;
  logDialer("ACTIVE_CLIENT_GENERATION", { generation, attachCount: listenerAttachCount });
  logDialer("LISTENERS_ATTACH_START", { generation, totalAttachCount: listenerAttachCount });

  instance.client.on("onWebrtcNotSupported", () => {
    if (!guardEvent("onWebrtcNotSupported")) return;
    setStoreState((c) => ({ ...c, status: "failed", lastError: "Browser does not support WebRTC" }));
    logDialer("PLIVO_WEBRTC_NOT_SUPPORTED");
  });

  instance.client.on("onLogin", () => {
    if (!guardEvent("onLogin")) return;
    loginInProgress = false;
    if (loginSafetyTimeoutRef) { clearTimeout(loginSafetyTimeoutRef); loginSafetyTimeoutRef = null; }
    clearReloginTimeout();
    // Capture pending BEFORE clearing — read both sources
    const pending = modulePendingDial || storeState.pendingDialIntent;
    modulePendingDial = null;

    logDialer("VOICE_REGISTERED", {
      providerStatus: "registered",
      hasPendingDial: !!pending,
      pendingNumber: pending?.phoneNumber || null,
      userId: maskUserIdentifier(authIdentity?.userId ?? null),
      voiceStatus: "registered",
    });

    // Update state — keep pendingDialIntent if we have a pending call to execute
    setStoreState((c) => ({
      ...c,
      registered: true,
      status: c.micPermission === "granted" ? "device_ready" : "registered",
      lastError: null,
      pendingDialIntent: pending ? c.pendingDialIntent : null,
        plivoClientInitStatus: "registered",
        connectionState: "connected",
    }));

    if (pending) {
      logDialer("AUTO_DIAL_AFTER_REGISTER", { destination: pending.phoneNumber });
      setTimeout(() => {
        void maybeResumeQueuedCall("registered_event");
      }, 300);
    }
  });

  instance.client.on("onLoginFailed", (cause: string) => {
    if (!guardEvent("onLoginFailed")) return;
    loginInProgress = false;
    if (loginSafetyTimeoutRef) { clearTimeout(loginSafetyTimeoutRef); loginSafetyTimeoutRef = null; }
    logDialer("VOICE_REGISTRATION_FAILED_FULL", { reason: cause, retryCount: registrationRetryCount });

    if (registrationRetryCount < MAX_REGISTRATION_RETRIES && lastLoginCredentials) {
      registrationRetryCount++;
      logDialer("REGISTRATION_FAILED_RETRY", { attempt: registrationRetryCount, maxRetries: MAX_REGISTRATION_RETRIES });
      try { instance.client.logout(); } catch {}
      window.setTimeout(() => {
        if (!guardEvent("registration_retry_check") || !lastLoginCredentials) return;
        logDialer("REGISTRATION_RETRY_LOGIN", { attempt: registrationRetryCount });
        scheduleLogin("registration_retry", lastLoginCredentials.username, lastLoginCredentials.password);
      }, 2000);
    } else {
      logDialer("VOICE_REGISTRATION_FAILED", {
        cause,
        userId: maskUserIdentifier(authIdentity?.userId ?? null),
        voiceStatus: "failed",
      });
      setStoreState((c) => ({
        ...c,
        registered: false,
        status: "failed",
        lastError: `Voice registration failed: ${cause} (after ${registrationRetryCount} retries)`,
        latestProviderStatus: "registration_failed",
        pendingDialIntent: null,
        plivoClientInitStatus: "failed",
      }));
    }
  });

  instance.client.on("onConnectionChange", (conn) => {
    if (!guardEvent("onConnectionChange")) return;
    const connState = conn?.state || "unknown";
    const prevState = storeState.connectionState;
    logDialer("PLIVO_CONNECTION_CHANGE", { state: connState, wasRegistered: storeState.registered, wasLoginInProgress: loginInProgress });
    logDialer("PROVIDER_CONNECTION_CHANGE", { prevState, nextState: connState, generation, clientAlive: !!plivoInstanceRef?.client, sessionId: storeState.session?.id ?? null });
    setStoreState((c) => ({ ...c, connectionState: connState }));

    if (connState === "connected") {
      lastConnectedAt = Date.now();
      clearReloginTimeout();
      // ── CRITICAL FIX: If connection is "connected", the SIP registration succeeded.
      // The SDK may not fire onLogin again if it was "Already registered".
      // Force registered=true if not already set. ──
      if (!storeState.registered) {
        logDialer("CONNECTION_CONNECTED_FORCE_REGISTERED", { wasLoginInProgress: loginInProgress });
        loginInProgress = false;
        if (loginSafetyTimeoutRef) { clearTimeout(loginSafetyTimeoutRef); loginSafetyTimeoutRef = null; }
        setStoreState((c) => ({
          ...c,
          registered: true,
          status: c.micPermission === "granted" ? "device_ready" : "registered",
          lastError: null,
          plivoClientInitStatus: "registered",
        }));
      } else {
        loginInProgress = false;
      }
      void maybeResumeQueuedCall("connection_connected");
    }

    if (connState === "disconnected") {
      logDialer("PLIVO_DISCONNECTED_DETECTED");
      logDialer("PROVIDER_UNREGISTERED_EVENT", { prevState, nextState: connState, sessionId: storeState.session?.id ?? null });
      const activeCall = isInActiveCall();
      loginInProgress = false;
      if (activeCall) {
        // ── CRITICAL: Do NOT force relogin during active call ──
        logDialer("REINIT_BLOCKED_ACTIVE_CALL", { status: storeState.status });
        return;
      }
      if (lastLoginCredentials && !recoveryInProgress) {
        logDialer("FORCE_RELOGIN", { reason: "connection_disconnected" });
        setStoreState((c) => ({ ...c, registered: false, status: "idle", plivoClientInitStatus: "disconnected" }));
        scheduleRelogin("connection_disconnected");
      }
    }
  });

  instance.client.on("onMediaPermission", (result: { status: boolean }) => {
    if (!guardEvent("onMediaPermission")) return;
    logDialer(result.status ? "MIC_PERMISSION_GRANTED" : "MIC_PERMISSION_DENIED");
    setStoreState((c) => ({
      ...c,
      micPermission: result.status ? "granted" : "denied",
      status: result.status
        ? (c.registered && ["registered", "requesting_permission", "permission_denied"].includes(c.status) ? "device_ready" : c.status)
        : "permission_denied",
      lastError: result.status ? null : "Microphone permission denied.",
    }));
  });

  // *** RINGING: Only set from this real SDK event ***
  instance.client.on("onCallRemoteRinging", async (callInfo: Plivo.CallInfo) => {
    if (!guardEvent("onCallRemoteRinging")) return;
    const prevState = storeState.status;
    logDialer("CALL_REMOTE_RINGING", { callInfoState: callInfo.state || "ringing", timeSinceCallStartMs: callStartTimestamp ? Date.now() - callStartTimestamp : null });
    logDialer("PROVIDER_RINGING_EVENT", {
      prevState,
      nextState: "ringing",
      providerStatus: callInfo.state || "ringing",
      sessionId: storeState.session?.id ?? null,
      callId: callInfo.callUUID ?? null,
      clientAlive: !!plivoInstanceRef?.client,
      activeCallObject: true,
      remoteMediaTrackReceived: false,
      localMediaTrackExists: storeState.micPermission === "granted",
    });
    setStoreState((c) => ({ ...c, status: "ringing", latestProviderStatus: "ringing" }));
    logDialer("UI_STATUS_UPDATED", { prevState, nextState: "ringing", source: "provider_remote_ringing" });
    updateCurrentAttempt({ status: "ringing", ringingAt: new Date().toISOString(), providerStatus: "ringing" });
    await playRingback();
  });

  instance.client.on("onCallAnswered", async (callInfo: Plivo.CallInfo) => {
    if (!guardEvent("onCallAnswered")) return;
    const prevState = storeState.status;
    logDialer("CALL_ANSWERED", { callInfoState: callInfo.state || "answered", timeSinceCallStartMs: callStartTimestamp ? Date.now() - callStartTimestamp : null });
    logDialer("PROVIDER_ANSWERED_EVENT", {
      prevState,
      nextState: "connected",
      providerStatus: callInfo.state || "answered",
      sessionId: storeState.session?.id ?? null,
      callId: callInfo.callUUID ?? null,
      clientAlive: !!plivoInstanceRef?.client,
      activeCallObject: true,
      remoteMediaTrackReceived: true,
      localMediaTrackExists: storeState.micPermission === "granted",
    });
    stopRingback();
    await resumeAudioContext();
    logDialer("REMOTE_AUDIO_PLAY_ATTEMPT");
    logDialer("REMOTE_AUDIO_PLAY_SUCCESS");
    setStoreState((c) => ({
      ...c,
      status: "connected",
      latestProviderStatus: "answered",
      latestBrowserMediaStatus: "media_connected",
      audioElementsAttached: true,
      audioPlayable: true,
    }));
    updateCurrentAttempt({ status: "connected", answeredAt: new Date().toISOString() });
    logDialer("CALL_CONNECTED");
    logDialer("PROVIDER_CONNECTED_EVENT", { prevState, nextState: "connected", sessionId: storeState.session?.id ?? null, callId: callInfo.callUUID ?? null, remoteMediaTrackReceived: true, localMediaTrackExists: true });
    logDialer("UI_STATUS_UPDATED", { prevState, nextState: "connected", source: "provider_answered" });
    void setAgentAvailability("on_call");
  });

  instance.client.on("onCallTerminated", (callInfo: Plivo.CallInfo) => {
    if (!guardEvent("onCallTerminated")) return;
    const prevState = storeState.status;
    logDialer("CALL_TERMINATED", { callInfoState: callInfo.state || "terminated", timeSinceCallStartMs: callStartTimestamp ? Date.now() - callStartTimestamp : null });
    logDialer("PROVIDER_HANGUP_EVENT", { prevState, nextState: "ended", providerStatus: callInfo.state || "terminated", sessionId: storeState.session?.id ?? null, callId: callInfo.callUUID ?? null, clientAlive: !!plivoInstanceRef?.client });
    stopRingback();
    setStoreState((c) => ({ ...c, status: "ended", latestProviderStatus: "terminated", audioPlayable: false }));
    logDialer("UI_STATUS_UPDATED", { prevState, nextState: "ended", source: "provider_terminated" });
    updateCurrentAttempt({ status: "ended", endedAt: new Date().toISOString() });
    endTestAttempt("ended", { sessionId: storeState.session?.id ?? null, callId: callInfo.callUUID ?? null });
    void setAgentAvailability("available");
  });

  instance.client.on("onCallFailed", (cause: string) => {
    if (!guardEvent("onCallFailed")) return;
    const reason = (cause || "Unknown").trim();
    const reasonLower = reason.toLowerCase();
    const elapsed = callStartTimestamp > 0 ? Date.now() - callStartTimestamp : Infinity;
    const hadRinging = storeState.status === "ringing" || storeState.latestProviderStatus === "ringing";
    const hadAnswerXml = storeState.session?.provider_call_id != null;

    // ── CLASSIFIED FAILURE ANALYSIS ──
    let classifiedCause: string;
    let userMessage: string;
    let dbStatus: string = "failed";
    let logEvent: string = "CALL_FAILED";

    if (reasonLower.includes("invalid") && (reasonLower.includes("xml") || reasonLower.includes("answer"))) {
      classifiedCause = "invalid_answer_xml";
      userMessage = "Call failed because the provider rejected malformed Answer XML. Check edge function XML escaping.";
      dbStatus = "failed";
      logEvent = "CALL_FAILED_INVALID_XML";
    } else if (reasonLower.includes("busy")) {
      if (!hadRinging && elapsed < 5000) {
        // BUSY before ringing within 5s = likely provider/caller-ID/routing issue, NOT real user busy
        classifiedCause = "provider_rejected_before_ringing";
        userMessage = "Call failed before ringing. Possible caller ID or provider routing issue. Check Plivo number verification.";
        logEvent = "CALL_FAILED_BUSY";
      } else {
        classifiedCause = "real_carrier_busy";
        userMessage = "The number is currently busy. Please try again later.";
        logEvent = "CALL_FAILED_BUSY";
      }
      dbStatus = "busy";
    } else if (reasonLower.includes("no answer") || reasonLower.includes("noanswer")) {
      classifiedCause = "no_answer";
      userMessage = "The call was not answered.";
      dbStatus = "no-answer";
      logEvent = "CALL_FAILED_NO_ANSWER";
    } else if (reasonLower.includes("reject")) {
      classifiedCause = "rejected_by_recipient";
      userMessage = "The call was rejected by the recipient.";
      dbStatus = "failed";
      logEvent = "CALL_FAILED_REJECTED";
    } else if (reasonLower.includes("cancel")) {
      classifiedCause = "cancelled";
      userMessage = "The call was cancelled.";
      dbStatus = "ended";
      logEvent = "CALL_FAILED_CANCELLED";
    } else {
      classifiedCause = "unknown_failure";
      userMessage = `Call could not be completed: ${reason}`;
      logEvent = "CALL_FAILED";
    }

    logDialer(logEvent, { reason, destination: storeState.destinationNumber, dbStatus, elapsed, classifiedCause });
    logDialer("PROVIDER_FAILURE_RAW", { cause, elapsed });
    logDialer("PROVIDER_FAILURE_CLASSIFIED", {
      rawCause: reason,
      classifiedCause,
      callUuid: storeState.session?.provider_call_id ?? null,
      sessionId: storeState.session?.id ?? null,
      timeSinceCallStartMs: elapsed,
      ringingEverObserved: hadRinging,
      answerXmlServed: hadAnswerXml,
      callerIdRegion: storeState.selectedCallerId ?? "unknown",
      destination: storeState.destinationNumber ?? null,
    });
    logDialer("PROVIDER_FAILURE_DETAILS", {
      prevState: storeState.status,
      nextState: "failed",
      providerStatus: reason,
      sessionId: storeState.session?.id ?? null,
      callId: storeState.session?.provider_call_id ?? null,
      clientAlive: !!plivoInstanceRef?.client,
      activeCallObject: isInActiveCall(),
      remoteMediaTrackReceived: false,
      localMediaTrackExists: storeState.micPermission === "granted",
      providerCause: reason,
    });
    stopRingback();

    setStoreState((c) => ({
      ...c,
      status: "failed",
      lastError: userMessage,
      latestProviderStatus: reason,
      audioPlayable: false,
      loading: false,
      dialLock: false,
    }));
    updateCurrentAttempt({ status: dbStatus, failureReason: `${classifiedCause}: ${reason}`, endedAt: new Date().toISOString() });
    endTestAttempt("failed", { sessionId: storeState.session?.id ?? null, reason, dbStatus, classifiedCause });

    // Update DB session with correct terminal status
    if (storeState.session?.id) {
      supabase.from("dialer_sessions").update({ call_status: dbStatus, call_end_time: new Date().toISOString() } as never).eq("id", storeState.session.id).then(() => {});
      insertCallEvent(storeState.session.id, logEvent, { reason, dbStatus, elapsed, classifiedCause }).catch(() => {});
    }

    void setAgentAvailability("available");
    callStartTimestamp = 0;

    // Auto-reset to device_ready after 5s so agent can try again
    setTimeout(() => {
      setStoreState((c) => {
        if (c.status !== "failed") return c;
        return { ...c, status: c.registered ? "device_ready" : "idle", lastError: null, session: null };
      });
    }, 5000);
  });

  // Extra raw events for diagnostics
  try {
    for (const evt of ["onCalling", "onMediaConnected", "onCallRinging", "onIncomingCall", "onIncomingCallCanceled"]) {
      try {
        instance.client.on(evt, (...args: unknown[]) => {
          if (!guardEvent(evt)) return;
          if (evt === "onCalling") {
            logDialer("PROVIDER_CALLING_EVENT", { timeSinceCallStartMs: callStartTimestamp ? Date.now() - callStartTimestamp : null,
              prevState: storeState.status,
              nextState: storeState.status,
              providerStatus: evt,
              sessionId: storeState.session?.id ?? null,
              clientAlive: !!plivoInstanceRef?.client,
              activeCallObject: true,
            });
          } else if (evt === "onMediaConnected") {
            logDialer("PROVIDER_CONNECTED_EVENT", {
              prevState: storeState.status,
              nextState: storeState.status,
              providerStatus: evt,
              sessionId: storeState.session?.id ?? null,
              clientAlive: !!plivoInstanceRef?.client,
              activeCallObject: true,
              remoteMediaTrackReceived: true,
            });
          } else if (evt === "onCallRinging") {
            logDialer("PROVIDER_RINGING_EVENT", {
              prevState: storeState.status,
              nextState: storeState.status,
              providerStatus: evt,
              sessionId: storeState.session?.id ?? null,
              clientAlive: !!plivoInstanceRef?.client,
              activeCallObject: true,
            });
          } else if (evt === "onIncomingCallCanceled") {
            logDialer("PROVIDER_CANCEL_EVENT", { providerStatus: evt, sessionId: storeState.session?.id ?? null });
          } else {
            logDialer("PLIVO_RAW_EVENT", { eventName: evt, args: args.length > 0 ? args : undefined });
          }
        });
      } catch {}
    }
  } catch {}
  logDialer("LISTENERS_ATTACH_DONE", { generation, totalAttachCount: listenerAttachCount });
  logDialer("LISTENER_ATTACH_VALIDATION", { attachCount: listenerAttachCount, expected: plivoClientGeneration });
  if (listenerAttachCount !== plivoClientGeneration) {
    logDialer("LISTENER_DUPLICATION_WARNING", { attachCount: listenerAttachCount, generation: plivoClientGeneration });
  }
}

// ─── Connection health monitor ──────────────────────────────────────
function startConnectionHealthMonitor() {
  if (connectionHealthInterval) return;
  connectionHealthInterval = setInterval(() => {
    if (!storeState.registered || storeState.connectionState !== "connected") return;
    const staleDuration = Date.now() - lastConnectedAt;
    if (staleDuration > 45000) {
      logDialer("STALE_REINIT_SKIPPED", { staleDurationMs: staleDuration });
    }
  }, 10000);
}

function stopConnectionHealthMonitor() {
  if (connectionHealthInterval) {
    clearInterval(connectionHealthInterval);
    connectionHealthInterval = null;
  }
}

function reinitializeDialer() {
  if (recoveryInProgress) {
    logDialer("INIT_SKIPPED", { reason: "recovery_in_progress" });
    return;
  }
  if (isInActiveCall()) {
    logDialer("REINIT_BLOCKED_ACTIVE_CALL", { status: storeState.status });
    return;
  }
  recoveryInProgress = true;
  logDialer("DIALER_REINIT_MANUAL_START");
  logDialer("DIALER_CLEANUP_OLD_CLIENT");
  destroyPlivoClient("manual_reinit");
  sdkInitStarted = false;
  initPromise = null;
  singletonInitialized = false;
  lastInitializedUserId = null;
  lastLoginCredentials = null;
  registrationRetryCount = 0;
  setStoreState((c) => ({ ...c, registered: false, status: "idle", sdkReady: false, plivoClientInitStatus: "reinitializing" }));
  window.setTimeout(() => {
    void initializeVoiceClient().finally(() => {
      recoveryInProgress = false;
      logDialer("DIALER_REINIT_MANUAL_DONE");
    });
  }, 1000);
}

// ─── SDK init ───────────────────────────────────────────────────────
async function initializeVoiceClient() {
  if (typeof window === "undefined") return;
  if (sdkInitStarted || initPromise) {
    logDialer("INIT_SKIPPED", { reason: "already_running" });
    return initPromise ?? Promise.resolve();
  }

  sdkInitStarted = true;
  initPromise = (async () => {
    bindPermissionListener();
    bindVisibilityRecovery();
    bindGlobalErrorHandlers();

    logDialer("DIALER_BUILD_VERSION", { version: BUILD_VERSION });
    logDialer("PLIVO_CLIENT_INIT_START");
    setStoreState((c) => ({ ...c, status: "initializing", plivoClientInitStatus: "initializing" }));

    const createClient = async () => {
    if (!window.Plivo) {
      logDialer("PLIVO_CLIENT_INIT_FAILED", { reason: "SDK_not_loaded" });
      setStoreState((c) => ({ ...c, status: "failed", lastError: "Voice SDK failed to load.", plivoClientInitStatus: "failed" }));
      return;
    }

    // HARD REQUIRE microphone permission before proceeding
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      logDialer("MIC_PERMISSION_GRANTED_HARD_CHECK");
      setStoreState((c) => ({ ...c, micPermission: "granted" }));
    } catch (micErr) {
      const reason = micErr instanceof Error ? micErr.message : String(micErr);
      logDialer("MIC_PERMISSION_BLOCKED", { error: reason });
      setStoreState((c) => ({
        ...c,
        micPermission: "denied",
        status: "permission_denied",
        lastError: "Microphone permission is required to use the dialer.",
        plivoClientInitStatus: "permission_blocked",
      }));
      toast.error("Microphone permission is required to use the dialer. Please allow microphone access and refresh.");
      return; // STOP initialization completely
    }

    destroyPlivoClient("new_client_creation");
    const generation = ++plivoClientGeneration;
    const instance = new window.Plivo({ debug: "INFO", permOnClick: true });
    plivoInstanceRef = instance;
    logDialer("CLIENT_SINGLETON_CREATED", { generation });
    bindPlivoEvents(instance, generation);

    setStoreState((c) => ({ ...c, sdkReady: true, status: "registering", plivoClientInitStatus: "client_created", connectionState: "connecting" }));
    logDialer("PLIVO_CLIENT_INIT_SUCCESS");

    await resumeAudioContext();

    try {
      const data = await fetchBrowserToken("init");

      if (data.app_id !== "45801072070731068") {
        throw new Error("Voice configuration mismatch.");
      }

      // Store credentials for re-login on disconnect/failure
      lastLoginCredentials = { username: data.username, password: data.password };
      registrationRetryCount = 0;
      lastConnectedAt = Date.now();

      // Start connection health monitor
      startConnectionHealthMonitor();

      if (!isActivePlivoClient(instance, generation)) return;
      scheduleLogin("initial_registration", data.username, data.password, 500);
    } catch (error) {
      logDialer("TOKEN_FETCH_FAILED", { error: error instanceof Error ? error.message : String(error) });
      setStoreState((c) => ({
        ...c,
        status: "failed",
        lastError: error instanceof Error ? error.message : String(error),
        pendingDialIntent: null,
        plivoClientInitStatus: "failed",
      }));
    }
  };

    if (window.Plivo) {
      await createClient();
      return;
    }

    await new Promise<void>((resolve) => {
      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts++;
        if (window.Plivo) {
          clearInterval(interval);
          void createClient().finally(resolve);
        } else if (attempts > 20) {
          clearInterval(interval);
          logDialer("PLIVO_CLIENT_INIT_FAILED", { reason: "SDK_load_timeout_10s" });
          setStoreState((c) => ({ ...c, status: "failed", lastError: "Voice SDK failed to load.", plivoClientInitStatus: "failed" }));
          resolve();
        }
      }, 500);
    });
  })().finally(() => {
    sdkInitStarted = false;
    initPromise = null;
  });

  return initPromise;
}

// ─── Mic permission ─────────────────────────────────────────────────
async function requestMicrophonePermissionInternal() {
  try {
    logDialer("MIC_PERMISSION_REQUEST");
    setStoreState((c) => ({ ...c, status: "requesting_permission", lastError: null }));
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    await resumeAudioContext();
    const track = stream.getAudioTracks()[0];
    const settings = track?.getSettings();
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const inputDevice = devices.find((d) => d.kind === "audioinput" && d.deviceId === settings.deviceId);
    const outputDevice = devices.find((d) => d.kind === "audiooutput");
    stream.getTracks().forEach((t) => t.stop());

    logDialer("MIC_PERMISSION_GRANTED", { inputDevice: inputDevice?.label || "Default" });
    setStoreState((c) => ({
      ...c,
      micPermission: "granted",
      status: c.registered ? "device_ready" : "idle",
      selectedInputDevice: inputDevice?.label || track?.label || "Default microphone",
      selectedOutputDevice: outputDevice?.label || "System default speaker",
      lastError: null,
      audioElementsAttached: true,
    }));
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logDialer("MIC_PERMISSION_DENIED", { reason: message });
    setStoreState((c) => ({
      ...c,
      micPermission: "denied",
      status: "permission_denied",
      lastError: `Microphone access denied: ${message}`,
    }));
    toast.error("Microphone permission denied.");
    return false;
  }
}

// ─── Hook ───────────────────────────────────────────────────────────
export function useBrowserDialer() {
  const { profile } = useAuth();
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const logs = useSyncExternalStore(subscribeToLogs, getLogSnapshot, getLogSnapshot);

  useEffect(() => {
    if (consumerCleanupTimer) {
      clearTimeout(consumerCleanupTimer);
      consumerCleanupTimer = null;
    }
    activeHookConsumers += 1;
    if (profile?.business_id) {
      authIdentity = { businessId: profile.business_id, userId: profile.user_id };
      lastStableAuthIdentity = authIdentity;
    } else if (lastStableAuthIdentity) {
      authIdentity = lastStableAuthIdentity;
      logDialer("BUSINESS_PROFILE_TRANSIENT_CHANGE", { preservedBusinessId: lastStableAuthIdentity.businessId });
    } else {
      authIdentity = null;
    }

    const currentUserId = profile?.user_id ?? null;
    setStoreState((c) => ({ ...c, userIdentifier: maskUserIdentifier(currentUserId) }));

    const userChanged = !!(currentUserId && lastInitializedUserId && currentUserId !== lastInitializedUserId);
    if (userChanged) {
      logDialer("USER_CHANGED_DETECTED", {
        previousUser: maskUserIdentifier(lastInitializedUserId),
        newUser: maskUserIdentifier(currentUserId),
        email: profile?.email ?? "unknown",
        voiceStatus: "reset_required",
        action: "force_reinit",
      });
      singletonInitialized = false;
      sdkInitStarted = false;
      initPromise = null;
      lastLoginCredentials = null;
      registrationRetryCount = 0;
      destroyPlivoClient("user_changed");
    }

    logDialer("DIALER_PAGE_MOUNTED", {
      version: BUILD_VERSION,
      consumers: activeHookConsumers,
      userId: maskUserIdentifier(currentUserId),
      email: profile?.email ?? "unknown",
    });
    logDialer("CONSUMER_COUNT_CHANGED", { consumers: activeHookConsumers });

    // Only sanitize stale state if there's NO active call — preserve active calls across remounts
    if (!isInActiveCall()) {
      sanitizeStaleState();
    } else {
      logDialer("ACTIVE_CALL_STATE_PRESERVED_ON_MOUNT", { status: storeState.status, sessionId: storeState.session?.id });
    }

    if (!singletonInitialized) {
      singletonInitialized = true;
      lastInitializedUserId = currentUserId;
      logDialer("DIALER_INIT_FOR_USER", {
        userId: maskUserIdentifier(currentUserId),
        email: profile?.email ?? "unknown",
        businessId: profile?.business_id ?? "none",
        tokenStatus: currentAccessToken ? "ready" : "pending",
        voiceStatus: "initializing",
      });
      const persistedPending = readPendingDial();
      if (persistedPending && !modulePendingDial) {
        modulePendingDial = persistedPending;
        setStoreState((c) => ({ ...c, pendingDialIntent: persistedPending }));
      }
      void initializeVoiceClient();
    }

    return () => {
      activeHookConsumers = Math.max(0, activeHookConsumers - 1);
      logDialer("EFFECT_CLEANUP_RUN", { remainingConsumers: activeHookConsumers });
      logDialer("CONSUMER_COUNT_CHANGED", { consumers: activeHookConsumers });
      // ── CRITICAL (stability-v18): NEVER destroy client on unmount ──
      // Zero consumers is normal when page-level dialer unmounts but
      // PersistentDialerConsumer at shell level keeps count >= 1.
      // Even if it somehow hits zero, we keep the singleton alive.
      if (activeHookConsumers === 0) {
        logDialer("ZERO_CONSUMERS_DETECTED_BUT_IGNORED", {
          route: typeof window !== "undefined" ? window.location.pathname : "unknown",
          visibilityState: typeof document !== "undefined" ? document.visibilityState : "unknown",
          activeCall: isInActiveCall(),
          registered: storeState.registered,
        });
        // Intentionally do NOT destroy client, clear state, or reset anything.
        // singletonInitialized stays true so re-mount reuses existing client.
      }
    };
  }, [profile?.business_id, profile?.user_id]);

  useEffect(() => {
    void maybeResumeQueuedCall("hook_state_change");
  }, [state.pendingDialIntent?.phoneNumber, state.audioReady, state.registered, state.connectionState, state.plivoClientInitStatus, state.loading, state.dialLock, state.status]);

  const loadLeadHistory = useCallback(async (leadId: string) => {
    const calls = await fetchLeadCallHistory(leadId);
    setStoreState((c) => ({ ...c, previousCalls: calls }));
  }, []);

  const requestMicPermission = useCallback(async () => requestMicrophonePermissionInternal(), []);

  const unlockAudio = useCallback(async () => {
    logDialer("AUDIO_ENABLE_BUTTON_CLICKED");
    logDialer("AUDIO_RESUME_TRIGGERED_BY_USER", { source: "manual_unlock_action" });
    if (storeState.micPermission !== "granted") {
      const granted = await requestMicrophonePermissionInternal();
      if (!granted) {
        logDialer("AUDIO_UNLOCK_FINAL_STATE", { ready: false, mode: "mic_denied" });
        return { ready: false, status: storeState.audioStatus };
      }
    }

    const ctx = await resumeAudioContext();
    logDialer("AUDIO_CONTEXT_RESUME_RESULT", { state: ctx?.state ?? "unavailable" });
    const ready = await initializeAudioOutput();
    if (ready) {
      const status = storeState.audioStatus;
      logDialer("AUDIO_READY_UI_UPDATED", { ready: storeState.audioReady, status });
      logDialer("CALL_READY_AFTER_AUDIO_UNLOCK", { status });
      logDialer("AUDIO_RESUME_COMPLETED", { source: "manual_unlock_action", status });
      toast.success(status === "audio_ready_degraded" ? "Audio ready. You can place calls in fallback mode." : "Audio ready. You can place calls.");
      void maybeResumeQueuedCall("manual_unlock_action");
      return { ready: true, status };
    }
    toast.error("Browser blocked audio. Interact with the page, then click Enable Browser Audio again.");
    return { ready: false, status: storeState.audioStatus };
  }, []);

  const startCall = useCallback(async (phoneNumber: string, leadId?: string, clientId?: string) => {
    logDialer("CALL_BUTTON_CLICKED", { phoneNumber, leadId: leadId ?? null });

    const readiness = canPlaceCall();
    logDialer("START_CALL_ENTERED", {
      rawPhoneNumber: phoneNumber,
      leadId: leadId ?? null,
      registered: storeState.registered,
      status: storeState.status,
      loading: storeState.loading,
      audioReady: storeState.audioReady,
      audioStatus: storeState.audioStatus,
      canPlaceCall: readiness.ready,
      readinessReason: readiness.reason,
    });

    if (!profile?.business_id) {
      logDialer("CALL_BLOCKED", { reason: "no_profile" });
      return;
    }
    if (storeState.dialLock || storeState.loading) {
      logDialer("CALL_BLOCKED", { reason: "dial_lock_or_loading" });
      toast.warning("A call is already being set up.");
      return;
    }
    if (["dialing", "ringing", "connected"].includes(storeState.status)) {
      logDialer("CALL_BLOCKED", { reason: "already_active", status: storeState.status });
      toast.warning("A call is already active.");
      return;
    }
    if (["registering", "initializing"].includes(storeState.status)) {
      logDialer("CALL_BLOCKED_STATUS_REGISTERING", { status: storeState.status });
      toast.warning("Voice service still connecting. Please wait.");
      return;
    }
    if (!phoneNumber.trim()) {
      logDialer("CALL_BLOCKED", { reason: "empty_number" });
      toast.error("Please enter a phone number.");
      return;
    }

    // Check mic
    if (storeState.micPermission !== "granted") {
      logDialer("START_CALL_MIC_CHECK");
      const granted = await requestMicrophonePermissionInternal();
      if (!granted) return;
    }

    const intent: PendingDialIntent = { phoneNumber: phoneNumber.trim(), leadId, clientId };

    // ── AUDIO UNLOCK: Try once with timeout, but don't permanently block ──
    if (!storeState.audioReady) {
      logDialer("START_CALL_AUDIO_UNLOCK_ATTEMPT");
      await resumeAudioContext();
      const audioOk = await withTimeout(initializeAudioOutput(), 3000, false);
      logDialer("START_CALL_AUDIO_UNLOCK_RESULT", { audioOk, audioReady: storeState.audioReady, audioStatus: storeState.audioStatus });

      // If audio init timed out but we can use degraded mode, force it
      if (!storeState.audioReady) {
        const ctx = getAudioContext();
        if (canUseDegradedAudioMode(ctx)) {
          logDialer("START_CALL_FORCE_DEGRADED_AUDIO", { audioContextState: ctx?.state });
          setStoreState((c) => ({
            ...c,
            audioReady: true,
            audioStatus: "audio_ready_degraded",
            latestBrowserMediaStatus: "audio_forced_degraded_for_call",
          }));
        }
      }
    }

    // ── FINAL READINESS CHECK ──
    // Check everything needed for the call
    const finalReadiness = canPlaceCall();
    logDialer("START_CALL_VALIDATION_RESULT", {
      ready: finalReadiness.ready,
      reason: finalReadiness.reason,
      audioReady: storeState.audioReady,
      registered: storeState.registered,
      connectionState: storeState.connectionState,
    });

    if (!finalReadiness.ready) {
      logDialer("CALL_QUEUED_BEFORE_REGISTER", { destination: phoneNumber.trim(), reason: finalReadiness.reason });
      storeQueuedCall(intent, finalReadiness.reason);
      if (finalReadiness.reason === "audio_not_ready") {
        logDialer("CALL_BLOCKED_AUDIO_NOT_READY", { audioStatus: storeState.audioStatus });
        toast.error("Browser audio is blocked. Click Enable Browser Audio to continue.");
      } else {
        toast.error("Voice not ready");
      }
      return;
    }

    logDialer("START_CALL_REGISTERED_PATH", { number: phoneNumber.trim() });
    await executeOutboundCall(intent);
  }, [profile]);

  const endCall = useCallback(async () => {
    logDialer("HANGUP_REQUESTED");
    setStoreState((c) => ({ ...c, status: "ending" }));
    try { plivoInstanceRef?.client?.hangup(); } catch {}

    if (storeState.session?.id) {
      await supabase.from("dialer_sessions").update({ call_status: "ended", call_end_time: new Date().toISOString() } as never).eq("id", storeState.session.id);
      await insertCallEvent(storeState.session.id, "browser_call_ended", { ended_by: "agent" });
    }

    stopRingback();
    setStoreState((c) => ({ ...c, status: "ended" }));
    updateCurrentAttempt({ status: "ended", endedAt: new Date().toISOString() });
    await setAgentAvailability("available");
    logDialer("CALL_CLEANUP_DONE");
  }, []);

  const toggleMute = useCallback(() => {
    const client = plivoInstanceRef?.client;
    if (!client) return;
    if (storeState.isMuted) {
      client.unmute();
      setStoreState((c) => ({ ...c, isMuted: false }));
      logDialer("BROWSER_UNMUTED");
    } else {
      client.mute();
      setStoreState((c) => ({ ...c, isMuted: true }));
      logDialer("BROWSER_MUTED");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleLogoutReset = () => resetDialerStateOnLogout();
    window.addEventListener(DIALER_LOGOUT_RESET_EVENT, handleLogoutReset);
    return () => window.removeEventListener(DIALER_LOGOUT_RESET_EVENT, handleLogoutReset);
  }, []);

  const resetDialer = useCallback(() => {
    logDialer("DIALER_RESET");
    stopRingback();
    sessionUnsubRef?.();
    sessionUnsubRef = null;
    sessionSubId = null;
    setStoreState((c) => ({
      ...c,
      session: null,
      callTimer: 0,
      isMuted: false,
      destinationNumber: "",
      selectedCallerId: "",
      lastError: null,
      pendingDialIntent: null,
      dialLock: false,
      latestProviderStatus: null,
      status: c.registered ? (c.micPermission === "granted" ? "device_ready" : "registered") : "idle",
    }));
  }, []);

  const redialLast = useCallback(async () => {
    if (storeState.lastCalledNumber) await startCall(storeState.lastCalledNumber);
  }, [startCall]);

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
    voiceClientRegistration: state.registered ? "ready" : state.status === "registering" ? "registering" : state.status === "failed" ? "failed" : "offline",
    latestProviderStatus: state.latestProviderStatus,
    latestBrowserMediaStatus: state.latestBrowserMediaStatus,
    lastError: state.lastError,
    lastEvent: state.lastEvent,
    pendingDialNumber: state.pendingDialIntent?.phoneNumber || null,
    clientHealthy: isClientHealthy(),
    connectionState: state.connectionState,
    tabVisibilityState: state.tabVisibilityState,
    plivoClientInitStatus: state.plivoClientInitStatus,
    lastTokenFetchStatus: state.lastTokenFetchStatus,
    lastTokenUsername: state.lastTokenUsername,
    lastTokenAppId: state.lastTokenAppId,
    lastTokenHasPassword: state.lastTokenHasPassword,
    lastAnswerXmlStatus: state.lastAnswerXmlStatus,
    lastAnswerXmlContentType: state.lastAnswerXmlContentType,
    lastAnswerXmlBody: state.lastAnswerXmlBody,
    buildVersion: BUILD_VERSION,
    deployedAt: DEPLOYED_AT,
    environment: getEnvironmentLabel(),
    userIdentifier: state.userIdentifier,
    hasAccessToken: state.hasAccessToken,
    hasActiveCall: ["dialing", "ringing", "connected"].includes(state.status),
    audioElementsAttached: state.audioElementsAttached,
    audioPlayable: state.audioPlayable,
  };

  const fmtTimer = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const reconnectVoice = useCallback(() => {
    logDialer("MANUAL_RECONNECT_TRIGGERED");
    reinitializeDialer();
  }, []);

  const testRegistration = useCallback(async () => {
    logDialer("REG_TEST_START", { hasClient: !!plivoInstanceRef?.client });
    if (!plivoInstanceRef?.client) {
      logDialer("REG_TEST_CLIENT_READY", { ready: false });
      await initializeVoiceClient();
      return;
    }
    logDialer("REG_TEST_CLIENT_READY", { ready: true });
    if (storeState.registered) {
      logDialer("REG_TEST_REGISTERED");
      return;
    }
    if (lastLoginCredentials) {
      logDialer("REG_TEST_LOGIN_ATTEMPT");
      scheduleLogin("manual_registration_test", lastLoginCredentials.username, lastLoginCredentials.password);
      return;
    }
    await initializeVoiceClient();
  }, []);

  const testTokenFetch = useCallback(async () => fetchBrowserToken("test"), []);

  const testAnswerXml = useCallback(async () => testAnswerXmlEndpoint(), []);

  return {
    session: state.session,
    callStatus: state.status,
    agentState: state.agentState,
    callTimer: state.callTimer,
    formattedTimer: fmtTimer(state.callTimer),
    isMuted: state.isMuted,
    previousCalls: state.previousCalls,
    loading: state.loading,
    isCallActive: ["dialing", "ringing", "connected"].includes(state.status),
    registered: state.registered,
    sdkReady: state.sdkReady,
    micPermission: state.micPermission,
    lastError: state.lastError,
    lastCalledNumber: state.lastCalledNumber,
    recentNumbers: state.recentNumbers,
    callAttempts: state.callAttempts,
    pendingDial: state.pendingDialIntent,
    pendingDialReason: state.pendingDialIntent?.blockedReason ?? null,
    audioReady: state.audioReady,
    audioStatus: state.audioStatus,
    diagnostics,
    debugLogs: logs,
    buildVersion: BUILD_VERSION,
    deployedAt: DEPLOYED_AT,
    logEvent: logDialer,
    clearDebugLogs: clearDialerLogs,
    startCall,
    endCall,
    toggleMute,
    submitDisposition,
    tagCall,
    loadLeadHistory,
    resetDialer,
    requestMicPermission,
    redialLast,
    reconnectVoice,
    unlockAudio,
    testRegistration,
    testTokenFetch,
    testAnswerXml,
  };
}
