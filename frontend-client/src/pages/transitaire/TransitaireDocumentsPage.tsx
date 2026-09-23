import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { fetchTransitaireDocuments } from "@/services/transitaire";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/utils";
import type { DocumentStatus, DocumentType } from "@/types";

const TYPE_LABELS: Record<DocumentType, string> = {
  IDENTITY: "Pièce d'identité",
  INVOICE: "Facture",
  PROOF_OF_ADDRESS: "Justificatif de domicile",
  CUSTOMS_FORM: "Formulaire douanier",
};

const STATUS_STYLES: Record<DocumentStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-800",
  VERIFIED: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-800",
  REJECTED: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-300 dark:ring-red-800",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifié",
  REJECTED: "Rejeté",
};

export function TransitaireDocumentsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["transitaire-documents", page],
    queryFn: () => fetchTransitaireDocuments({ page, pageSize: limit }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.pagination.total / limit)) : 1;
  const documents = data?.documents ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Documents</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Pièces justificatives et formulaires liés à vos colis.</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Tous les documents</h2>
          <span className="text-xs font-medium text-slate-400">{documents.length} sur {data?.pagination.total ?? 0}</span>
        </CardHeader>
        <CardBody className="overflow-x-auto p-0">
          {isLoading && <div className="p-6"><LoadingState label="Chargement des documents…" /></div>}
          {isError && <div className="p-6"><ErrorState message={error instanceof Error ? error.message : "Erreur"} onRetry={() => void refetch()} /></div>}
          {!isLoading && !isError && documents.length === 0 && (
            <div className="p-6">
              <EmptyState title="Aucun document" description="Les documents associés à vos expéditions apparaîtront ici." />
            </div>
          )}
          {!isLoading && !isError && documents.length > 0 && (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-5 py-3 font-semibold">Document</th>
                  <th className="px-5 py-3 font-semibold">Colis</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((d) => (
                  <tr key={d.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-5 py-4">
                      <FileText className="mr-2 inline size-4 text-slate-400" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {TYPE_LABELS[d.type]} <span className="text-xs font-normal text-slate-400">· {d.originalName}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-brand-700 dark:text-brand-300">{d.trackingNumber}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{formatDate(d.createdAt, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {data && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-slate-500">
            Page {page} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}