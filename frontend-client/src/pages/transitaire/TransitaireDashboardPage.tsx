import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Boxes,
  CalendarDays,
  Clock,
  MapPin,
  PackageCheck,
  PackagePlus,
  Percent,
  PlusCircle,
  ScanLine,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { fetchTransitaireRates, fetchTransitaireStats } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/Badge";
import { HorizontalBars, MonthlyBars, StatusDonut, STATUS_COLORS } from "@/components/transitaire/charts";
import { formatCurrency, formatDate, SERVICE_LABELS, STATUS_LABELS } from "@/utils";
import type { ShipmentStatus } from "@/types";

const ar = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} Ar`;

// ─── KPI ───
function Kpi({ label, value, sub, icon: Icon, chip, bar }: {
  label: string; value: string | number; sub?: string; icon: LucideIcon; chip: string; bar: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${bar} opacity-0 transition group-hover:opacity-100`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-black leading-none tracking-tight text-slate-900 dark:text-white">{value}</p>
          {sub ? <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{sub}</p> : null}
        </div>
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${chip}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export function TransitaireDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["transitaire-stats"],
    queryFn: () => fetchTransitaireStats(),
    refetchInterval: 30000,
  });
  const ratesQuery = useQuery({
    queryKey: ["transitaire-rates"],
    queryFn: () => fetchTransitaireRates(),
  });

  const stats = statsQuery.data?.stats;
  const carrier = ratesQuery.data?.rates.carrier;
  const kpis = stats?.kpis;

  const byStatus = (stats?.byStatus ?? []).map((s) => ({ status: s.status as ShipmentStatus, count: s._count._all }));
  const byTotal = byStatus.reduce((sum, b) => sum + b.count, 0);

  return (
    <div className="space-y-6">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#0b1120] px-6 py-8 shadow-xl shadow-indigo-950/30 sm:px-8 dark:shadow-black/40">
        <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Truck className="size-7 text-white" />
            </div>
            <div>
              <span className="flex items-center gap-2">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-300">Centre de commande · Live</span>
              </span>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-white">{carrier?.name ?? "Espace transitaire"}</h1>
              <p className="mt-1 text-sm text-slate-300">
                Pilotage de vos expéditions · mise à jour automatique toutes les 30 s
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                {kpis?.avgWeightKg != null && (
                  <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">∅ {kpis.avgWeightKg} kg / colis</span>
                )}
                {kpis?.avgDeliveryDays != null && (
                  <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">∅ livraison {kpis.avgDeliveryDays} j</span>
                )}
                <span className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/15">
                  {ar(kpis?.totalValueAr ?? 0)} · ≈ {(kpis?.totalValueEur ?? 0).toLocaleString("fr-FR")} €
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/espace-transitaire/new-shipment"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-white/10 transition hover:bg-slate-100"
            >
              <PlusCircle size={16} /> Nouveau colis
            </Link>
            <Link
              to="/espace-transitaire/monitoring"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <ScanLine size={16} /> Suivi en direct
            </Link>
          </div>
        </div>
      </section>

      {statsQuery.isLoading && <LoadingState label="Chargement du tableau de bord…" />}
      {statsQuery.isError && (
        <ErrorState message={statsQuery.error instanceof Error ? statsQuery.error.message : "Erreur"} onRetry={() => void statsQuery.refetch()} />
      )}

      {!statsQuery.isLoading && !statsQuery.isError && stats ? (
        <>
          {/* ─── KPIs ─── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi label="Total colis" value={String(stats.total ?? 0)} sub="Sur toute la plateforme" icon={Boxes} chip="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400" bar="from-indigo-500 to-blue-500" />
            <Kpi label="Nouveaux ce mois" value={String(kpis?.newThisMonth ?? 0)} icon={CalendarDays} chip="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400" bar="from-sky-400 to-blue-500" />
            <Kpi label="En attente" value={String(kpis?.pending ?? 0)} sub="À traiter" icon={Clock} chip="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" bar="from-slate-400 to-slate-500" />
            <Kpi label="En transit" value={String(kpis?.inTransit ?? 0)} icon={Truck} chip="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" bar="from-amber-400 to-orange-500" />
            <Kpi label="Livrés" value={String(kpis?.delivered ?? 0)} icon={PackageCheck} chip="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" bar="from-emerald-500 to-teal-500" />
            <Kpi label="Clients" value={String(kpis?.clients ?? 0)} icon={Users} chip="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400" bar="from-violet-500 to-fuchsia-500" />
            <Kpi label="Revenu réseau (net)" value={ar(kpis?.netAr ?? 0)} icon={Wallet} chip="bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400" bar="from-teal-500 to-emerald-500" />
            <Kpi label="Commission MadaColis" value={ar(kpis?.commissionAr ?? 0)} icon={Percent} chip="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" bar="from-rose-500 to-pink-500" />
          </div>

          {/* ─── VOLUMES + DONUT ─── */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  <TrendingUp className="mr-1.5 inline size-4 text-indigo-600 dark:text-indigo-400" />
                  Volumes — 12 derniers mois
                </h2>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800">
                  {byTotal} colis · {ar(kpis?.totalValueAr ?? 0)}
                </span>
              </CardHeader>
              <CardBody>
                {stats.volumeByMonth.some((m) => m.total > 0) ? (
                  <MonthlyBars data={stats.volumeByMonth} />
                ) : (
                  <EmptyState title="Aucun volume" description="Les colis mensuels s'afficheront ici dès la première expédition." />
                )}
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Répartition par statut</h2>
                <span className="text-xs font-medium text-slate-400">{byTotal} colis</span>
              </CardHeader>
              <CardBody>
                <StatusDonut data={byStatus} />
              </CardBody>
            </Card>
          </div>

          {/* ─── DESTINATIONS + SERVICES ─── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  <MapPin className="mr-1.5 inline size-4 text-indigo-600 dark:text-indigo-400" />
                  Top destinations
                </h2>
              </CardHeader>
              <CardBody>
                {stats.byCity.length ? (
                  <HorizontalBars data={stats.byCity.map((c) => ({ label: c.city, value: c.count, sub: ar(c.revenueAr) }))} />
                ) : (
                  <EmptyState title="Aucune destination" description="Les destinations de vos colis s'afficheront ici." />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  <Truck className="mr-1.5 inline size-4 text-indigo-600 dark:text-indigo-400" />
                  Répartition par service
                </h2>
              </CardHeader>
              <CardBody>
                {stats.byService.length ? (
                  <HorizontalBars
                    data={stats.byService.map((s) => ({
                      label: SERVICE_LABELS[s.serviceType],
                      value: s.count,
                      sub: ar(s.revenueAr),
                    }))}
                  />
                ) : (
                  <EmptyState title="Aucune donnée" description="Les services utilisés s'afficheront ici." />
                )}
              </CardBody>
            </Card>
          </div>

          {/* ─── À TRAITER + CLIENTS ─── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  <PackagePlus className="mr-1.5 inline size-4 text-amber-500" />
                  À traiter
                </h2>
                <Link to="/espace-transitaire/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300">
                  Colis <ArrowRight className="size-4" />
                </Link>
              </CardHeader>
              <CardBody className="space-y-3">
                {stats.pendingShipments.length === 0 && <EmptyState title="Rien à faire" description="Aucun colis en attente de traitement. Bravo !" />}
                {stats.pendingShipments.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-amber-50/60 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/20">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-amber-800 dark:text-amber-200">{s.trackingNumber}</span>
                        <StatusBadge value={s.status} />
                      </div>
                      <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/70">
                        {s.originCity} → {s.destinationCity} · créé le {formatDate(s.createdAt)}
                      </p>
                    </div>
                    <Link to="/espace-transitaire/shipments" className="text-sm font-semibold text-amber-700 hover:text-amber-900 dark:text-amber-300">
                      Traiter
                    </Link>
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Clients les plus actifs</h2>
                <Link to="/espace-transitaire/clients" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300">
                  Répertoire <ArrowRight className="size-4" />
                </Link>
              </CardHeader>
              <CardBody className="space-y-3">
                {stats.topClients.length === 0 && <EmptyState title="Aucun client" description="Les clients ayant des colis chez vous apparaîtront ici." />}
                {stats.topClients.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-sm font-bold text-white dark:bg-brand-700">
                        {c.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {c.city ?? "—"} · {c.count} colis · {c.delivered} livrés
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-teal-700 dark:text-teal-300">{ar(c.revenueAr)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>

          {/* ─── ACTIVITÉ + DERNIERS COLIS ─── */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  <Activity className="mr-1.5 inline size-4 text-indigo-600 dark:text-indigo-400" />
                  Activité récente
                </h2>
              </CardHeader>
              <CardBody>
                {stats.activities.length === 0 && <EmptyState title="Aucune activité" description="Les mises à jour de statut apparaîtront ici." />}
                <ol className="relative ml-3 space-y-5 border-l border-slate-200 dark:border-slate-800">
                  {stats.activities.map((a) => (
                    <li key={a.id} className="relative pl-6">
                      <span
                        className="absolute -left-[7px] top-1 size-3.5 rounded-full border-2 border-white dark:border-slate-900"
                        style={{ backgroundColor: STATUS_COLORS[a.status] }}
                      />
                      <p className="text-sm">
                        <span className="font-mono font-bold text-brand-800 dark:text-brand-300">{a.shipment.trackingNumber}</span>{" "}
                        <span className="text-slate-600 dark:text-slate-300">
                          basculé en <span className="font-semibold">{STATUS_LABELS[a.status]}</span>
                        </span>
                      </p>
                      {(a.comment || a.location) && (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {[a.location, a.comment].filter(Boolean).join(" — ")}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(a.createdAt, true)}</p>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>

            <Card>
              <CardHeader className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Derniers colis</h2>
                <Link to="/espace-transitaire/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900 dark:text-brand-300">
                  Tout voir <ArrowRight className="size-4" />
                </Link>
              </CardHeader>
              <CardBody className="space-y-3">
                {stats.recent.length === 0 && <EmptyState title="Aucun colis" description="Les expéditions confiées à votre transporteur apparaîtront ici." />}
                {stats.recent.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-brand-800 dark:text-brand-300">{s.trackingNumber}</span>
                        <StatusBadge value={s.status} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {s.originCity} → {s.destinationCity} · {s.user?.name ?? "Client"}
                      </p>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(s.estimatedPrice, s.currency)}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}