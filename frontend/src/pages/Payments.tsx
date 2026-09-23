import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import StatusBadge from "../components/StatusBadge";

type PaymentRow = {
  id: string;
  paymentReference: string;
  provider: string;
  method: string;
  amount: string;
  currency: string;
  status: string;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { name: string; email: string | null };
  shipment: { trackingNumber: string; destinationCity: string };
};

export default function Payments() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ payments: PaymentRow[] }>("/admin/payments", { params: { status: filter, pageSize: 100 } });
      setPayments(data.payments);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Paiements</h1>
          <p className="mt-0.5 text-sm text-slate-500">Transactions MVola, Orange Money, Airtel Money et carte bancaire.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset">
          Payé : {totalPaid.toFixed(2)} €
        </span>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select">
          <option value="">Tous les statuts</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      {error && <div className="card border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Référence</th>
                <th className="th">Client</th>
                <th className="th">Colis</th>
                <th className="th">Fournisseur</th>
                <th className="th">Montant</th>
                <th className="th">Statut</th>
                <th className="th">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50/70">
                  <td className="td font-mono text-xs font-semibold text-amber-700">{p.paymentReference}</td>
                  <td className="td">
                    <div className="font-semibold text-slate-800">{p.user.name}</div>
                    <div className="text-xs text-slate-500">{p.user.email ?? ""}</div>
                  </td>
                  <td className="td font-mono text-xs text-slate-600">{p.shipment.trackingNumber}</td>
                  <td className="td">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{p.provider.replace(/_/g, " ")}</span>
                  </td>
                  <td className="td font-bold text-slate-800">{p.amount} {p.currency}</td>
                  <td className="td"><StatusBadge value={p.status} /></td>
                  <td className="td text-xs text-slate-500">{new Date(p.createdAt).toLocaleString("fr-FR")}</td>
                </tr>
              ))}
              {!loading && payments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">Aucun paiement</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}