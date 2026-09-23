import { useState } from "react";
import { Blocks, RefreshCw, LayoutDashboard, Radio, Bell, PackagePlus, Package, History, CalendarDays, UsersRound, Contact, Truck, Users, Wallet, PiggyBank, Landmark, BarChart3, Tags, FolderOpen, ShieldCheck, Settings } from "lucide-react";
import { PageHeader, btnGhost } from "../components/ui";

const CATEGORIES: Array<{ name: string; color: string; modules: Array<{ key: string; label: string; icon: typeof Blocks; desc: string }> }> = [
  {
    name: "Accueil",
    color: "bg-blue-50 text-blue-600",
    modules: [
      { key: "module_dashboard", label: "Dashboard", icon: LayoutDashboard, desc: "Vue d'ensemble et KPIs" },
      { key: "module_suivi", label: "Suivi en direct", icon: Radio, desc: "Position temps réel des colis" },
      { key: "module_notifications", label: "Notifications", icon: Bell, desc: "Fil d'événements récents" },
    ],
  },
  {
    name: "Logistique",
    color: "bg-sky-50 text-sky-600",
    modules: [
      { key: "module_nouveau_colis", label: "Nouveau colis", icon: PackagePlus, desc: "Création de colis" },
      { key: "module_colis", label: "Colis", icon: Package, desc: "Gestion et statuts" },
      { key: "module_historique", label: "Historique", icon: History, desc: "Livrés et annulés" },
      { key: "module_agenda", label: "Agenda", icon: CalendarDays, desc: "Planning sur 7 jours" },
    ],
  },
  {
    name: "Tiers",
    color: "bg-violet-50 text-violet-600",
    modules: [
      { key: "module_clients", label: "Clients", icon: UsersRound, desc: "Base clients" },
      { key: "module_contacts", label: "Contacts", icon: Contact, desc: "Carnet d'adresses" },
      { key: "module_transporteurs", label: "Transporteurs", icon: Truck, desc: "Partenaires de livraison" },
      { key: "module_users", label: "Utilisateurs", icon: Users, desc: "Comptes et rôles" },
    ],
  },
  {
    name: "Finance",
    color: "bg-emerald-50 text-emerald-600",
    modules: [
      { key: "module_payments", label: "Paiements", icon: Wallet, desc: "Revenus de la plateforme" },
      { key: "module_commissions", label: "Commissions", icon: PiggyBank, desc: "Commission transporteurs" },
      { key: "module_tresorerie", label: "Trésorerie", icon: Landmark, desc: "Encaissements" },
      { key: "module_reports", label: "Rapports & Exports", icon: BarChart3, desc: "Statistiques et CSV" },
      { key: "module_pricing", label: "Tarification", icon: Tags, desc: "Grille tarifaire" },
    ],
  },
  {
    name: "Système",
    color: "bg-slate-100 text-slate-600",
    modules: [
      { key: "module_documents", label: "Documents", icon: FolderOpen, desc: "Pièces et formulaires" },
      { key: "module_audits", label: "Journal d'audit", icon: ShieldCheck, desc: "Traçabilité des actions" },
      { key: "module_settings", label: "Paramètres", icon: Settings, desc: "Préférences" },
    ],
  },
];

export default function ModulesPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_modules") ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  const toggle = (key: string) => {
    setEnabled((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("admin_modules", JSON.stringify(next));
      return next;
    });
  };

  const activeCount = CATEGORIES.reduce((a, c) => a + c.modules.length, 0) - Object.values(enabled).filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Modules"
        subtitle="Activez ou désactivez les modules du CRM selon vos besoins"
        actions={
          <>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">{activeCount} actifs</span>
            <button className={btnGhost} onClick={() => { localStorage.removeItem("admin_modules"); setEnabled({}); }}><RefreshCw size={16} /> Réinitialiser</button>
          </>
        }
      />

      <div className="space-y-5">
        {CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              <span className={`flex h-5 w-5 items-center justify-center rounded-md ${cat.color}`}><Blocks size={12} /></span>
              {cat.name}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cat.modules.map((m) => {
                const on = enabled[m.key] !== true;
                const Icon = m.icon;
                return (
                  <div key={m.key} className={`flex items-center gap-3 rounded-2xl border p-4 shadow-sm transition ${on ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-60"}`}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cat.color}`}><Icon size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">{m.label}</p>
                      <p className="text-[11px] text-slate-400">{m.desc}</p>
                    </div>
                    <button
                      onClick={() => toggle(m.key)}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-blue-600" : "bg-slate-300"}`}
                      title={on ? "Activé" : "Désactivé"}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}