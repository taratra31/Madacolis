import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { confirmPayment, getPayments } from "../api/endpoints";
import { Badge, Card, EmptyRow, PageHeader, Pagination, TableSkeleton, statusLabel, fmtDate, fmtMoney, btnGhost, btnPrimary, inputCls } from "../components/ui";

const STATUSES = ["ALL", "PAID", "UNPAID", "REFUNDED", "FAILED"];
const PROVIDERS = ["ALL", "MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY", "TELEMONEY", "CARD", "CASH"];

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [provider, setProvider] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["payments", page, status, provider],
    queryFn: () => getPayments({
      page,
      pageSize: 15,
      status: status && status !== "ALL" ? status : undefined,
      provider: provider && provider !== "ALL" ? provider : undefined,
    }),
  });

  const confirm = useMutation({
    mutationFn: confirmPayment,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle="Historique des paiements encaissés"
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      <Card
        title="Transactions"
        subtitle={data ? `${data.pagination.total} paiement(s) au total` : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              {STATUSES.map((s) => <option key={s} value={s}>{s === "ALL" ? "Tous les statuts" : statusLabel(s)}</option>)}
            </select>
            <select className={`${inputCls} w-auto`} value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1); }}>
              {PROVIDERS.map((p) => <option key={p} value={p}>{p === "ALL" ? "Tous les fournisseurs" : statusLabel(p)}</option>)}
            </select>
          </div>
        }
      >
        {isLoading ? <TableSkeleton rows={10} cols={7} /> : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-bold">Référence</th>
                    <th className="py-2 pr-3 font-bold">Client</th>
                    <th className="py-2 pr-3 font-bold">Colis</th>
                    <th className="py-2 pr-3 font-bold">Montant</th>
                    <th className="py-2 pr-3 font-bold">Fournisseur</th>
                    <th className="py-2 pr-3 font-bold">Statut</th>
                    <th className="py-2 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {!data || data.payments.length === 0 ? <EmptyRow colSpan={7} /> : data.payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-mono text-xs font-bold text-slate-700">{p.transactionId ?? p.id.slice(0, 10)}</td>
                      <td className="py-3 pr-3">
                        <p className="text-xs font-semibold text-slate-800">{p.user.name}</p>
                        <p className="text-xs text-slate-400">{p.user.email ?? ""}</p>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-600">{p.shipment?.trackingNumber ?? "—"}</td>
                      <td className="py-3 pr-3 font-bold text-slate-900">{fmtMoney(p.amount, p.currency)}</td>
                      <td className="py-3 pr-3"><Badge value={p.provider} /></td>
                      <td className="py-3 pr-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge value={p.status} />
                          {p.status === "PENDING" && (
                            <button
                              className={`${btnPrimary} inline-flex items-center gap-1 !px-2 !py-1 text-[11px]`}
                              onClick={() => confirm.mutate(p.id)}
                              disabled={confirm.isPending}
                            >
                              <CheckCircle2 size={12} /> Confirmer
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-xs text-slate-500">{fmtDate(p.createdAt)}</td>
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