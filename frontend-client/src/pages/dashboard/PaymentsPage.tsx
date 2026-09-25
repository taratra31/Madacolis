import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MessageCircle, PartyPopper } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate, PAYMENT_STATUS_LABELS, PROVIDER_LABELS, whatsappLink } from "@/utils";
import type { Payment } from "@/types";

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  PAID: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  FAILED: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
  REFUNDED: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
};

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => api<{ payments: Payment[] }>("/payments"),
  });

  const demoPay = useMutation({
    mutationFn: (paymentId: string) => api<{ payment: Payment }>(`/payments/${paymentId}/demo-confirm`, { method: "POST" }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["my-payments"] }),
  });

  const payments = data?.payments ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes paiements</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Historique de vos règlements et références de paiement.</p>
        </div>
        <Link to="/dashboard/shipments">
          <Button variant="outline">Voir mes colis</Button>
        </Link>
      </div>

      {isLoading && <LoadingState label="Chargement des paiements…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && payments.length === 0 && (
        <EmptyState title="Aucun paiement" description="Vos paiements apparaîtront ici dès le premier règlement d'un colis." />
      )}

      {!isLoading && !isError && payments.length > 0 && (
        <Card>
          <CardBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {payments.map((payment) => (
              <div key={payment.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-brand-800 dark:text-brand-300">{payment.paymentReference}</span>
                    <Badge className={PAYMENT_STATUS_STYLES[payment.status]}>{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {payment.shipment ? (
                      <Link to={`/dashboard/shipments/${payment.shipmentId}`} className="hover:text-blue-600">
                        {payment.shipment.trackingNumber}
                      </Link>
                    ) : (
                      "Colis"
                    )}{" "}
                    · {PROVIDER_LABELS[payment.provider]} · {formatDate(payment.createdAt, true)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(payment.amount, payment.currency)}</p>
                  {payment.status === "PENDING" && (
                    <div className="mt-1 flex flex-col items-end gap-1.5">
                      <a
                        href={whatsappLink(`Bonjour MadaColis, je souhaite régler ma référence de paiement ${payment.paymentReference}.`)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        <MessageCircle className="size-3.5" /> Régler via WhatsApp
                      </a>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => demoPay.mutate(payment.id)}
                        disabled={demoPay.isPending}
                        className="inline-flex items-center gap-1.5"
                      >
                        <PartyPopper className="size-3.5" />
                        {demoPay.isPending ? "Confirmation…" : "Payer (démo)"}
                      </Button>
                      <p className="max-w-[14rem] text-right text-[11px] text-slate-400">
                        Sans argent réel — simulation pour tester le circuit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}