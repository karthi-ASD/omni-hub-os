import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

/**
 * List of route prefixes that client portal users ARE allowed to access.
 * Everything else redirects to /dashboard.
 */
const CLIENT_ALLOWED_PREFIXES = [
  "/dashboard",
  "/my-billing",
  "/my-package",
  "/invoices",
  "/seo",
  "/client-reports",
  "/unified-tickets",
  "/projects",
  "/leads",
  "/clients",
  "/deals",
  "/calendar",
  "/hr/employees",
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
];

export function ClientRouteGuard({ children }: { children?: React.ReactNode }) {
  const { userType } = useAuth();

  // SINGLE SOURCE OF TRUTH: only restrict routes for resolved "client" type
  // All staff types (super_admin, business_admin, employee) pass through
  if (userType !== "client") {
    return children ? <>{children}</> : <Outlet />;
  }

  // Client user — check current path
  const path = window.location.pathname;
  const allowed = CLIENT_ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/")
  );

  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
