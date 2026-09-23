import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/utils";
import type { ShipmentsResponse } from "@/types";

export function DashboardTrackingPage() {
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-shipments", "dropdown"],
    queryFn: () => api<ShipmentsResponse>("/shipments", { params: { limit: 50 } }),
  });

  const shipments = data?.shipments ?? [];
  const match = submitted && shipments.find((s) => s.trackingNumber.toLowerCase().includes(submitted.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suivi de colis</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Retrouvez rapidement un de vos envois par numéro de tracking.</p>
      </div>

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" size={18} />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setSubmitted(code.trim())}
              placeholder="MD-FR-2026-000001"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 font-mono text-sm placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <Button onClick={() => setSubmitted(code.trim())}>Rechercher</Button>
        </CardBody>
      </Card>

      <div>
        {isLoading && <LoadingState label="Chargement de vos colis…" />}
        {!isLoading && (
          <div className="grid gap-3 sm:grid-cols-2">
            {shipments.map((shipment) => {
              const active = submitted === shipment.trackingNumber;
              return (
                <Link
                  key={shipment.id}
                  to={`/dashboard/shipments/${shipment.id}`}
                  className={`rounded-2xl border bg-white p-4 transition hover:shadow-md dark:bg-slate-900 ${
                    active ? "border-blue-500 shadow-md" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-bold text-brand-800 dark:text-brand-300">{shipment.trackingNumber}</span>
                    <StatusBadge value={shipment.status} />
                  </div>
                  <p className="mt-2 truncate text-sm text-slate-600 dark:text-slate-300">
                    {shipment.originCity} → {shipment.destinationCity}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(shipment.createdAt)}</p>
                </Link>
              );
            })}
            {shipments.length === 0 && (
              <div className="sm:col-span-2">
                <ErrorState title="Aucun colis" message="Vous n'avez pas encore d'envoi à suivre." onRetry={() => undefined} />
              </div>
            )}
          </div>
        )}
      </div>

      {match && (
        <div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="text-sm">
            <p className="font-semibold text-blue-700 dark:text-blue-300">"{submitted}" correspond à votre colis</p>
          </div>
          <Link to={`/dashboard/shipments/${match.id}`}>
            <Button size="sm">
              Voir le détail <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}