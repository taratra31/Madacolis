import { useState } from "react";
import { RefreshCw, Globe2, ShieldCheck, Sun, Bell, Info, MessageSquare, Phone, Mail, ExternalLink } from "lucide-react";
import { Card, PageHeader, btnGhost } from "../components/ui";

const PREFS: Array<{ key: string; label: string; desc: string }> = [
  { key: "compactTables", label: "Tableaux compacts", desc: "Afficher les tableaux avec un espacement réduit" },
  { key: "confirmActions", label: "Confirmation des actions", desc: "Demander une confirmation avant les actions destructives" },
  { key: "autoRefresh", label: "Actualisation automatique", desc: "Rafraîchir les données intermédiaires automatiquement" },
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("admin_prefs") ?? "{}") as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  const toggle = (key: string) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("admin_prefs", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Préférences de l'espace d'administration MadaColis"
        actions={<button className={btnGhost} onClick={() => { localStorage.removeItem("admin_prefs"); setPrefs({}); }}><RefreshCw size={16} /> Réinitialiser</button>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Préférences d'affichage" subtitle="Appliquées immédiatement dans votre session" action={<Sun size={16} className="text-slate-400" />}>
          <div className="space-y-2.5">
            {PREFS.map((p) => (
              <div key={p.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{p.label}</p>
                  <p className="text-[11px] text-slate-400">{p.desc}</p>
                </div>
                <button
                  onClick={() => toggle(p.key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${prefs[p.key] ? "bg-blue-600" : "bg-slate-300"}`}
                  title={prefs[p.key] ? "Activé" : "Désactivé"}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${prefs[p.key] ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info size={12} className="text-blue-500" /> Ces réglages sont stockés localement sur ce navigateur.
          </p>
        </Card>

        <div className="space-y-4">
          <Card title="Notifications" subtitle="Fréquence des alertes du tableau de bord" action={<Bell size={16} className="text-slate-400" />}>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Colis en attente de traitement</p>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">Immédiat</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Nouveaux paiements reçus</p>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Immédiat</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Rapport hebdomadaire</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-400/20">Lundi 08:00</span>
              </div>
            </div>
          </Card>

          <Card title="Plateforme" subtitle="Informations de service">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Globe2 size={12} /> Version</p>
                <p className="mt-1 text-sm font-extrabold text-slate-900">1.0.0</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><ShieldCheck size={12} /> Statut API</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Opérationnel</p>
              </div>
            </div>
            <a
              href="/login"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
            >
              <ExternalLink size={13} /> Site public MadaColis
            </a>
          </Card>
        </div>
      </div>

      <div className="mt-4">
        <Card title="Support" subtitle="Contactez l'équipe technique">
          <div className="grid gap-3 sm:grid-cols-3">
            <a href="https://wa.me/261340000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><MessageSquare size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">WhatsApp</p>
                <p className="text-[11px] text-slate-400">+261 34 00 000 00</p>
              </div>
            </a>
            <a href="mailto:support@madacolis.mg" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Mail size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Email</p>
                <p className="text-[11px] text-slate-400">support@madacolis.mg</p>
              </div>
            </a>
            <a href="tel:+261340000000" className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Phone size={18} /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">Téléphone</p>
                <p className="text-[11px] text-slate-400">Lun – Sam · 8h à 18h</p>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}