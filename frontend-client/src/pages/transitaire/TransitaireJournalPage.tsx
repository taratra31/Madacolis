import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Globe } from "lucide-react";
import { fetchTransitaireActivity } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/utils";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Création",
  UPDATE: "Mise à jour",
  DELETE: "Suppression",
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  UPDATE: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function TransitaireJournalPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-journal"],
    queryFn: () => fetchTransitaireActivity(),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingState label="Chargement du journal d'activité…" />;
  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />;
  }

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          <ClipboardList className="mr-2 inline size-6 text-indigo-600 dark:text-indigo-400" />
          Journal d'activité
        </h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Traçabilité des actions effectuées sur vos colis.</p>
      </div>

      {logs.length === 0 && <EmptyState title="Aucune action journalisée" description="Les actions sur vos colis seront enregistrées ici." />}

      {logs.length > 0 && (
        <div className="relative space-y-4 before:absolute before:inset-y-2 before:left-[19px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-4">
              <span
                className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  ACTION_COLORS[l.action] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {(ACTION_LABELS[l.action] ?? l.action).slice(0, 1)}
              </span>
              <Card className="min-w-0 flex-1">
                <CardBody className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {ACTION_LABELS[l.action] ?? l.action}
                      {l.user?.name ? <span className="font-normal text-slate-500"> · {l.user.name}</span> : null}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(l.createdAt, true)}</p>
                  </div>
                  <p className="mt-1 font-mono text-xs text-brand-700 dark:text-brand-300">{l.entityId}</p>
                  {l.newValues ? (
                    <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                      {String(JSON.stringify(l.newValues, null, 2))}
                    </pre>
                  ) : null}
                  {l.ipAddress && (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400">
                      <Globe className="size-3" /> {l.ipAddress}
                    </p>
                  )}
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}