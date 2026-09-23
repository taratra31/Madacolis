import type { ShipmentStatus } from "@/types";
import { STATUS_LABELS } from "@/utils";

export const STATUS_COLORS: Record<ShipmentStatus, string> = {
  PENDING: "#94A3B8",
  RECEIVED: "#3B82F6",
  IN_TRANSIT: "#0EA5E9",
  IN_CUSTOMS: "#8B5CF6",
  OUT_FOR_DELIVERY: "#14B8A6",
  DELIVERED: "#10B981",
  CANCELLED: "#EF4444",
};

/** Donut SVG : répartition par statut. */
export function StatusDonut({ data }: { data: Array<{ status: ShipmentStatus; count: number }> }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const valid = data.filter((d) => d.count > 0);
  const size = 160;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  if (total === 0) {
    return <EmptyDonut size={size} stroke={stroke} r={r} c={c} />;
  }

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Répartition par statut">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
          {valid.map((d) => {
            const len = (d.count / total) * c;
            const seg = (
              <circle
                key={d.status}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={STATUS_COLORS[d.status]}
                strokeWidth={stroke}
                strokeDasharray={`${Math.max(len - 1.5, 0.5)} ${c - Math.max(len - 1.5, 0.5)}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return seg;
          })}
        </g>
        <text x="50%" y="46%" textAnchor="middle" className="fill-slate-900 text-xl font-black dark:fill-white">
          {total}
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-slate-400 text-[10px] font-semibold uppercase">
          colis
        </text>
      </svg>
      <ul className="space-y-1.5">
        {Object.keys(STATUS_LABELS)
          .filter((s) => data.some((d) => d.status === s && d.count > 0))
          .map((s) => {
            const status = s as ShipmentStatus;
            const d = data.find((x) => x.status === status)!;
            const pct = total ? Math.round((d.count / total) * 100) : 0;
            return (
              <li key={status} className="flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                <span className="text-slate-600 dark:text-slate-300">{STATUS_LABELS[status]}</span>
                <span className="ml-auto pl-4 font-bold text-slate-900 dark:text-white">
                  {d.count} <span className="text-xs font-medium text-slate-400">({pct}%)</span>
                </span>
              </li>
            );
          })}
      </ul>
    </div>
  );
}

function EmptyDonut({ size, stroke, r, c }: { size: number; stroke: number; r: number; c: number }) {
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} strokeDasharray={`${c * 0.06} ${c * 0.94}`} />
    </svg>
  );
}

/** Barres horizontales de répartition (destinations / services). */
export function HorizontalBars({
  data,
  valueLabel,
}: {
  data: Array<{ label: string; value: number; sub?: string }>;
  valueLabel?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200">{d.label}</span>
            <span className="shrink-0 font-bold text-slate-900 dark:text-white">{valueLabel ? valueLabel(d.value) : d.value}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          {d.sub && <p className="mt-0.5 text-xs text-slate-400">{d.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/** Barres verticales : volume mensuel (12 derniers mois). */
export function MonthlyBars({
  data,
  height = 160,
}: {
  data: Array<{ label: string; total: number; delivered: number; revenueAr: number }>;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <div className="flex items-end gap-2" style={{ height: height + 26 }}>
      {data.map((d) => (
        <div key={d.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${d.label} · ${d.total} colis · ${d.revenueAr.toLocaleString("fr-FR")} Ar`}>
          <div className="pointer-events-none absolute -top-6 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white opacity-0 shadow transition group-hover:opacity-100 dark:bg-white dark:text-slate-900">
            {d.total}
          </div>
          <div
            className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-blue-500 transition-all group-hover:from-indigo-500 group-hover:to-blue-400"
            style={{ height: `${Math.max((d.total / max) * height, 3)}px` }}
          />
          <span className="mt-1.5 text-[11px] font-medium text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}