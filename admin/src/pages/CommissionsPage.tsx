import { useQuery } from "@tanstack/react-query";
import { PiggyBank, TrendingUp, Truck, CheckCircle2, RefreshCw } from "lucide-react";
import { getCommissions } from "../api/endpoints";
import { Card, ErrorBox, PageHeader, Spinner, StatCard, fmtMoney, btnGhost } from "../components/ui";

function CommChart({ data }: { data: Array<{ month: string; revenueAr: number; commissionAr: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.revenueAr));
  return (
    <div className="flex h-44 items-end gap-2 overflow-x-auto pb-1">
      {data.map((d) => (
        <div key={d.month} className="group flex h-full min-w-[44px] flex-1 flex-col items-center justify-end">
          <div className="relative flex w-full flex-1 items-end justify-center gap-1">
            <div className="w-1/3 max-w-[14px] rounded-t bg-blue-500 opacity-80 transition group-hover:opacity-100" style={{ height: `${(d.revenueAr / max) * 100}%` }} title={`Revenu : ${fmtMoney(d.revenueAr, "Ar")}`} />
            <div className="w-1/3 max-w-[14px] rounded-t bg-emerald-500 opacity-80 transition group-hover:opacity-100" style={{ height: `${(d.commissionAr / max) * 100}%` }} title={`Commission : ${fmtMoney(d.commissionAr, "Ar")}`} />
          </div>
          <p className="mt-1 whitespace-nowrap text-[10px] font-semibold text-slate-400">{d.month.split(" ")[0]}</p>
        </div>
      ))}
    </div>
  );
}

export default function CommissionsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["commissions"], queryFn: getCommissions });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox message="Erreur de chargement des commissions." onRetry={() => void refetch()} />;

  const ratePct = Math.round(data.rate * 100);

  return (
    <div>
      <PageHeader
        title="Commissions"
        subtitle={`Revenus et commissions MadaColis (${ratePct} %) sur les transporteurs`}
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenu des transporteurs" value={fmtMoney(data.totalRevenue, "Ar")} sub="Tous transporteurs confondus" icon={<TrendingUp size={20} />} accent="bg-blue-50 text-blue-600" />
        <StatCard label="Commission MadaColis" value={fmtMoney(data.totalCommission, "Ar")} sub={`Taux appliqué : ${ratePct} %`} icon={<PiggyBank size={20} />} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Transporteurs" value={data.perCarrier.length} sub="Partenaires actifs" icon={<Truck size={20} />} accent="bg-sky-50 text-sky-600" />
        <StatCard label="Colis livrés" value={data.deliveredShipments} sub="Générant une commission" icon={<CheckCircle2 size={20} />} accent="bg-violet-50 text-violet-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card title="Commission mensuelle" subtitle="Revenu (bleu) vs commission (vert) — 6 derniers mois" className="lg:col-span-3">
          <CommChart data={data.monthly} />
          <div className="mt-3 flex items-center gap-4 text-[11px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-blue-500" /> Revenu</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Commission</span>
          </div>
        </Card>

        <Card title="Détail par transporteur" className="lg:col-span-2">
          {data.perCarrier.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Aucun transporteur.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {data.perCarrier.map((c) => (
                <div key={c.carrierId} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><Truck size={14} className="text-sky-500" /> {c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.shipments} colis · {c.delivered} livrés</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-600">{fmtMoney(c.commission, "Ar")}</p>
                    <p className="text-[10px] text-slate-400">{fmtMoney(c.revenue, "Ar")} de CA</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}