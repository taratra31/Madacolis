import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  Bell,
  PackagePlus,
  Package,
  History,
  CalendarDays,
  UsersRound,
  Contact,
  Truck,
  Users,
  Wallet,
  PiggyBank,
  Landmark,
  BarChart3,
  Tags,
  FolderOpen,
  ShieldCheck,
  Blocks,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  ChevronDown,
  HeartPulse,
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminNotifications, getDashboard } from "../api/endpoints";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; badge?: string; end?: boolean };

const NAV_SECTIONS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Accueil",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/suivi", label: "Suivi en direct", icon: Radio },
      { to: "/notifications", label: "Notifications", icon: Bell, badge: "unread" },
    ],
  },
  {
    title: "Logistique",
    items: [
      { to: "/nouveau-colis", label: "Nouveau colis", icon: PackagePlus },
      { to: "/shipments", label: "Colis", icon: Package, badge: "pending" },
      { to: "/historique", label: "Historique", icon: History },
      { to: "/agenda", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    title: "Tiers",
    items: [
      { to: "/clients", label: "Clients", icon: UsersRound },
      { to: "/contacts", label: "Contacts", icon: Contact },
      { to: "/transporteurs", label: "Transporteurs", icon: Truck },
      { to: "/users", label: "Utilisateurs", icon: Users, badge: "users" },
    ],
  },
  {
    title: "Finance",
    items: [
      { to: "/payments", label: "Paiements", icon: Wallet, badge: "payments" },
      { to: "/commissions", label: "Commissions", icon: PiggyBank },
      { to: "/tresorerie", label: "Trésorerie", icon: Landmark },
      { to: "/reports", label: "Rapports & Exports", icon: BarChart3 },
      { to: "/pricing", label: "Tarification", icon: Tags },
    ],
  },
  {
    title: "Système",
    items: [
      { to: "/documents", label: "Documents", icon: FolderOpen, badge: "documents" },
      { to: "/audits", label: "Journal d'audit", icon: ShieldCheck },
      { to: "/modules", label: "Modules", icon: Blocks },
      { to: "/settings", label: "Paramètres", icon: Settings },
    ],
  },
];

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/suivi": "Suivi en direct",
  "/notifications": "Notifications",
  "/nouveau-colis": "Nouveau colis",
  "/users": "Utilisateurs",
  "/shipments": "Colis",
  "/historique": "Historique",
  "/agenda": "Agenda",
  "/transporteurs": "Transporteurs",
  "/documents": "Documents",
  "/clients": "Clients",
  "/contacts": "Contacts",
  "/payments": "Paiements",
  "/commissions": "Commissions",
  "/tresorerie": "Trésorerie",
  "/reports": "Rapports & Exports",
  "/pricing": "Tarification",
  "/audits": "Journal d'audit",
  "/modules": "Modules",
  "/settings": "Paramètres",
};

const SUBTITLES: Record<string, string> = {
  "/": "Vue d'ensemble de la plateforme MadaColis",
  "/suivi": "Position des colis en temps réel",
  "/notifications": "Événements récents de la plateforme",
  "/nouveau-colis": "Créer un colis pour un client",
  "/users": "Comptes, rôles et statuts de tous les utilisateurs",
  "/shipments": "Gestion et suivi de l'ensemble des colis",
  "/historique": "Colis livrés et annulés",
  "/agenda": "Planning des livraisons sur 7 jours",
  "/transporteurs": "Partenaires de livraison et leurs performances",
  "/documents": "Documents administratifs et pièces justificatives",
  "/clients": "Base clients et leurs activités",
  "/contacts": "Carnet de contacts de la plateforme",
  "/payments": "Paiements et revenus de la plateforme",
  "/commissions": "Commissions MadaColis sur les transporteurs",
  "/tresorerie": "Résumé financier et encaissements",
  "/reports": "Statistiques et exports de données",
  "/pricing": "Grille tarifaire par route et service",
  "/audits": "Traçabilité des actions sensibles",
  "/modules": "Activer ou désactiver les modules du CRM",
  "/settings": "Préférences et informations de la plateforme",
};

