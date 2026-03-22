import React, { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import AuthDiagnostics from "@/components/AuthDiagnostics";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { session, loading, roles, user, tenantValidationError } = useAuth();
  const [securityCheck, setSecurityCheck] = useState<"loading" | "pass" | "required">("pass");
  const hasSettledAccessRef = useRef(false);

  useEffect(() => {
    if (!session) {
      hasSettledAccessRef.current = false;
      return;
    }

    if (!loading && !tenantValidationError && securityCheck !== "loading") {
      hasSettledAccessRef.current = true;
    }
  }, [session, loading, tenantValidationError, securityCheck]);

  useEffect(() => {
    if (loading || tenantValidationError) return;
    if (!user) {
      setSecurityCheck("pass");
      return;
    }
    void checkFirstLoginSecurity();
  }, [user?.id, loading, tenantValidationError]);

  const checkFirstLoginSecurity = async () => {
    if (!user) {
      setSecurityCheck("pass");
      return;
    }

    setSecurityCheck("loading");
    const safetyTimeout = window.setTimeout(() => {
      setSecurityCheck("pass");
    }, 5000);

    try {
      const { data } = await supabase
        .from("first_login_security" as any)
        .select("requires_security_setup")
        .eq("user_id", user.id)
        .single();

      if (data && (data as any).requires_security_setup) {
        setSecurityCheck("required");
      } else {
        setSecurityCheck("pass");
      }
    } catch {
      setSecurityCheck("pass");
    } finally {
      window.clearTimeout(safetyTimeout);
    }
  };

  useEffect(() => {
    console.log("PROTECTED_ROUTE_RENDER", {
      hasSession: !!session,
      loading,
      securityCheck,
      tenantValidationError: !!tenantValidationError,
      requiredRoles: requiredRoles ?? [],
    });
  }, [session, loading, securityCheck, tenantValidationError, requiredRoles]);

  const showBlockingLoader = !hasSettledAccessRef.current && (loading || (user && securityCheck === "loading"));

  if (showBlockingLoader) {
    console.log("PROTECTED_ROUTE_LOADING_BRANCH", {
      hasSession: !!session,
      securityCheck,
      loading,
    });
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <AuthDiagnostics securityCheck={securityCheck} />
      </div>
    );
  }

  if (!session) {
    // CRITICAL: If we previously had a stable session, this is likely a transient
    // token refresh (e.g. tab return). Do NOT redirect to /login — keep rendering
    // children with the last stable state. This prevents blank page + wrong route.
    if (hasSettledAccessRef.current) {
      console.warn("PROTECTED_ROUTE_TRANSIENT_SESSION_LOSS", {
        reason: "session_null_after_stable_render",
        route: window.location.pathname,
      });
      return <>{children}</>;
    }
    console.warn("PROTECTED_ROUTE_REDIRECT_BRANCH", { reason: "missing_session" });
    return <Navigate to="/login" replace />;
  }

  if (tenantValidationError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
          <h1 className="text-xl font-bold text-foreground">Tenant mapping error</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account is linked to the wrong tenant context, so access has been blocked to prevent data leakage.
          </p>
        </div>
      </div>
    );
  }

  if (securityCheck === "required") {
    console.warn("PROTECTED_ROUTE_REDIRECT_BRANCH", { reason: "security_setup_required" });
    return <Navigate to="/security-setup" replace />;
  }

  if (loading || securityCheck === "loading") {
    return <>{children}</>;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequired = requiredRoles.some((r) => roles.includes(r));
    if (!hasRequired) {
      console.warn("PROTECTED_ROUTE_REDIRECT_BRANCH", {
        reason: "missing_required_role",
        requiredRoles,
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log("PROTECTED_ROUTE_CHILDREN_RETURNED", {
    loading,
    securityCheck,
    hasSession: !!session,
  });
  return <>{children}</>;
};

export default ProtectedRoute;
