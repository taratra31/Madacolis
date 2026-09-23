import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArchiveX,
  CalendarClock,
  CreditCard,
  FileText,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  Route as RouteIcon,
  User as UserIcon,
} from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { api, ApiError } from "@/services/api";
import { useAuth } from "@/contexts/auth";
import {
  DOCUMENT_LABELS,
  formatCurrency,
  formatDate,
  PAYMENT_STATUS_LABELS,
  PROVIDER_LABELS,
  SERVICE_LABELS,
} from "@/utils";
import type { Payment, PaymentProvider, Shipment } from "@/types";

const PAYMENT_PROVIDERS: PaymentProvider[] = ["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY", "CARD", "CASH"];

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>("MVOLA");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => api<{ shipment: Shipment }>(`/shipments/${id}`),
    enabled: Boolean(id),
  });

  const shipment = data?.shipment;
  const isPending = shipment?.status === "PENDING";
  const isPayable = shipment && shipment.status !== "CANCELLED" && !shipment.payments.some((p) => p.status === "PAID");

  const stripeLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK as string | undefined;
  const stripePaymentUrl = useMemo(() => {
    if (!stripeLink || !shipment) return "";
    try {
      const url = new URL(stripeLink);
      if (user?.email) url.searchParams.set("prefilled_email", user.email);
      url.searchParams.set("client_reference_id", shipment.trackingNumber);
      return url.toString();
    } catch {
      return "";
    }
  }, [stripeLink, shipment, user?.email]);

  const cancel = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError("");
    try {
      await api(`/shipments/${id}/cancel`, { method: "POST", body: { reason: cancelReason.trim() || undefined } });
      setCancelOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-shipments"] });
      await refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Impossible d'annuler le colis");
    } finally {
      setActionLoading(false);
    }
  };

  const pay = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError("");
    setCreatedPayment(null);
    try {
      const method = provider === "CARD" ? "CARD" : provider === "CASH" ? "CASH" : "MOBILE_MONEY";
      const response = await api<{ payment: Payment }>("/payments", { method: "POST", body: { shipmentId: id, provider, method } });
      setCreatedPayment(response.payment);
      setPayOpen(false);
      queryClient.invalidateQueries({ queryKey: ["shipment", id] });
      await refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Impossible d'initier le paiement");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) return <LoadingState label="Chargement du colis…" />;
  if (isError || !shipment) return <ErrorState message={error instanceof Error ? error.message : "Colis introuvable"} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link to="/dashboard/shipments" className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          ← Retour à mes colis
        </Link>
        <div className="flex flex-wrap gap-3">
          {isPayable && (
            <Button onClick={() => setPayOpen(true)}>
              <CreditCard className="size-4" /> Payer
            </Button>
          )}
          {isPending && (
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <ArchiveX className="size-4" /> Annuler l'envoi
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-brand-950 to-brand-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-300">Numéro de suivi</p>
            <p className="font-mono text-2xl font-bold">{shipment.trackingNumber}</p>
            {shipment.qrDataUrl ? (
              <a href={shipment.qrDataUrl} download={`mada-colis-${shipment.trackingNumber}.png`} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-300 hover:text-blue-200">
                <img src={shipment.qrDataUrl} alt={`QR ${shipment.trackingNumber}`} className="size-16 rounded-lg bg-white p-1" />
                Télécharger le QR du colis
              </a>
            ) : (
              <span className="mt-3 inline-block text-xs text-brand-300">QR non disponible</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-brand-200">{SERVICE_LABELS[shipment.serviceType]}</span>
            <StatusBadge value={shipment.status} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-brand-100">
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <MapPin className="size-4 text-blue-300" />
            {shipment.originCity}, {shipment.originCountry}
          </span>
          <span className="text-brand-400">——{shipment.totalWeight} kg——</span>
          <span className="flex items-center gap-1.5 font-semibold text-white">
            <MapPin className="size-4 text-blue-300" />
            {shipment.destinationCity}, {shipment.destinationCountry}
          </span>
        </div>
      </div>

      {actionError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:bg-red-950/40 dark:text-red-400">{actionError}</p>}

      {createdPayment && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900 dark:bg-blue-950/40">
          <p className="font-semibold text-blue-700 dark:text-blue-300">Paiement initié — référence : {createdPayment.paymentReference}</p>
          <p className="mt-1 text-blue-700/80 dark:text-blue-300/80">
            Montant {formatCurrency(createdPayment.amount, createdPayment.currency)} via {PROVIDER_LABELS[createdPayment.provider]}. Envoyez cette référence à notre équipe WhatsApp pour valider votre paiement.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <RouteIcon className="size-4 text-blue-600 dark:text-blue-400" /> Détails de l'envoi
              </h2>
            </CardHeader>
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Expéditeur">
                <p className="flex items-center gap-2"><UserIcon className="size-4 text-slate-400" />{shipment.senderName ?? "—"}</p>
                <p className="flex items-center gap-2 text-slate-500"><Phone className="size-4 text-slate-400" />{shipment.senderPhone ?? "—"}</p>
                {shipment.senderAddress && <p className="text-slate-500">{shipment.senderAddress}</p>}
              </InfoBlock>
              <InfoBlock label="Destinataire">
                <p className="flex items-center gap-2"><UserIcon className="size-4 text-slate-400" />{shipment.recipientName ?? "—"}</p>
                <p className="flex items-center gap-2 text-slate-500"><Phone className="size-4 text-slate-400" />{shipment.recipientPhone ?? "—"}</p>
                {shipment.recipientAddress && <p className="text-slate-500">{shipment.recipientAddress}</p>}
              </InfoBlock>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase text-slate-400">Articles</p>
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {shipment.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                        <Package className="size-4 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {item.quantity} × {item.description}
                          {item.isFragile && <span className="ml-1 text-xs text-amber-600">(fragile)</span>}
                        </span>
                      </span>
                      <span className="shrink-0 text-slate-500">{item.weight} kg</span>
                    </li>
                  ))}
                </ul>
                {shipment.notes && <p className="mt-2 text-xs italic text-slate-500">Notes : {shipment.notes}</p>}
                {shipment.requiredDocuments.length > 0 && (
                  <p className="mt-2 text-xs text-slate-500">
                    Documents demandés : {shipment.requiredDocuments.map((d) => DOCUMENT_LABELS[d]).join(", ")}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <CalendarClock className="size-4 text-blue-600 dark:text-blue-400" /> Historique
              </h2>
            </CardHeader>
            <CardBody>
              <TrackingTimeline events={shipment.timeline} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Montant</h2>
            </CardHeader>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>Prix estimé</span><span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(shipment.estimatedPrice, shipment.currency)}</span></div>
              {shipment.finalPrice !== null && (
                <div className="flex justify-between text-slate-500"><span>Prix final</span><span className="font-semibold text-blue-600">{formatCurrency(shipment.finalPrice, shipment.currency)}</span></div>
              )}
              <div className="flex justify-between text-slate-500"><span>Livraison estimée</span><span className="font-medium text-slate-800 dark:text-slate-100">{formatDate(shipment.estimatedDeliveryDate)}</span></div>
              {shipment.actualDeliveryDate && (
                <div className="flex justify-between text-slate-500"><span>Livré le</span><span className="font-medium text-blue-600">{formatDate(shipment.actualDeliveryDate)}</span></div>
              )}
              <div className="flex justify-between text-slate-500"><span>Créé le</span><span className="font-medium text-slate-800 dark:text-slate-100">{formatDate(shipment.createdAt)}</span></div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <CreditCard className="size-4 text-blue-600 dark:text-blue-400" /> Paiements
              </h2>
            </CardHeader>
            <CardBody>
              {shipment.payments.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun paiement enregistré. {isPayable ? "Vous pouvez payer dès maintenant." : ""}</p>
              ) : (
                <ul className="space-y-3">
                  {shipment.payments.map((payment) => (
                    <li key={payment.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                          <PackageCheck className="size-4 text-blue-500" />
                          {PROVIDER_LABELS[payment.provider]}
                        </span>
                        <span className="text-slate-500">{PAYMENT_STATUS_LABELS[payment.status]}</span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-slate-400">{payment.paymentReference}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatCurrency(payment.amount, payment.currency)} · {formatDate(payment.createdAt, true)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {shipment.documents.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <FileText className="size-4 text-blue-600 dark:text-blue-400" /> Documents
                </h2>
              </CardHeader>
              <CardBody>
                <ul className="space-y-2 text-sm">
                  {shipment.documents.map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-2"><FileText className="size-4 text-slate-400" />{DOCUMENT_LABELS[doc.type]}</span>
                      <span className="text-xs font-medium text-slate-400">{doc.status}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* Annulation */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Annuler l'envoi" footer={
        <>
          <Button variant="outline" onClick={() => setCancelOpen(false)}>Garder l'envoi</Button>
          <Button variant="danger" onClick={cancel} loading={actionLoading}>Confirmer l'annulation</Button>
        </>
      }>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Une fois annulé, ce colis ne pourra plus être expédié. Cette action est définitive.
        </p>
        <div className="mt-4">
          <Textarea label="Motif (optionnel)" rows={3} placeholder="Pourquoi annuler ?" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
        </div>
      </Modal>

      {/* Paiement */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Payer cet envoi" footer={
        <>
          <Button variant="outline" onClick={() => setPayOpen(false)}>Plus tard</Button>
          <Button onClick={pay} loading={actionLoading}>
            <CreditCard className="size-4" /> Générer la référence
          </Button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
            <p className="text-slate-500">Montant à payer</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(shipment.finalPrice ?? shipment.estimatedPrice, shipment.currency)}
            </p>
          </div>
          <Select
            label="Moyen de paiement (MVola, Orange, espèces…)"
            options={PAYMENT_PROVIDERS.map((p) => ({ value: p, label: PROVIDER_LABELS[p] }))}
            value={provider}
            onChange={(e) => setProvider(e.target.value as PaymentProvider)}
          />
          <p className="text-xs text-slate-400">
            Un numéro de référence vous sera attribué. Envoyez-le à notre équipe sur WhatsApp avec le montant pour confirmer le paiement.
          </p>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">ou carte bancaire</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>

          {stripePaymentUrl ? (
            <a href={stripePaymentUrl} target="_blank" rel="noreferrer">
              <Button variant="primary" fullWidth size="lg">
                <CreditCard className="size-4" /> Payer avec Stripe
              </Button>
            </a>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400 dark:border-slate-700">
              Paiement par carte (Stripe PayLink) à configurer — renseignez <code>VITE_STRIPE_PAYMENT_LINK</code> puis redémarrez le portail.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 text-sm">
      <p className="text-xs font-medium uppercase text-slate-400">{label}</p>
      <div className="text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}