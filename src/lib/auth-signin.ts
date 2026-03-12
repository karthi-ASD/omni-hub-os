import { supabase } from "@/integrations/supabase/client";

const AUTH_TIMEOUT_MS = 12000;
const LOCAL_SIGNOUT_TIMEOUT_MS = 1500;
const AUTH_TIMEOUT_CODE = "AUTH_TIMEOUT";
const SIGNOUT_TIMEOUT_CODE = "AUTH_SIGNOUT_TIMEOUT";

const isTimeoutError = (error: unknown, code: string) =>
  error instanceof Error && error.message === code;

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

const directPasswordSignIn = async (email: string, password: string) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (!supabaseUrl || !publishableKey) {
    throw new Error("Missing backend configuration");
  }

  const response = await withTimeout(
    () =>
      fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: publishableKey,
          "Content-Type": "application/json",
          "x-client-info": "nextweb-auth-fallback",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      }),
    AUTH_TIMEOUT_MS,
    AUTH_TIMEOUT_CODE,
  );

  const payload = await response.json().catch(() => ({} as any));

  if (!response.ok) {
    return { data: { user: null, session: null }, error: new Error(payload?.msg || payload?.error_description || "Invalid login credentials") };
  }

  const accessToken = payload?.access_token;
  const refreshToken = payload?.refresh_token;

  if (!accessToken || !refreshToken) {
    return { data: { user: null, session: null }, error: new Error("Login succeeded but session could not be restored") };
  }

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return { data, error };
};

export const signInWithPasswordResilient = async (email: string, password: string) => {
  const credentials = { email: email.trim(), password };

  try {
    return await withTimeout(
      () => supabase.auth.signInWithPassword(credentials),
      AUTH_TIMEOUT_MS,
      AUTH_TIMEOUT_CODE
    );
  } catch (error) {
    if (!isTimeoutError(error, AUTH_TIMEOUT_CODE)) throw error;

    await withTimeout(
      () => supabase.auth.signOut({ scope: "local" }),
      LOCAL_SIGNOUT_TIMEOUT_MS,
      SIGNOUT_TIMEOUT_CODE
    ).catch(() => undefined);

    try {
      return await withTimeout(
        () => supabase.auth.signInWithPassword(credentials),
        AUTH_TIMEOUT_MS,
        AUTH_TIMEOUT_CODE
      );
    } catch (secondError) {
      if (!isTimeoutError(secondError, AUTH_TIMEOUT_CODE)) throw secondError;
      return directPasswordSignIn(email, password);
    }
  }
};

export const isAuthTimeoutError = (error: unknown) =>
  isTimeoutError(error, AUTH_TIMEOUT_CODE);

