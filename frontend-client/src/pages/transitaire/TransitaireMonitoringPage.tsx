import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity as ActivityIcon, BadgeCheck, MapPin, Search } from "lucide-react";
import { fetchTransitaireShipments } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, STATUS_LABELS } from "@/utils";
import type { ShipmentStatus } from "@/types";

const FLOW: ShipmentStatus[] = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED"];
const ACTIVE: ShipmentStatus[] = ["RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"];

export function TransitaireMonitoringPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-monitoring"],
    queryFn: () => fetchTransitaireShipments({ pageSize: 100 }),
    refetchInterval: 20000,
  });

  const q = search.trim().toLowerCase();
  const shipments = (data?.shipments ?? [])
    .filter((s) => ACTIVE.includes(s.status))
    .filter(
      (s) =>
        !q ||
        s.trackingNumber.toLowerCase().includes(q) ||
        (s.user?.name ?? "").toLowerCase().includes(q) ||
        s.destinationCity.toLowerCase().includes(q),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Suivi en direct
            <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Tableau de bord des expéditions en cours (actualisé toutes les 20 s).</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tracking, client, destination…"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Chargement du suivi en direct…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState
          title="Aucune expédition en cours"
          description={search ? "Modifiez votre recherche." : "Les colis en transit apparaîtront ici en temps réel."}
        />
      )}

      {!isLoading && !isError && shipments.length > 0 && (
        <div className="space-y-4">
          {shipments.map((s) => {
            const currentIndex = FLOW.indexOf(s.status);
            const lastStep = s.statusHistory?.[0];
            return (
              <Card key={s.id} className="overflow-hidden">
                <CardBody className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-brand-800 dark:text-brand-300">{s.trackingNumber}</span>
                      <StatusBadge value={s.status} />
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(s.estimatedPrice, s.currency)}</p>
                        <p className="text-xs text-slate-400">{s.totalWeight} kg</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                    <span>
                      {s.originCity} → {s.destinationCity}
                    </span>
                    <span className="text-slate-400">· {s.user?.name ?? "Client"}</span>
                    <span className="text-slate-400">· créé le {formatDate(s.createdAt)}</span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      {FLOW.map((step, i) => (
                        <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                          <div className="flex w-full items-center">
                            {i > 0 && <span className={`h-1 flex-1 rounded ${i <= currentIndex ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-800"}`} />}
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition ${
                                i < currentIndex
                                  ? "bg-indigo-600 text-white"
                                  : i === currentIndex
                                    ? "bg-indigo-500 text-white ring-4 ring-indigo-200 dark:ring-indigo-900"
                                    : "bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                              }`}
                            >
                              {i < currentIndex ? <BadgeCheck className="size-3.5" /> : i + 1}
                            </span>
                          </div>
                          <span className={`text-center text-[10px] font-semibold ${i === currentIndex ? "text-indigo-600 dark:text-indigo-300" : i < currentIndex ? "text-slate-600 dark:text-slate-300" : "text-slate-400"}`}>
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {lastStep && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <ActivityIcon className="size-3.5" />
                      Dernière mise à jour : {STATUS_LABELS[lastStep.status]}
                      {lastStep.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" /> {lastStep.location}
                        </span>
                      ) : null}
                      · {formatDate(lastStep.createdAt, true)}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}