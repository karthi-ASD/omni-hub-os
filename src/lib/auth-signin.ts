import { supabase } from "@/integrations/supabase/client";

const DIRECT_AUTH_TIMEOUT_MS = 8000;
const PROXY_AUTH_TIMEOUT_MS = 12000;
const LOCAL_SIGNOUT_TIMEOUT_MS = 1500;
const AUTH_TIMEOUT_CODE = "AUTH_TIMEOUT";
const SIGNOUT_TIMEOUT_CODE = "AUTH_SIGNOUT_TIMEOUT";

const AUTH_CONFIG_ERROR_CODE = "AUTH_CONFIG_ERROR";

type PasswordAuthResult = {
  data: {
    user: unknown | null;
    session: unknown | null;
    [key: string]: unknown;
  };
  error: unknown;
};

type ProxyAuthPayload = {
  access_token?: string;
  refresh_token?: string;
  error?: string;
  error_description?: string;
  msg?: string;
};

type AuthDiagnostics = {
  hasSupabaseUrl: boolean;
  hasPublishableKey: boolean;
  hasAnonKeyAlias: boolean;
  supabaseUrl: string;
};

const isTimeoutError = (error: unknown, code: string) =>
  error instanceof Error && error.message === code;

const isNetworkAuthError = (error: unknown) =>
  error instanceof Error && /failed to fetch|networkerror|load failed|err_failed/i.test(error.message);

const shouldFallbackToProxy = (error: unknown) =>
  isTimeoutError(error, AUTH_TIMEOUT_CODE) || isNetworkAuthError(error);

const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  timeoutCode: string
): Promise<T> => {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(timeoutCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
};

export const getAuthClientDiagnostics = (): AuthDiagnostics => {
  const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || "").trim();
  const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  const anonKeyAlias = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

  return {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasPublishableKey: Boolean(publishableKey),
    hasAnonKeyAlias: Boolean(anonKeyAlias),
    supabaseUrl,
  };
};

const validateAuthConfig = () => {
  const diagnostics = getAuthClientDiagnostics();

  if (!diagnostics.hasSupabaseUrl || !diagnostics.hasPublishableKey) {
    throw new Error(AUTH_CONFIG_ERROR_CODE);
  }

  return diagnostics;
};

const proxyPasswordSignIn = async (email: string, password: string): Promise<PasswordAuthResult> => {
  const { data, error: invokeError } = await withTimeout(
    () =>
      supabase.functions.invoke("auth-password-proxy", {
        body: { email: email.trim(), password },
      }),
    PROXY_AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_CODE
  );

  if (invokeError) {
    return {
      data: { user: null, session: null },
      error: new Error(invokeError.message || "Login failed"),
    };
  }

  const payload = (data ?? {}) as ProxyAuthPayload;

  if (payload.error) {
    return {
      data: { user: null, session: null },
      error: new Error(payload.msg || payload.error_description || payload.error),
    };
  }

  if (!payload.access_token || !payload.refresh_token) {
    return {
      data: { user: null, session: null },
      error: new Error("Login succeeded but session could not be restored"),
    };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });

  const normalizedSessionData =
    (sessionData as { user?: unknown; session?: unknown; [key: string]: unknown } | null) ?? {};

  return {
    data: {
      ...normalizedSessionData,
      user: normalizedSessionData.user ?? null,
      session: normalizedSessionData.session ?? null,
    },
    error: sessionError,
  };
};

export const signInWithPasswordResilient = async (
  email: string,
  password: string
): Promise<PasswordAuthResult> => {
  const credentials = { email: email.trim(), password };
  const diagnostics = validateAuthConfig();

  if (import.meta.env.DEV) {
    console.info("[auth] client diagnostics", {
      hasSupabaseUrl: diagnostics.hasSupabaseUrl,
      hasPublishableKey: diagnostics.hasPublishableKey,
      hasAnonKeyAlias: diagnostics.hasAnonKeyAlias,
      supabaseUrl: diagnostics.supabaseUrl,
    });
  }

  try {
    return (await withTimeout(
      () => supabase.auth.signInWithPassword(credentials),
      DIRECT_AUTH_TIMEOUT_MS,
      AUTH_TIMEOUT_CODE
    )) as unknown as PasswordAuthResult;
  } catch (error) {
    if (!shouldFallbackToProxy(error)) throw error;

    await withTimeout(
      () => supabase.auth.signOut({ scope: "local" }),
      LOCAL_SIGNOUT_TIMEOUT_MS,
      SIGNOUT_TIMEOUT_CODE
    ).catch(() => undefined);

    return proxyPasswordSignIn(email, password);
  }
};

export const isAuthTimeoutError = (error: unknown) => isTimeoutError(error, AUTH_TIMEOUT_CODE);
export const isAuthConfigError = (error: unknown) =>
  error instanceof Error && error.message === AUTH_CONFIG_ERROR_CODE;

