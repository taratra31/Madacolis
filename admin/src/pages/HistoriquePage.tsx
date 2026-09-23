import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search, History as HistoryIcon } from "lucide-react";
import { getShipments } from "../api/endpoints";
import { Badge, Card, EmptyRow, PageHeader, Pagination, TableSkeleton, fmtDate, fmtMoney, btnGhost, inputCls } from "../components/ui";

export default function HistoriquePage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"DELIVERED" | "CANCELLED">("DELIVERED");
  const [debouncedQ, setDebouncedQ] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["historique", page, tab, debouncedQ],
    queryFn: () => getShipments({ page, pageSize: 15, status: tab, q: debouncedQ || undefined }),
  });

  return (
    <div>
      <PageHeader
        title="Historique"
        subtitle="Colis livrés et annulés, archives de la plateforme"
        actions={<button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {(["DELIVERED", "CANCELLED"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${tab === t ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow" : "text-slate-500 hover:bg-slate-50"}`}
            >
              {t === "DELIVERED" ? "Livrés" : "Annulés"}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} w-60 pl-9`}
            placeholder="N° de suivi…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
              window.clearTimeout((window as never as { __h?: number }).__h);
              (window as never as { __h?: number }).__h = window.setTimeout(() => setDebouncedQ(e.target.value), 350);
            }}
          />
        </div>
      </div>

      <Card title="Archives" subtitle={data ? `${data.pagination.total} colis au total` : undefined} action={<HistoryIcon size={16} className="text-slate-400" />}>
        {isLoading ? <TableSkeleton rows={10} cols={6} /> : error ? (
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
                    <th className="py-2 pr-3 font-bold">Prix</th>
                    <th className="py-2 pr-3 font-bold">Statut</th>
                    <th className="py-2 text-right font-bold">Créé le</th>
                  </tr>
                </thead>
                <tbody>
                  {!data || data.shipments.length === 0 ? <EmptyRow colSpan={6} /> : data.shipments.map((sh) => (
                    <tr key={sh.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-mono text-xs font-bold text-blue-600">{sh.trackingNumber}</td>
                      <td className="py-3 pr-3">
                        <p className="text-xs font-semibold text-slate-800">{sh.user.name}</p>
                        <p className="text-xs text-slate-400">{sh.user.phone ?? ""}</p>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-600">{sh.originCity} → {sh.destinationCity}</td>
                      <td className="py-3 pr-3 text-xs font-medium text-slate-700">{fmtMoney(sh.estimatedPrice, sh.currency)}</td>
                      <td className="py-3 pr-3"><Badge value={sh.status} /></td>
                      <td className="py-3 text-right text-xs text-slate-500">{fmtDate(sh.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data ? <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} /> : null}
          </>
        )}
      </Card>

      {data?.shipments.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">Aucun colis {tab === "DELIVERED" ? "livré" : "annulé"} pour le moment.</p>
      )}
    </div>
  );
}