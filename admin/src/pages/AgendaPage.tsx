import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Package, Clock3 } from "lucide-react";
import { getShipments } from "../api/endpoints";
import { Badge, PageHeader, Spinner, statusLabel, btnGhost } from "../components/ui";

const DAY_LABELS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function next7Days() {
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

export default function AgendaPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["agenda"],
    queryFn: () => getShipments({ page: 1, pageSize: 100 }),
  });

  const days = useMemo(next7Days, []);
  const shipments = data?.shipments ?? [];

  const byDay = days.map((d) => {
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    return shipments.filter((s) => {
      const est = s.estimatedDeliveryDate ? new Date(s.estimatedDeliveryDate) : null;
      return est && est >= d && est < next;
    });
  });
  const unscheduled = shipments.filter((s) => !s.estimatedDeliveryDate);

  return (
    <div>
      <PageHeader
        title="Agenda"
        subtitle={`Planning des livraisons · semaine du ${days[0].getDate()} ${MONTHS[days[0].getMonth()]} ${days[0].getFullYear()}`}
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      {isLoading ? <Spinner /> : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {days.map((d, i) => {
            const isToday = i === 0;
            return (
              <div key={d.toISOString()} className={`rounded-2xl border p-4 shadow-sm ${isToday ? "border-blue-300 bg-gradient-to-b from-blue-50/70 to-white" : "border-slate-200 bg-white"}`}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-bold ${isToday ? "text-blue-700" : "text-slate-800"}`}>
                      {DAY_LABELS[d.getDay()]}{isToday ? " · aujourd'hui" : ""}
                    </p>
                    <p className="text-[11px] text-slate-400">{d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}</p>
                  </div>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${isToday ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-500"}`}>
                    {d.getDate()}
                  </div>
                </div>
                <div className="space-y-2">
                  {byDay[i].length === 0 ? (
                    <p className="rounded-lg bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-400">Aucune livraison prévue</p>
                  ) : byDay[i].map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-[11px] font-bold text-blue-600">{s.trackingNumber}</p>
                        <p className="truncate text-[10px] text-slate-400">{s.originCity} → {s.destinationCity}</p>
                      </div>
                      <Badge value={s.status} label={statusLabel(s.status)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 shadow-sm xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold text-slate-700"><Clock3 size={16} className="text-amber-500" /> À planifier</p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">{unscheduled.length}</span>
            </div>
            <div className="space-y-2">
              {unscheduled.length === 0 ? (
                <p className="rounded-lg bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-400">Tous les colis ont une date estimée.</p>
              ) : unscheduled.slice(0, 12).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-slate-400" />
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] font-bold text-slate-700">{s.trackingNumber}</p>
                      <p className="truncate text-[10px] text-slate-400">{s.user.name}</p>
                    </div>
                  </div>
                  <Badge value={s.status} label={statusLabel(s.status)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}