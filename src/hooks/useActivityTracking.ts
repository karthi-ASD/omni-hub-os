/**
 * Global page-visit and session tracking hook.
 * Mount once at app root to auto-track navigation.
 */

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logBehaviour, logActivity, startSession, endSession, generateSessionId } from "@/lib/activity-logger";

/** Derive a human-friendly page name from the pathname */
function derivePageName(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return "Dashboard";
  return segments
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" › ");
}

export function useActivityTracking() {
  const location = useLocation();
  const { user, profile, userType } = useAuth();
  const sessionIdRef = useRef<string>(generateSessionId());
  const pageEntryRef = useRef<number>(Date.now());
  const prevPathnameRef = useRef<string>("");
  const hasStartedSessionRef = useRef(false);

  const userId = user?.id;
  const businessId = profile?.business_id;

  // Session lifecycle
  useEffect(() => {
    if (!userId) return;
    if (hasStartedSessionRef.current) return;
    hasStartedSessionRef.current = true;

    const sid = sessionIdRef.current;
    startSession(userId, sid);
    logActivity({
      userId,
      userRole: userType,
      businessId,
      module: "auth",
      actionType: "login",
      description: "User logged in",
    });

    const handleUnload = () => {
      endSession(userId, sid);
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      endSession(userId, sid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Page visit tracking
  useEffect(() => {
    if (!userId) return;
    const pathname = location.pathname;
    if (pathname === prevPathnameRef.current) return;

    // Log time spent on previous page
    if (prevPathnameRef.current) {
      const timeSpent = Math.round((Date.now() - pageEntryRef.current) / 1000);
      if (timeSpent > 1) {
        logBehaviour({
          userId,
          userRole: userType,
          businessId,
          sessionId: sessionIdRef.current,
          pageUrl: prevPathnameRef.current,
          pageName: derivePageName(prevPathnameRef.current),
          action: "page_leave",
          timeSpent,
        });
      }
    }

    // Log new page visit
    prevPathnameRef.current = pathname;
    pageEntryRef.current = Date.now();

    logBehaviour({
      userId,
      userRole: userType,
      businessId,
      sessionId: sessionIdRef.current,
      pageUrl: pathname,
      pageName: derivePageName(pathname),
      action: "page_visit",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, userId]);

  return { sessionId: sessionIdRef.current };
}
