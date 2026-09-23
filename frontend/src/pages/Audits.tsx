import { Fragment, useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";

type AuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string | null; email: string | null } | null;
};

export default function Audits() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ audits: AuditRow[] }>("/admin/audits", { params: { action, pageSize: 100 } });
      setAudits(data.audits);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Journal d'audit</h1>
          <p className="mt-0.5 text-sm text-slate-500">Traçabilité de toutes les actions sensibles.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 ring-inset">
          {audits.length} entrée{audits.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="Filtrer par action (ex: ADMIN, AUTH)…"
          className="input w-full sm:w-72"
        />
      </div>

      {error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Action</th>
                <th className="th">Entité</th>
                <th className="th">Utilisateur</th>
                <th className="th">IP</th>
                <th className="th">Date</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {audits.map((a) => (
                <Fragment key={a.id}>
                  <tr className={`transition hover:bg-slate-50/70 ${expanded === a.id ? "bg-slate-50/50" : ""}`}>
                    <td className="td font-mono text-xs font-semibold text-emerald-700">{a.action}</td>
                    <td className="td">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{a.entityType}</span>
                      <span className="ml-1.5 text-xs text-slate-400">{a.entityId.slice(0, 8)}…</span>
                    </td>
                    <td className="td text-xs font-medium text-slate-700">{a.user?.name ?? "Système"}</td>
                    <td className="td font-mono text-xs text-slate-500">{a.ipAddress ?? "—"}</td>
                    <td className="td text-xs text-slate-500">{new Date(a.createdAt).toLocaleString("fr-FR")}</td>
                    <td className="td whitespace-nowrap text-right">
                      <button
                        onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        {expanded === a.id ? "Masquer" : "Détails"}
                      </button>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-2 text-xs sm:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Avant</div>
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-slate-700">{JSON.stringify(a.oldValues ?? {}, null, 2)}</pre>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                            <div className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">Après</div>
                            <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-slate-700">{JSON.stringify(a.newValues ?? {}, null, 2)}</pre>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!loading && audits.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">Aucune entrée d'audit</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}