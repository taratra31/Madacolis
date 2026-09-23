import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

type DashboardData = {
  stats: {
    users: number;
    addresses: number;
    shipments: number;
    payments: number;
    pricingRules: number;
    documents: number;
    revenueEstimated: string | null;
    revenuePaid: string | null;
  };
  flows: { pending: number; inTransit: number; delivered: number };
  shipmentsByStatus: Array<{ status: string; _count: { _all: number } }>;
  paymentsByStatus: Array<{ status: string; _count: { _all: number } }>;
  shipmentsByService: Array<{ serviceType: string; _count: { _all: number } }>;
  revenueByProvider: Array<{ provider: string; amount: string | null }>;
  trend30d: Array<{ day: string; count: number }>;
  topRoutes: Array<{ originCity: string; originCountry: string; destinationCity: string; destinationCountry: string; count: number }>;
  recentShipments: Array<{ id: string; trackingNumber: string; status: string; destinationCity: string; createdAt: string; user: { name: string } }>;
  recentAudits: Array<{ id: string; action: string; createdAt: string; user: { name: string | null } | null }>;
};

const PIE_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4", "#ef4444", "#64748b"];

const CARD_ICONS = {
  users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  shipments: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  payments: "M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  pricing: "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z",
};

function StatIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className ?? ""}`} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={icon} />
    </svg>
  );
}

type ChartTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ name?: string | number; value?: number | string; color?: string }>;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs text-white shadow-xl">
      {label !== undefined && <div className="mb-1 font-semibold text-slate-300">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="capitalize">{String(entry.name ?? "").replace(/_/g, " ")}</span>
          <span className="ml-auto pl-4 font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<DashboardData>("/admin/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"));
  }, []);

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="card animate-pulse p-8 text-sm text-slate-400">Chargement du dashboard…</div>;

  const cards = [
    { label: "Utilisateurs", value: data.stats.users, to: "/users", tint: "blue" },
    { label: "Colis", value: data.stats.shipments, to: "/shipments", tint: "emerald" },
    { label: "Paiements", value: data.stats.payments, to: "/payments", tint: "amber" },
    { label: "Règles tarifaires", value: data.stats.pricingRules, to: "/pricing", tint: "violet" },
  ];

  const tintStyles: Record<string, { chip: string; text: string }> = {
    blue: { chip: "bg-blue-50 text-blue-600 ring-blue-200", text: "text-blue-600" },
    emerald: { chip: "bg-emerald-50 text-emerald-600 ring-emerald-200", text: "text-emerald-600" },
    amber: { chip: "bg-amber-50 text-amber-600 ring-amber-200", text: "text-amber-600" },
    violet: { chip: "bg-violet-50 text-violet-600 ring-violet-200", text: "text-violet-600" },
  };

  const statusPie = data.shipmentsByStatus.map((s) => ({ name: s.status, value: s._count._all }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Vue d'ensemble</h1>
          <p className="mt-0.5 text-sm text-slate-500">État en temps réel de la plateforme MadaColis.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 ring-inset">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card group relative overflow-hidden p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-slate-50 transition group-hover:scale-110" />
            <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${tintStyles[c.tint].chip}`}>
              <StatIcon icon={CARD_ICONS[c.tint === "blue" ? "users" : c.tint === "emerald" ? "shipments" : c.tint === "amber" ? "payments" : "pricing"]} />
            </div>
            <div className={`relative mt-4 text-3xl font-extrabold tracking-tight ${tintStyles[c.tint].text}`}>{c.value}</div>
            <div className="relative text-sm font-medium text-slate-500">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="card divide-y divide-slate-100 sm:divide-x sm:divide-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Revenus estimés", value: data.stats.revenueEstimated ?? "0", suffix: "€", accent: "text-emerald-600" },
          { label: "Revenus payés", value: data.stats.revenuePaid ?? "0", suffix: "€", accent: "text-slate-900" },
          { label: "Colis en attente", value: data.flows.pending, suffix: "", accent: "text-amber-600" },
          { label: "En transit / livrés", value: `${data.flows.inTransit}`, suffix: `/ ${data.flows.delivered}`, accent: "text-brand-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-5 py-4">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{kpi.label}</div>
            <div className={`mt-1 text-xl font-bold ${kpi.accent}`}>
              {kpi.value} <span className="text-sm font-semibold text-slate-400">{kpi.suffix}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700">Colis créés — 30 derniers jours</h2>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={data.trend30d}>
              <defs>
                <linearGradient id="gTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(d: string) => d.slice(5)} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={28} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#cbd5e1" }} />
              <Area type="monotone" dataKey="count" name="Colis" stroke="#10b981" fill="url(#gTrend)" strokeWidth={2.5} activeDot={{ r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700">Colis par statut</h2>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={3} stroke="none">
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
            {statusPie.map((s, i) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.name.replace(/_/g, " ").toLowerCase()} ({s.value})
              </span>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700">Paiements par statut</h2>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.paymentsByStatus.map((p) => ({ name: p.status, count: p._count._all }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} width={28} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="count" name="Nombre" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.paymentsByStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="mb-4 text-sm font-bold text-slate-700">Revenus payés par fournisseur (€)</h2>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data.revenueByProvider}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef1f5" vertical={false} />
              <XAxis dataKey="provider" tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(p: string) => p.replace(/_/g, " ")} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} width={36} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="amount" name="Revenus" radius={[6, 6, 0, 0]} fill="#10b981" maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-bold text-slate-700">Top routes</h2>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">{data.topRoutes.length}</span>
          </div>
          <ul className="divide-y divide-slate-50">
            {data.topRoutes.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-5 py-3 text-sm transition hover:bg-slate-50">
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${["bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700", "bg-amber-100 text-amber-700"][i] ?? "bg-slate-100 text-slate-600"}`}>
                    {i + 1}
                  </span>
                  <span className="truncate font-medium text-slate-700">
                    {r.originCity} <span className="text-slate-400">→</span> {r.destinationCity}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">{r.count}</span>
              </li>
            ))}
            {data.topRoutes.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">Aucune route</li>}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-bold text-slate-700">Derniers colis</h2>
            <Link to="/shipments" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-slate-50">
            {data.recentShipments.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="truncate font-mono text-sm font-semibold text-slate-800">{s.trackingNumber}</div>
                  <div className="truncate text-xs text-slate-500">
                    {s.user.name} · vers {s.destinationCity}
                  </div>
                </div>
                <StatusBadge value={s.status} />
              </li>
            ))}
            {data.recentShipments.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">Aucun colis</li>}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-bold text-slate-700">Activité récente</h2>
            <Link to="/audits" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700">
              Tout voir
            </Link>
          </div>
          <ul className="divide-y divide-slate-50">
            {data.recentAudits.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="truncate font-mono text-xs font-semibold text-emerald-700">{a.action}</div>
                  <div className="truncate text-xs text-slate-500">{a.user?.name ?? "Système"}</div>
                </div>
                <div className="shrink-0 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              </li>
            ))}
            {data.recentAudits.length === 0 && <li className="px-5 py-8 text-center text-sm text-slate-400">Aucune activité</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}