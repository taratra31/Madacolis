import { useEffect, useState } from "react";
import { Boxes, LayoutGrid, PackageOpen } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";

const KEY = "mc_transitaire_modules";

const MODULES: { id: string; name: string; desc: string; group: string }[] = [
  { id: "dashboard", name: "Tableau de bord", desc: "Indicateurs clés et graphiques.", group: "Pilotage" },
  { id: "monitoring", name: "Suivi en direct", desc: "Suivi temps réel des expéditions.", group: "Pilotage" },
  { id: "agenda", name: "Agenda des livraisons", desc: "Planification sur 7 jours.", group: "Pilotage" },
  { id: "journal", name: "Journal d'activité", desc: "Traçabilité des actions.", group: "Pilotage" },
  { id: "colis", name: "Colis & historique", desc: "Gestion complète des expéditions.", group: "Logistique" },
  { id: "tarifs", name: "Tarifs", desc: "Grilles tarifaires et commission.", group: "Logistique" },
  { id: "clients", name: "Clients & contacts", desc: "Base clients et carnet d'adresses.", group: "Tiers" },
  { id: "billing", name: "Facturation, paiements & trésorerie", desc: "Suivi financier complet.", group: "Finance" },
  { id: "commissions", name: "Commissions", desc: "Calcul des commissions 20 %.", group: "Finance" },
  { id: "reports", name: "Rapports & exports", desc: "Statistiques et exports CSV.", group: "Outils" },
  { id: "documents", name: "Documents", desc: "Pièces et formulaires douaniers.", group: "Outils" },
  { id: "team", name: "Équipe", desc: "Membres et rôles de l'agence.", group: "Organisation" },
  { id: "support", name: "Support", desc: "Aide et canaux de contact.", group: "Général" },
];

const GROUPS = ["Pilotage", "Logistique", "Tiers", "Finance", "Outils", "Organisation", "Général"];

export function TransitaireModulesPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, boolean>;
      setEnabled(Object.fromEntries(MODULES.map((m) => [m.id, raw[m.id] !== false])));
    } catch {
      setEnabled(Object.fromEntries(MODULES.map((m) => [m.id, true])));
    }
  }, []);

  const toggle = (id: string, value: boolean) => {
    const next = { ...enabled, [id]: value };
    setEnabled(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const activeCount = Object.values(enabled).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <LayoutGrid className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Modules
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Activez ou désactivez les fonctionnalités de votre espace. {activeCount}/{MODULES.length} actifs.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/40">
        <PackageOpen className="size-6 shrink-0 text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          Les modules désactivés restent dans le menu. La désactivation est mémorisée sur cet appareil.
        </p>
      </div>

      {GROUPS.map((group) => {
        const items = MODULES.filter((m) => m.group === group);
        return (
          <Card key={group}>
            <CardHeader className="flex items-center gap-2">
              <Boxes className="size-4 text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{group}</h2>
            </CardHeader>
            <CardBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {items.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{m.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{m.desc}</p>
                  </div>
                  <Checkbox checked={enabled[m.id] ?? true} onChange={(e) => toggle(m.id, e.target.checked)} aria-label={`Activer ${m.name}`} />
                </div>
              ))}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}