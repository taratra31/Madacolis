import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Contact as ContactIcon, Phone, Mail, Building2 } from "lucide-react";
import { getUsers } from "../api/endpoints";
import { Badge, Card, PageHeader, Spinner, inputCls } from "../components/ui";

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => getUsers({ page: 1, pageSize: 200 }),
  });

  const contacts = useMemo(() => {
    const list = data?.users ?? [];
    if (!q.trim()) return list;
    const n = q.toLowerCase();
    return list.filter((u) => `${u.name} ${u.email ?? ""} ${u.phone}`.toLowerCase().includes(n));
  }, [data, q]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof contacts>();
    for (const c of contacts) {
      const key = c.role;
      const arr = map.get(key) ?? [];
      arr.push(c);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [contacts]);

  const initials = (name: string) =>
    name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  const roleColor: Record<string, string> = {
    CUSTOMER: "from-blue-500 to-indigo-600",
    AGENT: "from-orange-400 to-rose-500",
    ADMIN: "from-purple-500 to-fuchsia-500",
    TRANSITAIRE: "from-sky-500 to-cyan-600",
  };

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="Carnet d'adresses de tous les acteurs de la plateforme"
        actions={
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className={`${inputCls} w-64 pl-9`} placeholder="Rechercher un contact…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        }
      />

      {isLoading ? <Spinner /> : error ? (
        <p className="text-sm font-semibold text-red-600">Erreur de chargement. <button className="underline" onClick={() => void refetch()}>Réessayer</button></p>
      ) : groups.length === 0 ? (
        <Card><p className="py-6 text-center text-sm text-slate-400">Aucun contact trouvé.</p></Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([role, list]) => (
            <div key={role}>
              <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <ContactIcon size={13} /> {role} · {list.length}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white ${roleColor[c.role] ?? "from-slate-400 to-slate-500"}`}>
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="flex items-center gap-1 truncate text-[11px] text-slate-400"><Mail size={11} /> {c.email ?? "—"}</p>
                      <p className="flex items-center gap-1 truncate text-[11px] text-slate-400"><Phone size={11} /> {c.phone} {c.role === "TRANSITAIRE" && c.carrierId ? <span className="ml-1 flex items-center gap-0.5 text-slate-300"><Building2 size={10} /> {c.carrierId}</span> : null}</p>
                    </div>
                    <Badge value={c.role} label={c.role} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}