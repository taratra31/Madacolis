import { useQuery } from "@tanstack/react-query";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { fetchTransitaireTeam } from "@/services/transitaire";
import { Card, CardBody } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, initialsOf } from "@/utils";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  AGENT: "Agent",
  TRANSITAIRE: "Transitaire",
  CUSTOMER: "Client",
};

const AVATAR_COLORS = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
];

export function TransitaireTeamPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-team"],
    queryFn: () => fetchTransitaireTeam(),
  });

  if (isLoading) return <LoadingState label="Chargement de l'équipe…" />;
  if (isError) {
    return <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />;
  }

  const team = data?.team ?? [];
  const active = team.filter((m) => m.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Équipe</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          {team.length} membre{team.length > 1 ? "s" : ""} · {active} actif{active > 1 ? "s" : ""}
        </p>
      </div>

      {team.length === 0 && (
        <EmptyState title="Aucun membre" description="Les comptes rattachés à votre agence apparaîtront ici." />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {team.map((m, i) => (
          <Card key={m.id}>
            <CardBody className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                >
                  {initialsOf(m.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-bold text-slate-900 dark:text-white">{m.name}</p>
                    {m.role === "TRANSITAIRE" && <ShieldCheck className="size-4 text-indigo-500" />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABELS[m.role] ?? m.role}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    m.isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${m.isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {m.isActive ? "Actif" : "Inactif"}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {m.email && (
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="size-4 shrink-0 text-slate-400" /> {m.email}
                  </p>
                )}
                {m.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="size-4 shrink-0 text-slate-400" /> {m.phone}
                  </p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">Colis traités : <b className="text-slate-900 dark:text-white">{m.shipments}</b></span>
                <span className="text-slate-400">dépuis le {formatDate(m.createdAt)}</span>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}