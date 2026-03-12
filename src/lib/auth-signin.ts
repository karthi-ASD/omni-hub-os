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

    return withTimeout(
      () => supabase.auth.signInWithPassword(credentials),
      AUTH_TIMEOUT_MS,
      AUTH_TIMEOUT_CODE
    );
  }
};

export const isAuthTimeoutError = (error: unknown) =>
  isTimeoutError(error, AUTH_TIMEOUT_CODE);
