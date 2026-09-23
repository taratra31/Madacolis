import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users, Package, Wallet, TrendingUp, ArrowRight, PlusCircle, ScanLine, CreditCard,
  Truck, PiggyBank, Activity, Clock3, PackageCheck, ChevronRight,
} from "lucide-react";
import { getAdminNotifications, getCommissions, getDashboard } from "../api/endpoints";
import { Badge, ErrorBox, statusLabel, fmtDate, btnPrimary } from "../components/ui";
import type { DashboardData } from "../types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  RECEIVED: "#3b82f6",
  IN_TRANSIT: "#0ea5e9",
  IN_CUSTOMS: "#a855f7",
  OUT_FOR_DELIVERY: "#14b8a6",
  DELIVERED: "#22c55e",
  CANCELLED: "#f87171",
};

const PROVIDER_COLORS: Record<string, string> = {
  MVOLA: "#3b82f6",
  ORANGE_MONEY: "#f97316",
  AIRTEL_MONEY: "#ef4444",
  TELEMONEY: "#0ea5e9",
  CARD: "#8b5cf6",
  CASH: "#10b981",
};

const fmtAr = (v?: number | null) => (v == null ? "—" : `${Math.round(v).toLocaleString("fr-FR")} Ar`);

// ─── Héros ───
function Hero({ data }: { data: DashboardData }) {
  const s = data.stats;
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0b1120] px-6 py-7 text-white shadow-xl shadow-slate-900/20 sm:px-8">
      <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-200 ring-1 ring-inset ring-white/15">
            <Activity size={12} className="animate-pulse text-emerald-400" /> Centre de commande · Opérationnel
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Vue d'ensemble de la plateforme</h2>
          <p className="mt-1.5 max-w-xl text-sm text-slate-400">
            {data.flows.delivered} colis livrés · {s.users} utilisateurs · {s.documents} documents · suivi en temps réel
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/nouveau-colis" className={btnPrimary}><PlusCircle size={16} /> Nouveau colis</Link>
            <Link to="/suivi" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur transition hover:bg-white/20">
              <ScanLine size={16} /> Suivi en direct
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <HeroChip label="En attente" value={data.flows.pending} accent="text-amber-300" dot="bg-amber-400" />
          <HeroChip label="En transit" value={data.flows.inTransit} accent="text-sky-300" dot="bg-sky-400" />
          <HeroChip label="Livrés" value={data.flows.delivered} accent="text-emerald-300" dot="bg-emerald-400" />
        </div>
      </div>
    </div>
  );
}

function HeroChip({ label, value, accent, dot }: { label: string; value: number; accent: string; dot: string }) {
  return (
    <div className="min-w-[92px] rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-inset ring-white/10">
      <p className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {label}
      </p>
      <p className={`mt-1 text-2xl font-black ${accent}`}>{value}</p>
    </div>
  );
}

// ─── KPI ───
function Kpi({ label, value, sub, icon, chip, bar, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; chip: string; bar: string; trend?: { pct: number };
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${bar} opacity-0 transition group-hover:opacity-100`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-[28px] font-black leading-none tracking-tight text-slate-900">{value}</p>
          {sub ? <p className="mt-2 text-xs font-medium text-slate-500">{sub}</p> : null}
        </div>
        <div className={`rounded-xl p-2.5 ${chip}`}>{icon}</div>
      </div>
      {trend ? (
        <p className={`mt-3 flex items-center gap-1 text-xs font-bold ${trend.pct >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
          <TrendingUp size={13} className={trend.pct < 0 ? "rotate-180" : ""} />
          {Math.abs(trend.pct)} % sur 7 jours
        </p>
      ) : null}
    </div>
  );
}

