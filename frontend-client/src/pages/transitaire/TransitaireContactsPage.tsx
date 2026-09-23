import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookUser, Mail, MapPin, Phone, Search } from "lucide-react";
import { fetchTransitaireClients } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/utils";

export function TransitaireContactsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-contacts", search],
    queryFn: () => fetchTransitaireClients({ q: search, pageSize: 100 }),
  });

  const clients = data?.clients ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            <BookUser className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
            Contacts
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Carnet d'adresses de vos clients.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, ville…"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
      </div>

      {isLoading && <LoadingState label="Chargement des contacts…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && clients.length === 0 && (
        <EmptyState title="Aucun contact" description="Les clients de votre agence apparaîtront ici." />
      )}

      {!isLoading && !isError && clients.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <Card key={c.id}>
              <CardBody className="p-5">
                <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {c.email && (
                    <p className="flex items-center gap-2 truncate">
                      <Mail className="size-4 shrink-0 text-slate-400" /> {c.email}
                    </p>
                  )}
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-slate-400" /> {c.phone ?? "—"}
                  </p>
                  {c.city && (
                    <p className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-slate-400" /> {c.city}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">
                    {c.shipments} colis · {c.delivered} livrés
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(c.revenueAr, "MGA")}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}