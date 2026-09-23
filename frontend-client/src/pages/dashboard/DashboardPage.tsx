import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Boxes, PackageCheck, PackagePlus, PackageX, Search, Truck } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { api } from "@/services/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShipmentCard } from "@/components/tracking/ShipmentCard";
import { Button } from "@/components/ui/Button";
import type { ShipmentsResponse } from "@/types";

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-shipments", "summary"],
    queryFn: () => api<ShipmentsResponse>("/shipments", { params: { limit: 100 } }),
  });

  const shipments = data?.shipments ?? [];
  const inTransit = shipments.filter((s) => ["IN_TRANSIT", "OUT_FOR_DELIVERY", "IN_CUSTOMS", "RECEIVED"].includes(s.status)).length;
  const delivered = shipments.filter((s) => s.status === "DELIVERED").length;

  const stats = [
    { label: "Total des colis", value: data?.total ?? 0, icon: Boxes, chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
    { label: "En transit", value: inTransit, icon: Truck, chip: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
    { label: "Livrés", value: delivered, icon: PackageCheck, chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
    { label: "En attente", value: shipments.filter((s) => ["PENDING"].includes(s.status)).length, icon: PackageX, chip: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bonjour{user ? `, ${user.name.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Voici l'état de vos expéditions MadaColis.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-4 p-5">
              <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${stat.chip}`}>
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/dashboard/shipments/create">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-md shadow-blue-600/20 transition hover:shadow-lg">
            <div>
              <PackagePlus className="size-6" />
              <h2 className="mt-2 text-lg font-bold">Créer un envoi</h2>
              <p className="text-sm text-blue-100">Préparez votre prochain colis.</p>
            </div>
            <ArrowRight className="size-5" />
          </div>
        </Link>
        <Link to="/dashboard/tracking">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div>
              <Search className="size-6 text-brand-700 dark:text-brand-300" />
              <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Suivre un colis</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Consultez l'avancement en direct.</p>
            </div>
            <ArrowRight className="size-5 text-slate-400" />
          </div>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Dernières expéditions</h2>
          <Link to="/dashboard/shipments" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
            Tout voir <ArrowRight className="size-4" />
          </Link>
        </CardHeader>
        <CardBody className="space-y-3">
          {isLoading && <LoadingState label="Chargement des colis…" />}
          {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}
          {!isLoading && !isError && shipments.length === 0 && (
            <EmptyState
              title="Aucun colis pour le moment"
              description="Créez votre premier envoi pour commencer."
              action={
                <Link to="/dashboard/shipments/create">
                  <Button size="sm" variant="primary">
                    <PackagePlus className="size-4" /> Créer un envoi
                  </Button>
                </Link>
              }
            />
          )}
          {!isLoading && !isError && shipments.slice(0, 5).map((shipment) => <ShipmentCard key={shipment.id} shipment={shipment} />)}
        </CardBody>
      </Card>
    </div>
  );
}