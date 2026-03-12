import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: AppRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { session, loading, roles, user } = useAuth();
  const [securityCheck, setSecurityCheck] = useState<"loading" | "pass" | "required">("loading");

  useEffect(() => {
    if (!user || loading) return;
    checkFirstLoginSecurity();
  }, [user, loading]);

  const checkFirstLoginSecurity = async () => {
    if (!user) { setSecurityCheck("pass"); return; }
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
    }
  };

  if (loading || securityCheck === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (securityCheck === "required") {
    return <Navigate to="/security-setup" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequired = requiredRoles.some((r) => roles.includes(r));
    if (!hasRequired) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
