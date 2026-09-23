import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../lib/api";
import Modal from "../components/Modal";

type Rule = {
  id: string;
  name: string;
  originCountry: string;
  destinationCountry: string;
  serviceType: string;
  basePrice: string;
  pricePerKg: string;
  pricePerKm: string | null;
  minimumPrice: string;
  currency: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  originCountry: "",
  destinationCountry: "",
  serviceType: "STANDARD",
  basePrice: "",
  pricePerKg: "",
  pricePerKm: "",
  minimumPrice: "",
  currency: "EUR",
  isActive: true,
};

export default function Pricing() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ rules: Rule[] }>("/admin/pricing-rules");
      setRules(data.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key: keyof typeof emptyForm, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (r: Rule) => {
    setEditing(r);
    setForm({
      name: r.name,
      originCountry: r.originCountry,
      destinationCountry: r.destinationCountry,
      serviceType: r.serviceType,
      basePrice: r.basePrice,
      pricePerKg: r.pricePerKg,
      pricePerKm: r.pricePerKm ?? "",
      minimumPrice: r.minimumPrice,
      currency: r.currency,
      isActive: r.isActive,
    });
    setModalOpen(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        basePrice: Number(form.basePrice),
        pricePerKg: Number(form.pricePerKg),
        pricePerKm: form.pricePerKm === "" ? null : Number(form.pricePerKm),
        minimumPrice: Number(form.minimumPrice),
      };
      if (editing) {
        await api(`/admin/pricing-rules/${editing.id}`, { method: "PUT", body });
      } else {
        await api("/admin/pricing-rules", { method: "POST", body });
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Rule) => {
    if (!confirm(`Supprimer la règle « ${r.name} » ?`)) return;
    try {
      await api(`/admin/pricing-rules/${r.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Règles tarifaires</h1>
          <p className="mt-0.5 text-sm text-slate-500">Formule : base + (poids × prix/kg) + (distance × prix/km)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 ring-inset">
            {rules.length} règle{rules.length > 1 ? "s" : ""}
          </span>
          <button onClick={openCreate} className="btn-primary">
            <span className="text-lg leading-none">+</span> Nouvelle règle
          </button>
        </div>
      </div>

      {error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Nom</th>
                <th className="th">Route</th>
                <th className="th">Service</th>
                <th className="th">Base</th>
                <th className="th">Prix/kg</th>
                <th className="th">Prix/km</th>
                <th className="th">Minimum</th>
                <th className="th">Actif</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rules.map((r) => (
                <tr key={r.id} className="transition hover:bg-slate-50/70">
                  <td className="td font-semibold text-slate-800">{r.name}</td>
                  <td className="td text-xs">{r.originCountry} → {r.destinationCountry}</td>
                  <td className="td">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{r.serviceType}</span>
                  </td>
                  <td className="td">{r.basePrice}</td>
                  <td className="td">{r.pricePerKg}</td>
                  <td className="td">{r.pricePerKm ?? "—"}</td>
                  <td className="td">{r.minimumPrice}</td>
                  <td className="td">{r.isActive ? "Oui" : "Non"}</td>
                  <td className="td whitespace-nowrap text-right">
                    <button onClick={() => openEdit(r)} className="mr-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
                      Modifier
                    </button>
                    <button onClick={() => remove(r)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700">
                      Suppr.
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rules.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">Aucune règle tarifaire</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Modifier la règle" : "Nouvelle règle tarifaire"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">Annuler</button>
            <button type="submit" form="pricing-form" disabled={saving} className="btn-primary">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        <form id="pricing-form" onSubmit={submit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nom</label>
            <input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Pays d'origine</label>
            <input className="input" value={form.originCountry} onChange={(e) => set("originCountry", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Pays de destination</label>
            <input className="input" value={form.destinationCountry} onChange={(e) => set("destinationCountry", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Service</label>
            <select className="select" value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)}>
              <option value="STANDARD">STANDARD</option>
              <option value="EXPRESS">EXPRESS</option>
              <option value="ECONOMY">ECONOMY</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Devise</label>
            <select className="select" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              <option value="EUR">EUR</option>
              <option value="MGA">MGA</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Prix de base</label>
            <input type="number" step="0.01" className="input" value={form.basePrice} onChange={(e) => set("basePrice", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Prix / kg</label>
            <input type="number" step="0.01" className="input" value={form.pricePerKg} onChange={(e) => set("pricePerKg", e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Prix / km (optionnel)</label>
            <input type="number" step="0.01" className="input" value={form.pricePerKm} onChange={(e) => set("pricePerKm", e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Prix minimum</label>
            <input type="number" step="0.01" className="input" value={form.minimumPrice} onChange={(e) => set("minimumPrice", e.target.value)} required />
          </div>
          <label className="col-span-2 mt-1 flex items-center gap-2.5 text-sm text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-emerald-600 focus:ring-emerald-500" />
            Règle active
          </label>
        </form>
      </Modal>
    </div>
  );
}