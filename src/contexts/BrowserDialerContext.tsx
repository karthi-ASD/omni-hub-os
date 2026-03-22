/**
 * BrowserDialerProvider — app-shell-level provider that keeps the dialer
 * singleton alive across route changes. Mounts once in AppShell for
 * authenticated users, never unmounts during SPA navigation.
 *
 * BUILD: stability-v16
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useBrowserDialer } from "@/hooks/useBrowserDialer";
import { useAuth } from "@/contexts/AuthContext";

type DialerContextValue = ReturnType<typeof useBrowserDialer> | null;

const BrowserDialerContext = createContext<DialerContextValue>(null);

export function BrowserDialerProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  // Only mount the hook when we have an authenticated user with a business
  const dialer = profile?.business_id ? useBrowserDialer() : null;

  return (
    <BrowserDialerContext.Provider value={dialer}>
      {children}
    </BrowserDialerContext.Provider>
  );
}

/**
 * Consume dialer context from any component in the tree.
 * Returns null if outside provider or user not authenticated.
 */
export function useDialerContext() {
  return useContext(BrowserDialerContext);
}
