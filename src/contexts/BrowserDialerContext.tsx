/**
 * BrowserDialerProvider — app-shell-level provider that keeps the dialer
 * singleton alive across route changes. Mounts once in AppShell for
 * authenticated users, never unmounts during SPA navigation.
 *
 * BUILD: stability-v16
 */

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useBrowserDialer } from "@/hooks/useBrowserDialer";
import { useAuth } from "@/contexts/AuthContext";

type DialerContextValue = ReturnType<typeof useBrowserDialer> | null;

const BrowserDialerContext = createContext<DialerContextValue>(null);

function DialerProviderInner({ children }: { children: ReactNode }) {
  const dialer = useBrowserDialer();

  useEffect(() => {
    console.log("[DIALER_PROVIDER] PROVIDER_MOUNTED");
    return () => {
      console.log("[DIALER_PROVIDER] PROVIDER_UNMOUNTED");
    };
  }, []);

  useEffect(() => {
    if (dialer.registered && dialer.diagnostics.clientHealthy) {
      console.log("[DIALER_PROVIDER] CLIENT_SINGLETON_REUSED", {
        registered: dialer.registered,
        status: dialer.callStatus,
      });
    }
  }, [dialer.registered]);

  return (
    <BrowserDialerContext.Provider value={dialer}>
      {children}
    </BrowserDialerContext.Provider>
  );
}

export function BrowserDialerProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  // Only activate dialer for users with a business — avoids conditional hook calls
  if (!profile?.business_id) {
    return (
      <BrowserDialerContext.Provider value={null}>
        {children}
      </BrowserDialerContext.Provider>
    );
  }

  return <DialerProviderInner>{children}</DialerProviderInner>;
}

/**
 * Consume dialer context from any component in the tree.
 * Returns null if outside provider or user not authenticated.
 */
export function useDialerContext() {
  return useContext(BrowserDialerContext);
}
