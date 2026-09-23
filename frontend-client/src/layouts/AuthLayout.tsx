import { Outlet } from "react-router-dom";

/** Écran plein — sans header ni footer public — pour les pages d'authentification. */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#020617]">
      <Outlet />
    </div>
  );
}