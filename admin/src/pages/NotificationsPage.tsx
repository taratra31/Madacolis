import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, RefreshCw, CheckCheck, Package, Wallet, UserRound, ShieldCheck } from "lucide-react";
import { getAdminNotifications } from "../api/endpoints";
import { Card, ErrorBox, PageHeader, Spinner, btnGhost } from "../components/ui";
import type { AdminNotificationType } from "../types";

const ICONS: Record<AdminNotificationType, { icon: typeof Bell; cls: string }> = {
  SHIPMENT: { icon: Package, cls: "bg-blue-50 text-blue-600" },
  PAYMENT: { icon: Wallet, cls: "bg-emerald-50 text-emerald-600" },
  USER: { icon: UserRound, cls: "bg-amber-50 text-amber-600" },
  SYSTEM: { icon: ShieldCheck, cls: "bg-slate-100 text-slate-500" },
};

const TYPE_LABELS: Record<string, string> = {
  ALL: "Toutes",
  SHIPMENT: "Colis",
  PAYMENT: "Paiements",
  USER: "Comptes",
  SYSTEM: "Système",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<string>("ALL");
  const { data, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin-notifs"],
    queryFn: getAdminNotifications,
    refetchInterval: 30000,
  });

  const list = (data?.notifications ?? []).filter((n) => filter === "ALL" || n.type === filter);
  const relative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.round(diff / 60000);
    if (min < 1) return "à l'instant";
    if (min < 60) return `il y a ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `il y a ${h} h`;
    return `il y a ${Math.round(h / 24)} j`;
  };

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Événements récents de la plateforme (7 derniers jours)"
        actions={
          <>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">{data?.unread ?? 0} non lus</span>
            <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {["ALL", "SHIPMENT", "PAYMENT", "USER", "SYSTEM"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${filter === f ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow" : "bg-white text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"}`}
          >
            {TYPE_LABELS[f]}
          </button>
        ))}
      </div>

      {isLoading ? <Spinner /> : error ? (
        <ErrorBox message="Erreur de chargement des notifications." onRetry={() => void refetch()} />
      ) : list.length === 0 ? (
        <Card><p className="py-8 text-center text-sm text-slate-400">Aucune notification pour ce filtre.</p></Card>
      ) : (
        <Card subtitle={`Dernière mise à jour : ${new Date(dataUpdatedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}>
          <div className="space-y-1">
            {list.map((n) => {
              const cfg = ICONS[n.type] ?? ICONS.SYSTEM;
              const Icon = cfg.icon;
              const isNew = n.type === "PAYMENT" || n.type === "USER";
              return (
                <div key={n.id} className={`flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-slate-50 ${isNew && filter === "ALL" ? "bg-blue-50/40" : ""}`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.cls}`}><Icon size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800">
                      {n.title}
                      {isNew ? <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase text-white">Nouveau</span> : null}
                    </p>
                    <p className="text-xs text-slate-400">{n.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-medium text-slate-400">{relative(n.time)}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <CheckCheck size={13} className="text-emerald-500" /> Mise à jour automatique toutes les 30 secondes
          </p>
        </Card>
      )}
    </div>
  );
}