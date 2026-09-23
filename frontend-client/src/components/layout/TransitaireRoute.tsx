import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/ui/LoadingState";

/** Réserve les routes /espace-transitaire/* au rôle TRANSITAIRE. */
export function TransitaireRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Vérification de votre session…" />
      </div>
    );
  }

  if (!user || user.role !== "TRANSITAIRE") {
    return <Navigate to={user ? "/dashboard" : "/login"} replace />;
  }

  return <Outlet />;
}