import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./Index";

const RootRoute = () => {
  const { session, loading, isAuthResolved } = useAuth();

  console.log("ROOT_ROUTE", {
    hasSession: !!session,
    loading,
    isAuthResolved,
  });

  if (loading || !isAuthResolved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Index />;
};

export default RootRoute;