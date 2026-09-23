import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, SERVICE_LABELS } from "@/utils";
import type { Shipment } from "@/types";

export function ShipmentCard({ shipment }: { shipment: Shipment }) {
  return (
    <Link to={`/dashboard/shipments/${shipment.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold text-brand-800 dark:text-brand-300">{shipment.trackingNumber}</span>
              <StatusBadge value={shipment.status} />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <span>
                {shipment.originCity}, {shipment.originCountry}
              </span>
              <ArrowRight className="size-3.5 text-slate-400" />
              <span>
                {shipment.destinationCity}, {shipment.destinationCountry}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDate(shipment.createdAt)} · {SERVICE_LABELS[shipment.serviceType]} · {shipment.totalWeight} kg
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(shipment.estimatedPrice, shipment.currency)}
            </p>
            <p className="text-xs text-slate-400">Estimé</p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}