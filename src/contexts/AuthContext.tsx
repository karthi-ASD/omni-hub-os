import React, { createContext, useContext, useEffect, useState } from "react";
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

    const hydrateUserState = async (nextSession: Session) => {
      try {
        const [profileData, userRoles] = await Promise.all([
          fetchProfile(nextSession.user.id),
          fetchRoles(nextSession.user.id),
        ]);

        // Check if user is a client user
        const { data: clientLink } = await supabase
          .from("client_users")
          .select("client_id")
          .eq("user_id", nextSession.user.id)
          .eq("is_primary", true)
          .maybeSingle();
        setClientUserId(clientLink?.client_id || null);

        // Client context validation: if client user, verify profile.business_id
        // matches client_business_id. Auto-correct if mismatched.
        if (clientLink?.client_id && profileData?.business_id) {
          const { data: clientRecord } = await supabase
            .from("clients")
            .select("client_business_id, business_id")
            .eq("id", clientLink.client_id)
            .maybeSingle();

          if (clientRecord?.client_business_id &&
              profileData.business_id !== clientRecord.client_business_id) {
            // Auto-correct: update profile to correct tenant
            await supabase
              .from("profiles")
              .update({ business_id: clientRecord.client_business_id } as any)
              .eq("user_id", nextSession.user.id);
            // Re-fetch profile with corrected business_id
            await fetchProfile(nextSession.user.id);
          }
        }

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
      } finally {
        finalizeLoading();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          setTimeout(() => {
            if (!isMounted) return;
            void hydrateUserState(nextSession);
          }, 0);
        } else {
          setRawProfile(null);
          setRoles([]);
          setAllBusinesses([]);
          setSelectedTenantId(null);
          setClientUserId(null);
          finalizeLoading();
        }
      }
    );

    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          void hydrateUserState(currentSession);
        } else {
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

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRawProfile(null);
    setRoles([]);
    setAllBusinesses([]);
    setSelectedTenantId(null);
    setClientUserId(null);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isSuperAdmin = hasRole("super_admin");
  const isBusinessAdmin = hasRole("business_admin");
  const isHRManager = hasRole("hr_manager");
  const isClientUser = !!clientUserId && !isSuperAdmin;
  const clientId = clientUserId;

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

  return (
    <AuthContext.Provider value={{
      session, user, profile, roles, loading, signOut,
      hasRole, isSuperAdmin, isBusinessAdmin, isHRManager,
      isClientUser, clientId,
      allBusinesses, selectedTenantId, selectTenant: setSelectedTenantId,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
