import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, LocateFixed, MapPin, PackageSearch, QrCode, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { StatusBadge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { TrackingTimeline } from "@/components/tracking/TrackingTimeline";
import { useLocale } from "@/contexts/locale";
import { api } from "@/services/api";
import { formatCurrency, formatDate, SERVICE_LABELS, STATUS_LABELS } from "@/utils";
import type { PublicTracking } from "@/types";

export function TrackingPage() {
  const { t } = useLocale();
  const [params] = useSearchParams();
  const code = (params.get("code") ?? "").trim();
  const [query, setQuery] = useState(code);
  const [submitted, setSubmitted] = useState(code);

  useEffect(() => {
    if (code) {
      setQuery(code);
      setSubmitted(code);
    }
  }, [code]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tracking", submitted],
    queryFn: () => api<{ tracking: PublicTracking }>(`/tracking/${encodeURIComponent(submitted)}`),
    enabled: submitted.length > 0,
    retry: false,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) setSubmitted(query.trim());
  };

  return (
    <>
      <PageHeader
        title={t("pages.tracking.title")}
        description={t("pages.tracking.subtitle")}
      />

      <section className="container-page py-14">
        <Reveal variant="fade">
          <form onSubmit={submit} className="mx-auto flex max-w-xl items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("pages.tracking.placeholder")}
                aria-label="Numéro de tracking"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <Button type="submit" size="lg" className="btn-shine">
              {t("pages.tracking.submit")}
            </Button>
          </form>
        </Reveal>

        <div className="mx-auto mt-10 max-w-2xl">
          {!submitted && (
            <Reveal variant="zoom" delay={100} className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400 dark:border-slate-700">
              <PackageSearch className="mx-auto mb-3 size-8 animate-float text-slate-300 dark:text-slate-600" />
              Saisissez un numéro pour afficher le détail de votre colis.
            </Reveal>
          )}

          {submitted && isLoading && <LoadingState label="Recherche du colis…" />}

          {submitted && isError && !isLoading && (
            <ErrorState
              title={error instanceof Error ? error.message : "Colis introuvable"}
              message="Vérifiez le numéro de tracking saisi, ou contactez-nous sur WhatsApp pour de l'aide."
              onRetry={() => void refetch()}
            />
          )}

          {submitted && data?.tracking && <TrackingResult tracking={data.tracking} />}
        </div>
      </section>
    </>
  );
}

function TrackingResult({ tracking }: { tracking: PublicTracking }) {
  const statusIndex = STATUS_LABELS[tracking.status as keyof typeof STATUS_LABELS];

  return (
    <Card className="animate-fade-in overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-blue-100">
              <CheckCircle2 className="size-4" /> Statut
            </p>
            <p className="mt-1 text-xl font-bold">{statusIndex}</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-lg font-bold">{tracking.trackingNumber}</p>
            <p className="text-xs text-blue-100">{SERVICE_LABELS[tracking.serviceType]}</p>
          </div>
        </div>
      </div>

      {tracking.qrDataUrl && (
        <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <img
            src={tracking.qrDataUrl}
            alt={`Code QR du colis ${tracking.trackingNumber}`}
            className="size-24 shrink-0 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
              <QrCode className="size-4 text-blue-600" /> Code QR du colis
            </p>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Scannez-le pour ouvrir cette page de suivi, ou collez-le sur votre étiquette de colis (à imprimer pour l'agence).
            </p>
          </div>
          <Link to={`/suivi?code=${encodeURIComponent(tracking.trackingNumber)}`} className="text-sm font-semibold text-blue-600 hover:underline">
            Ouvrir le suivi
          </Link>
        </div>
      )}

      <CardBody className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-start gap-3 text-sm">
            <LocateFixed className="mt-0.5 size-4 text-brand-700 dark:text-brand-300" />
            <div>
              <p className="text-xs uppercase text-slate-400">Départ</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {tracking.originCity}, {tracking.originCountry}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="mt-0.5 size-4 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs uppercase text-slate-400">Destination</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {tracking.destinationCity}, {tracking.destinationCountry}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <CalendarClock className="mt-0.5 size-4 text-slate-400" />
            <div>
              <p className="text-xs uppercase text-slate-400">Livraison estimée</p>
              <p className="font-medium text-slate-800 dark:text-slate-100">
                {tracking.actualDeliveryDate
                  ? `Livré le ${formatDate(tracking.actualDeliveryDate)}`
                  : tracking.estimatedDeliveryDate
                    ? formatDate(tracking.estimatedDeliveryDate)
                    : "À confirmer"}
              </p>
            </div>
          </div>
          <StatusBadge value={tracking.status} />
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <PackageSearch className="size-4 text-blue-600 dark:text-blue-400" />
            Historique du colis
          </h2>
          <TrackingTimeline events={tracking.statusHistory} />
        </div>
      </CardBody>

      <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        Prix estimé : <span className="font-semibold">{formatCurrency(tracking.estimatedPrice, tracking.currency)}</span> · Créé le {formatDate(tracking.createdAt)}
      </div>
    </Card>
  );
}