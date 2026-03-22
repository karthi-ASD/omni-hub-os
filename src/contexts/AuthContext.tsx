import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { resolveAppMode, resolveUserType, detectRoleConflict, assertNoEmployeeClientCrossover, type AppMode, type DashboardShell, type UserType } from "@/lib/role-resolver";

type AppRole = Database["public"]["Enums"]["app_role"];

type CRMType = "real_estate" | "service" | "finance" | "generic";

interface Profile {
  id: string;
  user_id: string;
  business_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface TenantBusiness {
  id: string;
  name: string;
  status: string;
}

interface ActiveBusinessContext {
  id: string;
  name: string;
  crm_type: CRMType | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAuthResolved: boolean;
  tenantValidationError: string | null;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isSuperAdmin: boolean;
  isBusinessAdmin: boolean;
  isHRManager: boolean;
  /** True when the logged-in user is a client portal user */
  isClientUser: boolean;
  /** The client_id this user is linked to (from client_users) */
  clientId: string | null;
  /** Resolved user type — SINGLE SOURCE OF TRUTH */
  userType: UserType;
  /** Resolved shell/app mode for layout and navigation */
  appMode: AppMode;
  dashboardShell: DashboardShell;
  activeTenantId: string | null;
  activeBusinessName: string | null;
  activeCRMType: CRMType | null;
  /** All businesses — only populated for super_admin */
  allBusinesses: TenantBusiness[];
  /** Selected tenant for super_admin context switching */
  selectedTenantId: string | null;
  selectTenant: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rawProfile, setRawProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessContextLoading, setBusinessContextLoading] = useState(false);
  const [tenantValidationError, setTenantValidationError] = useState<string | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<TenantBusiness[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [clientUserId, setClientUserId] = useState<string | null>(null);
  const [isEmployeeByHR, setIsEmployeeByHR] = useState(false);
  const [activeBusinessContext, setActiveBusinessContext] = useState<ActiveBusinessContext | null>(null);

  const isHydratingRef = React.useRef(false);
  const hasHydratedRef = React.useRef(false);
  const hasInitializedRef = React.useRef(false);
  const sessionRef = React.useRef<Session | null>(null);
  const hydratedSessionKeyRef = React.useRef<string | null>(null);

  const getSessionHydrationKey = (currentSession: Session | null) => {
    if (!currentSession) return null;
    return `${currentSession.user.id}:${currentSession.refresh_token ?? currentSession.access_token}`;
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, business_id, full_name, email, avatar_url")
        .eq("user_id", userId)
        .single();

      if (error) {
        setRawProfile(null);
        return null;
      }

      setRawProfile(data);
      return data;
    } catch {
      setRawProfile(null);
      return null;
    }
  };

