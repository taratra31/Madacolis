import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Search, UserRound, MapPin, Package, Mail, Phone, Crown } from "lucide-react";
import { getUsers } from "../api/endpoints";
import { Badge, Card, Pagination, TableSkeleton, fmtDate, btnGhost, inputCls } from "../components/ui";

const FILTERS = [
  { key: "", label: "Tous", icon: UserRound },
  { key: "CUSTOMER", label: "Clients", icon: Package },
  { key: "AGENT", label: "Agents", icon: Crown },
] as const;

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("CUSTOMER");

  // Les `q` de la recherche sont transmis tels quels (pas de debounce pour rester simple)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["clients", page, role],
    queryFn: () => getUsers({ page, pageSize: 15, role: role || undefined }),
  });

  const filtered = data?.users.filter((u) => {
    if (!q.trim()) return true;
    const n = `${u.name} ${u.email ?? ""} ${u.phone}`.toLowerCase();
    return n.includes(q.toLowerCase());
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Clients & Tiers</h1>
          <p className="mt-0.5 text-sm text-slate-500">Base des clients, agents et leurs activités</p>
        </div>
        <button className={btnGhost} onClick={() => void refetch()}><RefreshCw size={16} /> Actualiser</button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setRole(f.key); setPage(1); }}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                role === f.key ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <f.icon size={14} /> {f.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className={`${inputCls} pl-9`} placeholder="Filtrer par nom, email ou téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {isLoading ? <TableSkeleton rows={10} cols={6} /> : error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">Erreur de chargement.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(filtered ?? []).map((u) => (
              <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    u.role === "AGENT" ? "bg-gradient-to-br from-orange-400 to-rose-500" : u.role === "ADMIN" ? "bg-gradient-to-br from-purple-500 to-fuchsia-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}>
                    {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">{u.name}</p>
                    <p className="flex items-center gap-1 truncate text-[11px] text-slate-400"><Mail size={11} /> {u.email ?? "—"}</p>
                    <p className="flex items-center gap-1 truncate text-[11px] text-slate-400"><Phone size={11} /> {u.phone}</p>
                  </div>
                  <Badge value={u.role} label={u.role} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-extrabold text-slate-900">{u._count?.shipments ?? 0}</p>
                    <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><Package size={10} /> Colis</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-extrabold text-slate-900">{u._count?.addresses ?? 0}</p>
                    <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><MapPin size={10} /> Adresses</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-sm font-extrabold text-slate-900">{u.isActive ? "Oui" : "Non"}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Actif</p>
                  </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400">Inscrit le {fmtDate(u.createdAt)}</p>
              </div>
            ))}
            {(filtered ?? []).length === 0 ? <Card className="sm:col-span-2 xl:col-span-3"><p className="py-6 text-center text-sm text-slate-400">Aucun résultat.</p></Card> : null}
          </div>
          {data && (filtered?.length ?? 0) > 0 ? (
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onChange={setPage} />
          ) : null}
        </>
      )}
    </div>
  );
}