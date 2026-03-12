import { supabase } from "@/integrations/supabase/client";

const AUTH_TIMEOUT_MS = 12000;
const LOCAL_SIGNOUT_TIMEOUT_MS = 1500;
const AUTH_TIMEOUT_CODE = "AUTH_TIMEOUT";
const SIGNOUT_TIMEOUT_CODE = "AUTH_SIGNOUT_TIMEOUT";

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

const proxyPasswordSignIn = async (email: string, password: string): Promise<PasswordAuthResult> => {
  const { data, error: invokeError } = await withTimeout(
    () =>
      supabase.functions.invoke("auth-password-proxy", {
        body: { email: email.trim(), password },
      }),
    AUTH_TIMEOUT_MS,
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

  const normalizedSessionData = (sessionData as { user?: unknown; session?: unknown; [key: string]: unknown } | null) ?? {};

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

  try {
    return (await withTimeout(
      () => supabase.auth.signInWithPassword(credentials),
      AUTH_TIMEOUT_MS,
      AUTH_TIMEOUT_CODE
    )) as unknown as PasswordAuthResult;
  } catch (error) {
    if (!shouldFallbackToProxy(error)) throw error;

    await withTimeout(
      () => supabase.auth.signOut({ scope: "local" }),
      LOCAL_SIGNOUT_TIMEOUT_MS,
      SIGNOUT_TIMEOUT_CODE
    ).catch(() => undefined);

    try {
      return (await withTimeout(
        () => supabase.auth.signInWithPassword(credentials),
        AUTH_TIMEOUT_MS,
        AUTH_TIMEOUT_CODE
      )) as unknown as PasswordAuthResult;
    } catch (secondError) {
      if (!shouldFallbackToProxy(secondError)) throw secondError;
      return proxyPasswordSignIn(email, password);
    }
  }
};

export const isAuthTimeoutError = (error: unknown) =>
  isTimeoutError(error, AUTH_TIMEOUT_CODE);
