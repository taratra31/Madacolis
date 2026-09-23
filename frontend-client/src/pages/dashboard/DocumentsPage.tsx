import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { api } from "@/services/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, DOCUMENT_LABELS } from "@/utils";
import type { DocumentStatus } from "@/types";
import type { ShipmentDocument } from "@/types";

const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  VERIFIED: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-800",
  REJECTED: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
};

export function DocumentsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-documents"],
    queryFn: () => api<{ documents: ShipmentDocument[] }>("/documents"),
  });

  const documents = data?.documents ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mes documents</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Documents fournis pour vos envois et leur statut de vérification.</p>
      </div>

      {isLoading && <LoadingState label="Chargement des documents…" />}
      {isError && <ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} />}

      {!isLoading && !isError && documents.length === 0 && (
        <EmptyState
          title="Aucun document"
          description="Les documents liés à vos colis (pièce d'identité, facture…) apparaîtront ici."
        />
      )}

      {!isLoading && !isError && documents.length > 0 && (
        <Card>
          <CardBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{doc.originalName}</p>
                    <p className="text-xs text-slate-400">
                      {DOCUMENT_LABELS[doc.type]} · {doc.trackingNumber ?? "Sans colis"} · {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge className={DOCUMENT_STATUS_STYLES[doc.status]}>{doc.status}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}