import { useQuery } from "@tanstack/react-query";
import { Bell, CircleCheck, MapPin } from "lucide-react";
import { fetchTransitaireNotifications } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils";

export function TransitaireNotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-notifications"],
    queryFn: () => fetchTransitaireNotifications(),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingState label="Chargement des notifications…" />;
  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />;
  }

  const notifications = data?.notifications ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <Bell className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Notifications
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Changements de statut et paiements récents de vos colis.</p>
      </div>

      {notifications.length === 0 && <EmptyState title="Aucune notification" description="Les événements récents apparaîtront ici." />}

      <div className="space-y-3">
        {notifications.map((n) => (
          <Card key={n.id}>
            <CardBody className="flex items-start gap-4 p-4">
              <span
                className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${
                  n.kind === "PAYMENT"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
                }`}
              >
                {n.kind === "PAYMENT" ? <CircleCheck className="size-5" /> : <MapPin className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 dark:text-white">{n.message}</p>
                {n.detail && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{n.detail}</p>}
                <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt, true)}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}