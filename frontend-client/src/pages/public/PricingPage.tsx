import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, Plane } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { useLocale } from "@/contexts/locale";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { api } from "@/services/api";
import { formatCurrency, SERVICE_LABELS } from "@/utils";
import type { PricingService, ServiceType } from "@/types";

const SERVICES: ServiceType[] = ["STANDARD", "EXPRESS", "ECONOMY"];

export function PricingPage() {
  const { t } = useLocale();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["pricing-services"],
    queryFn: () => api<{ services: PricingService[] }>("/pricing/services"),
  });

  const services = data?.services ?? [];
  const routes = [...new Set(services.map((s) => {
    const a = [s.originCountry, s.destinationCountry].sort().join(" ↔ ");
    return a;
  }))];

  return (
    <>
      <PageHeader
        title={t("pages.pricing.title")}
        description={t("pages.pricing.subtitle")}
      >
        <Link to="/#tarifs" className="hidden sm:block">
          <ArrowRight className="size-5 rotate-180 text-slate-400" />
        </Link>
      </PageHeader>

      <section className="container-page py-14">
        {isLoading && <LoadingState label="Chargement des tarifs…" />}
        {isError && <ErrorState message={error instanceof Error ? error.message : "Impossible de charger les tarifs"} onRetry={() => void refetch()} />}

        {!isLoading && !isError && routes.map((route, routeIndex) => (
          <Reveal key={route} variant="fade" className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Plane className="size-5 animate-float text-blue-600 dark:text-blue-400" />
              {route}
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {SERVICES.map((type, i) => {
                const rule = services.find((s) => {
                  const sorted = [s.originCountry, s.destinationCountry].sort().join(" ↔ ");
                  return sorted === route && s.serviceType === type;
                });
                return (
                  <Reveal key={type} delay={(routeIndex * 3 + i) * 90} variant="up">
                    <Card className="card-lift border-t-4 border-t-blue-500">
                      <CardBody>
                        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          {SERVICE_LABELS[type]}
                        </p>
                        {rule ? (
                          <>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                              dès {formatCurrency(rule.basePrice, rule.currency)}
                            </p>
                            <ul className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
                              <li>Prix de base : {formatCurrency(rule.basePrice, rule.currency)}</li>
                              <li>Par kg : {formatCurrency(rule.pricePerKg, rule.currency)}</li>
                              <li>Montant minimum : {formatCurrency(rule.minimumPrice, rule.currency)}</li>
                            </ul>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-slate-400">Tarif non disponible pour cette route.</p>
                        )}
                      </CardBody>
                    </Card>
                  </Reveal>
                );
              })}
            </div>
          </Reveal>
        ))}

        <Reveal variant="zoom" className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-900 dark:bg-blue-950/40">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t("pages.pricing.ctaTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">{t("pages.pricing.ctaText")}</p>
          <Link to="/#tarifs" className="mt-4 inline-block">
            <span className="btn-shine inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
              {t("pages.pricing.ctaButton")} <ArrowRight className="size-4" />
            </span>
          </Link>
        </Reveal>
      </section>
    </>
  );
}