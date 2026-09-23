import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, FileText } from "lucide-react";
import { getDocuments } from "../api/endpoints";
import { Badge, Card, EmptyRow, PageHeader, Pagination, TableSkeleton, statusLabel, fmtDate, btnGhost, inputCls } from "../components/ui";
import type { DocumentStatus } from "../types";

const STATUSES: DocumentStatus[] = ["PENDING", "VERIFIED", "REJECTED"];

export default function DocumentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["documents", page, status],
    queryFn: () => getDocuments({ page, pageSize: 15, status: status || undefined }),
  });

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Pièces justificatives, factures et formulaires liés aux colis"
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      <Card
        title="Liste des documents"
        subtitle={data ? `${data.pagination.total} document(s) au total` : undefined}
        action={
          <select className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Tous les statuts</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        }
      >
        {isLoading ? <TableSkeleton rows={10} cols={5} /> : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-bold">Fichier</th>
                    <th className="py-2 pr-3 font-bold">Type</th>
                    <th className="py-2 pr-3 font-bold">Colis</th>
                    <th className="py-2 pr-3 font-bold">Déposé par</th>
                    <th className="py-2 pr-3 font-bold">Statut</th>
                    <th className="py-2 text-right font-bold">Déposé le</th>
                  </tr>
                </thead>
                <tbody>
                  {!data || data.documents.length === 0 ? <EmptyRow colSpan={6} /> : data.documents.map((d) => (
                    <tr key={d.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <FileText size={15} />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-xs font-semibold text-slate-800">{d.originalName}</p>
                            <p className="text-[10px] text-slate-400">{d.mimeType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3"><Badge value={d.type} /></td>
                      <td className="py-3 pr-3 font-mono text-xs font-bold text-blue-600">{d.shipment?.trackingNumber ?? "—"}</td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{d.user.name}</td>
                      <td className="py-3 pr-3"><Badge value={d.status} /></td>
                      <td className="py-3 text-right text-xs text-slate-500">{fmtDate(d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data ? <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} /> : null}
          </>
        )}
      </Card>
    </div>
  );
}