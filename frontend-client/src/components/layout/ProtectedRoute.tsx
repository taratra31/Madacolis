import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/ui/LoadingState";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Vérification de votre session…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // L'espace client est réservé aux clients ; les transitaires ont leur propre espace.
  if (user.role === "TRANSITAIRE") {
    return <Navigate to="/espace-transitaire" replace />;
  }

  return <Outlet />;
}