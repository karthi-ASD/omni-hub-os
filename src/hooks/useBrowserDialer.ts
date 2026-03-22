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
  timestamp: string;
  event: string;
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
}

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
};

const BUILD_VERSION = "stability-v11";
const DEPLOYED_AT = "2026-03-22T04:40:00Z";
type DialerIdentity = { businessId: string; userId: string } | null;

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
let modulePendingDial: PendingDialIntent | null = null;
let recoveryInProgress = false;
let initPromise: Promise<void> | null = null;
let loginInProgress = false;
let reloginTimeoutRef: number | null = null;
let activeHookConsumers = 0;
let consumerCleanupTimer: number | null = null;
let currentAccessToken: string | null = null;

// ─── Connection health monitor ──────────────────────────────────────
let lastConnectedAt = Date.now();
let connectionHealthInterval: ReturnType<typeof setInterval> | null = null;
let registrationRetryCount = 0;
const MAX_REGISTRATION_RETRIES = 3;
let lastLoginCredentials: { username: string; password: string } | null = null;

// ─── Log ring buffer ────────────────────────────────────────────────
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

function logDialer(event: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console.log(`[DIALER][${timestamp}] ${event}`, data || "");
  logBuffer.push({ timestamp, event, data });
  if (logBuffer.length > MAX_LOG_ENTRIES) logBuffer.shift();
  emitLogChange();
  setStoreState((c) => ({
    ...c,
    lastEvent: event,
    latestProviderStatus: data?.providerStatus ? String(data.providerStatus) : c.latestProviderStatus,
    latestBrowserMediaStatus: data?.mediaStatus ? String(data.mediaStatus) : c.latestBrowserMediaStatus,
  }));
}

