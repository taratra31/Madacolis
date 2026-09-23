import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/", label: "Dashboard", icon: "M3 13h6V3H3v10zm0 8h6v-6H3v6zm8 0h6v-8h-6v8zm0-18v6h6V3h-6z" },
  { to: "/users", label: "Utilisateurs", icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" },
  { to: "/shipments", label: "Colis", icon: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" },
  { to: "/payments", label: "Paiements", icon: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" },
  { to: "/pricing", label: "Tarifs", icon: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" },
  { to: "/audits", label: "Audit", icon: "M19 3H5c-1.66 0-3 1.34-3 3v14c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3V6c0-1.66-1.34-3-3-3zM12 17H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z" },
];

const TITLES: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/users": "Utilisateurs",
  "/shipments": "Colis",
  "/payments": "Paiements",
  "/pricing": "Tarifs",
  "/audits": "Journal d'audit",
};

function Icon({ path }: { path: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={path} />
    </svg>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0b1220] text-slate-100">
      <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-950/20" />

      <div className="relative flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-emerald-500/30">
          <img src="/logo.png" alt="MadaColis" className="h-full w-full object-cover" />
        </div>
        <div>
          <div className="text-sm font-bold leading-tight">MadaColis</div>
          <div className="text-[11px] font-medium uppercase tracking-widest text-emerald-400">Console Admin</div>
        </div>
      </div>

      <div className="relative mt-2 flex-1 space-y-1 overflow-y-auto px-3">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/25 ring-inset"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon path={item.icon} />
            {item.label}
            {item.to === "/" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          </NavLink>
        ))}
      </div>

      <div className="relative border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-sm font-bold ring-2 ring-emerald-500/40">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user?.name}</div>
            <div className="truncate text-xs text-slate-400">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Déconnexion"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-500/10 hover:text-emerald-300"
          >
            <Icon path="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = TITLES[pathname] ?? "MadaColis";

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-64 shrink-0 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 animate-fade-in-up">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-10 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur lg:px-6">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden">
            <Icon path="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-bold text-slate-700">{title}</h1>
            <span className="hidden rounded-full px-2 py-0.5 text-[11px] font-semibold text-slate-400 ring-1 ring-slate-200 ring-inset sm:inline-flex">
              Plateforme de livraison
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              En ligne
            </span>
            <button
              onClick={() => navigate("/audits")}
              className="hidden items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 md:inline-flex"
            >
              <span className="text-emerald-400">•</span> Audit
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}