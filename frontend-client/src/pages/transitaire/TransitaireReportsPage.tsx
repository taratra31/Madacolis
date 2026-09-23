import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, TrendingDown, TrendingUp } from "lucide-react";
import { fetchTransitaireStats } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { SERVICE_LABELS, STATUS_LABELS } from "@/utils";

const ar = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

export function TransitaireReportsPage() {
  const statsQuery = useQuery({
    queryKey: ["transitaire-reports"],
    queryFn: () => fetchTransitaireStats(),
    refetchInterval: 60000,
  });

  const stats = statsQuery.data?.stats;
  if (statsQuery.isLoading) return <LoadingState label="Chargement des rapports…" />;
  if (statsQuery.isError) {
    return <ErrorState message={statsQuery.error instanceof Error ? statsQuery.error.message : "Erreur"} onRetry={() => void statsQuery.refetch()} />;
  }
  if (!stats) return null;

  const months = stats.volumeByMonth.map((m, i) => ({
    ...m,
    growth: i === 0 ? null : m.total - stats.volumeByMonth[i - 1].total,
  }));
  const maxMonth = Math.max(1, ...months.map((m) => m.total));

  const csv = () => {
    const rows: string[][] = [["Mois", "Colis", "Livrés", "CA (Ar)"], ...stats.volumeByMonth.map((m) => [m.label, String(m.total), String(m.delivered), String(m.revenueAr)])];
    return rows.map((r) => r.join(";")).join("\r\n");
  };

  const onExport = () => {
    const blob = new Blob([`\uFEFF${csv()}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "madacolis-rapports-mensuels.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            <BarChart3 className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
            Rapports
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Synthèse mensuelle, services et destinations.</p>
        </div>
        <Button variant="outline" onClick={() => void onExport()}>
          <Download className="size-4" /> CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Volumes mensuels (12 derniers mois)</h2>
        </CardHeader>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="py-3 font-semibold">Mois</th>
                  <th className="py-3 font-semibold">Colis</th>
                  <th className="py-3 font-semibold">Livrés</th>
                  <th className="py-3 font-semibold">CA (Ar)</th>
                  <th className="py-3 font-semibold">Évolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {months.map((m) => (
                  <tr key={m.key} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3 font-bold capitalize text-slate-900 dark:text-white">{m.label}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${(m.total / maxMonth) * 100}%` }} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{m.total}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300">{m.delivered}</td>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{ar(m.revenueAr)}</td>
                    <td className="py-3">
                      {m.growth == null ? (
                        <span className="text-slate-400">—</span>
                      ) : m.growth >= 0 ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <TrendingUp className="size-3.5" /> +{m.growth}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <TrendingDown className="size-3.5" /> {m.growth}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Par service</h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="py-3 font-semibold">Service</th>
                    <th className="py-3 font-semibold">Colis</th>
                    <th className="py-3 font-semibold">CA (Ar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.byService.map((s) => (
                    <tr key={s.serviceType}>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{SERVICE_LABELS[s.serviceType]}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{s.count}</td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{ar(s.revenueAr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Top destinations</h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                    <th className="py-3 font-semibold">Destination</th>
                    <th className="py-3 font-semibold">Colis</th>
                    <th className="py-3 font-semibold">CA (Ar)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.byCity.map((c) => (
                    <tr key={c.city}>
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{c.city}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{c.count}</td>
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{ar(c.revenueAr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">État du parc (statuts)</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {stats.byStatus.map((b) => (
              <span key={b.status} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm dark:bg-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">{b._count._all}</span>
                <span className="text-slate-500 dark:text-slate-400">{STATUS_LABELS[b.status]}</span>
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}