// ─── Graphique d'activité (SVG + tooltip) ───
function TrendChart({ data }: { data: Array<{ day: string; count: number }> }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760;
  const H = 220;
  const P = 6;
  if (data.length === 0) return <p className="py-10 text-center text-sm text-slate-400">Aucune donnée sur la période.</p>;

  const max = Math.max(1, ...data.map((d) => d.count));
  const x = (i: number) => P + (i * (W - 2 * P)) / (data.length - 1);
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(1)},${(H - P).toFixed(1)} L${x(0).toFixed(1)},${(H - P).toFixed(1)} Z`;
  const hovered = hover != null ? data[hover] : null;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vx = ((e.clientX - rect.left) / rect.width) * W;
    const idx = Math.min(data.length - 1, Math.max(0, Math.round((vx - P) / ((W - 2 * P) / (data.length - 1)))));
    setHover(idx);
  };

  return (
    <div className="relative select-none" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 6" />
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {hovered && hover != null ? (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={0} y2={H - P} stroke="#2563eb" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
            <circle cx={x(hover)} cy={y(hovered.count)} r="5" fill="#fff" stroke="#2563eb" strokeWidth="2.5" />
          </>
        ) : null}
      </svg>
      {hovered && hover != null ? (
        <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-1.5 text-center text-white shadow-lg" style={{ left: `${(x(hover) / W) * 100}%`, top: 4 }}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{hovered.day}</p>
          <p className="text-sm font-black">{hovered.count} colis</p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Donut statuts ───
function Donut({ data }: { data: Array<{ status: string; _count: { _all: number } }> }) {
  const total = data.reduce((a, b) => a + b._count._all, 0);
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#f1f5f9" strokeWidth="13" />
          {total > 0
            ? data.map((d) => {
                const frac = d._count._all / total;
                const dash = frac * C;
                const off = -acc * C;
                acc += frac;
                return (
                  <circle
                    key={d.status}
                    cx="60" cy="60" r={R} fill="none"
                    stroke={STATUS_COLORS[d.status] ?? "#94a3b8"}
                    strokeWidth="13"
                    strokeDasharray={`${dash - 2} ${C - dash + 2}`}
                    strokeDashoffset={off}
                    strokeLinecap="round"
                  />
                );
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-slate-900">{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">colis</span>
        </div>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-2">
        {data.map((d) => (
          <div key={d.status} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[d.status] ?? "#94a3b8" }} />
              {statusLabel(d.status)}
            </span>
            <span className="font-bold text-slate-900">{d._count._all}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rangs & listes ───
const RANK_STYLES = ["bg-gradient-to-br from-blue-500 to-indigo-500", "bg-slate-700", "bg-slate-400"];

function NotificationDot({ type }: { type: string }) {
  const map: Record<string, string> = { SHIPMENT: "bg-blue-500", PAYMENT: "bg-emerald-500", USER: "bg-amber-400", SYSTEM: "bg-slate-400" };
  return <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${map[type] ?? "bg-slate-400"}`} />;
}

