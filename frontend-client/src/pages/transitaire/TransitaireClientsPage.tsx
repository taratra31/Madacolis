import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, MapPin, Phone, Search } from "lucide-react";
import { fetchTransitaireClients } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils";

const ar = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

export function TransitaireClientsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-clients", search, page],
    queryFn: () => fetchTransitaireClients({ q: search, page, pageSize: limit }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / limit)) : 1;
  const clients = data?.clients ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Répertoire clients</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Les clients dont les colis transitent par votre transporteur.</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          {data?.pagination.total ?? 0} clients
        </span>
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
              placeholder="Rechercher par nom, e-mail ou téléphone…"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
        </CardBody>
      </Card>

      {isLoading && <LoadingState label="Chargement des clients…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && clients.length === 0 && (
        <EmptyState title="Aucun client" description={search ? "Modifiez votre recherche." : "Les clients apparaîtront dès le premier colis assigné."} />
      )}

      {!isLoading && !isError && clients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {clients.map((c) => (
            <Card key={c.id} className="transition hover:shadow-md">
              <CardBody className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-700 text-lg font-bold text-white">
                      {c.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="size-3" />
                        {c.city ?? c.country ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-teal-700 dark:text-teal-300">{ar(c.revenueAr)}</p>
                    <p className="text-xs text-slate-400">CA total</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{c.shipments}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Colis</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{c.delivered}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Livrés</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{formatDate(c.lastTrip, true)}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Dernier colis</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3" /> {c.phone ?? "—"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Mail className="size-3" /> {c.email ?? "—"}
                  </span>
                  {c.memberSince && <span className="ml-auto">Client depuis {formatDate(c.memberSince)}</span>}
                </div>
              </CardBody>
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