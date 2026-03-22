/**
 * PersistentDialerConsumer — invisible shell-level component that keeps
 * the dialer context actively consumed so activeHookConsumers never drops
 * to zero during normal SPA navigation.
 *
 * Mounted inside BrowserDialerProvider at AppShell level.
 * Renders nothing visible.
 *
 * BUILD: stability-v18
 */

import { useEffect } from "react";
import { useDialerContext } from "@/contexts/BrowserDialerContext";

export function PersistentDialerConsumer() {
  const dialer = useDialerContext();

  useEffect(() => {
    if (!dialer) {
      console.error("SHELL_CONSUMER_MISSING_CONTEXT", {
        route: window.location.pathname,
      });
      return;
    }

    console.log("SHELL_CONSUMER_MOUNTED", {
      route: window.location.pathname,
    });
    return () => {
      console.warn("SHELL_CONSUMER_UNMOUNTED", {
        route: window.location.pathname,
      });
    };
  }, []);

  return null;
}
