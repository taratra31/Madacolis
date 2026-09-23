import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, FileSpreadsheet, Package, PieChart, Route, TrendingUp, Users, Wallet, RefreshCw } from "lucide-react";
import { exportCsv, getDashboard } from "../api/endpoints";
import { Card, Spinner, ErrorBox, statusLabel, btnGhost } from "../components/ui";
import { COMMISSION_RATE } from "./TransitairesPage";

const EXPORTS = [
  { kind: "colis" as const, label: "Export des colis", desc: "Tous les colis avec prix, commission et suivi", icon: Package },
  { kind: "utilisateurs" as const, label: "Export des utilisateurs", desc: "Comptes, rôles, statuts et volumes", icon: Users },
  { kind: "paiements" as const, label: "Export des paiements", desc: "Montants, providers et statuts de paiement", icon: Wallet },
  { kind: "documents" as const, label: "Export des documents", desc: "Documents administratifs de la plateforme", icon: FileSpreadsheet },
];

const PROVIDER_COLORS = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-indigo-500", "bg-cyan-500", "bg-violet-500"];

function BarChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-40 items-end gap-[3px] overflow-hidden">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.count / max) * 100));
        return (
          <div key={d.day} className="group relative flex-1" title={`${d.day} : ${d.count} colis`}>
            <div className="h-full w-full rounded-t bg-gradient-to-t from-blue-600 to-indigo-400 opacity-70 transition group-hover:opacity-100" style={{ height: `${h}%` }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
              {d.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportsPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });

  const doExport = async (kind: "colis" | "utilisateurs" | "paiements" | "documents") => {
    setBusy(kind);
    try {
      await exportCsv(kind);
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox message="Erreur de chargement des statistiques." onRetry={() => void refetch()} />;

  const { stats, trend30d, topRoutes, revenueByProvider, shipmentsByService } = data;
  const commissionAr = Math.round((stats.revenuePaid ?? 0) * COMMISSION_RATE);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Rapports & Exports</h1>
          <p className="mt-0.5 text-sm text-slate-500">Statistiques de la plateforme et exports de données</p>
        </div>
        <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Activité sur 30 jours" subtitle="Nombre de colis créés par jour" className="lg:col-span-2" action={<span className="flex items-center gap-1.5 text-xs font-bold text-blue-600"><TrendingUp size={14} /> <strong>{trend30d.reduce((a, d) => a + d.count, 0)}</strong> colis</span>}>
          <BarChart data={trend30d} />
          <div className="mt-2 flex justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>{trend30d[0]?.day}</span>
            <span>{trend30d[trend30d.length - 1]?.day}</span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Répartition des colis" subtitle="Par statut">
            {data.shipmentsByStatus.length === 0 ? <p className="py-4 text-sm text-slate-400">Aucune donnée.</p> : (
              <div className="space-y-3">
                {data.shipmentsByStatus.map((s) => {
                  const total = data.shipmentsByStatus.reduce((a, b) => a + b._count._all, 0);
                  const pct = Math.round((s._count._all / total) * 100);
                  return (
                    <div key={s.status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">{statusLabel(s.status)}</span>
                        <span className="font-bold text-slate-900">{s._count._all} ({pct}%)</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Revenus" subtitle="Vue financière globale">
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-xs font-semibold text-slate-500">Revenu estimé (colis)</span>
                <span className="text-sm font-extrabold text-slate-900">{fmtAr(stats.revenueEstimated ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-xs font-semibold text-emerald-700">Revenu collecté</span>
                <span className="text-sm font-extrabold text-emerald-700">{fmtAr(stats.revenuePaid ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-3">
                <span className="text-xs font-semibold text-indigo-700">Commission MadaColis (20 %)</span>
                <span className="text-sm font-extrabold text-indigo-700">{fmtAr(commissionAr)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card title="Top routes" subtitle="Les 5 trajets les plus fréquents" action={<Route size={16} className="text-slate-400" />}>
          <div className="divide-y divide-slate-50">
            {topRoutes.map((r, i) => (
              <div key={`${r.originCity}-${r.destinationCity}`} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black text-white ${PROVIDER_COLORS[i % PROVIDER_COLORS.length]}`}>{i + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{r.originCity} → {r.destinationCity}</p>
                    <p className="text-[10px] text-slate-400">{r.originCountry} / {r.destinationCountry}</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-extrabold text-blue-700">{r.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Colis par service" action={<PieChart size={16} className="text-slate-400" />}>
          <div className="space-y-3">
            {shipmentsByService.map((s) => {
              const total = shipmentsByService.reduce((a, b) => a + b._count._all, 0);
              const pct = total ? Math.round((s._count._all / total) * 100) : 0;
              return (
                <div key={s.serviceType}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{statusLabel(s.serviceType)}</span>
                    <span className="font-bold text-slate-900">{s._count._all}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${s.serviceType === "EXPRESS" ? "bg-rose-500" : s.serviceType === "ECONOMY" ? "bg-cyan-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Revenus par provider" action={<BarChart3 size={16} className="text-slate-400" />}>
          <div className="space-y-3">
            {revenueByProvider.length === 0 ? <p className="py-4 text-sm text-slate-400">Aucune donnée.</p> : revenueByProvider.map((p) => {
              const total = revenueByProvider.reduce((a, b) => a + (b.amount ?? 0), 0);
              const pct = total ? Math.round(((p.amount ?? 0) / total) * 100) : 0;
              return (
                <div key={p.provider}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{p.provider}</span>
                    <span className="font-bold text-slate-900">{fmtAr(p.amount ?? 0)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <Card title="Exports de données" subtitle="Téléchargez les données au format CSV" action={<Download size={16} className="text-slate-400" />}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {EXPORTS.map((e) => (
              <button
                key={e.kind}
                disabled={busy === e.kind}
                onClick={() => void doExport(e.kind)}
                className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md disabled:opacity-60"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition group-hover:scale-105">
                  <e.icon size={19} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{e.label}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{e.desc}</p>
                </div>
                <span className={`${busy === e.kind ? "pointer-events-none opacity-60" : ""} mt-auto inline-flex items-center gap-1.5 text-xs font-bold text-blue-600`}>
                  <Download size={13} /> {busy === e.kind ? "Préparation…" : "Télécharger"}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function fmtAr(v: number) {
  return `${Math.round(v).toLocaleString("fr-FR")} Ar`;
}