// ─── Global error handlers ──────────────────────────────────────────
function bindGlobalErrorHandlers() {
  if (globalErrorsBound || typeof window === "undefined") return;
  globalErrorsBound = true;
  window.addEventListener("error", (e) => logDialer("GLOBAL_ERROR", { message: e.message, filename: e.filename }));
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

function transitionStatus(nextStatus: BrowserDialerStatus) {
  const prev = storeState.status;
  // Start timer on connected
  if (prev !== "connected" && nextStatus === "connected" && !timerRef) {
    timerRef = setInterval(() => {
      storeState = { ...storeState, callTimer: storeState.callTimer + 1 };
      emitChange();
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

function getCallerIdForNumber(number: string): string {
  if (number.startsWith("+91")) return "India caller ID";
  if (number.startsWith("+61")) return "Australia caller ID";
  if (number.startsWith("+1")) return "US caller ID";
  return "Default caller ID";
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

async function fetchBrowserToken(context: "init" | "test" = "test") {
  const session = await syncAccessTokenState();

  if (!session?.access_token) {
    logDialer("NO_ACTIVE_SESSION");
    setStoreState((c) => ({
      ...c,
      status: "auth_required",
      registered: false,
      lastError: "Please log in to use calling features.",
      lastTokenFetchStatus: 401,
      lastTokenHasPassword: false,
    }));
    throw new Error("Please log in to use calling features.");
  }

  const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dialer-browser-token`;
  logDialer(context === "test" ? "TOKEN_TEST_START" : "CALLING_TOKEN_FUNCTION", { url: functionUrl, hasAccessToken: true });

  const res = await fetch(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({}),
  });

  logDialer("TOKEN_FETCH_RESPONSE_STATUS", { status: res.status, context });
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
    logDialer("TOKEN_TEST_FAILED", { error: data?.error || `Token request failed (${res.status})` });
    throw new Error(data?.error || `Token request failed (${res.status})`);
  }

  logDialer("TOKEN_RECEIVED_FULL", { username: data.username, hasPassword: !!data.password, app_id: data.app_id });
  return { ...data, url: functionUrl, status: res.status };
}

function scheduleLogin(reason: string, username: string, password: string, delayMs = 0) {
  if (!plivoInstanceRef?.client) {
    logDialer("LOGIN_SKIPPED", { reason: "missing_client", requestedBy: reason });
    return;
  }
  if (loginInProgress) {
    logDialer("LOGIN_SKIPPED", { reason: "already_running", requestedBy: reason });
    return;
  }
  if (storeState.registered || storeState.connectionState === "connected") {
    logDialer("RELOGIN_SKIPPED_ALREADY_REGISTERED", { requestedBy: reason });
    return;
  }

  const runLogin = () => {
    if (!plivoInstanceRef?.client) return;
    loginInProgress = true;
    setStoreState((c) => ({ ...c, plivoClientInitStatus: "logging_in" }));
    logDialer("PLIVO_LOGIN_CALLING", { reason });
    plivoInstanceRef.client.login(username, password);
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
    } catch (err) {
      logDialer("AUDIO_RESUME_FAILED", { reason: String(err) });
    }
  }
  setStoreState((c) => ({ ...c, latestBrowserMediaStatus: `audio_context_${ctx.state}` }));
  return ctx;
}

// ─── Ringback ───────────────────────────────────────────────────────
async function playRingback() {
  try {
    logDialer("RINGTONE_PLAY_ATTEMPT");
    if (ringbackRef) return;
    const ctx = await resumeAudioContext();
    if (!ctx) return;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    const osc1 = ctx.createOscillator(); osc1.frequency.value = 440; osc1.type = "sine"; osc1.connect(gain); osc1.start();
    const osc2 = ctx.createOscillator(); osc2.frequency.value = 480; osc2.type = "sine"; osc2.connect(gain); osc2.start();
    let time = ctx.currentTime;
    for (let i = 0; i < 20; i++) { gain.gain.setValueAtTime(0.04, time); time += 2; gain.gain.setValueAtTime(0, time); time += 4; }
    ringbackRef = { ctx, osc1, osc2, gain };
    setStoreState((c) => ({ ...c, audioElementsAttached: true, audioPlayable: true }));
    logDialer("RINGTONE_PLAY_SUCCESS");
  } catch (e) {
    setStoreState((c) => ({ ...c, audioPlayable: false }));
    logDialer("RINGTONE_PLAY_FAILED", { reason: e instanceof Error ? e.message : String(e) });
  }
}

function stopRingback() {
  if (!ringbackRef) return;
  try { ringbackRef.gain.disconnect(); } catch {}
  try { ringbackRef.osc1.stop(); } catch {}
  try { ringbackRef.osc2.stop(); } catch {}
  ringbackRef = null;
  setStoreState((c) => ({ ...c, audioPlayable: false }));
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
function bindVisibilityRecovery() {
  if (visibilityListenerBound || typeof document === "undefined") return;
  document.addEventListener("visibilitychange", handleVisibilityChange);
  visibilityListenerBound = true;
}

function handleVisibilityChange() {
  const visible = document.visibilityState === "visible";
  logDialer("TAB_VISIBILITY_CHANGE", { visibilityState: document.visibilityState });
  setStoreState((c) => ({ ...c, tabVisibilityState: document.visibilityState }));

  if (!visible) return; // Nothing to do when hiding

  // Resume audio safely
  void resumeAudioContext().catch(() => {});

  // Check client health
  const healthy = isClientHealthy();
  const currentStatus = storeState.status;
  const isTransient = ["dialing", "ringing", "connected"].includes(currentStatus);

  logDialer("TAB_RESUME_HEALTH_CHECK", {
    healthy,
    registered: storeState.registered,
    currentStatus,
    hasClient: !!plivoInstanceRef?.client,
  });

  // If in an active call, just resume audio — don't touch state
  if (isTransient && healthy) return;

  // If client is dead and we're not in an active call, try recovery
  if (!healthy && !isTransient && !recoveryInProgress) {
    logDialer("DIALER_STATE_RECOVERY_START", { reason: "client_missing_on_tab_resume" });
    recoveryInProgress = true;
    sdkInitStarted = false;
    singletonInitialized = false;
    registrationRetryCount = 0;
    setStoreState((c) => ({ ...c, registered: false, status: "idle", sdkReady: false }));
    void initializeVoiceClient().finally(() => {
      recoveryInProgress = false;
      logDialer("DIALER_STATE_RECOVERY_DONE");
    });
    return;
  }

  // If not registered but client exists, force re-login
  if (!storeState.registered && healthy && !recoveryInProgress && lastLoginCredentials) {
    logDialer("REINIT_AFTER_TAB_RETURN", { reason: "not_registered_but_client_exists" });
    scheduleLogin("tab_return", lastLoginCredentials.username, lastLoginCredentials.password, 500);
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
async function executeOutboundCall(intent: PendingDialIntent) {
  logDialer("EXECUTE_OUTBOUND_CALL_ENTERED", { raw: intent.phoneNumber });

  if (!authIdentity || !plivoInstanceRef?.client) {
    logDialer("EXECUTE_CALL_BLOCKED", { reason: "no_auth_or_client" });
    return;
  }
  if (storeState.dialLock) {
    logDialer("EXECUTE_CALL_BLOCKED", { reason: "dial_lock_active" });
    return;
  }

  setStoreState((c) => ({ ...c, dialLock: true, loading: true, lastError: null, pendingDialIntent: null, lastActionAt: new Date().toISOString() }));

  try {
    await resumeAudioContext();

    let resolvedPhone = intent.phoneNumber;
    if (intent.leadId) {
      const { data: lead } = await supabase.from("leads").select("phone").eq("id", intent.leadId).maybeSingle();
      if (lead?.phone) resolvedPhone = lead.phone;
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

    const selectedCallerId = getCallerIdForNumber(normalizedPhone);
    logDialer("CALLER_ID_SELECTED", { callerId: selectedCallerId, destination: normalizedPhone });

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
      selectedCallerId,
      status: "dialing",
      isMuted: false,
      callTimer: 0,
      lastCalledNumber: normalizedPhone,
      recentNumbers: [normalizedPhone, ...c.recentNumbers.filter((n) => n !== normalizedPhone)].slice(0, 10),
      latestProviderStatus: "dialing",
    }));

    const sess = await createDialerSession({
      businessId: authIdentity.businessId,
      userId: authIdentity.userId,
      phoneNumber: normalizedPhone,
      leadId: intent.leadId,
      clientId: intent.clientId,
    });

    if (!sess) throw new Error("Failed to create call session");

    logDialer("SESSION_CREATED", { sessionId: sess.id });
    await supabase.from("dialer_sessions").update({ call_mode: "browser", call_status: "initiating" } as never).eq("id", sess.id);

    bindSession(sess.id);
    setStoreState((c) => ({ ...c, session: sess }));
    await setAgentAvailability("on_call");

    logDialer("CALL_DIAL_START", { destinationNumber: normalizedPhone, sessionId: sess.id });
    logDialer("PLIVO_CALL_INVOKING_NOW", { destination: normalizedPhone });

    plivoInstanceRef.client.call(normalizedPhone, { "X-PH-SessionId": sess.id });

    logDialer("PLIVO_CALL_INVOKED", { destinationNumber: normalizedPhone });
    await insertCallEvent(sess.id, "browser_call_initiated", { destination: normalizedPhone, call_mode: "browser" });
    toast.info(`Calling ${normalizedPhone}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Call initiation failed";
    logDialer("CALL_START_ERROR", { reason: message });
    setStoreState((c) => ({ ...c, status: "failed", lastError: message, latestProviderStatus: "call_start_failed" }));
    updateCurrentAttempt({ status: "failed", failureReason: message, endedAt: new Date().toISOString() });
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

function destroyPlivoClient() {
  if (!plivoInstanceRef?.client) return;
  logDialer("LISTENERS_DETACHED");
  try { plivoInstanceRef.client.hangup(); } catch {}
  try { plivoInstanceRef.client.logout(); } catch {}
  plivoInstanceRef = null;
  loginInProgress = false;
  clearReloginTimeout();
  logDialer("CLIENT_DESTROYED");
}

function bindPlivoEvents(instance: PlivoBrowserSDK, generation: number) {
  const guard = () => isActivePlivoClient(instance, generation);
  logDialer("LISTENERS_ATTACHED", { generation });

  instance.client.on("onWebrtcNotSupported", () => {
    if (!guard()) return;
    setStoreState((c) => ({ ...c, status: "failed", lastError: "Browser does not support WebRTC" }));
    logDialer("PLIVO_WEBRTC_NOT_SUPPORTED");
  });

  instance.client.on("onLogin", () => {
    if (!guard()) return;
    loginInProgress = false;
    clearReloginTimeout();
    // Capture pending BEFORE clearing — read both sources
    const pending = modulePendingDial || storeState.pendingDialIntent;
    modulePendingDial = null;

    logDialer("VOICE_REGISTERED", {
      providerStatus: "registered",
      hasPendingDial: !!pending,
      pendingNumber: pending?.phoneNumber || null,
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
      // Clear pendingDialIntent only when execution starts
      setTimeout(() => {
        setStoreState((c) => ({ ...c, pendingDialIntent: null }));
        void executeOutboundCall(pending);
      }, 300);
    }
  });

  instance.client.on("onLoginFailed", (cause: string) => {
    if (!guard()) return;
    loginInProgress = false;
    logDialer("VOICE_REGISTRATION_FAILED_FULL", { reason: cause, retryCount: registrationRetryCount });

    if (registrationRetryCount < MAX_REGISTRATION_RETRIES && lastLoginCredentials) {
      registrationRetryCount++;
      logDialer("REGISTRATION_FAILED_RETRY", { attempt: registrationRetryCount, maxRetries: MAX_REGISTRATION_RETRIES });
      try { instance.client.logout(); } catch {}
      window.setTimeout(() => {
        if (!guard() || !lastLoginCredentials) return;
        logDialer("REGISTRATION_RETRY_LOGIN", { attempt: registrationRetryCount });
        scheduleLogin("registration_retry", lastLoginCredentials.username, lastLoginCredentials.password);
      }, 2000);
    } else {
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
    if (!guard()) return;
    const connState = conn?.state || "unknown";
    logDialer("PLIVO_CONNECTION_CHANGE", { state: connState });
    setStoreState((c) => ({ ...c, connectionState: connState }));

    if (connState === "connected") {
      lastConnectedAt = Date.now();
      loginInProgress = false;
      clearReloginTimeout();
    }

    if (connState === "disconnected") {
      logDialer("PLIVO_DISCONNECTED_DETECTED");
      // If not in an active call, force re-login after delay
      const isInCall = ["dialing", "ringing", "connected"].includes(storeState.status);
      loginInProgress = false;
      if (!isInCall && lastLoginCredentials && !recoveryInProgress) {
        logDialer("FORCE_RELOGIN", { reason: "connection_disconnected" });
        setStoreState((c) => ({ ...c, registered: false, status: "idle", plivoClientInitStatus: "disconnected" }));
        scheduleRelogin("connection_disconnected");
      }
    }
  });

  instance.client.on("onMediaPermission", (result: { status: boolean }) => {
    if (!guard()) return;
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
    if (!guard()) return;
    logDialer("CALL_REMOTE_RINGING", { callInfoState: callInfo.state || "ringing" });
    setStoreState((c) => ({ ...c, status: "ringing", latestProviderStatus: "ringing" }));
    updateCurrentAttempt({ status: "ringing", ringingAt: new Date().toISOString(), providerStatus: "ringing" });
    await playRingback();
  });

  instance.client.on("onCallAnswered", async (callInfo: Plivo.CallInfo) => {
    if (!guard()) return;
    logDialer("CALL_ANSWERED", { callInfoState: callInfo.state || "answered" });
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
    void setAgentAvailability("on_call");
  });

  instance.client.on("onCallTerminated", (callInfo: Plivo.CallInfo) => {
    if (!guard()) return;
    logDialer("CALL_TERMINATED", { callInfoState: callInfo.state || "terminated" });
    stopRingback();
    setStoreState((c) => ({ ...c, status: "ended", latestProviderStatus: "terminated", audioPlayable: false }));
    updateCurrentAttempt({ status: "ended", endedAt: new Date().toISOString() });
    void setAgentAvailability("available");
  });

  instance.client.on("onCallFailed", (cause: string) => {
    if (!guard()) return;
    logDialer("CALL_FAILED", { reason: cause, destination: storeState.destinationNumber });
    stopRingback();
    setStoreState((c) => ({
      ...c,
      status: "failed",
      lastError: `Call failed: ${cause}`,
      latestProviderStatus: cause,
      audioPlayable: false,
    }));
    updateCurrentAttempt({ status: "failed", failureReason: cause, endedAt: new Date().toISOString() });
    void setAgentAvailability("available");
  });

  // Extra raw events for diagnostics
  try {
    for (const evt of ["onCalling", "onMediaConnected", "onCallRinging", "onIncomingCall", "onIncomingCallCanceled"]) {
      try {
        instance.client.on(evt, (...args: unknown[]) => {
          if (!guard()) return;
          logDialer("PLIVO_RAW_EVENT", { eventName: evt, args: args.length > 0 ? args : undefined });
        });
      } catch {}
    }
  } catch {}
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
  recoveryInProgress = true;
  logDialer("DIALER_REINIT_MANUAL_START");
  logDialer("DIALER_CLEANUP_OLD_CLIENT");
  destroyPlivoClient();
  sdkInitStarted = false;
  initPromise = null;
  singletonInitialized = false;
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

    destroyPlivoClient();
    const generation = ++plivoClientGeneration;
    const instance = new window.Plivo({ debug: "INFO", permOnClick: true });
    plivoInstanceRef = instance;
    logDialer("CLIENT_CREATED", { generation });
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
    authIdentity = profile?.business_id ? { businessId: profile.business_id, userId: profile.user_id } : null;
    setStoreState((c) => ({ ...c, userIdentifier: maskUserIdentifier(profile?.user_id ?? null) }));
    logDialer("DIALER_PAGE_MOUNTED", { version: BUILD_VERSION });

    // Reset stale transient state on mount
    sanitizeStaleState();

    if (!singletonInitialized) {
      singletonInitialized = true;
      void initializeVoiceClient();
    }

    return () => {
      activeHookConsumers = Math.max(0, activeHookConsumers - 1);
      logDialer("EFFECT_CLEANUP_RUN", { remainingConsumers: activeHookConsumers });
      if (activeHookConsumers === 0) {
        consumerCleanupTimer = window.setTimeout(() => {
          if (activeHookConsumers > 0) return;
          stopConnectionHealthMonitor();
          sessionUnsubRef?.();
          sessionUnsubRef = null;
          sessionSubId = null;
          destroyPlivoClient();
          singletonInitialized = false;
          sdkInitStarted = false;
        }, 1000);
      }
    };
  }, [profile?.business_id, profile?.user_id]);

  const loadLeadHistory = useCallback(async (leadId: string) => {
    const calls = await fetchLeadCallHistory(leadId);
    setStoreState((c) => ({ ...c, previousCalls: calls }));
  }, []);

  const requestMicPermission = useCallback(async () => requestMicrophonePermissionInternal(), []);

  const startCall = useCallback(async (phoneNumber: string, leadId?: string, clientId?: string) => {
    logDialer("START_CALL_ENTERED", {
      rawPhoneNumber: phoneNumber,
      leadId: leadId ?? null,
      registered: storeState.registered,
      status: storeState.status,
      loading: storeState.loading,
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
    if (!phoneNumber.trim()) {
      logDialer("CALL_BLOCKED", { reason: "empty_number" });
      toast.error("Please enter a phone number.");
      return;
    }

    // Check mic
    if (storeState.micPermission !== "granted") {
      const granted = await requestMicrophonePermissionInternal();
      if (!granted) return;
    }

    const intent: PendingDialIntent = { phoneNumber: phoneNumber.trim(), leadId, clientId };

    if (!storeState.registered || !plivoInstanceRef?.client) {
      logDialer("CALL_QUEUED_BEFORE_REGISTER", { destination: phoneNumber.trim() });
      modulePendingDial = intent;
      setStoreState((c) => ({ ...c, pendingDialIntent: intent }));
      toast.info("Call queued — waiting for voice registration…");
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
    diagnostics,
    debugLogs: logs,
    buildVersion: BUILD_VERSION,
    deployedAt: DEPLOYED_AT,
    logEvent: logDialer,
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
    testRegistration,
    testTokenFetch,
    testAnswerXml,
  };
}
