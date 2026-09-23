import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ChevronDown, Download, FileEdit, Search, Truck } from "lucide-react";
import { downloadTransitaireCsv, fetchTransitaireShipments, updateTransitaireShipmentStatus } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, SERVICE_LABELS, STATUS_LABELS, STATUS_ORDER } from "@/utils";
import type { ShipmentStatus } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
];

const NEW_STATUS_OPTIONS = STATUS_ORDER.filter((s) => s !== "CANCELLED").map((s) => ({ value: s, label: STATUS_LABELS[s] }));

export function TransitaireShipmentsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const limit = 8;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-shipments", status, search, page],
    queryFn: () => fetchTransitaireShipments({ status: status as ShipmentStatus | "", q: search, page, pageSize: limit }),
  });

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateTransitaireShipmentStatus>[1] }) => updateTransitaireShipmentStatus(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transitaire-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["transitaire-stats"] });
      setExpanded(null);
    },
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / limit)) : 1;
  const shipments = data?.shipments ?? [];

  const onExport = async () => {
    setExporting(true);
    try {
      const blob = await downloadTransitaireCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `madacolis-colis-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Colis</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Les expéditions assignées à votre transporteur.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="md" onClick={() => void onExport()} loading={exporting}>
            <Download className="size-4" /> CSV
          </Button>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {data?.pagination.total ?? 0} colis
          </span>
        </div>
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
              placeholder="Rechercher par tracking…"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
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

      {isLoading && <LoadingState label="Chargement des colis…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && shipments.length === 0 && (
        <EmptyState
          title="Aucun colis"
          description={search || status ? "Modifiez vos filtres pour élargir la recherche." : "Aucune expédition assignée pour le moment."}
        />
      )}

      {!isLoading && !isError && shipments.length > 0 && (
        <div className="space-y-3">
          {shipments.map((s) => (
            <Card key={s.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-brand-800 dark:text-brand-300">{s.trackingNumber}</span>
                    <StatusBadge value={s.status} />
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <span>
                      {s.originCity}, {s.originCountry}
                    </span>
                    <ArrowRight className="size-3.5 text-slate-400" />
                    <span>
                      {s.destinationCity}, {s.destinationCountry}
                    </span>
                    <span className="text-slate-400">
                      · {s.user?.name ?? "Client MadaColis"}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(s.createdAt)} · {SERVICE_LABELS[s.serviceType]} · {s.totalWeight} kg
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(s.estimatedPrice, s.currency)}</p>
                    <p className="text-xs text-slate-400">Estimation</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <FileEdit className="size-4" /> Statut
                  </Button>
                </div>
              </div>

              {expanded === s.id && (
                <UpdateForm
                  key={s.id}
                  currentStatus={s.status}
                  pending={mutation.isPending}
                  error={mutation.isError ? (mutation.error instanceof Error ? mutation.error.message : "Erreur") : null}
                  onSubmit={(body) => mutation.mutate({ id: s.id, body })}
                />
              )}
            </Card>
          ))}
        </div>
      )}

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

function UpdateForm({
  currentStatus,
  pending,
  error,
  onSubmit,
}: {
  currentStatus?: string;
  pending: boolean;
  error: string | null;
  onSubmit: (body: { status: ShipmentStatus; comment?: string; location?: string }) => void;
}) {
  const [nextStatus, setNextStatus] = useState<string>((currentStatus ?? "RECEIVED") as string);
  const [comment, setComment] = useState("");
  const [location, setLocation] = useState("");

  const submit = () => {
    if (!nextStatus) return;
    onSubmit({
      status: nextStatus as ShipmentStatus,
      comment: comment.trim() || undefined,
      location: location.trim() || undefined,
    });
  };

  return (
    <div className="border-t border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3 sm:flex-1">
          <div className="w-full sm:w-44">
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Nouveau statut</label>
            <Select aria-label="Nouveau statut" options={NEW_STATUS_OPTIONS} value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Ville / lieu</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex : Ivato, Paris…"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div className="min-w-56 flex-1">
            <label className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">Commentaire</label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Détails de la mise à jour…"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </div>
        <Button size="sm" onClick={() => submit()} loading={pending}>
          <Truck className="size-4" /> Appliquer
        </Button>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
        <ChevronDown className="size-3.5" /> La mise à jour sera visible par le client sur le suivi.
      </p>
    </div>
  );
}