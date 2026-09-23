import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { fetchTransitaireShipments } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import type { TransitaireShipmentsResponse } from "@/types";

const ACTIVE = new Set(["RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY"]);

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const fmt = (d: Date) => d.toISOString().slice(0, 10);
const label = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

type Row = TransitaireShipmentsResponse["shipments"][number];

export function TransitaireAgendaPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-agenda"],
    queryFn: () => fetchTransitaireShipments({ pageSize: 100 }),
    refetchInterval: 60000,
  });

  const days = useMemo(() => {
    const today = new Date();
    const list: { key: string; date: Date; title: string }[] = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i);
      return { key: fmt(d), date: d, title: label(d) };
    });
    const byDate = new Map<string, Row[]>();
    for (const s of data?.shipments ?? []) {
      if (!ACTIVE.has(s.status)) continue;
      const due = s.estimatedDeliveryDate ? s.estimatedDeliveryDate.slice(0, 10) : null;
      const key = due && due >= fmt(today) ? due : "."; // sans date → "à planifier"
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)?.push(s);
    }
    return { list, byDate };
  }, [data]);

  if (isLoading) return <LoadingState label="Chargement de l'agenda…" />;
  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />;
  }

  const planned = days.list.flatMap((d) => days.byDate.get(d.key) ?? []);
  const tbd = days.byDate.get(".") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <CalendarDays className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Agenda des livraisons
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Les 7 prochains jours, avec les livraisons attendues.</p>
      </div>

      {planned.length === 0 && tbd.length === 0 && (
        <EmptyState title="Aucune livraison planifiée" description="Créez des colis ou fixez des dates de livraison estimée." />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {days.list.map((day) => {
          const items = days.byDate.get(day.key) ?? [];
          const today = day.key === fmt(new Date());
          return (
            <Card key={day.key} className={today ? "ring-2 ring-indigo-500/60" : ""}>
              <CardBody>
                <p className={`mb-3 text-sm font-bold capitalize ${today ? "text-indigo-600 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"}`}>
                  {today ? "Aujourd'hui · " : ""}
                  {day.title}
                </p>
                {items.length === 0 ? (
                  <p className="text-sm text-slate-400">Aucune livraison prévue</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((s) => (
                      <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
                        <div>
                          <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300">{s.trackingNumber}</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {s.originCity} → {s.destinationCity} · {s.user?.name}
                          </p>
                        </div>
                        <StatusBadge value={s.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {tbd.length > 0 && (
        <Card>
          <CardBody>
            <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">Livraisons à planifier (sans date)</p>
            <div className="flex flex-wrap gap-2">
              {tbd.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm dark:bg-amber-950/50">
                  <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-300">{s.trackingNumber}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{s.destinationCity}</span>
                </span>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}