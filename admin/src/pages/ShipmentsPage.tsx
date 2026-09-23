import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, RefreshCw, PackageCheck } from "lucide-react";
import { getShipments, updateShipmentStatus } from "../api/endpoints";
import { Badge, Card, EmptyRow, Field, Modal, PageHeader, Pagination, TableSkeleton, statusLabel, fmtDate, fmtMoney, btnGhost, btnPrimary, inputCls } from "../components/ui";
import type { ShipmentStatus } from "../types";

const STATUSES: ShipmentStatus[] = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function ShipmentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState("");
  const [target, setTarget] = useState<{ id: string; number: string; status: ShipmentStatus } | null>(null);
  const [newStatus, setNewStatus] = useState<ShipmentStatus>("RECEIVED");
  const [comment, setComment] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["shipments", page, debouncedQ, status],
    queryFn: () => getShipments({ page, pageSize: 15, q: debouncedQ || undefined, status: status || undefined }),
  });

  const update = useMutation({
    mutationFn: (p: { id: string; status: ShipmentStatus; comment?: string }) => updateShipmentStatus(p.id, p.status, p.comment),
    onSuccess: () => {
      setTarget(null);
      setComment("");
      void qc.invalidateQueries({ queryKey: ["shipments"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Colis"
        subtitle="Gérez les colis et mettez à jour leur statut"
        actions={
          <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
        }
      />

      <Card
        title="Liste des colis"
        subtitle={data ? `${data.pagination.total} colis au total` : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputCls} w-48 pl-9`}
                placeholder="N° de suivi…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                  window.clearTimeout((window as never as { __st?: number }).__st);
                  (window as never as { __st?: number }).__st = window.setTimeout(() => setDebouncedQ(e.target.value), 350);
                }}
              />
            </div>
            <select className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">Tous les statuts</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
        }
      >
        {isLoading ? <TableSkeleton rows={10} cols={8} /> : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-bold">N° suivi</th>
                    <th className="py-2 pr-3 font-bold">Client</th>
                    <th className="py-2 pr-3 font-bold">Trajet</th>
                    <th className="py-2 pr-3 font-bold">Service</th>
                    <th className="py-2 pr-3 font-bold">Prix est.</th>
                    <th className="py-2 pr-3 font-bold">Statut</th>
                    <th className="py-2 pr-3 font-bold">Créé</th>
                    <th className="py-2 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!data || data.shipments.length === 0 ? <EmptyRow colSpan={8} /> : data.shipments.map((sh) => (
                    <tr key={sh.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-mono text-xs font-bold text-blue-600">{sh.trackingNumber}</td>
                      <td className="py-3 pr-3">
                        <p className="text-xs font-semibold text-slate-800">{sh.user.name}</p>
                        <p className="text-xs text-slate-400">{sh.user.phone ?? sh.user.email ?? ""}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{sh.originCity}, {sh.originCountry} → {sh.destinationCity}, {sh.destinationCountry}</td>
                      <td className="py-3 pr-3"><Badge value={sh.serviceType} /></td>
                      <td className="py-3 pr-3 text-xs font-medium text-slate-700">{fmtMoney(sh.estimatedPrice, sh.currency)}</td>
                      <td className="py-3 pr-3"><Badge value={sh.status} /></td>
                      <td className="py-3 pr-3 text-xs text-slate-500">{fmtDate(sh.createdAt)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => { setTarget({ id: sh.id, number: sh.trackingNumber, status: sh.status }); setNewStatus(sh.status); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <PackageCheck size={14} /> Mettre à jour
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data ? <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} /> : null}
          </>
        )}
      </Card>

      {target ? (
        <Modal title={`Statut du colis ${target.number}`} subtitle="Le changement est enregistré dans l'historique de suivi" onClose={() => { if (!update.isPending) { setTarget(null); setComment(""); } }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Statut actuel</span>
              <Badge value={target.status} />
            </div>
            <Field label="Nouveau statut">
              <select className={inputCls} value={newStatus} onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}>
                {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
            </Field>
            <Field label="Commentaire" hint="facultatif">
              <textarea className={inputCls} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ex : colis reçu à Antananarivo…" />
            </Field>
            <div className="flex justify-end gap-2">
              <button disabled={update.isPending} onClick={() => { setTarget(null); setComment(""); }} className={btnGhost}>Annuler</button>
              <button
                disabled={update.isPending || newStatus === target.status}
                onClick={() => void update.mutate({ id: target.id, status: newStatus, comment: comment.trim() || undefined })}
                className={btnPrimary}
              >
                {update.isPending ? "Enregistrement…" : "Enregistrer le statut"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}