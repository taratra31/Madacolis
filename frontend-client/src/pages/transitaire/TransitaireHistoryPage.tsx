import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Archive, Search } from "lucide-react";
import { fetchTransitaireShipments } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/utils";

export function TransitaireHistoryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-history", search],
    queryFn: () => fetchTransitaireShipments({ pageSize: 100, q: search }),
  });

  const archived = (data?.shipments ?? []).filter((s) => s.status === "DELIVERED" || s.status === "CANCELLED");
  const totalPages = Math.max(1, Math.ceil(archived.length / limit));
  const pageSafe = Math.min(page, totalPages);
  const shipments = archived.slice((pageSafe - 1) * limit, pageSafe * limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            <Archive className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
            Historique
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Colis livrés et annulés.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Numéro de tracking…"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Chargement de l'historique…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState title="Aucun colis archivé" description="Les colis livrés ou annulés apparaîtront ici." />
      )}

      {!isLoading && !isError && shipments.length > 0 && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">{archived.length} résultat(s)</span>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Tracking</th>
                  <th className="px-5 py-3 font-semibold">Trajet</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Créé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {shipments.map((s) => (
                  <tr key={s.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-mono font-semibold text-brand-700 dark:text-brand-300">{s.trackingNumber}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {s.originCity} → {s.destinationCity}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{s.user?.name ?? "—"}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(s.estimatedPrice, s.currency)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={s.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(s.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={pageSafe <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-slate-500">
            Page {pageSafe} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}