import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import StatusBadge from "../components/StatusBadge";

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  country: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { shipments: number; addresses: number };
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ users: UserRow[] }>("/admin/users", { params: { q, role, pageSize: 100 } });
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [q, role]);

  useEffect(() => {
    load();
  }, [load]);

  const updateField = async (id: string, field: "role" | "isActive", value: string | boolean) => {
    setSaving(id);
    try {
      await api(`/admin/users/${id}`, { method: "PUT", body: { [field]: value } });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  };

  const removeUser = async (u: UserRow) => {
    if (!confirm(`Supprimer définitivement « ${u.name} » (${u.email ?? u.phone}) ?\nSes adresses, colis et paiements seront supprimés.`)) return;
    setSaving(u.id);
    try {
      await api(`/admin/users/${u.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Utilisateurs</h1>
          <p className="mt-0.5 text-sm text-slate-500">Gérez les rôles et l'activation des comptes.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 ring-inset">
          {users.length} compte{users.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher (nom, email, téléphone)…" className="input w-full sm:w-72" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="select">
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Admin</option>
          <option value="AGENT">Agent</option>
          <option value="CUSTOMER">Client</option>
        </select>
      </div>

      {error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Utilisateur</th>
                <th className="th">Rôle</th>
                <th className="th">Localisation</th>
                <th className="th">Colis</th>
                <th className="th">Actif</th>
                <th className="th">Inscrit le</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50/70">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-xs font-bold text-slate-700">
                        {u.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{u.name}</div>
                        <div className="text-xs text-slate-500">{u.email ?? u.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <select
                      value={u.role}
                      disabled={saving === u.id}
                      onChange={(e) => updateField(u.id, "role", e.target.value)}
                      className="select h-8 rounded-lg py-0 text-xs font-semibold"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="td text-xs">{u.city ?? "—"}, {u.country ?? "—"}</td>
                  <td className="td">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{u._count.shipments}</span>
                  </td>
                  <td className="td">
                    <button disabled={saving === u.id} onClick={() => updateField(u.id, "isActive", !u.isActive)}>
                      <StatusBadge value={u.isActive} />
                    </button>
                  </td>
                  <td className="td text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="td whitespace-nowrap text-right">
                    <button
                      disabled={saving === u.id || u.id === currentUser?.id}
                      onClick={() => removeUser(u)}
                      title={u.id === currentUser?.id ? "Impossible de supprimer votre propre compte" : "Supprimer définitivement"}
                      className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Aucun utilisateur</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {!loading && users.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-400">
            {users.length} ligne{users.length > 1 ? "s" : ""} affichée{users.length > 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}