export default function DashboardPage() {
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const notif = useQuery({ queryKey: ["admin-notifs"], queryFn: getAdminNotifications });
  const comm = useQuery({ queryKey: ["commissions"], queryFn: getCommissions });

  if (dash.isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-44 animate-pulse rounded-3xl bg-slate-200/80" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200/80" />)}</div>
        <div className="grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200/80" />)}</div>
      </div>
    );
  }
  if (dash.error || !dash.data) return <ErrorBox message="Impossible de charger le dashboard." onRetry={() => void dash.refetch()} />;

  const data = dash.data;
  const s = data.stats;
  const g7 = data.trend30d.slice(-7).reduce((a, t) => a + t.count, 0);
  const p7 = data.trend30d.slice(-14, -7).reduce((a, t) => a + t.count, 0);
  const growthPct = p7 > 0 ? Math.round(((g7 - p7) / p7) * 100) : undefined;
  const totalColis = data.trend30d.reduce((a, t) => a + t.count, 0);
  const pendingShare = s.shipments > 0 ? Math.round((data.flows.pending / s.shipments) * 100) : 0;
  const commission = comm.data?.totalCommission;
  const ratePct = Math.round((comm.data?.rate ?? 0.2) * 100);

  return (
    <div className="space-y-5 pb-6">
      <Hero data={data} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Colis créés (30 j)" value={totalColis} sub={`${s.shipments} au total sur la plateforme`} icon={<Package size={20} />} chip="bg-blue-50 text-blue-600" bar="from-blue-500 to-indigo-500" trend={growthPct != null ? { pct: growthPct } : undefined} />
        <Kpi label="En attente" value={data.flows.pending} sub={`${pendingShare} % du volume total`} icon={<Clock3 size={20} />} chip="bg-amber-50 text-amber-600" bar="from-amber-400 to-orange-500" />
        <Kpi label="Recettes encaissées" value={fmtAr(s.revenuePaid)} sub="Paiements payés" icon={<Wallet size={20} />} chip="bg-emerald-50 text-emerald-600" bar="from-emerald-500 to-teal-500" />
        <Kpi label={`Commission (${ratePct} %)`} value={fmtAr(commission)} sub={comm.data ? `${comm.data.deliveredShipments} colis livrés` : "En cours de calcul…"} icon={<PiggyBank size={20} />} chip="bg-violet-50 text-violet-600" bar="from-violet-500 to-fuchsia-500" />
      </div>

      {/* Tendance + Donut */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><TrendingUp size={16} className="text-blue-600" /> Activité — 30 derniers jours</h3>
              <p className="text-xs text-slate-400">Survolez le graphique pour voir le détail quotidien</p>
            </div>
            <div className="flex gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{g7} cette semaine</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{data.trend30d.length ? `${data.trend30d[data.trend30d.length - 1].count} aujourd'hui` : ""}</span>
            </div>
          </div>
          <TrendChart data={data.trend30d} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-1 text-sm font-bold text-slate-900">Répartition par statut</h3>
          <p className="mb-4 text-xs text-slate-400">Volume total des colis</p>
          <Donut data={data.shipmentsByStatus} />
        </div>
      </div>

      {/* Routes + Revenus + Activité */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Top routes</h3>
              <p className="text-xs text-slate-400">Les trajets les plus fréquents</p>
            </div>
            <PackageCheck size={17} className="text-slate-300" />
          </div>
          <div className="divide-y divide-slate-50">
            {data.topRoutes.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Aucune donnée.</p> : data.topRoutes.map((r, i) => (
              <div key={`${r.originCity}-${r.destinationCity}`} className="flex items-center gap-3 py-2.5">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-black text-white ${RANK_STYLES[i] ?? "bg-slate-400"}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.originCity} → {r.destinationCity}</p>
                  <p className="text-[11px] text-slate-400">{r.originCountry} / {r.destinationCountry}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-extrabold text-blue-700">{r.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenus par canal</h3>
              <p className="text-xs text-slate-400">Paiements encaissés</p>
            </div>
            <CreditCard size={17} className="text-slate-300" />
          </div>
          <div className="space-y-3.5">
            {data.revenueByProvider.length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Aucun encaissement.</p> : data.revenueByProvider.map((p) => {
              const total = data.revenueByProvider.reduce((a, b) => a + (b.amount ?? 0), 0);
              const pct = total ? Math.round(((p.amount ?? 0) / total) * 100) : 0;
              return (
                <div key={p.provider}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PROVIDER_COLORS[p.provider] ?? "#94a3b8" }} />
                      {statusLabel(p.provider)}
                    </span>
                    <span className="font-bold text-slate-900">{fmtAr(p.amount)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PROVIDER_COLORS[p.provider] ?? "#94a3b8" }} />
                    </div>
                    <span className="w-9 text-right text-[11px] font-bold text-slate-400">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Activité récente</h3>
              <p className="text-xs text-slate-400">Notifications de la plateforme</p>
            </div>
            <Link to="/notifications" className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:underline">Tout voir <ChevronRight size={13} /></Link>
          </div>
          <div className="space-y-1">
            {(notif.data?.notifications ?? []).slice(0, 6).map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition hover:bg-slate-50">
                <NotificationDot type={n.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-700">{n.title}</p>
                  <p className="truncate text-[11px] text-slate-400">{n.detail}</p>
                </div>
              </div>
            ))}
            {(notif.data?.notifications ?? []).length === 0 ? <p className="py-6 text-center text-sm text-slate-400">Aucun événement récent.</p> : null}
          </div>
        </div>
      </div>

      {/* Derniers colis + audit */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Package size={16} className="text-blue-600" /> Derniers colis</h3>
              <p className="text-xs text-slate-400">Les 8 créations les plus récentes</p>
            </div>
            <Link to="/shipments" className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:underline">Tout voir <ChevronRight size={13} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-bold">N° suivi</th>
                  <th className="py-2 pr-3 font-bold">Client</th>
                  <th className="py-2 pr-3 font-bold">Trajet</th>
                  <th className="py-2 pr-3 font-bold">Statut</th>
                  <th className="py-2 font-bold">Créé</th>
                </tr>
              </thead>
              <tbody>
                {data.recentShipments.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400">Aucun colis.</td></tr>
                ) : data.recentShipments.map((sh) => (
                  <tr key={sh.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                    <td className="py-2.5 pr-3 font-mono text-xs font-bold text-blue-600">{sh.trackingNumber}</td>
                    <td className="py-2.5 pr-3 text-xs font-medium text-slate-700">{sh.user.name}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{sh.originCity} → {sh.destinationCity}</td>
                    <td className="py-2.5 pr-3"><Badge value={sh.status} /></td>
                    <td className="py-2.5 text-xs text-slate-500">{fmtDate(sh.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900"><Activity size={16} className="text-violet-600" /> Journal récent</h3>
              <p className="text-xs text-slate-400">Dernières actions sensibles</p>
            </div>
            <Link to="/audits" className="flex items-center gap-0.5 text-xs font-bold text-blue-600 hover:underline">Tout voir <ChevronRight size={13} /></Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3 font-bold">Action</th>
                  <th className="py-2 pr-3 font-bold">Admin</th>
                  <th className="py-2 pr-3 font-bold">Entité</th>
                  <th className="py-2 font-bold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAudits.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">Aucune action.</td></tr>
                ) : data.recentAudits.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                    <td className="py-2.5 pr-3"><span className="font-mono text-[11px] font-bold text-slate-700">{a.action}</span></td>
                    <td className="py-2.5 pr-3 text-xs text-slate-600">{a.user?.name ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-xs text-slate-400">{a.entity}{a.entityId ? ` #${a.entityId.slice(0, 8)}` : ""}</td>
                    <td className="py-2.5 text-xs text-slate-500">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Accès rapide</h3>
            <p className="text-xs text-slate-400">Les outils les plus utilisés</p>
          </div>
          <ArrowRight size={16} className="text-slate-300" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink to="/users" icon={<Users size={17} />} label="Utilisateurs" cls="text-blue-600 bg-blue-50" />
          <QuickLink to="/transporteurs" icon={<Truck size={17} />} label="Transporteurs" cls="text-sky-600 bg-sky-50" />
          <QuickLink to="/pricing" icon={<Wallet size={17} />} label="Tarification" cls="text-violet-600 bg-violet-50" />
          <QuickLink to="/payments" icon={<CreditCard size={17} />} label="Paiements" cls="text-emerald-600 bg-emerald-50" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label, cls }: { to: string; icon: React.ReactNode; label: string; cls: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${cls}`}>{icon}</span>
      <span className="flex-1 text-sm font-semibold text-slate-700">{label}</span>
      <ChevronRight size={15} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </Link>
  );
}