import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Truck, PackageOpen, CheckCircle2, Clock3, ShieldCheck, Mail, Phone, TrendingUp } from "lucide-react";
import { getTransitaires, updateUserStatus } from "../api/endpoints";
import { Card, ErrorBox, PageHeader, Pagination, ProgressBar, Spinner, btnGhost, fmtDate } from "../components/ui";

export const COMMISSION_RATE = 0.2;
export const EUR_TO_MGA = 6000;

export default function TransitairesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["transporteurs", page],
    queryFn: () => getTransitaires({ page, pageSize: 20 }),
  });

  const toggle = useMutation({
    mutationFn: (u: { id: string; isActive: boolean }) => updateUserStatus(u.id, { isActive: u.isActive }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["transporteurs"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Transporteurs"
        subtitle="Partenaires de livraison (transitaires) et leurs performances"
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      {isLoading ? <Spinner /> : error ? <ErrorBox message="Erreur de chargement des transporteurs." onRetry={() => void refetch()} /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(data?.transitaires ?? []).map((t) => {
              const pendingPct = t.shipments ? Math.round((t.pending / t.shipments) * 100) : 0;
              const commissionAr = Math.round(t.revenueAr * COMMISSION_RATE);
              return (
                <div key={t.id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-lg hover:shadow-slate-200/60">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
                        <Truck size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{t.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">{t.carrierId}</p>
                      </div>
                    </div>
                    <button
                      title={t.isActive ? "Désactiver" : "Activer"}
                      disabled={toggle.isPending}
                      onClick={() => void toggle.mutate({ id: t.id, isActive: !t.isActive })}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                        t.isActive ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100" : "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-300/40 hover:bg-slate-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${t.isActive ? "bg-green-500" : "bg-slate-400"}`} />
                      {t.isActive ? "Actif" : "Inactif"}
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3 text-center">
                      <PackageOpen size={15} className="mx-auto text-blue-500" />
                      <p className="mt-1 text-xl font-extrabold text-slate-900">{t.shipments}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Colis</p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center">
                      <Clock3 size={15} className="mx-auto text-amber-500" />
                      <p className="mt-1 text-xl font-extrabold text-slate-900">{t.pending}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80">En cours</p>
                    </div>
                    <div className="rounded-xl bg-green-50 p-3 text-center">
                      <CheckCircle2 size={15} className="mx-auto text-green-500" />
                      <p className="mt-1 text-xl font-extrabold text-slate-900">{t.delivered}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-green-600/80">Livrés</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Charge de travail</span>
                      <span>{pendingPct}%</span>
                    </div>
                    <ProgressBar value={t.pending} max={Math.max(t.shipments, 1)} color="bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500"><Mail size={13} className="text-slate-400" /> {t.email ?? "—"}</div>
                    <div className="flex items-center gap-1.5 text-slate-500"><Phone size={13} className="text-slate-400" /> {t.phone ?? "—"}</div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2.5 ring-1 ring-inset ring-blue-100">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-blue-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Revenu total</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900">{fmtAr(t.revenueAr)}</p>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <ShieldCheck size={12} className="text-emerald-500" /> Commission MadaColis estimée : <strong className="text-slate-600">{fmtAr(commissionAr)}</strong>
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">Inscrit le {fmtDate(t.createdAt)}</p>
                </div>
              );
            })}
          </div>
          {data && data.transitaires.length === 0 ? (
            <Card><p className="py-6 text-center text-sm text-slate-400">Aucun transporteur enregistré.</p></Card>
          ) : null}
          {data ? <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} /> : null}
        </>
      )}
    </div>
  );
}

function fmtAr(v: number) {
  return `${Math.round(v).toLocaleString("fr-FR")} Ar`;
}