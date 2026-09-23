import { useQuery } from "@tanstack/react-query";
import { Globe2, Plane, Ship } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { fetchTransitaireRates } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatAr } from "@/utils";

export function TransitaireRatesPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-rates"],
    queryFn: () => fetchTransitaireRates(),
  });

  const rates = data?.rates;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes tarifs</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {rates ? `${rates.carrier.name} — tarifs publiés sur la plateforme MadaColis.` : "Tarifs publiés sur la plateforme MadaColis."}
        </p>
      </div>

      {isLoading && <LoadingState label="Chargement des tarifs…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {rates && (
        <>
          <Card>
            <CardBody className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Plane className="size-5" />
                  <p className="text-sm font-bold">Fret aérien</p>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatAr(rates.carrier.airPerKgAr)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">par kg facturable · {rates.carrier.airDays} jours</p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 dark:border-sky-900/50 dark:bg-sky-950/30">
                <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300">
                  <Ship className="size-5" />
                  <p className="text-sm font-bold">Fret maritime</p>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{formatAr(rates.carrier.seaPerM3Ar)}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">par m³ facturé · {rates.carrier.seaDays} jours</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <Globe2 className="size-5" />
                  <p className="text-sm font-bold">Commission MadaColis</p>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{rates.commissionRateLabel}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">prélevée sur le sous-total transport</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="divide-y divide-slate-100 dark:divide-slate-800">
              <Row label="Frais de dossier / manutention" value={formatAr(rates.carrier.baseHandlingAr ?? 0)} />
              <Row label="Délai avion" value={`${rates.carrier.airDays} jours`} />
              <Row label="Délai bateau" value={`${rates.carrier.seaDays} jours`} />
              <Row label="Taux de change affiché" value={`1 € ≈ ${rates.eurToMga.toLocaleString("fr-FR")} Ar`} />
              <Row label="Compte" value={user?.name ?? "—"} />
            </CardBody>
          </Card>

          <p className="text-center text-xs text-slate-400">
            Les tarifs sont configurés par MadaColis et appliqués lors des devis clients.
          </p>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}