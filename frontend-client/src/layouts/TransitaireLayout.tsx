import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Database,
  FileText,
  Globe,
  Landmark,
  LifeBuoy,
  LayoutGrid,
  LogOut,
  Map,
  Menu,
  Monitor,
  Moon,
  PackageCheck,
  PackagePlus,
  Sun,
  Settings2,
  Truck,
  User,
  Users,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/contexts/auth";
import { useTheme } from "@/contexts/theme";
import { cn, initialsOf } from "@/utils";

const NAV_SECTIONS: { title?: string; items: { to: string; label: string; icon: typeof Boxes; end?: boolean }[] }[] = [
  {
    title: "Accueil",
    items: [
      { to: "/espace-transitaire", label: "Tableau de bord", icon: Boxes, end: true },
      { to: "/espace-transitaire/monitoring", label: "Suivi en direct", icon: Map },
      { to: "/espace-transitaire/agenda", label: "Agenda", icon: CalendarDays },
      { to: "/espace-transitaire/journal", label: "Journal d'activité", icon: ClipboardList },
      { to: "/espace-transitaire/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Logistique",
    items: [
      { to: "/espace-transitaire/new-shipment", label: "Nouveau colis", icon: PackagePlus },
      { to: "/espace-transitaire/shipments", label: "Colis", icon: Truck },
      { to: "/espace-transitaire/history", label: "Historique", icon: Archive },
      { to: "/espace-transitaire/tarifs", label: "Tarifs", icon: Globe },
    ],
  },
  {
    title: "Tiers",
    items: [
      { to: "/espace-transitaire/clients", label: "Clients", icon: Users },
      { to: "/espace-transitaire/contacts", label: "Contacts", icon: UsersRound },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/espace-transitaire/payments", label: "Facturation", icon: Wallet },
      { to: "/espace-transitaire/commissions", label: "Commissions", icon: CircleDollarSign },
      { to: "/espace-transitaire/tresorerie", label: "Trésorerie", icon: Landmark },
    ],
  },
  {
    title: "Outils",
    items: [
      { to: "/espace-transitaire/reports", label: "Rapports", icon: BarChart3 },
      { to: "/espace-transitaire/export", label: "Export données", icon: Database },
      { to: "/espace-transitaire/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    title: "Organisation",
    items: [{ to: "/espace-transitaire/team", label: "Équipe", icon: UsersRound }],
  },
  {
    title: "Configuration",
    items: [
      { to: "/espace-transitaire/settings", label: "Paramètres", icon: Settings2 },
      { to: "/espace-transitaire/modules", label: "Modules", icon: LayoutGrid },
      { to: "/espace-transitaire/support", label: "Support", icon: LifeBuoy },
      { to: "/espace-transitaire/profile", label: "Profil", icon: User },
    ],
  },
];

export function TransitaireLayout() {
  const { user, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebar = (
    <div className="relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative flex h-16 items-center justify-between border-b border-white/5 px-5">
        <Link to="/" aria-label="Retour au site">
          <Logo className="[&_span:last-child]:text-white" />
        </Link>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:text-white lg:hidden" aria-label="Fermer le menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="relative flex-1 space-y-5 overflow-y-auto p-4" aria-label="Navigation espace transitaire">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title ?? "root"}>
            {section.title && (
              <p className="mb-1.5 flex items-center gap-2 px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-950/40"
                        : "text-slate-300 hover:bg-white/5 hover:text-white",
                    )
                  }
                >
                  <item.icon className="size-4.5" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="relative border-t border-white/5 p-4">
        {user && (
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
              {initialsOf(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email ?? user.phone}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={cycleTheme} className="flex h-10 flex-1 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Changer de thème">
            {theme === "dark" ? <Sun className="size-4" /> : theme === "light" ? <Moon className="size-4" /> : <Monitor className="size-4" />}
          </button>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-white/5 text-slate-300 transition hover:bg-red-500/20 hover:text-red-400"
            aria-label="Se déconnecter"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-brand-950 lg:block">{sidebar}</aside>

      <div className={cn("fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setOpen(false)} aria-hidden />

      <div className={cn("fixed inset-y-0 left-0 z-50 w-64 bg-brand-950 transition-transform lg:hidden", open ? "translate-x-0" : "-translate-x-full")}>
        {sidebar}
      </div>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden" aria-label="Ouvrir le menu">
              <Menu className="size-5" />
            </button>
            <span className="hidden items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 lg:inline-flex">
              <Truck className="size-3.5" />
              Espace transitaire
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="hidden text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white sm:block">
              Retour au site
            </Link>
            <Link to="/espace-transitaire/shipments">
              <button className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:inline-flex">
                <PackageCheck className="size-4" />
                Gérer les colis
              </button>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
          <div key={pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}