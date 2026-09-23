import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Clock, CreditCard, DollarSign, ShieldAlert } from "lucide-react";
import { fetchTransitairePayments } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, PAYMENT_STATUS_LABELS, PROVIDER_LABELS } from "@/utils";
import type { PaymentStatus } from "@/types";

const ar = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  FAILED: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
  REFUNDED: "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
};

export function TransitairePaymentsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-payments", page],
    queryFn: () => fetchTransitairePayments({ page, pageSize: limit }),
  });

  const summary = data?.summary;
  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / limit)) : 1;
  const payments = data?.payments ?? [];

  const summaryCards = [
    { label: "Montants totaux", value: ar(summary?.totalAr ?? 0), sub: `${summary?.totalCount ?? 0} paiements`, icon: DollarSign, chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" },
    { label: "Encaissés", value: ar(summary?.paidAr ?? 0), sub: `${summary?.paidCount ?? 0} payés`, icon: BadgeCheck, chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "En attente", value: ar(summary?.pendingAr ?? 0), sub: `${summary?.pendingCount ?? 0} en attente`, icon: Clock, chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Échoués / remboursés", value: `${(summary?.failedCount ?? 0) + (summary?.refundedCount ?? 0)}`, sub: `${summary?.failedCount ?? 0} échoués · ${summary?.refundedCount ?? 0} remboursés`, icon: ShieldAlert, chip: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Facturation</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Les paiements des colis assignés à votre transporteur.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardBody className="flex items-center gap-4 p-5">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${s.chip}`}>
                <s.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className="text-[11px] text-slate-400">{s.sub}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Paiements</h2>
          <span className="text-xs font-medium text-slate-400">{payments.length} sur {data?.pagination.total ?? 0}</span>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          {isLoading && <div className="p-6"><LoadingState label="Chargement des paiements…" /></div>}
          {isError && <div className="p-6"><ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} /></div>}
          {!isLoading && !isError && payments.length === 0 && (
            <div className="p-6">
              <EmptyState title="Aucun paiement" description="Les paiements des colis de votre transporteur apparaîtront ici." />
            </div>
          )}
          {!isLoading && !isError && payments.length > 0 && (
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Référence</th>
                  <th className="px-5 py-3 font-semibold">Colis</th>
                  <th className="px-5 py-3 font-semibold">Moyen</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4">
                      <CreditCard className="mr-2 inline size-4 text-slate-400" />
                      <span className="font-medium text-slate-900 dark:text-white">{p.paymentReference}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-brand-700 dark:text-brand-300">{p.trackingNumber}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{PROVIDER_LABELS[p.provider] ?? p.provider}</td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(p.amount, p.currency)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${PAYMENT_STYLES[p.status]}`}>
                        {PAYMENT_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(p.paidAt ?? p.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

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