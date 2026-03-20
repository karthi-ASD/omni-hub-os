import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const TENANT_ALLOWED_PREFIXES = [
  "/dashboard",
  "/my-billing",
  "/my-package",
  "/invoices",
  "/seo",
  "/client-reports",
  "/unified-tickets",
  "/projects",
  "/calendar",
  "/reports",
  "/settings",
  "/profile",
  "/nextweb-services",
  "/my-crm",
  "/client-performance-intelligence",
  "/client-seo-projects",
  "/client-website-structure",
  "/client-local-presence",
  "/client-leads-dashboard",
  "/solar-projects",
  "/solar-dashboard",
  "/solar-installations",
];

export function ClientRouteGuard({ children }: { children?: React.ReactNode }) {
  const { dashboardShell, isAuthResolved } = useAuth();

  if (!isAuthResolved) {
    return null;
  }

  if (dashboardShell === "super_admin" || dashboardShell === "internal_staff") {
    return children ? <>{children}</> : <Outlet />;
  }

  const path = window.location.pathname;
  const allowed = TENANT_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

