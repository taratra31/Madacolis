import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { LoadingState } from "@/components/ui/LoadingState";

/** Réservé aux visiteurs non connectés (login / register). */
export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Chargement…" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === "TRANSITAIRE" ? "/espace-transitaire" : "/dashboard"} replace />;
  }

  return <Outlet />;
}