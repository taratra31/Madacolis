import { CheckCircle2, MapPin, Package, ShieldCheck, Truck, XCircle } from "lucide-react";
import { formatDate, STATUS_LABELS } from "@/utils";
import type { ShipmentStatus, ShipmentStatusEvent } from "@/types";

const ICONS: Record<ShipmentStatus, typeof Package> = {
  PENDING: Package,
  RECEIVED: Package,
  IN_TRANSIT: Truck,
  IN_CUSTOMS: ShieldCheck,
  OUT_FOR_DELIVERY: MapPin,
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
};

const DOT_COLORS: Record<ShipmentStatus, string> = {
  PENDING: "bg-slate-400",
  RECEIVED: "bg-blue-500",
  IN_TRANSIT: "bg-amber-500",
  IN_CUSTOMS: "bg-violet-500",
  OUT_FOR_DELIVERY: "bg-cyan-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

const TINTS: Record<ShipmentStatus, string> = {
  PENDING: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  RECEIVED: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  IN_TRANSIT: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  IN_CUSTOMS: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
  OUT_FOR_DELIVERY: "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400",
  DELIVERED: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  CANCELLED: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
};

export interface TimelineEvent {
  status: ShipmentStatus;
  comment: string | null;
  location: string | null;
  createdAt: string;
}

/** Timeline verticale (chronologique, du plus ancien au plus récent). */
export function TrackingTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">Aucun événement disponible.</p>;
  }

  const chronological = [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <ol className="relative space-y-6">
      {chronological.map((event, index) => {
        const Icon = ICONS[event.status];
        const isLast = index === chronological.length - 1;
        return (
          <li key={`${event.status}-${event.createdAt}-${index}`} className="relative flex gap-4">
            {!isLast && <span className="absolute left-4 top-10 h-[calc(100%-2.5rem)] w-px bg-slate-200 dark:bg-slate-700" />}
            <span className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-black/5 ${TINTS[event.status]}`}>
              <Icon className="size-4" />
              {isLast && (
                <span className="absolute inset-0 -m-1 rounded-full opacity-40 [mask-image:radial-gradient(circle,transparent_65%,black)]">
                  <span className={`block size-full rounded-full ${DOT_COLORS[event.status]}`} />
                </span>
              )}
            </span>
            <div className="min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{STATUS_LABELS[event.status]}</span>
                <span className={`size-2 rounded-full ${DOT_COLORS[event.status]}`} />
                <span className="text-xs text-slate-400">{formatDate(event.createdAt, true)}</span>
              </div>
              {event.location && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{event.location}</p>}
              {event.comment && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{event.comment}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export type { ShipmentStatusEvent };