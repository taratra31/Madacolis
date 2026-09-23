import { useQuery } from "@tanstack/react-query";
import { Landmark, TrendingUp, TriangleAlert, Wallet } from "lucide-react";
import { fetchTransitairePayments } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils";

const ar = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;
const inAr = (amount: number, currency: string) => (currency === "EUR" ? amount * 5000 : amount);

export function TransitaireTresoreriePage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-tresorerie"],
    queryFn: () => fetchTransitairePayments({ pageSize: 100 }),
  });

  if (isLoading) return <LoadingState label="Chargement de la trésorerie…" />;
  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />;
  }

  const summary = data?.summary;
  const payments = data?.payments ?? [];
  const recovery = summary?.totalAr ? ((summary.paidAr ?? 0) / summary.totalAr) * 100 : 0;

  const byStatus = {
    PAID: payments.filter((p) => p.status === "PAID").reduce((s, p) => s + inAr(Number(p.amount), p.currency), 0),
    PENDING: payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + inAr(Number(p.amount), p.currency), 0),
    FAILED: payments.filter((p) => p.status === "FAILED" || p.status === "REFUNDED").reduce((s, p) => s + inAr(Number(p.amount), p.currency), 0),
  };

  const recent = payments.slice(0, 12);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <Landmark className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Trésorerie
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Vue d'ensemble de vos encaissements.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Wallet className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Encaissé</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{ar(byStatus.PAID)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <TriangleAlert className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">En attente</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{ar(byStatus.PENDING)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-4 p-5">
            <span className="flex size-11 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <TrendingUp className="size-5" />
            </span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Impayés / annulés</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{ar(byStatus.FAILED)}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Taux de recouvrement</h2>
        </CardHeader>
        <CardBody>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all"
              style={{ width: `${Math.min(100, recovery)}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {recovery.toFixed(0)} % du chiffre d'affaires ({ar(summary?.paidAr ?? 0)} / {ar(summary?.totalAr ?? 0)}) est encaissé.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Derniers mouvements</h2>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          {recent.length === 0 && <div className="p-6"><EmptyState title="Aucun mouvement" /></div>}
          {recent.length > 0 && (
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Colis</th>
                  <th className="px-5 py-3 font-semibold">Référence</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recent.map((p) => (
                  <tr key={p.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-brand-700 dark:text-brand-300">{p.trackingNumber}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{p.paymentReference}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">{ar(inAr(Number(p.amount), p.currency))}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                          p.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800"
                            : p.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800"
                              : "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-800"
                        }`}
                      >
                        {p.status === "PAID" ? "Payé" : p.status === "PENDING" ? "En attente" : p.status === "REFUNDED" ? "Remboursé" : "Échoué"}
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
    </div>
  );
}