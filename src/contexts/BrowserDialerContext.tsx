/**
 * BrowserDialerProvider — app-shell-level provider that keeps the dialer
 * singleton alive across route changes. Mounts once in AppShell for
 * authenticated users, never unmounts during SPA navigation.
 *
 * BUILD: stability-v19
 *
 * ROOT CAUSE FIX (v19): Previous versions conditionally switched between
 * two different component subtrees (<Provider value={null}> vs <DialerProviderInner>)
 * based on effectiveBusinessId. This caused React to unmount/remount ALL children
 * whenever business_id flickered (e.g. during mic permission → token refresh).
 * Fix: ALWAYS render through DialerProviderInner so the component tree is stable.
 */

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { logDialerEvent, useBrowserDialer } from "@/hooks/useBrowserDialer";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "react-router-dom";

type DialerContextValue = ReturnType<typeof useBrowserDialer> | null;

const BrowserDialerContext = createContext<DialerContextValue>(null);

let providerMountCount = 0;

/**
 * Inner component that always calls useBrowserDialer().
 * Since this is only rendered inside authenticated AppShell,
 * the hook is safe to call unconditionally.
 * If business_id is not yet available, the dialer simply won't
 * initialize its Plivo client (authIdentity will be null).
 */
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
  }, [location.pathname, dialer.registered, dialer.callStatus]);

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

/**
 * STABILITY-V19 FIX:
 * Always render DialerProviderInner to maintain a STABLE component tree.
 * 
 * Previous versions conditionally switched between:
 *   <Provider value={null}>{children}</Provider>   (no business)
 *   <DialerProviderInner>{children}</DialerProviderInner>  (has business)
 * 
 * This caused React to unmount/remount ALL children on any business_id flicker,
 * which was the root cause of blank screens after mic permission.
 * 
 * Now we ALWAYS render: DialerProviderInner > Provider > children
 * The dialer hook handles null business gracefully (sets authIdentity=null).
 */
export function BrowserDialerProvider({ children }: { children: ReactNode }) {
  return <DialerProviderInner>{children}</DialerProviderInner>;
}

/**
 * Consume dialer context from any component in the tree.
 * Returns null if outside provider or user not authenticated.
 */
export function useDialerContext() {
  return useContext(BrowserDialerContext);
}
