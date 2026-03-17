import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

/**
 * List of route prefixes that client portal users ARE allowed to access.
 * Everything else redirects to /dashboard.
 */
const CLIENT_ALLOWED_PREFIXES = [
  "/dashboard",
  "/my-billing",
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
];

export function ClientRouteGuard({ children }: { children?: React.ReactNode }) {
  const { isClientUser } = useAuth();

  if (!isClientUser) {
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
