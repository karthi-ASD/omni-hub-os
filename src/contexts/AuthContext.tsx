import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

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

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
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
  const [tenantValidationError, setTenantValidationError] = useState<string | null>(null);
  const [allBusinesses, setAllBusinesses] = useState<TenantBusiness[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [clientUserId, setClientUserId] = useState<string | null>(null);

  const isHydratingRef = React.useRef(false);
  const hasHydratedRef = React.useRef(false);
  const hasInitializedRef = React.useRef(false);
  const sessionRef = React.useRef<Session | null>(null);

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

  const validateClientTenantMapping = async (userId: string, profileData: Profile | null) => {
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
    setTenantValidationError(null);
    hasHydratedRef.current = false;
    isHydratingRef.current = false;
  }, []);

  useEffect(() => {
    sessionRef.current = session;
    userIdRef.current = user?.id ?? null;
  }, [session, user?.id]);

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
      if (isHydratingRef.current) {
        console.log("[Auth] hydrate skipped — already in progress", { source, userId: nextSession.user.id });
        return;
      }

      isHydratingRef.current = true;
      console.log("[Auth] hydrate start", { source, userId: nextSession.user.id });

      try {
        setTenantValidationError(null);

        const [profileData, userRoles] = await Promise.all([
          fetchProfile(nextSession.user.id),
          fetchRoles(nextSession.user.id),
        ]);

        await validateClientTenantMapping(nextSession.user.id, profileData);

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

        hasHydratedRef.current = true;
      } finally {
        isHydratingRef.current = false;
        console.log("[Auth] hydrate end", { source, userId: nextSession.user.id });
        finalizeLoading();
      }
    };

    const queueHydration = (nextSession: Session, source: "initial" | "sign_in") => {
      window.setTimeout(() => {
        if (isMounted) void hydrateUserState(nextSession, source);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("[Auth Event]", event);

      switch (event) {
        case "TOKEN_REFRESHED":
          hasInitializedRef.current = true;
          console.log("[Auth] TOKEN_REFRESHED — silent update only");
          if (!sessionRef.current && nextSession) {
            setSession(nextSession);
            setUser(nextSession.user);
          }
          break;

        case "INITIAL_SESSION":
          console.log("[Auth] INITIAL_SESSION ignored — getSession is authoritative");
          break;

        case "SIGNED_IN":
          hasInitializedRef.current = true;
          setSession(nextSession);
          setUser(nextSession?.user ?? null);
          if (nextSession?.user) {
            clearAllUserState();
            setLoading(true);
            queueHydration(nextSession, "sign_in");
          } else {
            finalizeLoading();
          }
          break;

        case "SIGNED_OUT":
          hasInitializedRef.current = true;
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
        setLoading(true);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
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
  }, [clearAllUserState, session, user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    clearAllUserState();
  }, [clearAllUserState]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);
  const isSuperAdmin = hasRole("super_admin");
  const isBusinessAdmin = hasRole("business_admin");
  const isHRManager = hasRole("hr_manager");
  const isClientUser = !!clientUserId && !isSuperAdmin;
  const clientId = clientUserId;
  const selectTenant = useCallback((id: string | null) => setSelectedTenantId(id), []);

  // KEY FIX: For super_admin, override profile.business_id with selected tenant
  // This makes ALL hooks that use profile.business_id work automatically
  const profile: Profile | null = rawProfile
    ? {
        ...rawProfile,
        business_id: isSuperAdmin && selectedTenantId
          ? selectedTenantId
          : rawProfile.business_id,
      }
    : null;

  const contextValue = useMemo(() => ({
    session,
    user,
    profile,
    roles,
    loading,
    tenantValidationError,
    signOut,
    hasRole,
    isSuperAdmin,
    isBusinessAdmin,
    isHRManager,
    isClientUser,
    clientId,
    allBusinesses,
    selectedTenantId,
    selectTenant,
  }), [session, user, profile, roles, loading, tenantValidationError, signOut, hasRole, isSuperAdmin, isBusinessAdmin, isHRManager, isClientUser, clientId, allBusinesses, selectedTenantId, selectTenant]);

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
