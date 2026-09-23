import { Outlet, useLocation } from "react-router-dom";
import { PublicNavbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PublicLayout() {
  const { pathname } = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <PublicNavbar />
      <main className="flex-1">
        <div key={pathname} className="animate-fade-up">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}