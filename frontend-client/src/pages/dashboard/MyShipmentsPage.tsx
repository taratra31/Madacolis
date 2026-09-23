import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PackagePlus, Search } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShipmentCard } from "@/components/tracking/ShipmentCard";
import { Button } from "@/components/ui/Button";
import { STATUS_LABELS } from "@/utils";
import type { ShipmentsResponse } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export function MyShipmentsPage() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-shipments", status, search, page],
    queryFn: () =>
      api<ShipmentsResponse>("/shipments", {
        params: { status: status || undefined, search: search || undefined, page, limit },
      }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes colis</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Retrouvez tous vos envois et leur statut.</p>
        </div>
        <Link to="/dashboard/shipments/create">
          <Button variant="primary">
            <PackagePlus className="size-4" /> Nouvel envoi
          </Button>
        </Link>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher par numéro de tracking…"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="w-full sm:w-52">
            <Select
              aria-label="Filtrer par statut"
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </CardBody>
      </Card>

      <div className="space-y-3">
        {isLoading && <LoadingState label="Chargement de vos colis…" />}
        {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}
        {!isLoading && !isError && data && data.shipments.length === 0 && (
          <EmptyState
            title="Aucun colis trouvé"
            description={search || status ? "Modifiez vos filtres pour élargir la recherche." : "Créez votre premier envoi."}
            action={
              !search && !status ? (
                <Link to="/dashboard/shipments/create">
                  <Button size="sm">
                    <PackagePlus className="size-4" /> Créer un envoi
                  </Button>
                </Link>
              ) : undefined
            }
          />
        )}
        {!isLoading && !isError && data?.shipments.map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} />)}
      </div>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}