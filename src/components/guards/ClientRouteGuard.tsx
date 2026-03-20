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
  const { isClientUser, roles } = useAuth();

  // Double-check: employees/admins NEVER get client route restrictions
  const isStaff = roles.includes("employee" as any) || roles.includes("business_admin" as any) || roles.includes("super_admin" as any);

  if (!isClientUser || isStaff) {
    // Not a client user — allow everything
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
