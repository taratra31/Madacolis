import { useQuery } from "@tanstack/react-query";
import { Landmark, Wallet, Hourglass, Package, RefreshCw, Smartphone } from "lucide-react";
import { getTreasury } from "../api/endpoints";
import { Card, ErrorBox, PageHeader, Spinner, StatCard, btnGhost } from "../components/ui";

function MoneyChart({ data }: { data: Array<{ month: string; encaisséAr: number; attenduAr: number }> }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.encaisséAr, d.attenduAr)));
  return (
    <div className="flex h-44 items-end gap-2 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.month} className="group flex h-full min-w-[44px] flex-1 flex-col items-center justify-end">
          <div className="flex w-full flex-1 items-end justify-center gap-1">
            <div className="w-1/3 max-w-[14px] rounded-t bg-emerald-500 opacity-80 transition group-hover:opacity-100" style={{ height: `${(d.encaisséAr / max) * 100}%` }} title={`Encaissé : ${fmtAr(d.encaisséAr)}`} />
            <div className="w-1/3 max-w-[14px] rounded-t bg-amber-400 opacity-80 transition group-hover:opacity-100" style={{ height: `${(d.attenduAr / max) * 100}%` }} title={`Attendu : ${fmtAr(d.attenduAr)}`} />
          </div>
          <p className="mt-1 whitespace-nowrap text-[10px] font-semibold text-slate-400">{d.month.split(" ")[0]}</p>
        </div>
      ))}
    </div>
  );
}

export default function TresoreriePage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["treasury"], queryFn: getTreasury });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox message="Erreur de chargement de la trésorerie." onRetry={() => void refetch()} />;

  return (
    <div>
      <PageHeader
        title="Trésorerie"
        subtitle="Encaissements, attendus et répartition par canal de paiement"
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total encaissé" value={fmtAr(data.encaisséTotalAr)} sub="Paiements payés (6 mois)" icon={<Wallet size={20} />} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Via MVola" value={fmtAr(data.encaisséMMvolaAr)} sub="Paiement mobile money" icon={<Smartphone size={20} />} accent="bg-blue-50 text-blue-600" />
        <StatCard label="Attendu (à encaisser)" value={fmtAr(data.attenduAr)} sub="Colis en cours non payés" icon={<Hourglass size={20} />} accent="bg-amber-50 text-amber-600" />
        <StatCard label="Colis en cours" value={data.colisEnCours} sub="Génèrent de l'attendu" icon={<Package size={20} />} accent="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Encaissé vs attendu" subtitle="Évolution sur 6 mois (€ convertis en Ar)" className="lg:col-span-3">
          <MoneyChart data={data.mensuel} />
          <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Encaissé</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-amber-400" /> Attendu</span>
          </div>
        </Card>

        <Card title="Répartition par canal" className="lg:col-span-2">
          <div className="space-y-3">
            {data.parFournisseur.map((p) => {
              const total = data.parFournisseur.reduce((a, b) => a + b.amount, 0);
              const pct = total ? Math.round((p.amount / total) * 100) : 0;
              return (
                <div key={p.name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600">{p.name}</span>
                    <span className="font-bold text-slate-900">{fmtAr(p.amount)} · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${p.name === "MVola" ? "bg-blue-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
        <Landmark size={14} /> Les montants sont affichés en ariary (Ar). Les paiements en euros sont convertis au taux de référence EUR → Ar.
      </p>
    </div>
  );
}

function fmtAr(v: number) {
  return `${Math.round(v).toLocaleString("fr-FR")} Ar`;
}