  const fetchRoles = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const userRoles = data?.map((r) => r.role) ?? [];
      setRoles(userRoles);
      return userRoles;
    } catch {
      setRoles([]);
      return [] as AppRole[];
    }
  };

  /** Check if user has an hr_employees record — CRITICAL for employee detection */
  const checkEmployeeByHR = async (userId: string, businessId: string | null): Promise<boolean> => {
    if (!businessId) {
      // Also check without business_id filter (some employees may not have it set)
      try {
        const { data } = await supabase
          .from("hr_employees")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        const result = !!data;
        setIsEmployeeByHR(result);
        return result;
      } catch {
        setIsEmployeeByHR(false);
        return false;
      }
    }

    try {
      const { data } = await supabase
        .from("hr_employees")
        .select("id")
        .eq("user_id", userId)
        .eq("business_id", businessId)
        .limit(1)
        .maybeSingle();
      const result = !!data;
      setIsEmployeeByHR(result);
      return result;
    } catch {
      setIsEmployeeByHR(false);
      return false;
    }
  };

  const fetchBusinesses = async () => {
    try {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, status")
        .order("name");
      const businesses = data || [];
      setAllBusinesses(businesses);
      return businesses;
    } catch {
      setAllBusinesses([]);
      return [] as TenantBusiness[];
    }
  };

  const fetchActiveBusinessContext = useCallback(async (businessId: string | null) => {
    if (!businessId) {
      setActiveBusinessContext(null);
      setBusinessContextLoading(false);
      return null;
    }

    setBusinessContextLoading(true);

    try {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, crm_type")
        .eq("id", businessId)
        .maybeSingle();

      const context = (data as ActiveBusinessContext | null) ?? null;
      setActiveBusinessContext(context);
      return context;
    } catch {
      setActiveBusinessContext(null);
      return null;
    } finally {
      setBusinessContextLoading(false);
    }
  }, []);

  const validateClientTenantMapping = async (
    userId: string,
    profileData: Profile | null,
    userRoles: AppRole[],
    employeeByHR: boolean
  ) => {
    // 🔴 CRITICAL: Skip tenant mapping entirely for staff users — they are NEVER clients
    const hasStaffSignal = userRoles.some((role) =>
      ["super_admin", "business_admin", "employee", "hr_manager", "manager"].includes(role)
    ) || employeeByHR;

    if (hasStaffSignal) {
      console.log("[TenantMapping] Skipped — user is staff", { userId, employeeByHR });
      setClientUserId(null);
      setTenantValidationError(null);
      return profileData;
    }

    try {
      const { data: clientLink } = await supabase
        .from("client_users")
        .select("client_id")
        .eq("user_id", userId)
        .eq("is_primary", true)
        .maybeSingle();

      const linkedClientId = clientLink?.client_id || null;
      setClientUserId(linkedClientId);

      if (!linkedClientId) {
        setTenantValidationError(null);
        return profileData;
      }

      const { data: clientRecord } = await supabase
        .from("clients")
        .select("client_business_id, business_id")
        .eq("id", linkedClientId)
        .maybeSingle();

      const expectedBusinessId = clientRecord?.client_business_id ?? null;

      if (!expectedBusinessId) {
        setTenantValidationError("Tenant mapping error");
        return null;
      }

      if (profileData?.business_id !== expectedBusinessId) {
        await Promise.all([
          supabase
            .from("profiles")
            .update({ business_id: expectedBusinessId } as any)
            .eq("user_id", userId),
          supabase
            .from("user_roles")
            .update({ business_id: expectedBusinessId } as any)
            .eq("user_id", userId),
        ]);

        const refreshedProfile = await fetchProfile(userId);
        if (!refreshedProfile || refreshedProfile.business_id !== expectedBusinessId) {
          setTenantValidationError("Tenant mapping error");
          return null;
        }

        setTenantValidationError(null);
        return refreshedProfile;
      }

      setTenantValidationError(null);
      return profileData;
    } catch {
      setTenantValidationError("Tenant mapping error");
      return null;
    }
  };

  const clearAllUserState = useCallback(() => {
    setRawProfile(null);
    setRoles([]);
    setAllBusinesses([]);
    setSelectedTenantId(null);
    setClientUserId(null);
    setIsEmployeeByHR(false);
    setActiveBusinessContext(null);
    setBusinessContextLoading(false);
    setTenantValidationError(null);
    hasHydratedRef.current = false;
    isHydratingRef.current = false;
    hydratedSessionKeyRef.current = null;
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    let isMounted = true;
    const forceStopTimer = window.setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 10000);

    const finalizeLoading = () => {
      if (!isMounted) return;
      window.clearTimeout(forceStopTimer);
      setLoading(false);
    };

    const hydrateUserState = async (nextSession: Session, source: "initial" | "sign_in") => {
      const hydrationKey = getSessionHydrationKey(nextSession);

      if (isHydratingRef.current) return;
      if (hydratedSessionKeyRef.current === hydrationKey) {
        console.log("[Hydration] skipped duplicate", { source, hydrationKey });
        hasHydratedRef.current = true;
        finalizeLoading();
        return;
      }

      console.log("[Hydration] start", { source, hydrationKey });
      isHydratingRef.current = true;

      try {
        setTenantValidationError(null);

        const [profileData, userRoles] = await Promise.all([
          fetchProfile(nextSession.user.id),
          fetchRoles(nextSession.user.id),
        ]);

        // 🔴 CRITICAL: Check hr_employees BEFORE client tenant mapping
        const effectiveBusinessId = profileData?.business_id ?? null;
        const employeeByHR = await checkEmployeeByHR(nextSession.user.id, effectiveBusinessId);

        // Log debug info for role resolution
        console.log("[User Debug]", {
          userId: nextSession.user.id,
          roles: userRoles,
          businessId: effectiveBusinessId,
          isEmployeeByHR: employeeByHR,
        });

        const validatedProfile = await validateClientTenantMapping(nextSession.user.id, profileData, userRoles, employeeByHR);
        const finalBusinessId = validatedProfile?.business_id ?? profileData?.business_id ?? null;

        if (userRoles.includes("super_admin")) {
          const biz = await fetchBusinesses();
          if (biz.length > 0) {
            setSelectedTenantId((current) => {
              if (current) return current;
              const active = biz.find((b) => b.status === "active");
              return active?.id || biz[0].id;
            });
          }
        }

        await fetchActiveBusinessContext(finalBusinessId);

        hydratedSessionKeyRef.current = hydrationKey;
        hasHydratedRef.current = true;
        console.log("[Hydration] complete", { source, hydrationKey, userRoles, employeeByHR });
      } finally {
        isHydratingRef.current = false;
        finalizeLoading();
      }
    };

    const queueHydration = (nextSession: Session, source: "initial" | "sign_in") => {
      window.setTimeout(() => {
        if (isMounted) void hydrateUserState(nextSession, source);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const previousSession = sessionRef.current;
      const previousHydrationKey = getSessionHydrationKey(previousSession);
      const nextHydrationKey = getSessionHydrationKey(nextSession);
      const previousAccessToken = previousSession?.access_token ?? null;
      const nextAccessToken = nextSession?.access_token ?? null;

      console.log("[Auth Event]", event, {
        previousHydrationKey,
        nextHydrationKey,
        previousUserId: previousSession?.user.id ?? null,
        nextUserId: nextSession?.user.id ?? null,
      });

      switch (event) {
        case "TOKEN_REFRESHED": {
          hasInitializedRef.current = true;
          sessionRef.current = nextSession;

          if (previousAccessToken !== nextAccessToken || previousHydrationKey !== nextHydrationKey) {
            setSession(nextSession);
            setUser(nextSession?.user ?? null);
          }
          break;
        }

        case "INITIAL_SESSION":
          break;

        case "SIGNED_IN": {
          hasInitializedRef.current = true;
          sessionRef.current = nextSession;
          const isSameAuthenticatedSession = !!previousSession && !!nextSession && previousHydrationKey === nextHydrationKey;
          const alreadyHydratedSession = !!nextHydrationKey && hydratedSessionKeyRef.current === nextHydrationKey;

          setSession(nextSession);
          setUser(nextSession?.user ?? null);

          if (nextSession?.user) {
            if (isSameAuthenticatedSession || alreadyHydratedSession) {
              finalizeLoading();
              break;
            }

            clearAllUserState();
            setLoading(true);
            queueHydration(nextSession, "sign_in");
          } else {
            finalizeLoading();
          }
          break;
        }

        case "SIGNED_OUT":
          hasInitializedRef.current = true;
          sessionRef.current = null;
          setSession(null);
          setUser(null);
          clearAllUserState();
          finalizeLoading();
          break;

        default:
          break;
      }
    });

    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (hasInitializedRef.current) return;

        hasInitializedRef.current = true;
        sessionRef.current = currentSession;
        setLoading(true);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const hydrationKey = getSessionHydrationKey(currentSession);
          if (hydrationKey && hydratedSessionKeyRef.current === hydrationKey) {
            console.log("[Hydration] initial session already hydrated", { hydrationKey });
            hasHydratedRef.current = true;
            finalizeLoading();
            return;
          }

          queueHydration(currentSession, "initial");
        } else {
          setTenantValidationError(null);
          finalizeLoading();
        }
      })
      .catch(() => finalizeLoading());

    return () => {
      isMounted = false;
      window.clearTimeout(forceStopTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const userName = rawProfile?.full_name?.split(" ")[0] || null;
    console.log("SIGN_OUT_INITIATED", { userName });

    // Clear ALL session-specific state atomically
    const keysToRemove = [
      "dialer_phone_draft", "dialer_notes_draft", "dialer_lead_context",
      "dialer_followup_draft", "dialer_show_followup", "dialer_right_tab",
      "dialer_disposition_draft", "dialer_callback_reason", "dialer_wrapup_draft",
      "dialer_view_state", "last_authenticated_route",
    ];
    keysToRemove.forEach(k => sessionStorage.removeItem(k));
    console.log("SESSION_STATE_CLEARED");
    console.log("TENANT_NAV_STATE_CLEARED");

    // Store sign-out message BEFORE clearing state so it persists
    const message = userName
      ? `${userName}, you have been signed out successfully.`
      : "You have been signed out successfully.";
    sessionStorage.setItem("signout_message", message);

    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    clearAllUserState();
    console.log("SIGN_OUT_SUCCESS");
    console.log("SIGN_OUT_REDIRECT_TARGET", { target: "/login" });

    // Force navigate to login to prevent blank page / stale UI
    console.log("PROTECTED_LAYOUT_UNMOUNTED");
    console.log("BLANK_SIGNOUT_PAGE_PREVENTED");
    window.location.href = "/login";
  }, [clearAllUserState, rawProfile?.full_name]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const isSuperAdmin = hasRole("super_admin");
  const isBusinessAdmin = hasRole("business_admin");
  const isHRManager = hasRole("hr_manager");

  const selectTenant = useCallback((id: string | null) => setSelectedTenantId(id), []);

  // KEY FIX: For super_admin, override profile.business_id with selected tenant
  const profile: Profile | null = rawProfile
    ? {
        ...rawProfile,
        business_id: isSuperAdmin && selectedTenantId
          ? selectedTenantId
          : rawProfile.business_id,
      }
    : null;

  const activeTenantId = isSuperAdmin
    ? (selectedTenantId ?? rawProfile?.business_id ?? null)
    : (profile?.business_id ?? rawProfile?.business_id ?? null);

  const activeCRMType = activeBusinessContext?.crm_type ?? null;

  // 🔒 DO NOT MODIFY — SECURITY CRITICAL
  // 🔴 STEP 1: Detect staff signal FIRST — before ANY resolver runs
  const isStaffBySignal =
    isEmployeeByHR ||
    (roles as string[]).some((role) =>
      ["super_admin", "business_admin", "employee", "hr_manager", "manager"].includes(role)
    );

  // 🔴 STEP 2: Sanitize clientUserId BEFORE passing to resolvers
  const safeClientUserId = isStaffBySignal ? null : clientUserId;

  // 🔴 STEP 3: Resolve user type with SAFE values only
  const resolvedUserType = resolveUserType({ roles: roles as string[], clientUserId: safeClientUserId, isEmployeeByHR });

  // 🔴 STEP 4: STRICT user type — no dependency on resolvedUserType for staff
  const userType: UserType = isStaffBySignal
    ? (roles.includes("super_admin")
        ? "super_admin"
        : roles.includes("business_admin")
        ? "business_admin"
        : "employee")
    : resolvedUserType;

  // 🔴 STEP 5: Lock effective client ID from safe value
  const effectiveClientUserId = safeClientUserId;

  // 🔴 STEP 6: Extra hard lock — impossible state assertion
  if (isStaffBySignal && effectiveClientUserId) {
    throw new Error("CRITICAL: Staff has clientUserId after override");
  }

  const appMode = resolveAppMode({
    roles: roles as string[],
    clientUserId: effectiveClientUserId,
    businessId: activeTenantId,
    isEmployeeByHR,
  });
  const dashboardShell: DashboardShell = appMode;
  const isAuthResolved = !loading && !businessContextLoading && (!!session ? !!rawProfile : true);

  // Derived booleans from userType — NEVER infer independently
  // 🚫 NEVER use roles.includes("client") — INVALID DESIGN
  const isClientUser = userType === "client";
  const clientId = isClientUser ? effectiveClientUserId : null;

  // Detect and log role conflicts (staff user with client_users record)
  const conflict = detectRoleConflict({ roles: roles as string[], clientUserId: effectiveClientUserId, userId: user?.id, isEmployeeByHR });
  if (conflict) {
    console.warn(conflict);
  }

  // 🔴 REGRESSION GUARD + KILL SWITCH
  try {
    assertNoEmployeeClientCrossover({ isEmployeeByHR, roles: roles as string[], userType, clientUserId: effectiveClientUserId, userId: user?.id });
  } catch (e) {
    console.error(e);
    if (user?.id) {
      supabase.from("system_events" as any).insert({
        business_id: rawProfile?.business_id ?? "00000000-0000-0000-0000-000000000000",
        event_type: "SECURITY_ROLE_BUG",
        payload_json: {
          userId: user.id,
          roles,
          userType,
          clientUserId: effectiveClientUserId,
          isEmployeeByHR,
        },
      }).then(() => {});
    }
  }

  // 🔴 DEV SAFETY: Warn if roles contain "client" (invalid pattern)
  if ((roles as string[]).includes("client")) {
    console.warn("[AUTH WARNING] roles.includes('client') detected — this is an INVALID design pattern. Use clientUserId instead.");
  }

  // 🔒 ONE-TIME final auth state log per session
  useEffect(() => {
    if (rawProfile && isAuthResolved && !(window as any).__AUTH_LOGGED__) {
      (window as any).__AUTH_LOGGED__ = true;
      console.log("[AUTH FINAL STATE]", {
        userId: user?.id,
        roles,
        clientUserId: effectiveClientUserId,
        isEmployeeByHR,
        userType,
        appMode,
        dashboardShell,
        businessId: activeTenantId,
        isStaffBySignal,
      });
    }
  }, [isAuthResolved, userType, appMode]);

  useEffect(() => {
    if (!session?.user) {
      setActiveBusinessContext(null);
      setBusinessContextLoading(false);
      return;
    }

    void fetchActiveBusinessContext(activeTenantId);
  }, [session?.user?.id, activeTenantId, fetchActiveBusinessContext]);

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    roles,
    loading,
    isAuthResolved,
    tenantValidationError,
    signOut,
    hasRole,
    isSuperAdmin,
    isBusinessAdmin,
    isHRManager,
    isClientUser,
    clientId,
    userType,
    appMode,
    dashboardShell,
    activeTenantId,
    activeBusinessName: activeBusinessContext?.name ?? null,
    activeCRMType,
    allBusinesses,
    selectedTenantId,
    selectTenant,
  }), [session, user, profile, roles, loading, isAuthResolved, tenantValidationError, signOut, hasRole, isSuperAdmin, isBusinessAdmin, isHRManager, isClientUser, clientId, userType, appMode, dashboardShell, activeTenantId, activeBusinessContext?.name, activeCRMType, allBusinesses, selectedTenantId, selectTenant]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
