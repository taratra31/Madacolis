import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldCheck, ShieldOff, Trash2, RefreshCw, UserCog } from "lucide-react";
import { deleteUser, getUsers, updateUserStatus } from "../api/endpoints";
import { Badge, Card, EmptyRow, Modal, PageHeader, Pagination, TableSkeleton, btnGhost, btnDanger, inputCls } from "../components/ui";
import type { Role } from "../types";

const ROLES: Role[] = ["CUSTOMER", "TRANSITAIRE", "AGENT", "ADMIN"];

export default function UsersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [target, setTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["users", page, debouncedQ, role],
    queryFn: () => getUsers({ page, pageSize: 15, q: debouncedQ || undefined, role: role || undefined }),
  });

  const toggleActive = useMutation({
    mutationFn: (u: { id: string; isActive: boolean }) => updateUserStatus(u.id, { isActive: u.isActive }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["users"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const changeRole = useMutation({
    mutationFn: (u: { id: string; role: Role }) => updateUserStatus(u.id, { role: u.role }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["users"] }),
  });

  const doDelete = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      setTarget(null);
      void qc.invalidateQueries({ queryKey: ["users"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérez les comptes, rôles et statuts des utilisateurs"
        actions={
          <>
            <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
          </>
        }
      />

      <Card
        title="Liste des utilisateurs"
        subtitle={data ? `${data.pagination.total} utilisateur(s) au total` : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputCls} w-52 pl-9`}
                placeholder="Rechercher nom / email…"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                  window.clearTimeout((window as never as { __t?: number }).__t);
                  (window as never as { __t?: number }).__t = window.setTimeout(() => setDebouncedQ(e.target.value), 350);
                }}
              />
            </div>
            <select className={`${inputCls} w-auto`} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
              <option value="">Tous les rôles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        }
      >
        {isLoading ? <TableSkeleton rows={10} cols={6} /> : error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-3 font-bold">Nom</th>
                    <th className="py-2 pr-3 font-bold">Contact</th>
                    <th className="py-2 pr-3 font-bold">Rôle</th>
                    <th className="py-2 pr-3 font-bold">Colis / Adresses</th>
                    <th className="py-2 pr-3 font-bold">Statut</th>
                    <th className="py-2 text-right font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data || data.users.length === 0) ? <EmptyRow colSpan={6} /> : data.users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-50 transition hover:bg-slate-50/70">
                      <td className="py-3 pr-3 font-semibold text-slate-900">{u.name}</td>
                      <td className="py-3 pr-3">
                        <p className="text-xs text-slate-600">{u.email ?? "—"}</p>
                        <p className="text-xs text-slate-400">{u.phone}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <select
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-500 disabled:opacity-50"
                          value={u.role}
                          disabled={changeRole.isPending}
                          onChange={(e) => void changeRole.mutate({ id: u.id, role: e.target.value as Role })}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="py-3 pr-3 text-xs text-slate-500">{u._count?.shipments ?? 0} / {u._count?.addresses ?? 0}</td>
                      <td className="py-3 pr-3">
                        <Badge value={u.isActive ? "ACTIF" : "INACTIF"} label={u.isActive ? "Actif" : "Inactif"} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title={u.isActive ? "Désactiver" : "Activer"}
                            disabled={toggleActive.isPending}
                            onClick={() => void toggleActive.mutate({ id: u.id, isActive: !u.isActive })}
                            className={`rounded-lg p-2 ${u.isActive ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"} transition`}
                          >
                            {u.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                          </button>
                          <button
                            title="Supprimer"
                            disabled={doDelete.isPending}
                            onClick={() => { setTarget({ id: u.id, name: u.name }); }}
                            className="rounded-lg p-2 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
        <Modal title="Supprimer l'utilisateur" subtitle="Action irréversible" onClose={() => { if (!doDelete.isPending) setTarget(null); }}>
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4">
            <UserCog size={20} className="mt-0.5 shrink-0 text-red-500" />
            <p className="text-sm text-slate-700">
              Voulez-vous vraiment supprimer <strong className="text-slate-900">{target.name}</strong> ? Toutes ses données associées seront perdues.
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button disabled={doDelete.isPending} onClick={() => setTarget(null)} className={btnGhost}>Annuler</button>
            <button disabled={doDelete.isPending} onClick={() => void doDelete.mutate(target.id)} className={btnDanger}>
              {doDelete.isPending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}