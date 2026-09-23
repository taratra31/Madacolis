import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, Briefcase, PiggyBank, Wallet } from "lucide-react";
import { fetchTransitairePayments } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils";

const RATE = 0.2;

const ar = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;
const eur = (v: number) => `${(v / 5000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;

export function TransitaireCommissionsPage() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-commissions", page],
    queryFn: () => fetchTransitairePayments({ page, pageSize: limit }),
  });

  const paid = (data?.payments ?? []).filter((p) => p.status === "PAID");
  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / limit)) : 1;

  const summary = data?.summary;
  const commissionTotal = paid.reduce((s, p) => s + (sumInAr(p) * RATE), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <BadgePercent className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Commissions
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Votre part de 20 % sur chaque paiement encaissé.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Encaissé (paiements)</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{ar(summary?.paidAr ?? 0)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <PiggyBank className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Vos commissions (20 %)</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{ar(summary ? summary.paidAr * RATE : 0)}</p>
              <p className="text-xs text-slate-400">{eur(summary ? summary.paidAr * RATE : 0)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Briefcase className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Paiements payés</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{summary?.paidCount ?? 0} / {summary?.totalCount ?? 0}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {isLoading && <LoadingState label="Chargement des commissions…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && paid.length === 0 && (
        <EmptyState title="Aucun paiement payé" description="Les paiements encaissés généreront des commissions." />
      )}

      {!isLoading && !isError && paid.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Détail par paiement</h2>
          </CardHeader>
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Colis</th>
                  <th className="px-5 py-3 font-semibold">Réf. paiement</th>
                  <th className="px-5 py-3 font-semibold">Montant payé</th>
                  <th className="px-5 py-3 font-semibold">Commission (20 %)</th>
                  <th className="px-5 py-3 font-semibold">Paié le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paid.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-mono font-semibold text-brand-700 dark:text-brand-300">{p.trackingNumber}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{p.paymentReference}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{ar(sumInAr(p))}</td>
                    <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">{ar(sumInAr(p) * RATE)}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(p.paidAt ?? p.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <p className="text-center text-xs text-slate-400">Commission totale calculée : {ar(commissionTotal)}</p>

      {!isLoading && !isError && totalPages > 1 && (
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

function sumInAr(p: { amount: number; currency: string }) {
  return p.currency === "EUR" ? Number(p.amount) * 5000 : Number(p.amount);
}