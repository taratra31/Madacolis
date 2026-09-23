import { ArrowDown, Box, Route, Truck } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { formatAriary, formatCurrency, SERVICE_LABELS } from "@/utils";
import type { Quote } from "@/types";

export function PriceSummary({ quote }: { quote: Quote }) {
  const rows: Array<{ label: string; value: string; icon?: typeof Box }> = [
    { label: "Poids facturé", value: `${quote.billingWeight} kg${quote.usingVolumetric ? " (volumétrique)" : ""}`, icon: Box },
    { label: "Tarif", value: `${quote.pricePerKg} €/kg${quote.isFragile ? " · fragile +15%" : ""}`, icon: Box },
    { label: "Distance", value: `${quote.distanceKm.toLocaleString("fr-FR")} km`, icon: Route },
    { label: "Service", value: SERVICE_LABELS[quote.serviceType], icon: Truck },
  ];

  return (
    <Card className="bg-brand-900 text-white dark:bg-brand-900">
      <CardBody className="space-y-3 p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">Estimation du prix</p>
        <ul className="space-y-1.5 text-sm">
          {rows.map((row) => (
            <li key={row.label} className="flex items-center justify-between text-brand-100">
              <span className="flex items-center gap-2">
                {row.icon && <row.icon className="size-4 text-brand-300" />}
                {row.label}
              </span>
              <span className="font-medium">{row.value}</span>
            </li>
          ))}
          <li className="mt-2 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
            <span className="flex items-center gap-2 font-medium">
              <ArrowDown className="size-4 text-blue-300" />
              Total estimé
            </span>
            <span className="flex flex-col items-end leading-tight">
              <span className="text-xl font-bold text-blue-300">{formatCurrency(quote.price, quote.currency)}</span>
              <span className="text-xs text-brand-300">≈ {formatAriary(quote.price)}</span>
            </span>
          </li>
        </ul>
        <p className="text-xs text-brand-200">
          Livraison estimée sous {quote.estimatedDeliveryDays} jours · Prix calculé par le backend, non contractuel.
        </p>
      </CardBody>
    </Card>
  );
}