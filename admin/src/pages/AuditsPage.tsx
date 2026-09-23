import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, ShieldCheck, Search } from "lucide-react";
import { getAudits } from "../api/endpoints";
import { Card, EmptyRow, PageHeader, Pagination, TableSkeleton, btnGhost, fmtDate, inputCls } from "../components/ui";

export default function AuditsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [debouncedAction, setDebouncedAction] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["audits", page, debouncedAction],
    queryFn: () => getAudits({ page, pageSize: 20, action: debouncedAction || undefined }),
  });

  return (
    <div>
      <PageHeader
        title="Journal d'audit"
        subtitle="Trace de toutes les actions administratives"
        actions={
          <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
        }
      />

      <Card
        title="Historique des actions"
        subtitle={data ? `${data.pagination.total} événement(s) journalisé(s)` : undefined}
        action={
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className={`${inputCls} w-56 pl-9`}
              placeholder="Filtrer par action (SHIPMENT_UPDATE…)…"
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(1);
                window.clearTimeout((window as never as { __a?: number }).__a);
                (window as never as { __a?: number }).__a = window.setTimeout(() => setDebouncedAction(e.target.value), 350);
              }}
            />
          </div>
        }
      >
        {isLoading ? <TableSkeleton rows={12} cols={6} /> : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-bold">Action</th>
                    <th className="py-2 pr-3 font-bold">Admin</th>
                    <th className="py-2 pr-3 font-bold">Entité</th>
                    <th className="py-2 pr-3 font-bold">IP</th>
                    <th className="py-2 pr-3 font-bold">Détails</th>
                    <th className="py-2 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {!data || data.audits.length === 0 ? <EmptyRow colSpan={6} text="Aucun événement enregistré." /> : data.audits.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2 py-1 font-mono text-[11px] font-bold text-slate-700">
                          <ShieldCheck size={12} className="text-slate-400" />
                          {a.action}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-xs font-medium text-slate-700">{a.user?.name ?? "—"}</td>
                      <td className="py-3 pr-3 text-xs text-slate-500">{a.entity}{a.entityId ? ` #${a.entityId.slice(0, 8)}` : ""}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-400">{a.ip ?? "—"}</td>
                      <td className="py-3 pr-3">
                        {a.metadata ? <pre className="max-w-[260px] truncate text-[11px] text-slate-400">{JSON.stringify(a.metadata)}</pre> : <span className="text-xs text-slate-300">—</span>}
                      </td>
                      <td className="py-3 text-xs text-slate-500">{fmtDate(a.createdAt)}</td>
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