function NavBadges() {
  const { data } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const notif = useQuery({ queryKey: ["admin-notifs"], queryFn: getAdminNotifications });
  if (!data) return { unread: notif.data?.unread ?? 0 };
  return {
    users: data.stats.users,
    payments: data.stats.payments,
    pending: data.flows.pending,
    documents: data.stats.documents,
    unread: notif.data?.unread ?? 0,
  };
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<number[]>(NAV_SECTIONS.map((_, i) => i));
  const navigate = useNavigate();
  const location = useLocation();
  const badges = NavBadges();

  const userRaw = localStorage.getItem("admin_user");
  let userName = "Admin";
  let userRole = "";
  try {
    if (userRaw) {
      const u = JSON.parse(userRaw) as { name?: string; role?: string };
      userName = u.name ?? "Admin";
      userRole = u.role ?? "";
    }
  } catch {
    // ignore
  }
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    navigate("/login");
  };

  const pageTitle = Object.entries(TITLES).find(([k]) => (k === "/" ? location.pathname === "/" : location.pathname.startsWith(k)))?.[1] ?? "Dashboard";
  const pageSubtitle = Object.entries(SUBTITLES).find(([k]) => (k === "/" ? location.pathname === "/" : location.pathname.startsWith(k)))?.[1];

  const toggleSection = (idx: number) =>
    setOpenSections((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));

  const SidebarItem = ({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) => {
    const badge = item.badge ? (badges as never)[item.badge] : undefined;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
            isActive
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/40"
              : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <item.icon size={17} className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-200"} />
            <span className="flex-1">{item.label}</span>
            {typeof badge === "number" && badge > 0 ? (
              <span
                className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-white/25 text-white" : item.badge === "pending" ? "bg-amber-500/20 text-amber-300" : "bg-white/10 text-slate-300"
                }`}
              >
                {badge}
              </span>
            ) : null}
          </>
        )}
      </NavLink>
    );
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-blue-500/20 to-transparent blur-3xl" />
      <div className="relative flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-blue-600/40">
          <img src="/logo.png" alt="MadaColis" className="size-full object-cover" />
        </div>
        <div>
          <p className="text-[15px] font-bold leading-tight text-white">MadaColis</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Administration</p>
        </div>
      </div>

      <nav className="scrollbar-thin relative flex-1 space-y-2 overflow-y-auto px-3">
        {NAV_SECTIONS.map((section, idx) => {
          const isShown = openSections.includes(idx);
          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(idx)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition hover:text-slate-300"
              >
                {section.title}
                <ChevronDown size={12} className={`transition-transform ${isShown ? "" : "-rotate-90"}`} />
              </button>
              {isShown ? (
                <div className="mt-0.5 space-y-1">
                  {section.items.map((item) => <SidebarItem key={item.to} item={item} onNavigate={() => setOpen(false)} />)}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      <div className="relative mt-4 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white">
            {initials || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            <p className="truncate text-[11px] text-slate-400">{userRole === "ADMIN" ? "Administrateur" : userRole || "Administrateur"}</p>
          </div>
          <button onClick={logout} title="Se déconnecter" className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400">
            <LogOut size={16} />
          </button>
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-600">
          <HeartPulse size={11} className="text-emerald-400" /> Statut API · Opérationnel
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden bg-[#0b1120] lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col overflow-hidden bg-[#0b1120]">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-3 z-10 rounded-lg p-2 text-slate-400 hover:bg-white/10">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)}>
                <Menu size={20} />
              </button>
              <div>
                <p className="text-base font-bold tracking-tight text-slate-900">{pageTitle}</p>
                {pageSubtitle ? <p className="hidden text-[12px] text-slate-400 sm:block">{pageSubtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(0)} title="Actualiser" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700">
                <RefreshCw size={18} />
              </button>
              <div className="hidden items-center gap-2.5 rounded-full border border-slate-200 py-1.5 pl-1.5 pr-3 sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white">
                  {initials || "A"}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-slate-800">{userName}</p>
                  <p className="text-[10px] text-slate-400">{userRole || "Admin"}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 h-px w-full bg-gradient-to-r from-blue-500/40 via-slate-200 to-transparent" />
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}