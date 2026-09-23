import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import StatusBadge from "../components/StatusBadge";
import Modal from "../components/Modal";

type ShipmentRow = {
  id: string;
  trackingNumber: string;
  originCountry: string;
  originCity: string;
  destinationCountry: string;
  destinationCity: string;
  serviceType: string;
  status: string;
  totalWeight: string;
  estimatedPrice: string;
  currency: string;
  estimatedDeliveryDate: string | null;
  createdAt: string;
  user: { name: string; email: string | null; phone: string };
};

const statuses = ["PENDING", "RECEIVED", "IN_TRANSIT", "IN_CUSTOMS", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"];

export default function Shipments() {
  const [shipments, setShipments] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<ShipmentRow | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ shipments: ShipmentRow[] }>("/admin/shipments", { params: { q, status, pageSize: 100 } });
      setShipments(data.shipments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    load();
  }, [load]);

  const openModal = (s: ShipmentRow) => {
    setSelected(s);
    setNewStatus(s.status);
    setComment("");
  };

  const saveStatus = async () => {
    if (!selected || !newStatus) return;
    setSaving(true);
    try {
      await api(`/admin/shipments/${selected.id}/status`, { method: "PUT", body: { status: newStatus, comment } });
      setSelected(null);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Colis</h1>
          <p className="mt-0.5 text-sm text-slate-500">Suivez et mettez à jour l'état des expéditions.</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200 ring-inset">
          {shipments.length} colis
        </span>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Numéro de tracking…" className="input w-full sm:w-64" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select">
          <option value="">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Tracking</th>
                <th className="th">Trajet</th>
                <th className="th">Service</th>
                <th className="th">Poids</th>
                <th className="th">Prix estimé</th>
                <th className="th">Statut</th>
                <th className="th">Client</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {shipments.map((s) => (
                <tr key={s.id} className="transition hover:bg-slate-50/70">
                  <td className="td font-mono text-xs font-semibold text-emerald-700">{s.trackingNumber}</td>
                  <td className="td text-xs">
                    <div className="font-medium text-slate-700">{s.originCity}</div>
                    <div className="text-slate-400">→ {s.destinationCity}</div>
                  </td>
                  <td className="td">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{s.serviceType}</span>
                  </td>
                  <td className="td">{Number(s.totalWeight).toFixed(1)} kg</td>
                  <td className="td font-semibold text-slate-800">{s.estimatedPrice} {s.currency}</td>
                  <td className="td"><StatusBadge value={s.status} /></td>
                  <td className="td text-xs text-slate-600">{s.user.name}</td>
                  <td className="td whitespace-nowrap text-right">
                    <button onClick={() => openModal(s)} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-emerald-600 hover:text-white">
                      Changer statut
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && shipments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">Aucun colis</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!selected}
        title={`Statut — ${selected?.trackingNumber ?? ""}`}
        onClose={() => setSelected(null)}
        footer={
          <>
            <button onClick={() => setSelected(null)} className="btn-outline">Annuler</button>
            <button onClick={saveStatus} disabled={saving || !newStatus} className="btn-primary">
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">Trajet</div>
              <div className="text-sm font-semibold text-slate-800">
                {selected.originCity} ({selected.originCountry}) → {selected.destinationCity} ({selected.destinationCountry})
              </div>
              <div className="mt-1 text-xs text-slate-500">Client : {selected.user.name}</div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau statut</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="select">
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ").toLowerCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Commentaire (optionnel)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input h-auto py-2.5" placeholder="Commentaire visible par le client…" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}