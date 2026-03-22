/**
 * BrowserDialerProvider — app-shell-level provider that keeps the dialer
 * singleton alive across route changes. Mounts once in AppShell for
 * authenticated users, never unmounts during SPA navigation.
 *
 * BUILD: stability-v17
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { logDialerEvent, useBrowserDialer } from "@/hooks/useBrowserDialer";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

type DialerContextValue = ReturnType<typeof useBrowserDialer> | null;

const BrowserDialerContext = createContext<DialerContextValue>(null);

let providerMountCount = 0;

function DialerProviderInner({ children }: { children: ReactNode }) {
  const dialer = useBrowserDialer();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const renderCountRef = useRef(0);
  renderCountRef.current++;

  useEffect(() => {
    providerMountCount++;
    dialer.logEvent("PROVIDER_MOUNTED", { mountCount: providerMountCount });
    dialer.logEvent("SHELL_LEVEL_DIALER_CONSUMER_MOUNTED", { mountCount: providerMountCount });
    return () => {
      dialer.logEvent("SHELL_LEVEL_DIALER_CONSUMER_UNMOUNTED", { mountCount: providerMountCount });
      dialer.logEvent("PROVIDER_UNMOUNT_REASON", { mountCount: providerMountCount, route: window.location.pathname });
      dialer.logEvent("PROVIDER_UNMOUNTED", { mountCount: providerMountCount });
    };
  }, []);

  useEffect(() => {
    dialer.logEvent("PROVIDER_RENDERED", {
      renderCount: renderCountRef.current,
      route: location.pathname,
      registered: dialer.registered,
      callStatus: dialer.callStatus,
    });
  });

  // Route change detection — proves provider survives navigation
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      dialer.logEvent("ROUTE_CHANGE_DETECTED", {
        from: prevPathRef.current,
        to: location.pathname,
      });
      dialer.logEvent("DIALER_PROVIDER_STILL_MOUNTED_AFTER_ROUTE_CHANGE", {
        renderCount: renderCountRef.current,
        registered: dialer.registered,
        callStatus: dialer.callStatus,
      });
      prevPathRef.current = location.pathname;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (dialer.registered && dialer.diagnostics.clientHealthy) {
      dialer.logEvent("CLIENT_SINGLETON_REUSED", {
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
  const stableBusinessIdRef = useRef<string | null>(profile?.business_id ?? null);

  if (profile?.business_id) {
    stableBusinessIdRef.current = profile.business_id;
  }

  const effectiveBusinessId = profile?.business_id ?? stableBusinessIdRef.current;

  // Only activate dialer for users with a business — avoids conditional hook calls
  if (!effectiveBusinessId) {
    logDialerEvent("PROVIDER_RENDER_GUARD_REASON", {
      reason: "no_business_id",
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
    return (
      <BrowserDialerContext.Provider value={null}>
        {children}
      </BrowserDialerContext.Provider>
    );
  }

  if (!profile?.business_id && effectiveBusinessId) {
    logDialerEvent("BUSINESS_PROFILE_TRANSIENT_CHANGE", {
      preservedBusinessId: effectiveBusinessId,
      route: typeof window !== "undefined" ? window.location.pathname : "unknown",
    });
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
