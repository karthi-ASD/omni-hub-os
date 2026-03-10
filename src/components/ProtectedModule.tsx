import React from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProtectedModuleProps {
  moduleKey: string;
  action?: "view" | "create" | "edit" | "delete" | "approve" | "export";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const AccessDenied = () => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full border-destructive/30">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground mt-2">
              You don't have sufficient permissions to access this module.
              Contact your administrator to request access.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const ProtectedModule: React.FC<ProtectedModuleProps> = ({
  moduleKey,
  action = "view",
  children,
  fallback,
}) => {
  const { canAccess, loading } = useRolePermissions();
  const { loading: authLoading, isSuperAdmin, isBusinessAdmin } = useAuth();

  // While loading, render children to avoid flash
  if (authLoading || loading) return <>{children}</>;

  // Super admin and business admin always have access
  if (isSuperAdmin || isBusinessAdmin) return <>{children}</>;

  if (canAccess(moduleKey, action)) {
    return <>{children}</>;
  }

  return <>{fallback || <AccessDenied />}</>;
};

export default ProtectedModule;
