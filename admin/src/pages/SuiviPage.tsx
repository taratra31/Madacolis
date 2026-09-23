import { useQuery } from "@tanstack/react-query";
import { Radio, RefreshCw, MapPin, PackageSearch } from "lucide-react";
import { getShipments } from "../api/endpoints";
import { Badge, Card, PageHeader, statusLabel, fmtDate, btnGhost, Spinner } from "../components/ui";
import type { ShipmentStatus } from "../types";

const STEPS: ShipmentStatus[] = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED"];
const LIVE_STATUSES = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"];

export default function SuiviPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["suivi"],
    queryFn: () => getShipments({ page: 1, pageSize: 100 }),
    refetchInterval: 20000,
    refetchIntervalInBackground: true,
  });

  const live = (data?.shipments ?? []).filter((s) => LIVE_STATUSES.includes(s.status));
  const stepIndex = (status: ShipmentStatus) => STEPS.indexOf(status);

  return (
    <div>
      <PageHeader
        title="Suivi en direct"
        subtitle={`Position des colis en cours de traitement · ${live.length} actuellement`}
        actions={
          <button className={btnGhost} onClick={() => void refetch()}>
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Actualiser
          </button>
        }
      />

      {isLoading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
      ) : live.length === 0 ? (
        <Card><p className="py-8 text-center text-sm text-slate-400">Aucun colis en cours de traitement.</p></Card>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <LiveKpi label="Total en cours" value={live.length} accent="bg-blue-50 text-blue-600" />
            <LiveKpi label="En attente" value={live.filter((s) => s.status === "PENDING").length} accent="bg-amber-50 text-amber-600" />
            <LiveKpi label="En transit" value={live.filter((s) => s.status === "IN_TRANSIT" || s.status === "IN_CUSTOMS").length} accent="bg-sky-50 text-sky-600" />
            <LiveKpi label="En livraison" value={live.filter((s) => s.status === "OUT_FOR_DELIVERY").length} accent="bg-teal-50 text-teal-600" />
          </div>

          <Card title="Flux en direct" subtitle="Rafraîchi automatiquement toutes les 20 secondes" action={<Radio size={16} className="animate-pulse text-emerald-500" />}>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
              {live.map((sh) => {
                const idx = stepIndex(sh.status);
                return (
                  <div key={sh.id} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><PackageSearch size={17} /></div>
                        <div>
                          <p className="font-mono text-xs font-black text-blue-600">{sh.trackingNumber}</p>
                          <p className="text-[11px] text-slate-400">{sh.user.name}</p>
                        </div>
                      </div>
                      <Badge value={sh.status} />
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {STEPS.map((st, i) => (
                        <div key={st} className="flex flex-1 items-center">
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${i <= idx ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {i < idx ? "✓" : i + 1}
                          </div>
                          {i < STEPS.length - 1 ? (
                            <div className={`h-0.5 flex-1 ${i < idx ? "bg-blue-500" : "bg-slate-200"}`} />
                          ) : null}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {sh.originCity} → {sh.destinationCity}</span>
                      <span>Créé {fmtDate(sh.createdAt)} · Statut actuel : <strong className="text-slate-600">{statusLabel(sh.status)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function LiveKpi({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex h-2 w-2 rounded-full animate-pulse-soft ${accent.includes("amber") ? "bg-amber-500" : accent.includes("sky") ? "bg-sky-500" : accent.includes("teal") ? "bg-teal-500" : "bg-blue-500"}`} />
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}